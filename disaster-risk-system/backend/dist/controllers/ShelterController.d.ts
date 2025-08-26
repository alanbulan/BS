import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class ShelterController extends BaseController {
    private shelterModel;
    constructor();
    getShelters: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getNearestShelters: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getShelterById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createShelter: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateShelter: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteShelter: (req: Request, res: Response, next: import("express").NextFunction) => void;
    batchDelete: (req: Request, res: Response, next: import("express").NextFunction) => void;
    batchUpdateStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    exportShelters: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCapacityHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateOccupancy: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getShelterStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getShelterTypes: (req: Request, res: Response, next: import("express").NextFunction) => void;
    private calculateDistance;
}
//# sourceMappingURL=ShelterController.d.ts.map