import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { FileModel } from '../models/FileModel';
import { getFileInfo, cleanupTempFiles } from '../middleware/upload';

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

export class FileService {
  private fileModel: FileModel;

  constructor() {
    this.fileModel = new FileModel();
  }

  /**
   * 保存单个文件记录
   */
  async saveFile(
    file: Express.Multer.File, 
    uploadedBy?: number,
    relatedType?: string,
    relatedId?: number,
    isPublic: boolean = false
  ): Promise<FileRecord> {
    try {
      const fileInfo = getFileInfo(file);
      
      const fileRecord = await this.fileModel.createFile({
        original_name: fileInfo.originalName,
        file_name: fileInfo.fileName,
        file_path: fileInfo.path,
        file_url: fileInfo.url,
        mime_type: fileInfo.mimetype,
        file_size: fileInfo.size,
        category: fileInfo.category,
        uploaded_by: uploadedBy,
        related_type: relatedType,
        related_id: relatedId,
        is_public: isPublic
      });

      console.log(`文件保存成功: ${fileInfo.originalName} -> ${fileInfo.fileName}`);
      return fileRecord;
    } catch (error) {
      // 保存失败时清理文件
      cleanupTempFiles(file);
      console.error('文件保存失败:', error);
      throw error;
    }
  }

  /**
   * 批量保存文件记录
   */
  async saveFiles(
    files: Express.Multer.File[],
    uploadedBy?: number,
    relatedType?: string,
    relatedId?: number,
    isPublic: boolean = false
  ): Promise<FileRecord[]> {
    const savedFiles: FileRecord[] = [];
    const failedFiles: Express.Multer.File[] = [];

    for (const file of files) {
      try {
        const fileRecord = await this.saveFile(file, uploadedBy, relatedType, relatedId, isPublic);
        savedFiles.push(fileRecord);
      } catch (error) {
        console.error(`文件保存失败: ${file.originalname}`, error);
        failedFiles.push(file);
      }
    }

    // 清理失败的文件
    if (failedFiles.length > 0) {
      cleanupTempFiles(failedFiles);
    }

    return savedFiles;
  }

  /**
   * 处理图片（压缩、调整大小）
   */
  async processImage(
    file: Express.Multer.File,
    options: ImageProcessOptions = {}
  ): Promise<Express.Multer.File> {
    try {
      const {
        width = 1920,
        height = 1080,
        quality = 80,
        format = 'jpeg'
      } = options;

      // 只处理图片文件
      if (!file.mimetype.startsWith('image/')) {
        return file;
      }

      const outputPath = file.path.replace(path.extname(file.path), `_processed.${format}`);
      
      await sharp(file.path)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: format === 'jpeg' ? quality : undefined })
        .png({ quality: format === 'png' ? quality : undefined })
        .webp({ quality: format === 'webp' ? quality : undefined })
        .toFile(outputPath);

      // 删除原文件
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // 更新文件信息
      const stats = fs.statSync(outputPath);
      file.path = outputPath;
      file.filename = path.basename(outputPath);
      file.size = stats.size;
      file.mimetype = `image/${format}`;

