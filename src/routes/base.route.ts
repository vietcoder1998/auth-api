import express from 'express';
import { BaseController } from '../controllers';

export class BaseRouter<T, Dto, Dro> {
    public path: string='health';
    public routes: express.Router = express.Router();

    constructor(path: string, controller?: BaseController<T, Dto, Dro>) {
        this.path = path;
        if (controller) {
            this.initializeRoutes(controller);
        }
    }

    protected initializeRoutes(controller: BaseController<T, Dto, Dro>) {
        // Initialize routes with the provided controller
        this.routes.get('/', controller.search.bind(controller));
        this.routes.post('/', controller.create.bind(controller));
        this.routes.get('/:id', controller.findOne.bind(controller));
        this.routes.put('/:id', controller.update.bind(controller));
        this.routes.delete('/:id', controller.delete.bind(controller));
    }
}