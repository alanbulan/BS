import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class EscapeRouteController extends BaseController {
    private escapeRouteModel;
    constructor();
    createRoute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRoutes: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRouteById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRouteByRouteId: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRoutesFromPoint: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRoutesToShelter: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRoutesInArea: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateRoute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    verifyRoute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteRoute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    batchImport: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRecommendations: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=EscapeRouteController.d.ts.map