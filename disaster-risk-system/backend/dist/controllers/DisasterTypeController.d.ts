import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class DisasterTypeController extends BaseController {
    private disasterTypeModel;
    constructor();
    createDisasterType: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getDisasterTypes: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getDisasterTypeById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateDisasterType: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getDisasterTypesByRiskLevel: (req: Request, res: Response, next: import("express").NextFunction) => void;
    toggleDisasterTypeStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getDisasterTypeStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteDisasterType: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=DisasterTypeController.d.ts.map