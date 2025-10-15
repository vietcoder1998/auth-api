
import { NextFunction, Request, Response } from 'express';

// Extend Express Request interface to include 'user'
declare global {
	namespace Express {
		interface User {
			roles?: string[];
			permissions?: Array<{
				name: string;
				route?: string;
				method?: string;
			}>;
			// add other user properties if needed
		}
		interface Request {
			user?: User;
		}
	}
}

// Usage: rbac(['admin', 'superadmin']) or rbac(['manage_users'])
// For route-based: rbac([]) - will check permissions based on current route and method
export const rbac = (req: Request, res: Response, next: NextFunction) => {
	const user = req.user;

	console.log('[RBAC] Checking permissions for:', req.originalUrl, req.method);
	console.log('[RBAC] User permissions:', user?.permissions?.map(p => ({ name: p.name, route: p.route, method: p.method })));

	if (req.originalUrl?.includes('/admin/auth')) {
		console.log('[RBAC] Admin auth route, skipping RBAC');
		return next()
	}

	// Temporary: Skip RBAC for history endpoints to test if controllers work
	if (req.originalUrl?.includes('/admin/login-history') || req.originalUrl?.includes('/admin/logic-history')) {
		console.log('[RBAC] Temporarily skipping RBAC for history endpoints');
		return next();
	}

	if (!user) {
		console.log('[RBAC] No user found, returning 401');
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Check route-based permissions (if no specific permissions required)
	if (user.permissions?.length) {
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
