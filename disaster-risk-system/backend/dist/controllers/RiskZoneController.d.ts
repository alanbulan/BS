import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class RiskZoneController extends BaseController {
    private riskZoneModel;
    constructor();
    createRiskZone: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZones: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZoneById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZoneByCode: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateRiskZone: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZonesByLocation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getNearbyRiskZones: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZonesByDisasterType: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZonesByRiskLevel: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZoneStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskZoneBounds: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getOverlappingRiskZones: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteRiskZone: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=RiskZoneController.d.ts.map