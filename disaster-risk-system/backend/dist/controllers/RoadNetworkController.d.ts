import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class RoadNetworkController extends BaseController {
    private roadNetworkModel;
    constructor();
    createRoad: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRoads: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRoadById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRoadByRoadId: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRoadsInArea: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getEmergencyRoutes: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRoadsNearPoint: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateRoad: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteRoad: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    batchImport: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateConditionScore: (req: Request, res: Response, next: import("express").NextFunction) => void;
    setEmergencyRoute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getConnectivityAnalysis: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getQualityReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=RoadNetworkController.d.ts.map