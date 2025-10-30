import { Request, Response } from 'express';
import { ResultService } from '../services/result.service';

export class ResultController {
  constructor(private service: ResultService) {}

  create = async (req: Request, res: Response) => {
    const result = await this.service.create(req.body);
    res.json(result);
  };
  findAll = async (_: Request, res: Response) => {
    const results = await this.service.findAll();
    res.json(results);
  };
  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id);
    res.json(result);
  };
  update = async (req: Request, res: Response) => {
    const result = await this.service.update(req.params.id, req.body);
    res.json(result);
  };
  delete = async (req: Request, res: Response) => {
    const result = await this.service.delete(req.params.id);
    res.json(result);
  };
}
