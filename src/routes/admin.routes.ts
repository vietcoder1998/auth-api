import { createPermission, getPermissions, updatePermission } from '../controllers/permission.controller';
import { createRole, getRoles, updateRole } from '../controllers/role.controller';
import { grantToken, revokeToken } from '../controllers/token.controller';
import { createUser, getUsers, searchUsers, updateUser } from '../controllers/user.controller';
import { getNotificationTemplates, createNotificationTemplate, updateNotificationTemplate } from '../controllers/notificationTemplate.controller';
import { Router } from 'express';


const router = Router();


// User endpoints
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.get('/users/search', searchUsers);

// Role endpoints
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);

// Permission endpoints
router.get('/permissions', getPermissions);
router.post('/permissions', createPermission);
router.put('/permissions/:id', updatePermission);

// Token endpoints
router.post('/tokens/revoke', revokeToken);
router.post('/tokens/grant', grantToken);

// NotificationTemplate endpoints
router.get('/notification-templates', async (req, res) => {
	try {
		const templates = await getNotificationTemplates();
		res.json(templates);
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch notification templates' });
	}
});
router.post('/notification-templates', async (req, res) => {
	try {
		const template = await createNotificationTemplate(req.body);
		res.status(201).json(template);
	} catch (err) {
		res.status(400).json({ error: 'Failed to create notification template' });
	}
});
router.put('/notification-templates/:id', async (req, res) => {
	try {
		const template = await updateNotificationTemplate(req.params.id, req.body);
		res.json(template);
	} catch (err) {
		res.status(400).json({ error: 'Failed to update notification template' });
	}
});

export default router;
