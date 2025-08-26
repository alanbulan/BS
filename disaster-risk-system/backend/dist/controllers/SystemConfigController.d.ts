import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class SystemConfigController extends BaseController {
    private systemConfigModel;
    constructor();
    createConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getConfigs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getConfigByKey: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getConfigValue: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getConfigsByType: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWarningLevels: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    setConfigValue: (req: Request, res: Response, next: import("express").NextFunction) => void;
    setBatchConfigs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    hardDeleteConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getConfigTypes: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    exportConfigs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    importConfigs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    resetToDefaults: (req: Request, res: Response, next: import("express").NextFunction) => void;
    clearCache: (req: Request, res: Response, next: import("express").NextFunction) => void;
    validateConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSystemInfo: (req: Request, res: Response, next: import("express").NextFunction) => void;
    private checkSystemStatus;
    private checkDatabaseConnection;
    private formatUptime;
}
//# sourceMappingURL=SystemConfigController.d.ts.map