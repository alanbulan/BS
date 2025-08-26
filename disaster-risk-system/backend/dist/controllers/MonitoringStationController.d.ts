import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class MonitoringStationController extends BaseController {
    private stationModel;
    private typeModel;
    constructor();
    createStation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStations: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationByStationId: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateStation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getActiveStations: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationsByType: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationsByZone: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getNearbyStations: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateStationLocation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    toggleStationStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationTypeStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationsNeedingMaintenance: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateMaintenanceSchedule: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateStationEquipment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getDataTransmissionStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteStation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    batchUpdateStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationDetail: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStationStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    batchUpdateStationStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=MonitoringStationController.d.ts.map