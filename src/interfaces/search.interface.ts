export interface SearchParams {
    where?: Record<string, any>;
    orderBy?: Record<string, any> | Record<string, any>[];
    skip?: number;
    take?: number;
    include?: Record<string, any>;
    select?: Record<string, any>;
    [key: string]: any; // Allow additional Prisma args
}

export interface DefaultSearchQuery {
    q?: string;
    page?: number;
    size?: number;
    next?: boolean;
    previous?: boolean;
    total?: number;
}