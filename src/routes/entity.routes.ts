import { EntityDro, EntityDto, EntityModel } from "../interfaces";
import { entityController, EntityController } from "../controllers";
import { BaseRouter } from "./base.route";

export class EntityRoutes extends BaseRouter<EntityModel, EntityDto, EntityDro> {
    private entityController: EntityController;
    constructor() {
        super('/entities');
        this.entityController = entityController;
        this.initializeRoutes();
    }

    override initializeRoutes(): void {
        // Custom initialization logic for EntityRoutes
        this.routes.get(`/`, this.entityController.search.bind(this.entityController));
        this.routes.get(`/:id`, this.entityController.findOne.bind(this.entityController));
        this.routes.post(`/`, this.entityController.create.bind(this.entityController));
        this.routes.put(`/:id`, this.entityController.update.bind(this.entityController));
        this.routes.delete(`/:id`, this.entityController.delete.bind(this.entityController));
    }
}

export const entityRoutes = new EntityRoutes();