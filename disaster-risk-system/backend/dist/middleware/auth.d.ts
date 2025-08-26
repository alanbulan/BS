import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                username: string;
                email: string;
                role: string;
            };
        }
    }
}
export interface JWTPayload {
    id: number;
    username: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export declare class AuthMiddleware {
    private userModel;
    constructor();
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => void;
    requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
    requireExpertOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
    requireOwnerOrAdmin: (getUserIdFromParams: (req: Request) => number) => (req: Request, res: Response, next: NextFunction) => void;
}
export declare const verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireExpertOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOwnerOrAdmin: (getUserIdFromParams: (req: Request) => number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map