"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
class BaseController {
    constructor() {
        this.asyncHandler = (fn) => {
            return (req, res, next) => {
                Promise.resolve(fn(req, res, next)).catch(next);
            };
        };
    }
    getPaginationParams(req) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.page_size) || parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        return { page, limit, offset };
    }
    getSortParams(req) {
        const sortBy = req.query.sortBy || 'id';
        const sortOrder = req.query.sortOrder || 'ASC';
        return { sortBy, sortOrder };
    }
    validateRequired(data, fields) {
        for (const field of fields) {
            if (!data[field]) {
                return `${field} is required`;
            }
        }
        return null;
    }
    success(res, data, message = 'Success') {
        return res.status(200).json({
            success: true,
            message,
            data
        });
    }
    created(res, data, message = 'Created successfully') {
        return res.status(201).json({
            success: true,
            message,
            data
        });
    }
    error(res, message, statusCode = 500) {
        return res.status(statusCode).json({
            success: false,
            message,
            error: true
        });
    }
    notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message,
            error: true
        });
    }
    paginated(res, data, pagination) {
        const totalPages = pagination.pages || pagination.totalPages;
        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total: pagination.total,
                page: pagination.page,
                limit: pagination.limit,
                totalPages,
                hasNext: pagination.page < totalPages,
                hasPrev: pagination.page > 1
            }
        });
    }
    serverError(res, error) {
        console.error('Server Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: true
        });
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=BaseController.js.map