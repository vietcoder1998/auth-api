import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { BlogDto, BlogModel } from '../interfaces';

export class BlogRepository extends BaseRepository<BlogModel, BlogDto, BlogDto> {
    constructor(blogDelegate = prisma.blog) {
        super(blogDelegate);
    }
    // Add custom methods for Blog if needed
}
