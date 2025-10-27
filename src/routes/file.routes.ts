import { Router } from 'express';
import { upload, uploadFile, getFile, deleteFile, downloadDocument } from '../controllers/file.controller';

const router = Router();

router.post('/upload', upload.single('file'), uploadFile);
router.get('/:filename', getFile);
router.get('/download/:filename', downloadDocument);
router.delete('/:filename', deleteFile);

export default router;
