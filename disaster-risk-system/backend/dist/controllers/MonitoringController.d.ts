import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class MonitoringController extends BaseController {
    private monitoringModel;
    private stationModel;
    constructor();
    getMonitoringData: (req: Request, res: Response) => Promise<void>;
    getNearbyMonitoringData: (req: Request, res: Response) => Promise<void>;
    addMonitoringData: (req: Request, res: Response) => Promise<void>;
    batchAddMonitoringData: (req: Request, res: Response) => Promise<void>;
    getStationStatistics: (req: Request, res: Response) => Promise<void>;
    getDataTypes: (req: Request, res: Response) => Promise<void>;
    getStations: (req: Request, res: Response) => Promise<void>;
    createStation: (req: Request, res: Response) => Promise<void>;
    updateStation: (req: Request, res: Response) => Promise<void>;
    deleteStation: (req: Request, res: Response) => Promise<void>;
    getStationDetail: (req: Request, res: Response) => Promise<void>;
    batchUpdateStationStatus: (req: Request, res: Response) => Promise<void>;
    getRealtimeData: (req: Request, res: Response) => Promise<void>;
    deleteMonitoringData: (req: Request, res: Response) => Promise<void>;
    updateMonitoringData: (req: Request, res: Response) => Promise<void>;
    getAnomalousData: (req: Request, res: Response) => Promise<void>;
    getDataQualityReport: (req: Request, res: Response) => Promise<void>;
    getDataTrend: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=MonitoringController.d.ts.map