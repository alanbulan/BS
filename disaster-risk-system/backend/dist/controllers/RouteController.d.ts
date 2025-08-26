import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class RouteController extends BaseController {
    private routeService;
    constructor();
    calculateRoute: (req: Request, res: Response) => Promise<void>;
    updateRouteStatus: (req: Request, res: Response) => Promise<void>;
    checkRerouting: (req: Request, res: Response) => Promise<void>;
    getNearestShelters: (req: Request, res: Response) => Promise<void>;
    getRouteDetails: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=RouteController.d.ts.map