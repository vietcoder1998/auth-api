
import { NextFunction, Request, Response } from 'express';
import { logInfo, logError, logWarn } from './logger.middle';

// Extend Express Request interface to include 'user'
declare global {
	namespace Express {
		interface User {
			id?: string;
			email?: string;
			role?: string;
			roles?: string[];
			permissions?: Array<{
				name: string;
				route?: string;
				method?: string;
			}>;
			impersonatedBy?: string;
			impersonatedAt?: string;
			// add other user properties if needed
		}
		interface Request {
			user?: User;
		}
	}
}

// Usage: rbac(['admin', 'superadmin']) or rbac(['manage_users'])
// For route-based: rbac([]) - will check permissions based on current route and method
export const rbac = async (req: Request, res: Response, next: NextFunction) => {
	const user = req.user;
	const sso = req.sso;

	if (req.originalUrl?.includes('/admin/auth') || req.originalUrl?.includes('/api/sso')) {
		return next()
	}

	// Temporary: Skip RBAC for history endpoints and logs to test if controllers work
	if (req.originalUrl?.includes('/admin/login-history') || 
		req.originalUrl?.includes('/admin/logic-history') ||
		req.originalUrl?.includes('/admin/logs')) {
		return next();
	}

	// If SSO authentication but no user permissions loaded, load them
	if (sso && (!user || !user.permissions)) {
		try {
			const userWithPermissions = await require('@prisma/client').PrismaClient().user.findUnique({
				where: { id: sso.userId },
				include: {
					role: {
						include: {
							permissions: true,
						},
					},
				},
			});

			if (userWithPermissions?.role) {
				req.user = {
					...req.user,
					roles: [userWithPermissions.role.name],
					permissions: userWithPermissions.role.permissions.map((p: any) => ({
						name: p.name,
						route: p.route,
						method: p.method,
					})),
				};
				logInfo('RBAC SSO user permissions loaded', {
					userId: sso.userId,
					roleName: userWithPermissions.role.name,
					permissionCount: userWithPermissions.role.permissions.length
				});
			}
		} catch (error) {
			logError('RBAC failed to load SSO user permissions', {
				userId: sso.userId,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	if (!user && !sso) {
		logWarn('RBAC access denied - no authentication', {
			endpoint: req.originalUrl,
			method: req.method,
			reason: 'No user or SSO found'
		});
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Check route-based permissions (if no specific permissions required)
	if (user?.permissions?.length) {
		const currentRoute = req.route?.path || req.path;
		const fullUrl = req.originalUrl; // Use the full URL for matching
		const currentMethod = req.method.toUpperCase();

		// Helper function to match parameterized routes
		const matchesParameterizedRoute = (permissionRoute: string, actualUrl: string): boolean => {
			// Convert parameterized route pattern to regex
			// e.g., /api/admin/conversations/:id -> /api/admin/conversations/[^/]+
			const regexPattern = permissionRoute
				.replace(/:[^/]+/g, '[^/]+') // Replace :param with [^/]+ (matches any non-slash chars)
				.replace(/\//g, '\\/'); // Escape forward slashes
			
			const regex = new RegExp(`^${regexPattern}(?:\\?.*)?$`); // Allow query parameters
			return regex.test(actualUrl);
		};

		const hasRoutePermission = user.permissions.some(perm => {
			// Check if permission matches current route and method
			if (perm.route && perm.method) {
				// Try exact route match first
				let routeMatch = (perm.route === currentRoute && perm.method === currentMethod) ||
				                (perm.route === fullUrl && perm.method === currentMethod);
				
				// If no exact match, try parameterized route matching
				if (!routeMatch && perm.method === currentMethod) {
					routeMatch = matchesParameterizedRoute(perm.route, fullUrl);
				}
				
				return routeMatch;
			}
			// Fallback to wildcard permissions
			if (perm.route && !perm.method) {
				let routeMatch = perm.route === currentRoute || perm.route === fullUrl;
				
				// Try parameterized route matching for wildcards too
				if (!routeMatch) {
					routeMatch = matchesParameterizedRoute(perm.route, fullUrl);
				}
				
				return routeMatch;
			}
			return false;
		});

		if (hasRoutePermission) {
			logInfo('RBAC access granted', {
				endpoint: req.originalUrl,
				method: req.method,
				userEmail: user.email,
				userId: user.id
			});
			return next();
		}
	}

	logWarn('RBAC access denied - insufficient privileges', {
		endpoint: req.originalUrl,
		method: req.method,
		userEmail: user?.email,
		userId: user?.id,
		hasPermissions: !!user?.permissions?.length
	});
	return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
};
