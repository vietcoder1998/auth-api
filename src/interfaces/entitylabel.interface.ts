export interface EntityLabelModel {
    id: string;
    entityId: string;
    entityType: string;
    labelId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EntityLabelDto {
    entityId: string;
    entityType: string;
    labelId: string;
}

export interface EntityLabelDro extends EntityLabelModel {}
