import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class UserController extends BaseController {
    private userModel;
    constructor();
    createUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updatePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateLocation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getNearbyUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    searchUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    toggleUserStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=UserController.d.ts.map