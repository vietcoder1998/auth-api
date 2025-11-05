import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { DocumentService, documentService } from '../services/document.service';
import { jobController } from './job.controller';

export class DocumentController extends BaseController<any, any, any> {
  private documentService: DocumentService;

  constructor(documentService: DocumentService) {
    super(documentService);
    this.documentService = documentService;
  }

  /**
   * List all documents
   */
  async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, createdAtFrom, createdAtTo } = req.query;

      const filter: any = {};
      if (name) filter.name = String(name);
      if (type) filter.type = String(type);
      if (createdAtFrom) filter.createdAtFrom = new Date(String(createdAtFrom));
      if (createdAtTo) filter.createdAtTo = new Date(String(createdAtTo));

      const documents = await this.documentService.listDocuments(filter);
      res.json({ success: true, data: documents });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const document = await this.documentService.getDocument(req.params.id);

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      res.json({ success: true, data: document });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create a new document
   */
  async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const { name, url, fileId, type } = req.body;

      if (!name) {
        res.status(400).json({ success: false, error: 'Document name is required' });
        return;
      }

      if (!fileId) {
        res.status(400).json({ success: false, error: 'File ID is required' });
        return;
      }

      const document = await this.documentService.createDocument({
        name,
        url,
        fileId,
        type,
      });

      res.status(201).json({ success: true, data: document });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update a document
   */
  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { name, url, type } = req.body;

      const document = await this.documentService.updateDocument(req.params.id, {
        name,
        url,
        type,
      });

      res.json({ success: true, data: document });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      await this.documentService.deleteDocument(req.params.id);
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Split file into chunks
   */
  async splitFileToChunks(req: Request, res: Response): Promise<void> {
    try {
      const { fileContent, fileType } = req.body;

      if (!fileContent) {
        res.status(400).json({ success: false, error: 'File content is required' });
        return;
      }

      if (!fileType) {
        res.status(400).json({ success: false, error: 'File type is required' });
        return;
      }

      const chunks = await this.documentService.splitFileToChunks(fileContent, fileType);
      res.json({ success: true, data: chunks });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create chunk job for a document
   */
  async createChunkJob(req: Request, res: Response): Promise<void> {
    try {
      const { documentId, fileContent, fileType } = req.body;
      const userId = req.user?.id;

      if (!documentId) {
        res.status(400).json({ success: false, error: 'Document ID is required' });
        return;
      }

      if (!fileContent) {
        res.status(400).json({ success: false, error: 'File content is required' });
        return;
      }

      if (!fileType) {
        res.status(400).json({ success: false, error: 'File type is required' });
        return;
      }

      const job = await this.documentService.createChunkJob(
        documentId,
        fileContent,
        fileType,
        userId
      );

      res.status(201).json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Export singleton instance
export const documentController = new DocumentController(documentService);

// Export individual controller methods for route binding
export const listDocuments = documentController.listDocuments.bind(documentController);
export const getDocument = documentController.getDocument.bind(documentController);
export const createDocument = documentController.createDocument.bind(documentController);
export const updateDocument = documentController.updateDocument.bind(documentController);
export const deleteDocument = documentController.deleteDocument.bind(documentController);
export const splitFileToChunks = documentController.splitFileToChunks.bind(documentController);
export const createChunkJob = documentController.createChunkJob.bind(documentController);
