import { EntityModel, EntityDto, EntityDro } from "../interfaces/entity.interface";
import { BaseService } from "./base.service";

import { EntityRepository } from "../repositories/entity.repository";

export class EntityService extends BaseService<EntityModel, EntityDto, EntityDro> {}
export const entityService = new EntityService(new EntityRepository());