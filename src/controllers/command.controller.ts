
import { Request, Response } from 'express';
import { CommandService } from '../services/command.service';
import { BaseController } from './base.controller';
import { CommandDro, CommandDto, CommandModel } from '../interfaces';

export class CommandController extends BaseController<CommandModel, CommandDto, CommandDro> {
	// Explicitly type the service property as CommandService
	protected service: CommandService;

	constructor() {
		super(new CommandService());
		this.service = new CommandService();
	}
	/**
	 * POST /api/commands - process a command
	 */
	async processCommand(req: Request, res: Response) {
		try {
			const context = req.body;
			if (!context || !context.type || !context.agentId) {
				return res.status(400).json({
					success: false,
					message: 'Missing required fields: type, agentId',
				});
			}
			const result = await this.service.processCommand(context);
			this.sendSuccess(res, result);
		} catch (error) {
			this.handleError(res, error);
		}
	}

	// Standard CRUD methods using BaseController
	async create(req: Request, res: Response) {
		return super.create(req, res);
	}

	async findOne(req: Request, res: Response) {
		return super.findOne(req, res);
	}

	async update(req: Request, res: Response) {
		return super.update(req, res);
	}

	async delete(req: Request, res: Response) {
		return super.delete(req, res);
	}
}
