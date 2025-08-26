import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class RiskZonesController extends BaseController {
    getRiskZones: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZoneById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createRiskZone: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateRiskZone: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteRiskZone: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZoneStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    findRiskZoneByLocation: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=RiskZonesController.d.ts.map