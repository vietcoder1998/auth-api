
import { Request, Response, NextFunction } from 'express';

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
	if (!user) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Check route-based permissions (if no specific permissions required)
	if (user.permissions?.length) {
		const currentRoute = req.route?.path || req.path;
		const currentMethod = req.method.toUpperCase();

		const hasRoutePermission = user.permissions.some(perm => {
			// Check if permission matches current route and method
			if (perm.route && perm.method) {
				return perm.route === currentRoute && perm.method === currentMethod;
			}
			// Fallback to wildcard permissions
			if (perm.route && !perm.method) {
				return perm.route === currentRoute;
			}
			return false;
		});

		if (hasRoutePermission) {
			return next();
		}
	}

	return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
};
