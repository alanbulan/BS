import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class AuthController extends BaseController {
    private authService;
    constructor();
    register: (req: Request, res: Response, next: import("express").NextFunction) => void;
    login: (req: Request, res: Response, next: import("express").NextFunction) => void;
    loginByEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
    refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCurrentUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    forgotPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    resetPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    checkUsername: (req: Request, res: Response, next: import("express").NextFunction) => void;
    checkEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=AuthController.d.ts.map