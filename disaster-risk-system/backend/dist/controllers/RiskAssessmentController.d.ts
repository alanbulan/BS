import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class RiskAssessmentController extends BaseController {
    private riskAssessmentService;
    private riskAssessmentModel;
    constructor();
    assessZoneRisk: (req: Request, res: Response, next: import("express").NextFunction) => void;
    batchAssessRisk: (req: Request, res: Response, next: import("express").NextFunction) => void;
    assessLocationRisk: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getHistoricalAssessments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getHighRiskZones: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskAssessments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskAssessment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createRiskAssessment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateRiskAssessment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteRiskAssessment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskAssessmentStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    exportRiskAssessments: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=RiskAssessmentController.d.ts.map