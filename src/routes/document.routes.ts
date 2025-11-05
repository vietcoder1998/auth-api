import { documentController } from '../controllers/document.controller';
import { jobController } from '../controllers/job.controller';
import { upload, uploadFile } from '../controllers/file.controller';
import { BaseRouter } from './index';

export class DocumentRoutes extends BaseRouter<any, any, any> {
  constructor() {
    super('/documents');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    // Document upload endpoint
    this.routes.post('/upload', upload.single('file'), uploadFile);

    // Document CRUD operations
    this.routes.post('/', documentController.createDocument.bind(documentController));
    this.routes.get('/', documentController.listDocuments.bind(documentController));
    this.routes.get('/:id', documentController.getDocument.bind(documentController));
    this.routes.put('/:id', documentController.updateDocument.bind(documentController));
    this.routes.delete('/:id', documentController.deleteDocument.bind(documentController));

    // Document processing
    this.routes.post('/chunks/split', documentController.splitFileToChunks.bind(documentController));
    this.routes.post('/chunks/job', documentController.createChunkJob.bind(documentController));

    // Start extract job for a document
    this.routes.post(
      '/:id/start-extract-job',
      jobController.startExtractJobForDocument.bind(jobController)
    );
  }
}

export const documentRoutes = new DocumentRoutes();
export default documentRoutes;
