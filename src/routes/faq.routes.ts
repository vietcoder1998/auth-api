import { Router } from 'express';
import { listFaqs, getFaq, createFaq, updateFaq, deleteFaq } from '../controllers/faq.controller';

const router = Router();

router.get('/', listFaqs);
router.get('/:id', getFaq);
router.post('/', createFaq);
router.put('/:id', updateFaq);
router.delete('/:id', deleteFaq);

export default router;
