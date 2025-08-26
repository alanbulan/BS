"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const FileModel_1 = require("../models/FileModel");
const upload_1 = require("../middleware/upload");
class FileService {
    constructor() {
        this.fileModel = new FileModel_1.FileModel();
    }
    async saveFile(file, uploadedBy, relatedType, relatedId, isPublic = false) {
        try {
            const fileInfo = (0, upload_1.getFileInfo)(file);
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
        }
        catch (error) {
            (0, upload_1.cleanupTempFiles)(file);
            console.error('文件保存失败:', error);
            throw error;
        }
    }
    async saveFiles(files, uploadedBy, relatedType, relatedId, isPublic = false) {
        const savedFiles = [];
        const failedFiles = [];
        for (const file of files) {
            try {
                const fileRecord = await this.saveFile(file, uploadedBy, relatedType, relatedId, isPublic);
                savedFiles.push(fileRecord);
            }
            catch (error) {
                console.error(`文件保存失败: ${file.originalname}`, error);
                failedFiles.push(file);
            }
        }
        if (failedFiles.length > 0) {
            (0, upload_1.cleanupTempFiles)(failedFiles);
        }
        return savedFiles;
    }
    async processImage(file, options = {}) {
        try {
            const { width = 1920, height = 1080, quality = 80, format = 'jpeg' } = options;
            if (!file.mimetype.startsWith('image/')) {
                return file;
            }
            const outputPath = file.path.replace(path_1.default.extname(file.path), `_processed.${format}`);
            await (0, sharp_1.default)(file.path)
                .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            })
                .jpeg({ quality: format === 'jpeg' ? quality : undefined })
                .png({ quality: format === 'png' ? quality : undefined })
                .webp({ quality: format === 'webp' ? quality : undefined })
                .toFile(outputPath);
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
            const stats = fs_1.default.statSync(outputPath);
            file.path = outputPath;
            file.filename = path_1.default.basename(outputPath);
            file.size = stats.size;
            file.mimetype = `image/${format}`;
            console.log(`图片处理完成: ${file.originalname}`);
            return file;
        }
        catch (error) {
            console.error('图片处理失败:', error);
            throw error;
        }
    }
    async processImages(files, options = {}) {
        const processedFiles = [];
        for (const file of files) {
            try {
                const processedFile = await this.processImage(file, options);
                processedFiles.push(processedFile);
            }
            catch (error) {
                console.error(`图片处理失败: ${file.originalname}`, error);
                processedFiles.push(file);
            }
        }
        return processedFiles;
    }
    async getFileById(id) {
        try {
            const file = await this.fileModel.findById(id);
            return file;
        }
        catch (error) {
            console.error('获取文件失败:', error);
            return null;
        }
    }
    async getFilesByRelation(relatedType, relatedId, category) {
        try {
            const files = await this.fileModel.findByRelation(relatedType, relatedId, category);
            return files;
        }
        catch (error) {
            console.error('获取关联文件失败:', error);
            return [];
        }
    }
    async getFilesByUser(userId, category, page = 1, limit = 20) {
        try {
            const result = await this.fileModel.findByUser(userId, category, page, limit);
            return {
                files: result.files,
                total: result.total
            };
        }
        catch (error) {
            console.error('获取用户文件失败:', error);
            return { files: [], total: 0 };
        }
    }
    async deleteFile(id, userId) {
        try {
            const file = await this.fileModel.findById(id);
            if (!file) {
                throw new Error('文件不存在');
            }
            if (userId && file.uploaded_by !== userId) {
                throw new Error('无权限删除此文件');
            }
            if (fs_1.default.existsSync(file.file_path)) {
                fs_1.default.unlinkSync(file.file_path);
                console.log(`物理文件已删除: ${file.file_path}`);
            }
            const success = await this.fileModel.deleteFile(id);
            if (success) {
                console.log(`文件记录已删除: ${file.original_name}`);
            }
            return success;
        }
        catch (error) {
            console.error('删除文件失败:', error);
            throw error;
        }
    }
    async deleteFiles(ids, userId) {
        let successCount = 0;
        let failedCount = 0;
        for (const id of ids) {
            try {
                await this.deleteFile(id, userId);
                successCount++;
            }
            catch (error) {
                console.error(`删除文件 ${id} 失败:`, error);
                failedCount++;
            }
        }
        return { success: successCount, failed: failedCount };
    }
    async updateFile(id, updates, userId) {
        try {
            const file = await this.fileModel.findById(id);
            if (!file) {
                throw new Error('文件不存在');
            }
            if (userId && file.uploaded_by !== userId) {
                throw new Error('无权限修改此文件');
            }
            return await this.fileModel.updateFile(id, updates);
        }
        catch (error) {
            console.error('更新文件失败:', error);
            throw error;
        }
    }
    async getFileStats(userId) {
        try {
            return await this.fileModel.getFileStats(userId);
        }
        catch (error) {
            console.error('获取文件统计失败:', error);
            throw error;
        }
    }
    async cleanupOrphanFiles(dryRun = true) {
        try {
            const orphanFiles = await this.fileModel.findOrphanFiles();
            const cleanupList = [];
            let totalSize = 0;
            for (const file of orphanFiles) {
                if (fs_1.default.existsSync(file.file_path)) {
                    const stats = fs_1.default.statSync(file.file_path);
                    totalSize += stats.size;
                    cleanupList.push(file.file_path);
                    if (!dryRun) {
                        fs_1.default.unlinkSync(file.file_path);
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
        }
        catch (error) {
            console.error('清理孤立文件失败:', error);
            throw error;
        }
    }
    generateFileUrl(file, baseUrl) {
        const base = baseUrl || process.env.BASE_URL || 'http://localhost:3000';
        return `${base}${file.file_url}`;
    }
    async fileExists(id) {
        try {
            const file = await this.fileModel.findById(id);
            return file !== null && fs_1.default.existsSync(file.file_path);
        }
        catch (error) {
            return false;
        }
    }
    getMimeType(filePath) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        const mimeTypes = {
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
exports.FileService = FileService;
//# sourceMappingURL=FileService.js.map