import { EntityModel, EntityDto, EntityDro } from "../interfaces/entity.interface";
import prisma from "../prisma";
import { BaseRepository } from "./base.repository";

export class EntityRepository extends BaseRepository<EntityModel, EntityDto, EntityDro> {
    constructor(entityModel: any = prisma.entity) {
        super(entityModel);
    }
}

export const entityRepository = new EntityRepository();