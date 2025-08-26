import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare const successResponse: <T>(res: Response, data?: T, message?: string, statusCode?: number) => Response;
export declare const errorResponse: (res: Response, error: string, statusCode?: number, data?: any) => Response;
export declare const paginatedResponse: <T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string) => Response;
export declare const createdResponse: <T>(res: Response, data: T, message?: string) => Response;
export declare const noContentResponse: (res: Response) => Response;
export declare const notFoundResponse: (res: Response, message?: string) => Response;
export declare const unauthorizedResponse: (res: Response, message?: string) => Response;
export declare const forbiddenResponse: (res: Response, message?: string) => Response;
export declare const serverErrorResponse: (res: Response, message?: string) => Response;
export declare const validationErrorResponse: (res: Response, errors: any, message?: string) => Response;
//# sourceMappingURL=response.d.ts.map