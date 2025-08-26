import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class MonitoringStationTypeController extends BaseController {
    private model;
    constructor();
    getTypes: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createType: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateType: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteType: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTypeUsageStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=MonitoringStationTypeController.d.ts.map