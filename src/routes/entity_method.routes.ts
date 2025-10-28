import { EntityDro, EntityDto, EntityModel } from "../interfaces";
import { entityMethodController, EntityMethodController } from "../controllers";
import { BaseRouter } from "./base.route";
import express from "express";

export class EntityMethodRoutes extends BaseRouter<EntityModel, EntityDto, EntityDro> {
    private entityMethodController: EntityMethodController;
    constructor() {
        super('/entitiy-methods');
        this.entityMethodController = entityMethodController;
        this.routes = express.Router();
        this.initializeRoutes();
    }

    override initializeRoutes(): void {
        // Custom initialization logic for EntityMethodRoutes
        this.routes.get(`/`, this.entityMethodController.search.bind(this.entityMethodController));
        this.routes.get(`/:id`, this.entityMethodController.findOne.bind(this.entityMethodController));
        this.routes.post(`/`, this.entityMethodController.create.bind(this.entityMethodController));
        this.routes.put(`/:id`, this.entityMethodController.update.bind(this.entityMethodController));
        this.routes.delete(`/:id`, this.entityMethodController.delete.bind(this.entityMethodController));
    }
}

export const entityMethodRoutes = new EntityMethodRoutes();