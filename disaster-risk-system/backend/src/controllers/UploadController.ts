import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { getFileInfo } from '../middleware/upload';
import path from 'path';

export class UploadController extends BaseController {
  /**
   * 单个图片上传
   * POST /uploads/image
   */
  uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        this.error(res, '未上传文件', 400);
        return;
      }

      const fileInfo = getFileInfo(req.file);
      
      this.success(res, {
        url: fileInfo.url,
        filename: fileInfo.fileName,
        size: fileInfo.size,
        mimetype: fileInfo.mimetype
      }, '图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      this.error(res, '图片上传失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 多个图片上传
   * POST /uploads/images
   */
  uploadImages = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        this.error(res, '未上传文件', 400);
        return;
      }

      const filesInfo = req.files.map(file => getFileInfo(file));
      
      this.success(res, filesInfo.map(info => ({
        url: info.url,
        filename: info.fileName,
        size: info.size,
        mimetype: info.mimetype
      })), `成功上传${filesInfo.length}个文件`);
    } catch (error) {
      console.error('批量上传失败:', error);
      this.error(res, '批量上传失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 视频上传
   * POST /uploads/video
   */
  uploadVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        this.error(res, '未上传文件', 400);
        return;
      }

      const fileInfo = getFileInfo(req.file);
      
      this.success(res, {
        url: fileInfo.url,
        filename: fileInfo.fileName,
        size: fileInfo.size,
        mimetype: fileInfo.mimetype
      }, '视频上传成功');
    } catch (error) {
      console.error('视频上传失败:', error);
      this.error(res, '视频上传失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 文档上传
   * POST /uploads/document
   */
  uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        this.error(res, '未上传文件', 400);
        return;
      }

      const fileInfo = getFileInfo(req.file);
      
      this.success(res, {
        url: fileInfo.url,
        filename: fileInfo.fileName,
        size: fileInfo.size,
        mimetype: fileInfo.mimetype
      }, '文档上传成功');
    } catch (error) {
      console.error('文档上传失败:', error);
      this.error(res, '文档上传失败: ' + (error as Error).message, 500);
    }
  };
}

