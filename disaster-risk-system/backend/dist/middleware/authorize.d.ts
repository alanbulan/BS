import { Request, Response, NextFunction } from 'express';
export declare const authorize: (requiredRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireExpertOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireUser: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authorize.d.ts.map