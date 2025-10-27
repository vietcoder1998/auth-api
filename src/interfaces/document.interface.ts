export interface DocumentModel {
    id: string;
    name: string;
    url?: string;
    fileId: string;
    type?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentDto {
    name: string;
    url?: string;
    fileId: string;
    type?: string;
}

export interface DocumentDro extends DocumentModel {}
