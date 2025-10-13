
import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
	interface User {
	  roles?: string[];
	  permissions?: string[];
	  // add other user properties if needed
	}
	interface Request {
	  user?: User;
	}
  }
}

// Usage: rbac(['admin', 'superadmin']) or rbac(['manage_users'])
export function rbac(required: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = req.user;
		if (!user) {
			return res.status(401).json({ error: 'Unauthorized' });
		}
		// Check roles
		if (user.roles?.length && required.some(r => user.roles?.includes(r))) {
			return next();
		}
		// Check permissions
		if (user.permissions?.length && required.some(p => user.permissions?.includes(p))) {
			return next();
		}
		return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
	};
}
