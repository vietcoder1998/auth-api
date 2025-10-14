import { Router } from 'express';
import {
  getMailTemplates,
  getMailTemplateById,
  createMailTemplate,
  updateMailTemplate,
  deleteMailTemplate,
} from '../controllers/mailTemplate.controller';

const router = Router();

// Get all mail templates
router.get('/', getMailTemplates);

// Get specific mail template by ID
router.get('/:id', getMailTemplateById);

// Create new mail template
router.post('/', createMailTemplate);

// Update mail template
router.put('/:id', updateMailTemplate);

// Delete mail template
router.delete('/:id', deleteMailTemplate);

export default router;