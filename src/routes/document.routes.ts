import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/document.controller';
import { startExtractJobForDocument } from '../controllers/job.controller';
import { upload, uploadFile } from '../controllers/file.controller';

const router = Router();

// Document upload endpoint
router.post('/upload', upload.single('file'), uploadFile);


router.get('/', listDocuments);
router.get('/:id', getDocument);
router.post('/', createDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

// Start extract job for a document
router.post('/:id/start-extract-job', startExtractJobForDocument);

export default router;
