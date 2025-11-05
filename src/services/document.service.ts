import { PrismaClient, Document } from '@prisma/client';
import { jobService } from './job.service';
import * as XLSX from 'xlsx';
import { BaseService } from './base.service';
import { DocumentRepository } from '../repositories/document.repository';
import { DocumentDto } from '../interfaces';

const prisma = new PrismaClient();

export interface DocumentFilter {
	name?: string;
	type?: string;
	createdAtFrom?: Date;
	createdAtTo?: Date;
}

export interface DocumentChunk {
	content: string;
	index: number;
}

export class DocumentService extends BaseService<any, DocumentDto, DocumentDto> {
	private documentRepository: DocumentRepository;

	constructor() {
		const documentRepository = new DocumentRepository();
		super(documentRepository);
		this.documentRepository = documentRepository;
	}

	async createDocument(data: { name: string; url?: string; fileId: string; type?: string }): Promise<Document> {
		return this.documentRepository.create(data as any);
	}

	async getDocument(id: string): Promise<Document | null> {
		return this.documentRepository.findById(id);
	}

	async updateDocument(id: string, data: Partial<{ name: string; url: string; type: string }>): Promise<Document> {
		return this.documentRepository.update(id, data as any);
	}

	async deleteDocument(id: string): Promise<Document> {
		return this.documentRepository.delete(id);
	}

	async listDocuments(filter: DocumentFilter = {}): Promise<Document[]> {
		const where: Record<string, any> = {};
		if (filter.name) where.name = { contains: filter.name };
		if (filter.type) where.type = filter.type;
		if (filter.createdAtFrom || filter.createdAtTo) {
			where.createdAt = {};
			if (filter.createdAtFrom) where.createdAt.gte = filter.createdAtFrom;
			if (filter.createdAtTo) where.createdAt.lte = filter.createdAtTo;
		}
		return prisma.document.findMany({ where, orderBy: { createdAt: 'desc' } });
	}

	// Auto detect file type and split file into chunks
	async splitFileToChunks(fileContent: string | Buffer, fileType: string): Promise<DocumentChunk[]> {
		let chunks: string[] = [];
		if (fileType.startsWith('text/') || fileType.endsWith('.txt') || fileType.endsWith('.md')) {
			// Split by lines, then group every 20 lines as a chunk
			const lines = fileContent.toString().split(/\r?\n/);
			for (let i = 0; i < lines.length; i += 20) {
				chunks.push(lines.slice(i, i + 20).join('\n'));
			}
		} else if (fileType.endsWith('.json')) {
			// Split by top-level objects if possible
			try {
				const jsonArr = JSON.parse(fileContent.toString());
				if (Array.isArray(jsonArr)) {
					chunks = jsonArr.map((obj) => JSON.stringify(obj));
				} else {
					chunks = [fileContent.toString()];
				}
			} catch {
				chunks = [fileContent.toString()];
			}
		} else if (fileType.endsWith('.csv')) {
			// Split by lines, group every 50 lines
			const lines = fileContent.toString().split(/\r?\n/);
			for (let i = 0; i < lines.length; i += 50) {
				chunks.push(lines.slice(i, i + 50).join('\n'));
			}
		} else if (fileType.endsWith('.xlsx')) {
			// Parse XLSX and split rows into chunks
			const workbook = XLSX.read(fileContent, { type: typeof fileContent === 'string' ? 'base64' : 'buffer' });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
			for (let i = 0; i < rows.length; i += 50) {
				const chunkRows = rows.slice(i, i + 50);
				// Convert rows to CSV-like string for each chunk
				const chunkStr = chunkRows.map(row => row.join(',')).join('\n');
				chunks.push(chunkStr);
			}
		} else {
			// Default: split by period for sentences
			chunks = fileContent.toString().split('.').map((s) => s.trim()).filter(Boolean);
		}
		return chunks.map((content, index) => ({ content, index }));
	}

	// Call job for chunk breaking
	async createChunkJob(documentId: string, fileContent: string, fileType: string, userId?: string) {
		const chunks = await this.splitFileToChunks(fileContent, fileType);
		// Call job service to process chunks
		return jobService.addJob('extract', { documentId, chunks }, userId, `Chunk break for document ${documentId}`);
	}
}

export const documentService = new DocumentService();
