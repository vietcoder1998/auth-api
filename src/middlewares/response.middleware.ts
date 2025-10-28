import { NextFunction, Request, Response } from 'express';

// Extend Express Request to allow meta property
declare module 'express-serve-static-core' {
  interface Request {
    meta?: {
      query: Record<string, any>;
      params: Record<string, any>;
      page: number;
      pageSize: number;
      total?: number;
      q: string;
      [key: string]: any;
    };
  }
}

/**
 * ResponseMiddleware class for wrapping responses in boundary format
 */
export class ResponseMiddleware {
  /**
   * Middleware to wrap all responses in a boundary format: { data, message, total?, pagination? }
   * Usage: Place after all routes, before error handler.
   */
  static boundaryResponse(req: Request, res: Response, next: NextFunction) {
    // Extract pagination info from query params
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : limit;

    // Add meta information to request
    req.meta = {
      ...req.meta,
      query: { ...req.query },
      params: { ...req.params },
      page,
      pageSize,
      q: typeof req.query.q === 'string' ? req.query.q : '',
    };

    const oldJson = res.json;

    res.json = function (body: any) {
      // If already in boundary format, don't double-wrap
      if (body && typeof body === 'object' && 'data' in body && 'message' in body) {
        return oldJson.call(this, body);
      }

      // If response already contains pagination structure (data, total, page, limit), wrap it properly
      if (
        body &&
        typeof body === 'object' &&
        'data' in body &&
        'total' in body &&
        'page' in body &&
        'limit' in body
      ) {
        return oldJson.call(this, {
          data: body.data,
          message: body.message ?? 'Success',
          total: body.total,
          page: body.page,
          limit: body.limit,
          totalPages: body.totalPages || Math.ceil(body.total / body.limit),
          success: true,
        });
      }

      // If body is an error or string, treat as message
      if (body instanceof Error || (body && body.error)) {
        const code = body.code || res.statusCode || 500;
        const errorCode = body.errorCode || body.code || 'UNKNOWN_ERROR';
        const message = body.message || body.error || String(body);

        return oldJson.call(this, {
          data: null,
          message,
          code,
          errorCode,
          success: false,
        });
      }

      if (typeof body === 'string') {
        return oldJson.call(this, {
          data: null,
          message: String(body),
          success: true,
        });
      }

      // Handle paginated data with pagination object
      if (body && typeof body === 'object' && 'pagination' in body) {
        const { data, pagination, total, ...rest } = body;
        return oldJson.call(this, {
          data: data,
          message: 'Success',
          total: total || pagination?.total || (Array.isArray(data) ? data.length : 0),
          page: pagination?.page || req.meta?.page || 1,
          limit: pagination?.limit || pagination?.pageSize || req.meta?.pageSize || 10,
          totalPages:
            pagination?.totalPages ||
            Math.ceil(
              (pagination?.total || total || 0) / (pagination?.limit || req.meta?.pageSize || 10),
            ),
          success: true,
          ...rest,
        });
      }

      // If data is an array, add total and pagination info
      if (Array.isArray(body)) {
        const total = req.meta?.total || body.length;
        const currentPage = req.meta?.page || 1;
        const currentPageSize = req.meta?.pageSize || 10;

        return oldJson.call(this, {
          data: body,
          message: 'Success',
          total,
          pagination: {
            page: currentPage,
            limit: currentPageSize,
            total,
            totalPages: Math.ceil(total / currentPageSize),
          },
          success: true,
        });
      }

      // Default: wrap single object in { data, message }
      return oldJson.call(this, {
        data: body,
        message: 'Success',
        success: true,
      });
    };

    next();
  }

  /**
   * Helper function to set pagination metadata in request
   * Use this in controllers before sending response
   */
  static setPaginationMeta(req: Request, total: number, page?: number, pageSize?: number) {
    if (!req.meta) {
      req.meta = {
        query: { ...req.query },
        params: { ...req.params },
        page: page || 1,
        pageSize: pageSize || 10,
        q: '',
      };
    }
    req.meta.total = total;
    if (page) req.meta.page = page;
    if (pageSize) req.meta.pageSize = pageSize;
  }

  /**
   * Helper function to create paginated response
   */
  static createPaginatedResponse(data: any[], total: number, page: number, limit: number) {
    return {
      data,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
