import { Router } from 'express';
import {
  getMails,
  getMailById,
  createMail,
  updateMail,
  deleteMail,
  markMailAsSent,
  markMailAsFailed,
  getMailStats,
  resendMail,
} from '../controllers/mail.controller';

const router = Router();

// Get all mails with pagination and filtering
router.get('/', getMails);

// Get mail statistics
router.get('/stats', getMailStats);

// Get specific mail by ID
router.get('/:id', getMailById);

// Create new mail
router.post('/', createMail);

// Update mail
router.put('/:id', updateMail);

// Delete mail
router.delete('/:id', deleteMail);

// Mark mail as sent
router.patch('/:id/sent', markMailAsSent);

// Mark mail as failed
router.patch('/:id/failed', markMailAsFailed);

// Resend mail (reset to pending status)
router.patch('/:id/resend', resendMail);

export default router;
