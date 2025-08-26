import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const commonValidations: {
    id: Joi.NumberSchema<number>;
    pagination: {
        page: Joi.NumberSchema<number>;
        limit: Joi.NumberSchema<number>;
    };
    coordinates: {
        longitude: Joi.NumberSchema<number>;
        latitude: Joi.NumberSchema<number>;
    };
    timeRange: {
        startTime: Joi.DateSchema<Date>;
        endTime: Joi.DateSchema<Date>;
    };
    riskLevel: Joi.NumberSchema<number>;
    username: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    phone: Joi.StringSchema<string>;
    geometry: Joi.ObjectSchema<any>;
    file: {
        mimetype: Joi.StringSchema<string>;
        size: Joi.NumberSchema<number>;
    };
};
export declare const validateChinaCoordinates: (longitude: number, latitude: number) => boolean;
export declare const validateGeometry: (geometry: any) => boolean;
export declare const sanitizeInput: (input: any) => any;
//# sourceMappingURL=validation.d.ts.map