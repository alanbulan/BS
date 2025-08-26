import { Request } from 'express';
export declare const ALLOWED_IMAGE_TYPES: string[];
export declare const ALLOWED_VIDEO_TYPES: string[];
export declare const ALLOWED_DOCUMENT_TYPES: string[];
export declare const MAX_IMAGE_SIZE: number;
export declare const MAX_VIDEO_SIZE: number;
export declare const MAX_DOCUMENT_SIZE: number;
export declare const uploadSingle: (fieldName?: string) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultiple: (fieldName?: string, maxCount?: number) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadFields: (fields: {
    name: string;
    maxCount: number;
}[]) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const validateFileSize: (req: Request, res: any, next: any) => any;
export declare const handleUploadError: (error: any, req: Request, res: any, next: any) => any;
export declare const cleanupTempFiles: (files: Express.Multer.File | Express.Multer.File[] | undefined) => void;
export declare const getFileInfo: (file: Express.Multer.File) => {
    originalName: string;
    fileName: string;
    mimetype: string;
    size: number;
    path: string;
    category: string;
    url: string;
};
//# sourceMappingURL=upload.d.ts.map