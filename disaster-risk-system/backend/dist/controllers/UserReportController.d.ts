import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class UserReportController extends BaseController {
    private userReportModel;
    constructor();
    getUserReports: (req: Request, res: Response) => Promise<void>;
    getUserReportById: (req: Request, res: Response) => Promise<void>;
    createUserReport: (req: Request, res: Response) => Promise<void>;
    verifyUserReport: (req: Request, res: Response) => Promise<void>;
    updateVotes: (req: Request, res: Response) => Promise<void>;
    getNearbyReports: (req: Request, res: Response) => Promise<void>;
    getReportTypeStats: (req: Request, res: Response) => Promise<void>;
    getRecentEmergencyReports: (req: Request, res: Response) => Promise<void>;
    getReportTypes: (req: Request, res: Response) => Promise<void>;
    getReportConstants: (_req: Request, res: Response) => Promise<void>;
    deleteUserReport: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=UserReportController.d.ts.map