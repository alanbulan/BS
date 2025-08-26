import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class WarningController extends BaseController {
    private warningModel;
    private warningService;
    constructor();
    createWarning: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarnings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateWarning: (req: Request, res: Response, next: import("express").NextFunction) => void;
    cancelWarning: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningsByLocation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getActiveWarnings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getEvacuationWarnings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningsByZone: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningsByDisasterType: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningsByLevel: (req: Request, res: Response, next: import("express").NextFunction) => void;
    autoAssessAndWarn: (req: Request, res: Response, next: import("express").NextFunction) => void;
    processExpiredWarnings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateWarningStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    extendWarningExpiry: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createWarningUpdate: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningsInArea: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningLevelStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getDisasterTypeWarningStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteWarning: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=WarningController.d.ts.map