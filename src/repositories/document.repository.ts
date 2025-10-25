import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { DocumentDto, DocumentModel } from '../interfaces';

export class DocumentRepository extends BaseRepository<DocumentModel, DocumentDto, DocumentDto> {
    constructor(documentDelegate = prisma.document) {
        super(documentDelegate);
    }

    async findByName(name: string) {
        return this.model.findMany({ where: { name: { contains: name } } });
    }

    async findByType(type: string) {
        return this.model.findMany({ where: { type } });
    }
}
