import { EntityModel, EntityDto, EntityDro } from "../interfaces/entity.interface";
import { EntityService } from "../services/entity.service";
import { BaseController } from "./base.controller";
import { entityService } from "../services";

export class EntityController extends BaseController<EntityModel, EntityDto, EntityDro> {
  private entityService: EntityService

  constructor(entityService: EntityService) {
    super(entityService);
    this.entityService = entityService;
  } 
}

export const entityController = new EntityController(entityService);