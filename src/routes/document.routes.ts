import { Router } from 'express';
import { listDocuments, getDocument, createDocument, updateDocument, deleteDocument } from '../controllers/document.controller';

const router = Router();

router.get('/', listDocuments);
router.get('/:id', getDocument);
router.post('/', createDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
