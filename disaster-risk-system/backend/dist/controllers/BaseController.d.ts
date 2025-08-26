import { Request, Response, NextFunction } from 'express';
export declare class BaseController {
    protected asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
    protected getPaginationParams(req: Request): {
        page: number;
        limit: number;
        offset: number;
    };
    protected getSortParams(req: Request): {
        sortBy: string;
        sortOrder: string;
    };
    protected validateRequired(data: any, fields: string[]): string | null;
    protected success(res: Response, data: any, message?: string): Response<any, Record<string, any>>;
    protected created(res: Response, data: any, message?: string): Response<any, Record<string, any>>;
    protected error(res: Response, message: string, statusCode?: number): Response<any, Record<string, any>>;
    protected notFound(res: Response, message?: string): Response<any, Record<string, any>>;
    protected paginated<T>(res: Response, data: T[], pagination: any): Response<any, Record<string, any>>;
    protected serverError(res: Response, error: any): Response<any, Record<string, any>>;
}
//# sourceMappingURL=BaseController.d.ts.map