      console.log(`图片处理完成: ${file.originalname}`);
      return file;
    } catch (error) {
      console.error('图片处理失败:', error);
      throw error;
    }
  }

  /**
   * 批量处理图片
   */
  async processImages(
    files: Express.Multer.File[],
    options: ImageProcessOptions = {}
  ): Promise<Express.Multer.File[]> {
    const processedFiles: Express.Multer.File[] = [];

    for (const file of files) {
      try {
        const processedFile = await this.processImage(file, options);
        processedFiles.push(processedFile);
      } catch (error) {
        console.error(`图片处理失败: ${file.originalname}`, error);
        // 处理失败时保留原文件
        processedFiles.push(file);
      }
    }

    return processedFiles;
  }

  /**
   * 根据ID获取文件
   */
  async getFileById(id: number): Promise<FileRecord | null> {
    try {
      const file = await this.fileModel.findById(id);
      return file as FileRecord | null;
    } catch (error) {
      console.error('获取文件失败:', error);
      return null;
    }
  }

  /**
   * 根据关联信息获取文件列表
   */
  async getFilesByRelation(
    relatedType: string,
    relatedId: number,
    category?: string
  ): Promise<FileRecord[]> {
    try {
      const files = await this.fileModel.findByRelation(relatedType, relatedId, category);
      return files as FileRecord[];
    } catch (error) {
      console.error('获取关联文件失败:', error);
      return [];
    }
  }

  /**
   * 根据用户获取文件列表
   */
  async getFilesByUser(
    userId: number,
    category?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ files: FileRecord[]; total: number }> {
    try {
      const result = await this.fileModel.findByUser(userId, category, page, limit);
      return {
        files: result.files as FileRecord[],
        total: result.total
      };
    } catch (error) {
      console.error('获取用户文件失败:', error);
      return { files: [], total: 0 };
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(id: number, userId?: number): Promise<boolean> {
    try {
      const file = await this.fileModel.findById(id);
      if (!file) {
        throw new Error('文件不存在');
      }

      // 检查权限
      if (userId && file.uploaded_by !== userId) {
        throw new Error('无权限删除此文件');
      }

      // 删除物理文件
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
        console.log(`物理文件已删除: ${file.file_path}`);
      }

      // 删除数据库记录
      const success = await this.fileModel.deleteFile(id);
      if (success) {
        console.log(`文件记录已删除: ${file.original_name}`);
      }

      return success;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(ids: number[], userId?: number): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const id of ids) {
      try {
        await this.deleteFile(id, userId);
        successCount++;
      } catch (error) {
        console.error(`删除文件 ${id} 失败:`, error);
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * 更新文件信息
   */
  async updateFile(
    id: number,
    updates: Partial<FileRecord>,
    userId?: number
  ): Promise<FileRecord | null> {
    try {
      const file = await this.fileModel.findById(id);
      if (!file) {
        throw new Error('文件不存在');
      }

      // 检查权限
      if (userId && file.uploaded_by !== userId) {
        throw new Error('无权限修改此文件');
      }

      return await this.fileModel.updateFile(id, updates);
    } catch (error) {
      console.error('更新文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件统计信息
   */
  async getFileStats(userId?: number): Promise<any> {
    try {
      return await this.fileModel.getFileStats(userId);
    } catch (error) {
      console.error('获取文件统计失败:', error);
      throw error;
    }
  }

  /**
   * 清理孤立文件（没有关联的文件）
   */
  async cleanupOrphanFiles(dryRun: boolean = true): Promise<{ files: string[]; size: number }> {
    try {
      const orphanFiles = await this.fileModel.findOrphanFiles();
      const cleanupList: string[] = [];
      let totalSize = 0;

      for (const file of orphanFiles) {
        if (fs.existsSync(file.file_path)) {
          const stats = fs.statSync(file.file_path);
          totalSize += stats.size;
          cleanupList.push(file.file_path);

          if (!dryRun) {
            fs.unlinkSync(file.file_path);
            if (file.id) {
              await this.fileModel.deleteFile(file.id);
            }
            console.log(`清理孤立文件: ${file.file_path}`);
          }
        }
      }

      return {
        files: cleanupList,
        size: totalSize
      };
    } catch (error) {
      console.error('清理孤立文件失败:', error);
      throw error;
    }
  }

  /**
   * 生成文件访问URL
   */
  generateFileUrl(file: FileRecord, baseUrl?: string): string {
    const base = baseUrl || process.env.BASE_URL || 'http://localhost:3000';
    return `${base}${file.file_url}`;
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(id: number): Promise<boolean> {
    try {
      const file = await this.fileModel.findById(id);
      return file !== null && fs.existsSync(file.file_path);
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取文件MIME类型
   */
  getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/mov',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}