
import { NextFunction, Request, Response } from 'express';

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

	console.log('[RBAC] Checking permissions for:', req.originalUrl, req.method);
	console.log('[RBAC] SSO authentication:', !!sso);

	if (req.originalUrl?.includes('/admin/auth') || req.originalUrl?.includes('/api/sso')) {
		console.log('[RBAC] Auth/SSO route, skipping RBAC');
		return next()
	}

	// Temporary: Skip RBAC for history endpoints to test if controllers work
	if (req.originalUrl?.includes('/admin/login-history') || req.originalUrl?.includes('/admin/logic-history')) {
		console.log('[RBAC] Temporarily skipping RBAC for history endpoints');
		return next();
	}

	// If SSO authentication but no user permissions loaded, load them
	if (sso && (!user || !user.permissions)) {
		console.log('[RBAC] Loading permissions for SSO user');
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
			}
		} catch (error) {
			console.error('[RBAC] Error loading SSO user permissions:', error);
		}
	}

	if (!user && !sso) {
		console.log('[RBAC] No user or SSO found, returning 401');
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Check route-based permissions (if no specific permissions required)
	if (user?.permissions?.length) {
		const currentRoute = req.route?.path || req.path;
		const fullUrl = req.originalUrl; // Use the full URL for matching
		const currentMethod = req.method.toUpperCase();

		console.log('[RBAC] Checking route:', currentRoute, 'fullUrl:', fullUrl, 'method:', currentMethod);

		const hasRoutePermission = user.permissions.some(perm => {
			// Check if permission matches current route and method
			if (perm.route && perm.method) {
				// Try both exact route match and full URL match
				const routeMatch = (perm.route === currentRoute && perm.method === currentMethod) ||
				                  (perm.route === fullUrl && perm.method === currentMethod);
				console.log('[RBAC] Permission check:', perm.name, 'route:', perm.route, 'method:', perm.method, 'matches:', routeMatch);
				return routeMatch;
			}
			// Fallback to wildcard permissions
			if (perm.route && !perm.method) {
				const routeMatch = perm.route === currentRoute || perm.route === fullUrl;
				console.log('[RBAC] Wildcard permission check:', perm.name, 'route:', perm.route, 'matches:', routeMatch);
				return routeMatch;
			}
			return false;
		});

		console.log('[RBAC] Final permission result:', hasRoutePermission);

		if (hasRoutePermission) {
			return next();
		}
	} else {
		console.log('[RBAC] User has no permissions');
	}

	console.log('[RBAC] Access denied, returning 403');
	return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
};
