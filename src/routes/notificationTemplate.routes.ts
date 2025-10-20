import { Router } from 'express';
import * as notificationTemplateController from '../controllers/notificationTemplate.controller';

const router = Router();

// Get all notification templates
router.get('/', async (req, res) => {
  try {
    const templates = await notificationTemplateController.getNotificationTemplates();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notification templates' });
  }
});

// Get a single notification template by id
router.get('/:id', async (req, res) => {
  try {
    const template = await notificationTemplateController.getNotificationTemplate(req.params.id);
    if (!template) return res.status(404).json({ error: 'Not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notification template' });
  }
});

// Create a notification template
router.post('/', async (req, res) => {
  try {
    const template = await notificationTemplateController.createNotificationTemplate(req.body);
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create notification template' });
  }
});

// Update a notification template
router.put('/:id', async (req, res) => {
  try {
    const template = await notificationTemplateController.updateNotificationTemplate(
      req.params.id,
      req.body,
    );
    res.json(template);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update notification template' });
  }
});

// Delete a notification template
router.delete('/:id', async (req, res) => {
  try {
    await notificationTemplateController.deleteNotificationTemplate(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete notification template' });
  }
});

export default router;
