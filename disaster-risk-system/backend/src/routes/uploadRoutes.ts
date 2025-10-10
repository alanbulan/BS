import { Router } from 'express';
import { UploadController } from '../controllers/UploadController';
import { verifyToken } from '../middleware/auth';
import { uploadSingle, uploadMultiple, validateFileSize, handleUploadError } from '../middleware/upload';

const router = Router();
const uploadController = new UploadController();

// 单个图片上传 (需要登录)
router.post(
  '/image',
  verifyToken,
  uploadSingle('file'),
  handleUploadError,
  validateFileSize,
  uploadController.uploadImage
);

// 多个图片上传 (需要登录)
router.post(
  '/images',
  verifyToken,
  uploadMultiple('files', 9),
  handleUploadError,
  validateFileSize,
  uploadController.uploadImages
);

// 视频上传 (需要登录)
router.post(
  '/video',
  verifyToken,
  uploadSingle('file'),
  handleUploadError,
  validateFileSize,
  uploadController.uploadVideo
);

// 文档上传 (需要登录)
router.post(
  '/document',
  verifyToken,
  uploadSingle('file'),
  handleUploadError,
  validateFileSize,
  uploadController.uploadDocument
);

export default router;

