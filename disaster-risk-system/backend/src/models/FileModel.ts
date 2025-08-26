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

export class FileModel extends BaseModel {
  constructor() {
    super('files');
  }

  async createFile(fileData: Omit<FileData, 'id' | 'created_at'>): Promise<FileData> {
    const result = await this.create(fileData);
    return result as FileData;
  }

  async findById(id: number): Promise<FileData | null> {
    const result = await super.findById(id);
    return result;
  }

  async findByRelation(relatedType: string, relatedId: number, category?: string): Promise<FileData[]> {
    const conditions: any = {
      related_type: relatedType,
      related_id: relatedId
    };
    
    if (category) {
      conditions.category = category;
    }
    
    return await this.findWhere(conditions);
  }

  async findByUser(userId: number, category?: string, page: number = 1, limit: number = 20): Promise<{ files: FileData[]; total: number }> {
    const conditions: any = {
      uploaded_by: userId
    };
    
    if (category) {
      conditions.category = category;
    }
    
    const offset = (page - 1) * limit;
    const files = await this.findWhere(conditions);
    const total = files.length;
    
    return { files, total };
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.delete(id);
    return result;
  }

  async updateById(id: number, updates: Partial<FileData>): Promise<FileData | null> {
    const result = await this.update(id, updates);
    return result as FileData | null;
  }

  async updateFile(id: number, updates: Partial<FileData>): Promise<FileData | null> {
    return await this.updateById(id, updates);
  }

  async getStats(userId?: number): Promise<any> {
    // 简化的统计实现
    const conditions = userId ? { uploaded_by: userId } : {};
    const total = await this.count(conditions);
    
    return {
      total_files: total,
      total_size: 0, // 需要实际计算
      by_category: {}
    };
  }

  async getFileStats(userId?: number): Promise<any> {
    return await this.getStats(userId);
  }

  async deleteFile(id: number): Promise<boolean> {
    return await this.deleteById(id);
  }

  async findOrphanFiles(): Promise<FileData[]> {
    // 查找没有关联的文件
    const allFiles = await this.findAll();
    return allFiles.filter(file => !file.related_type && !file.related_id);
  }
}