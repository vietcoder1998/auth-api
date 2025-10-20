import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/document.controller';
import { upload, uploadFile } from '../controllers/file.controller';

const router = Router();

// Document upload endpoint
router.post('/upload', upload.single('file'), uploadFile);

router.get('/', listDocuments);
router.get('/:id', getDocument);
router.post('/', createDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
