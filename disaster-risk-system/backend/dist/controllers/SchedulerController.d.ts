import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class SchedulerController extends BaseController {
    constructor();
    getTaskStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    manualAutoAssess: (req: Request, res: Response, next: import("express").NextFunction) => void;
    manualProcessExpired: (req: Request, res: Response, next: import("express").NextFunction) => void;
    manualCleanupTokens: (req: Request, res: Response, next: import("express").NextFunction) => void;
    startTasks: (req: Request, res: Response, next: import("express").NextFunction) => void;
    stopTasks: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=SchedulerController.d.ts.map