"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationErrorResponse = exports.serverErrorResponse = exports.forbiddenResponse = exports.unauthorizedResponse = exports.notFoundResponse = exports.noContentResponse = exports.createdResponse = exports.paginatedResponse = exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, message, statusCode = 200) => {
    const response = {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
};
exports.successResponse = successResponse;
const errorResponse = (res, error, statusCode = 400, data) => {
    const response = {
        success: false,
        error,
        data,
        timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
};
exports.errorResponse = errorResponse;
const paginatedResponse = (res, data, page, limit, total, message) => {
    const totalPages = Math.ceil(total / limit);
    const response = {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
    return res.status(200).json(response);
};
exports.paginatedResponse = paginatedResponse;
const createdResponse = (res, data, message = '创建成功') => {
    return (0, exports.successResponse)(res, data, message, 201);
};
exports.createdResponse = createdResponse;
const noContentResponse = (res) => {
    return res.status(204).send();
};
exports.noContentResponse = noContentResponse;
const notFoundResponse = (res, message = '资源未找到') => {
    return (0, exports.errorResponse)(res, message, 404);
};
exports.notFoundResponse = notFoundResponse;
const unauthorizedResponse = (res, message = '未授权访问') => {
    return (0, exports.errorResponse)(res, message, 401);
};
exports.unauthorizedResponse = unauthorizedResponse;
const forbiddenResponse = (res, message = '禁止访问') => {
    return (0, exports.errorResponse)(res, message, 403);
};
exports.forbiddenResponse = forbiddenResponse;
const serverErrorResponse = (res, message = '服务器内部错误') => {
    return (0, exports.errorResponse)(res, message, 500);
};
exports.serverErrorResponse = serverErrorResponse;
const validationErrorResponse = (res, errors, message = '数据验证失败') => {
    return (0, exports.errorResponse)(res, message, 422, errors);
};
exports.validationErrorResponse = validationErrorResponse;
//# sourceMappingURL=response.js.map