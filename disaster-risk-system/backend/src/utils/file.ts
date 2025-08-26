// 文件工具函数
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import * as mime from 'mime-types';

// 异步文件操作
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const access = promisify(fs.access);

// 文件类型配置
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz'],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
  DATA: ['json', 'xml', 'csv', 'sql']
};

// 文件大小限制（字节）
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  ARCHIVE: 100 * 1024 * 1024, // 100MB
  VIDEO: 500 * 1024 * 1024, // 500MB
  AUDIO: 50 * 1024 * 1024, // 50MB
  DATA: 10 * 1024 * 1024, // 10MB
  DEFAULT: 10 * 1024 * 1024 // 10MB
};

// 文件信息接口
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

// 文件验证结果接口
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 获取文件扩展名
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().slice(1);
};

// 获取文件名（不含扩展名）
export const getFileNameWithoutExtension = (filename: string): string => {
  return path.basename(filename, path.extname(filename));
};

// 获取MIME类型
export const getMimeType = (filename: string): string => {
  return mime.lookup(filename) || 'application/octet-stream';
};

// 判断文件类型
export const getFileType = (filename: string): string => {
  const extension = getFileExtension(filename);
  
  for (const [type, extensions] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (extensions.includes(extension)) {
      return type;
    }
  }
  
  return 'OTHER';
};

// 验证文件类型
export const isValidFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

// 验证文件大小
export const isValidFileSize = (size: number, maxSize?: number): boolean => {
  const limit = maxSize || FILE_SIZE_LIMITS.DEFAULT;
  return size <= limit;
};

// 验证图片文件
export const isImageFile = (filename: string): boolean => {
  return isValidFileType(filename, ALLOWED_FILE_TYPES.IMAGE);
};

// 验证文档文件
export const isDocumentFile = (filename: string): boolean => {
  return isValidFileType(filename, ALLOWED_FILE_TYPES.DOCUMENT);
};

// 生成唯一文件名
export const generateUniqueFileName = (originalName: string): string => {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${random}.${extension}`;
};

// 生成文件哈希
export const generateFileHash = async (filePath: string): Promise<string> => {
  try {
    const fileBuffer = await readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (error) {
    throw new Error(`Failed to generate file hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 检查文件是否存在
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

// 创建目录
export const ensureDirectory = async (dirPath: string): Promise<void> => {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 获取文件信息
export const getFileInfo = async (filePath: string): Promise<FileInfo> => {
  try {
    const stats = await stat(filePath);
    const filename = path.basename(filePath);
    const extension = getFileExtension(filename);
    const mimeType = getMimeType(filename);
    const hash = await generateFileHash(filePath);
    
    return {
      name: filename,
      originalName: filename,
      size: stats.size,
      mimeType,
      extension,
      path: filePath,
      hash,
      uploadTime: stats.birthtime
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 验证文件
export const validateFile = async (filePath: string, options: {
  allowedTypes?: string[];
  maxSize?: number;
  checkContent?: boolean;
}): Promise<FileValidationResult> => {
  const result: FileValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  try {
    // 检查文件是否存在
    if (!(await fileExists(filePath))) {
      result.isValid = false;
      result.errors.push('File does not exist');
      return result;
    }
    
    const fileInfo = await getFileInfo(filePath);
    const filename = path.basename(filePath);
    
    // 验证文件类型
    if (options.allowedTypes && !isValidFileType(filename, options.allowedTypes)) {
      result.isValid = false;
      result.errors.push(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
    }
    
    // 验证文件大小
    if (options.maxSize && !isValidFileSize(fileInfo.size, options.maxSize)) {
      result.isValid = false;
      result.errors.push(`File size exceeds limit. Max size: ${formatFileSize(options.maxSize)}`);
    }
    
    // 检查文件内容（简单检查）
    if (options.checkContent) {
      const buffer = await readFile(filePath);
      
      // 检查是否为空文件
      if (buffer.length === 0) {
        result.isValid = false;
        result.errors.push('File is empty');
      }
      
      // 检查图片文件的魔数
      if (isImageFile(filename)) {
        if (!isValidImageFile(buffer)) {
          result.isValid = false;
          result.errors.push('Invalid image file format');
        }
      }
    }
    
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return result;
};

// 检查图片文件魔数
const isValidImageFile = (buffer: Buffer): boolean => {
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }
  
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return true;
  }
  
  // GIF
  if (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a') {
    return true;
  }
  
  // BMP
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
    return true;
  }
  
  // WebP
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return true;
  }
  
  return false;
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 复制文件
export const copyFile = async (sourcePath: string, destinationPath: string): Promise<void> => {
  try {
    const sourceBuffer = await readFile(sourcePath);
    await ensureDirectory(path.dirname(destinationPath));
    await writeFile(destinationPath, sourceBuffer);
  } catch (error) {
    throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 移动文件
export const moveFile = async (sourcePath: string, destinationPath: string): Promise<void> => {
  try {
    await copyFile(sourcePath, destinationPath);
    await deleteFile(sourcePath);
  } catch (error) {
    throw new Error(`Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 删除文件
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    if (await fileExists(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 读取目录
export const readDirectory = async (dirPath: string): Promise<string[]> => {
  try {
    return await readdir(dirPath);
  } catch (error) {
    throw new Error(`Failed to read directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 清理目录
export const cleanDirectory = async (dirPath: string, olderThanDays: number = 7): Promise<number> => {
  try {
    const files = await readDirectory(dirPath);
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await stat(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        await deleteFile(filePath);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    throw new Error(`Failed to clean directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 获取目录大小
export const getDirectorySize = async (dirPath: string): Promise<number> => {
  try {
    const files = await readDirectory(dirPath);
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await stat(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      }
    }
    
    return totalSize;
  } catch (error) {
    throw new Error(`Failed to get directory size: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 生成文件上传路径
export const generateUploadPath = (baseDir: string, fileType: string, filename: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return path.join(baseDir, fileType.toLowerCase(), `${year}`, `${month}`, `${day}`, filename);
};

// 创建文件下载响应
export const createDownloadResponse = (filePath: string, filename?: string) => {
  const actualFilename = filename || path.basename(filePath);
  const mimeType = getMimeType(actualFilename);
  
  return {
    filePath,
    filename: actualFilename,
    mimeType,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${actualFilename}"`,
      'Cache-Control': 'no-cache'
    }
  };
};

// 文件流处理
export const createFileStream = (filePath: string) => {
  return fs.createReadStream(filePath);
};

// 写入文件流
export const createWriteStream = (filePath: string) => {
  return fs.createWriteStream(filePath);
};