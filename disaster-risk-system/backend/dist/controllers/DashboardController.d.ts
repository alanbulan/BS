import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class DashboardController extends BaseController {
    private shelterModel;
    private userReportModel;
    private monitoringDataModel;
    private stationModel;
    constructor();
    getDashboardStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getDisasterTypeStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMonitoringOverview: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskTrends: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRiskLevelStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRecentWarnings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSystemStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    private getMonitoringStatus;
    private getWarningStatus;
    private getDataSyncStatus;
    private getMapServiceStatus;
    private checkMonitoringSystemStatus;
    private checkWarningSystemStatus;
    private checkDataSyncStatus;
    private getLastDataUpdateTime;
}
//# sourceMappingURL=DashboardController.d.ts.map