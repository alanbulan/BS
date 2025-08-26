import fs from 'fs';
export declare const ALLOWED_FILE_TYPES: {
    IMAGE: string[];
    DOCUMENT: string[];
    ARCHIVE: string[];
    VIDEO: string[];
    AUDIO: string[];
    DATA: string[];
};
export declare const FILE_SIZE_LIMITS: {
    IMAGE: number;
    DOCUMENT: number;
    ARCHIVE: number;
    VIDEO: number;
    AUDIO: number;
    DATA: number;
    DEFAULT: number;
};
export interface FileInfo {
    name: string;
    originalName: string;
    size: number;
    mimeType: string;
    extension: string;
    path: string;
    hash: string;
    uploadTime: Date;
}
export interface FileValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export declare const getFileExtension: (filename: string) => string;
export declare const getFileNameWithoutExtension: (filename: string) => string;
export declare const getMimeType: (filename: string) => string;
export declare const getFileType: (filename: string) => string;
export declare const isValidFileType: (filename: string, allowedTypes: string[]) => boolean;
export declare const isValidFileSize: (size: number, maxSize?: number) => boolean;
export declare const isImageFile: (filename: string) => boolean;
export declare const isDocumentFile: (filename: string) => boolean;
export declare const generateUniqueFileName: (originalName: string) => string;
export declare const generateFileHash: (filePath: string) => Promise<string>;
export declare const fileExists: (filePath: string) => Promise<boolean>;
export declare const ensureDirectory: (dirPath: string) => Promise<void>;
export declare const getFileInfo: (filePath: string) => Promise<FileInfo>;
export declare const validateFile: (filePath: string, options: {
    allowedTypes?: string[];
    maxSize?: number;
    checkContent?: boolean;
}) => Promise<FileValidationResult>;
export declare const formatFileSize: (bytes: number) => string;
export declare const copyFile: (sourcePath: string, destinationPath: string) => Promise<void>;
export declare const moveFile: (sourcePath: string, destinationPath: string) => Promise<void>;
export declare const deleteFile: (filePath: string) => Promise<void>;
export declare const readDirectory: (dirPath: string) => Promise<string[]>;
export declare const cleanDirectory: (dirPath: string, olderThanDays?: number) => Promise<number>;
export declare const getDirectorySize: (dirPath: string) => Promise<number>;
export declare const generateUploadPath: (baseDir: string, fileType: string, filename: string) => string;
export declare const createDownloadResponse: (filePath: string, filename?: string) => {
    filePath: string;
    filename: string;
    mimeType: string;
    headers: {
        'Content-Type': string;
        'Content-Disposition': string;
        'Cache-Control': string;
    };
};
export declare const createFileStream: (filePath: string) => fs.ReadStream;
export declare const createWriteStream: (filePath: string) => fs.WriteStream;
//# sourceMappingURL=file.d.ts.map