import { ResultRepository } from '../repositories/result.repository';
import { IResult } from '../interfaces/result.interface';

export class ResultService {
  constructor(private repository: ResultRepository) {}

  create(data: Partial<IResult>) {
    return this.repository.create(data);
  }
  findAll() {
    return this.repository.findAll();
  }
  findById(id: string) {
    return this.repository.findById(id);
  }
  update(id: string, data: Partial<IResult>) {
    return this.repository.update(id, data);
  }
  delete(id: string) {
    return this.repository.delete(id);
  }
}
