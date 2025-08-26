"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWriteStream = exports.createFileStream = exports.createDownloadResponse = exports.generateUploadPath = exports.getDirectorySize = exports.cleanDirectory = exports.readDirectory = exports.deleteFile = exports.moveFile = exports.copyFile = exports.formatFileSize = exports.validateFile = exports.getFileInfo = exports.ensureDirectory = exports.fileExists = exports.generateFileHash = exports.generateUniqueFileName = exports.isDocumentFile = exports.isImageFile = exports.isValidFileSize = exports.isValidFileType = exports.getFileType = exports.getMimeType = exports.getFileNameWithoutExtension = exports.getFileExtension = exports.FILE_SIZE_LIMITS = exports.ALLOWED_FILE_TYPES = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const crypto_1 = __importDefault(require("crypto"));
const mime = __importStar(require("mime-types"));
const readFile = (0, util_1.promisify)(fs_1.default.readFile);
const writeFile = (0, util_1.promisify)(fs_1.default.writeFile);
const unlink = (0, util_1.promisify)(fs_1.default.unlink);
const mkdir = (0, util_1.promisify)(fs_1.default.mkdir);
const stat = (0, util_1.promisify)(fs_1.default.stat);
const readdir = (0, util_1.promisify)(fs_1.default.readdir);
const access = (0, util_1.promisify)(fs_1.default.access);
exports.ALLOWED_FILE_TYPES = {
    IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
    DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz'],
    VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
    DATA: ['json', 'xml', 'csv', 'sql']
};
exports.FILE_SIZE_LIMITS = {
    IMAGE: 10 * 1024 * 1024,
    DOCUMENT: 50 * 1024 * 1024,
    ARCHIVE: 100 * 1024 * 1024,
    VIDEO: 500 * 1024 * 1024,
    AUDIO: 50 * 1024 * 1024,
    DATA: 10 * 1024 * 1024,
    DEFAULT: 10 * 1024 * 1024
};
const getFileExtension = (filename) => {
    return path_1.default.extname(filename).toLowerCase().slice(1);
};
exports.getFileExtension = getFileExtension;
const getFileNameWithoutExtension = (filename) => {
    return path_1.default.basename(filename, path_1.default.extname(filename));
};
exports.getFileNameWithoutExtension = getFileNameWithoutExtension;
const getMimeType = (filename) => {
    return mime.lookup(filename) || 'application/octet-stream';
};
exports.getMimeType = getMimeType;
const getFileType = (filename) => {
    const extension = (0, exports.getFileExtension)(filename);
    for (const [type, extensions] of Object.entries(exports.ALLOWED_FILE_TYPES)) {
        if (extensions.includes(extension)) {
            return type;
        }
    }
    return 'OTHER';
};
exports.getFileType = getFileType;
const isValidFileType = (filename, allowedTypes) => {
    const extension = (0, exports.getFileExtension)(filename);
    return allowedTypes.includes(extension);
};
exports.isValidFileType = isValidFileType;
const isValidFileSize = (size, maxSize) => {
    const limit = maxSize || exports.FILE_SIZE_LIMITS.DEFAULT;
    return size <= limit;
};
exports.isValidFileSize = isValidFileSize;
const isImageFile = (filename) => {
    return (0, exports.isValidFileType)(filename, exports.ALLOWED_FILE_TYPES.IMAGE);
};
exports.isImageFile = isImageFile;
const isDocumentFile = (filename) => {
    return (0, exports.isValidFileType)(filename, exports.ALLOWED_FILE_TYPES.DOCUMENT);
};
exports.isDocumentFile = isDocumentFile;
const generateUniqueFileName = (originalName) => {
    const extension = (0, exports.getFileExtension)(originalName);
    const timestamp = Date.now();
    const random = crypto_1.default.randomBytes(8).toString('hex');
    return `${timestamp}_${random}.${extension}`;
};
exports.generateUniqueFileName = generateUniqueFileName;
const generateFileHash = async (filePath) => {
    try {
        const fileBuffer = await readFile(filePath);
        return crypto_1.default.createHash('sha256').update(fileBuffer).digest('hex');
    }
    catch (error) {
        throw new Error(`Failed to generate file hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.generateFileHash = generateFileHash;
const fileExists = async (filePath) => {
    try {
        await access(filePath, fs_1.default.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
};
exports.fileExists = fileExists;
const ensureDirectory = async (dirPath) => {
    try {
        await mkdir(dirPath, { recursive: true });
    }
    catch (error) {
        throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.ensureDirectory = ensureDirectory;
const getFileInfo = async (filePath) => {
    try {
        const stats = await stat(filePath);
        const filename = path_1.default.basename(filePath);
        const extension = (0, exports.getFileExtension)(filename);
        const mimeType = (0, exports.getMimeType)(filename);
        const hash = await (0, exports.generateFileHash)(filePath);
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
    }
    catch (error) {
        throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.getFileInfo = getFileInfo;
const validateFile = async (filePath, options) => {
    const result = {
        isValid: true,
        errors: [],
        warnings: []
    };
    try {
        if (!(await (0, exports.fileExists)(filePath))) {
            result.isValid = false;
            result.errors.push('File does not exist');
            return result;
        }
        const fileInfo = await (0, exports.getFileInfo)(filePath);
        const filename = path_1.default.basename(filePath);
        if (options.allowedTypes && !(0, exports.isValidFileType)(filename, options.allowedTypes)) {
            result.isValid = false;
            result.errors.push(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
        }
        if (options.maxSize && !(0, exports.isValidFileSize)(fileInfo.size, options.maxSize)) {
            result.isValid = false;
            result.errors.push(`File size exceeds limit. Max size: ${(0, exports.formatFileSize)(options.maxSize)}`);
        }
        if (options.checkContent) {
            const buffer = await readFile(filePath);
            if (buffer.length === 0) {
                result.isValid = false;
                result.errors.push('File is empty');
            }
            if ((0, exports.isImageFile)(filename)) {
                if (!isValidImageFile(buffer)) {
                    result.isValid = false;
                    result.errors.push('Invalid image file format');
                }
            }
        }
    }
    catch (error) {
        result.isValid = false;
        result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return result;
};
exports.validateFile = validateFile;
const isValidImageFile = (buffer) => {
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return true;
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return true;
    }
    if (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a') {
        return true;
    }
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
        return true;
    }
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
        return true;
    }
    return false;
};
const formatFileSize = (bytes) => {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
exports.formatFileSize = formatFileSize;
const copyFile = async (sourcePath, destinationPath) => {
    try {
        const sourceBuffer = await readFile(sourcePath);
        await (0, exports.ensureDirectory)(path_1.default.dirname(destinationPath));
        await writeFile(destinationPath, sourceBuffer);
    }
    catch (error) {
        throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.copyFile = copyFile;
const moveFile = async (sourcePath, destinationPath) => {
    try {
        await (0, exports.copyFile)(sourcePath, destinationPath);
        await (0, exports.deleteFile)(sourcePath);
    }
    catch (error) {
        throw new Error(`Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.moveFile = moveFile;
const deleteFile = async (filePath) => {
    try {
        if (await (0, exports.fileExists)(filePath)) {
            await unlink(filePath);
        }
    }
    catch (error) {
        throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.deleteFile = deleteFile;
const readDirectory = async (dirPath) => {
    try {
        return await readdir(dirPath);
    }
    catch (error) {
        throw new Error(`Failed to read directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.readDirectory = readDirectory;
const cleanDirectory = async (dirPath, olderThanDays = 7) => {
    try {
        const files = await (0, exports.readDirectory)(dirPath);
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
        let deletedCount = 0;
        for (const file of files) {
            const filePath = path_1.default.join(dirPath, file);
            const stats = await stat(filePath);
            if (stats.mtime.getTime() < cutoffTime) {
                await (0, exports.deleteFile)(filePath);
                deletedCount++;
            }
        }
        return deletedCount;
    }
    catch (error) {
        throw new Error(`Failed to clean directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.cleanDirectory = cleanDirectory;
const getDirectorySize = async (dirPath) => {
    try {
        const files = await (0, exports.readDirectory)(dirPath);
        let totalSize = 0;
        for (const file of files) {
            const filePath = path_1.default.join(dirPath, file);
            const stats = await stat(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            }
            else if (stats.isDirectory()) {
                totalSize += await (0, exports.getDirectorySize)(filePath);
            }
        }
        return totalSize;
    }
    catch (error) {
        throw new Error(`Failed to get directory size: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.getDirectorySize = getDirectorySize;
const generateUploadPath = (baseDir, fileType, filename) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return path_1.default.join(baseDir, fileType.toLowerCase(), `${year}`, `${month}`, `${day}`, filename);
};
exports.generateUploadPath = generateUploadPath;
const createDownloadResponse = (filePath, filename) => {
    const actualFilename = filename || path_1.default.basename(filePath);
    const mimeType = (0, exports.getMimeType)(actualFilename);
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
exports.createDownloadResponse = createDownloadResponse;
const createFileStream = (filePath) => {
    return fs_1.default.createReadStream(filePath);
};
exports.createFileStream = createFileStream;
const createWriteStream = (filePath) => {
    return fs_1.default.createWriteStream(filePath);
};
exports.createWriteStream = createWriteStream;
//# sourceMappingURL=file.js.map