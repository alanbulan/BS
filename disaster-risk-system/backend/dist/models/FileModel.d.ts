import { BaseModel } from './BaseModel';
export interface FileData {
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
export declare class FileModel extends BaseModel {
    constructor();
    createFile(fileData: Omit<FileData, 'id' | 'created_at'>): Promise<FileData>;
    findById(id: number): Promise<FileData | null>;
    findByRelation(relatedType: string, relatedId: number, category?: string): Promise<FileData[]>;
    findByUser(userId: number, category?: string, page?: number, limit?: number): Promise<{
        files: FileData[];
        total: number;
    }>;
    deleteById(id: number): Promise<boolean>;
    updateById(id: number, updates: Partial<FileData>): Promise<FileData | null>;
    updateFile(id: number, updates: Partial<FileData>): Promise<FileData | null>;
    getStats(userId?: number): Promise<any>;
    getFileStats(userId?: number): Promise<any>;
    deleteFile(id: number): Promise<boolean>;
    findOrphanFiles(): Promise<FileData[]>;
}
//# sourceMappingURL=FileModel.d.ts.map