"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileInfo = exports.cleanupTempFiles = exports.handleUploadError = exports.validateFileSize = exports.uploadFields = exports.uploadMultiple = exports.uploadSingle = exports.MAX_DOCUMENT_SIZE = exports.MAX_VIDEO_SIZE = exports.MAX_IMAGE_SIZE = exports.ALLOWED_DOCUMENT_TYPES = exports.ALLOWED_VIDEO_TYPES = exports.ALLOWED_IMAGE_TYPES = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
exports.ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
];
exports.ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm'
];
exports.ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];
exports.MAX_IMAGE_SIZE = 10 * 1024 * 1024;
exports.MAX_VIDEO_SIZE = 100 * 1024 * 1024;
exports.MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
const ensureUploadDir = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
};
const generateFileName = (originalName) => {
    const timestamp = Date.now();
    const randomString = crypto_1.default.randomBytes(8).toString('hex');
    const ext = path_1.default.extname(originalName);
    return `${timestamp}_${randomString}${ext}`;
};
const getFileCategory = (mimetype) => {
    if (exports.ALLOWED_IMAGE_TYPES.includes(mimetype))
        return 'images';
    if (exports.ALLOWED_VIDEO_TYPES.includes(mimetype))
        return 'videos';
    if (exports.ALLOWED_DOCUMENT_TYPES.includes(mimetype))
        return 'documents';
    return 'others';
};
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        const category = getFileCategory(file.mimetype);
        const fullPath = path_1.default.join(uploadPath, category);
        ensureUploadDir(fullPath);
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        const fileName = generateFileName(file.originalname);
        cb(null, fileName);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        ...exports.ALLOWED_IMAGE_TYPES,
        ...exports.ALLOWED_VIDEO_TYPES,
        ...exports.ALLOWED_DOCUMENT_TYPES
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
};
const getFileSizeLimit = (mimetype) => {
    if (exports.ALLOWED_IMAGE_TYPES.includes(mimetype))
        return exports.MAX_IMAGE_SIZE;
    if (exports.ALLOWED_VIDEO_TYPES.includes(mimetype))
        return exports.MAX_VIDEO_SIZE;
    if (exports.ALLOWED_DOCUMENT_TYPES.includes(mimetype))
        return exports.MAX_DOCUMENT_SIZE;
    return exports.MAX_IMAGE_SIZE;
};
const createUploadMiddleware = (maxFiles = 10) => {
    return (0, multer_1.default)({
        storage,
        fileFilter,
        limits: {
            fileSize: exports.MAX_VIDEO_SIZE,
            files: maxFiles
        }
    });
};
const uploadSingle = (fieldName = 'file') => {
    return createUploadMiddleware(1).single(fieldName);
};
exports.uploadSingle = uploadSingle;
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
    return createUploadMiddleware(maxCount).array(fieldName, maxCount);
};
exports.uploadMultiple = uploadMultiple;
const uploadFields = (fields) => {
    const maxFiles = fields.reduce((sum, field) => sum + field.maxCount, 0);
    return createUploadMiddleware(maxFiles).fields(fields);
};
exports.uploadFields = uploadFields;
const validateFileSize = (req, res, next) => {
    if (!req.files && !req.file) {
        return next();
    }
    const files = req.files ?
        (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) :
        [req.file];
    for (const file of files) {
        if (!file)
            continue;
        const sizeLimit = getFileSizeLimit(file.mimetype);
        if (file.size > sizeLimit) {
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
            return res.status(400).json({
                success: false,
                error: `文件 ${file.originalname} 超过大小限制 (${(sizeLimit / 1024 / 1024).toFixed(1)}MB)`
            });
        }
    }
    next();
};
exports.validateFileSize = validateFileSize;
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
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
exports.handleUploadError = handleUploadError;
const cleanupTempFiles = (files) => {
    if (!files)
        return;
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => {
        if (file && fs_1.default.existsSync(file.path)) {
            try {
                fs_1.default.unlinkSync(file.path);
                console.log(`清理临时文件: ${file.path}`);
            }
            catch (error) {
                console.error(`清理文件失败: ${file.path}`, error);
            }
        }
    });
};
exports.cleanupTempFiles = cleanupTempFiles;
const getFileInfo = (file) => {
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
exports.getFileInfo = getFileInfo;
//# sourceMappingURL=upload.js.map