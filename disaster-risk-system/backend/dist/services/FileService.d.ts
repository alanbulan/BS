export interface FileRecord {
    id: number;
    original_name: string;
    file_name: string;
    file_path: string;
    file_url: string;
    mime_type: string;
    file_size: number;
    category: string;
    uploaded_by?: number;
    related_type?: string;
    related_id?: number;
    is_public: boolean;
    created_at: Date;
}
export interface ImageProcessOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}
export declare class FileService {
    private fileModel;
    constructor();
    saveFile(file: Express.Multer.File, uploadedBy?: number, relatedType?: string, relatedId?: number, isPublic?: boolean): Promise<FileRecord>;
    saveFiles(files: Express.Multer.File[], uploadedBy?: number, relatedType?: string, relatedId?: number, isPublic?: boolean): Promise<FileRecord[]>;
    processImage(file: Express.Multer.File, options?: ImageProcessOptions): Promise<Express.Multer.File>;
    processImages(files: Express.Multer.File[], options?: ImageProcessOptions): Promise<Express.Multer.File[]>;
    getFileById(id: number): Promise<FileRecord | null>;
    getFilesByRelation(relatedType: string, relatedId: number, category?: string): Promise<FileRecord[]>;
    getFilesByUser(userId: number, category?: string, page?: number, limit?: number): Promise<{
        files: FileRecord[];
        total: number;
    }>;
    deleteFile(id: number, userId?: number): Promise<boolean>;
    deleteFiles(ids: number[], userId?: number): Promise<{
        success: number;
        failed: number;
    }>;
    updateFile(id: number, updates: Partial<FileRecord>, userId?: number): Promise<FileRecord | null>;
    getFileStats(userId?: number): Promise<any>;
    cleanupOrphanFiles(dryRun?: boolean): Promise<{
        files: string[];
        size: number;
    }>;
    generateFileUrl(file: FileRecord, baseUrl?: string): string;
    fileExists(id: number): Promise<boolean>;
    getMimeType(filePath: string): string;
}
//# sourceMappingURL=FileService.d.ts.map