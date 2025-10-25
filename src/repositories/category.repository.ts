import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { CategoryDto, CategoryModel } from '../interfaces';

export class CategoryRepository extends BaseRepository<CategoryModel, CategoryDto, CategoryDto> {
    constructor(categoryDelegate = prisma.category) {
        super(categoryDelegate);
    }
    // Add custom methods for Category if needed
}
