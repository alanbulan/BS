import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

// 支持的文件类型
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm'
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

// 文件大小限制 (字节)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

// 确保上传目录存在
const ensureUploadDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 生成唯一文件名
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  let ext = path.extname(originalName);
  
  // 如果没有扩展名，尝试从文件名猜测
  if (!ext && originalName) {
    const nameLower = originalName.toLowerCase();
    if (nameLower.includes('jpg') || nameLower.includes('jpeg')) ext = '.jpg';
    else if (nameLower.includes('png')) ext = '.png';
    else if (nameLower.includes('gif')) ext = '.gif';
    else if (nameLower.includes('webp')) ext = '.webp';
    else ext = '.jpg'; // 默认jpg
  }
  
  console.log('[UPLOAD] 原始文件名:', originalName, '扩展名:', ext);
  return `${timestamp}_${randomString}${ext}`;
};

// 获取文件类别
const getFileCategory = (mimetype: string): string => {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return 'images';
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) return 'videos';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimetype)) return 'documents';
  return 'others';
};

// 存储配置
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const category = getFileCategory(file.mimetype);
    const fullPath = path.join(uploadPath, category);
    
    ensureUploadDir(fullPath);
    cb(null, fullPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const fileName = generateFileName(file.originalname);
    cb(null, fileName);
  }
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_VIDEO_TYPES,
    ...ALLOWED_DOCUMENT_TYPES
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`));
  }
};

// 文件大小限制函数
const getFileSizeLimit = (mimetype: string): number => {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return MAX_IMAGE_SIZE;
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) return MAX_VIDEO_SIZE;
  if (ALLOWED_DOCUMENT_TYPES.includes(mimetype)) return MAX_DOCUMENT_SIZE;
  return MAX_IMAGE_SIZE; // 默认限制
};

// 基础上传配置
const createUploadMiddleware = (maxFiles: number = 10) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_VIDEO_SIZE, // 使用最大的限制作为总体限制
      files: maxFiles
    }
  });
};

// 单文件上传中间件
export const uploadSingle = (fieldName: string = 'file') => {
  return createUploadMiddleware(1).single(fieldName);
};

// 多文件上传中间件
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => {
  return createUploadMiddleware(maxCount).array(fieldName, maxCount);
};

// 混合字段上传中间件
export const uploadFields = (fields: { name: string; maxCount: number }[]) => {
  const maxFiles = fields.reduce((sum, field) => sum + field.maxCount, 0);
  return createUploadMiddleware(maxFiles).fields(fields);
};

// 文件验证中间件
export const validateFileSize = (req: Request, res: any, next: any) => {
  if (!req.files && !req.file) {
    return next();
  }

  const files = req.files ? 
    (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : 
    [req.file];

  for (const file of files) {
    if (!file) continue;
    
    const sizeLimit = getFileSizeLimit(file.mimetype);
    if (file.size > sizeLimit) {
      // 删除已上传的文件
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return res.status(400).json({
        success: false,
        error: `文件 ${file.originalname} 超过大小限制 (${(sizeLimit / 1024 / 1024).toFixed(1)}MB)`
      });
    }
  }

  next();
};

// 错误处理中间件
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: '文件大小超过限制'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: '文件数量超过限制'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: '意外的文件字段'
        });
      default:
        return res.status(400).json({
          success: false,
          error: `上传错误: ${error.message}`
        });
    }
  }

  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
};

// 清理临时文件
export const cleanupTempFiles = (files: Express.Multer.File | Express.Multer.File[] | undefined) => {
  if (!files) return;

  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach(file => {
    if (file && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log(`清理临时文件: ${file.path}`);
      } catch (error) {
        console.error(`清理文件失败: ${file.path}`, error);
      }
    }
  });
};

// 获取文件信息
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    fileName: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    category: getFileCategory(file.mimetype),
    url: `/uploads/${getFileCategory(file.mimetype)}/${file.filename}`
  };
};