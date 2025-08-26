"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserReportController = void 0;
const BaseController_1 = require("./BaseController");
const UserReportModel_1 = require("../models/UserReportModel");
class UserReportController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.getUserReports = async (req, res) => {
            try {
                const { page, limit, offset } = this.getPaginationParams(req);
                const { sortBy, sortOrder } = this.getSortParams(req);
                const { user_id, report_type, disaster_type_id, verification_status, min_severity, max_severity, is_emergency, start_date, end_date, search } = req.query;
                const conditions = {};
                if (user_id)
                    conditions.user_id = parseInt(user_id);
                if (report_type)
                    conditions.report_type = report_type;
                if (disaster_type_id)
                    conditions.disaster_type_id = parseInt(disaster_type_id);
                if (verification_status)
                    conditions.verification_status = verification_status;
                if (min_severity)
                    conditions.min_severity = parseInt(min_severity);
                if (max_severity)
                    conditions.max_severity = parseInt(max_severity);
                if (is_emergency !== undefined)
                    conditions.is_emergency = is_emergency === 'true';
                if (start_date)
                    conditions.start_date = new Date(start_date);
                if (end_date)
                    conditions.end_date = new Date(end_date);
                if (search)
                    conditions.search = search;
                const result = await this.userReportModel.findWithPagination({
                    conditions,
                    pagination: { page, limit, offset },
                    sort: { field: sortBy, order: sortOrder }
                });
                this.paginated(res, result.data, result.pagination);
            }
            catch (error) {
                console.error('获取用户报告列表失败:', error);
                this.error(res, '获取用户报告列表失败: ' + error.message, 500);
            }
        };
        this.getUserReportById = async (req, res) => {
            try {
                const { id } = req.params;
                if (!id) {
                    this.error(res, '报告ID不能为空', 400);
                    return;
                }
                const report = await this.userReportModel.findById(parseInt(id));
                if (!report) {
                    this.notFound(res, '用户报告不存在');
                    return;
                }
                this.success(res, report, '获取用户报告详情成功');
            }
            catch (error) {
                console.error('获取用户报告详情失败:', error);
                this.error(res, '获取用户报告详情失败: ' + error.message, 500);
            }
        };
        this.createUserReport = async (req, res) => {
            try {
                const requiredFields = ['user_id', 'report_type'];
                const validation = this.validateRequired(req.body, requiredFields);
                if (validation) {
                    this.error(res, validation, 400);
                    return;
                }
                const { user_id, location, report_type, disaster_type_id, title, description, severity = 3, images, videos, is_emergency = false } = req.body;
                if (severity < 1 || severity > 5) {
                    this.error(res, '严重程度必须在1-5之间', 400);
                    return;
                }
                const reportData = {
                    user_id,
                    location,
                    report_type,
                    disaster_type_id,
                    title,
                    description,
                    severity,
                    images,
                    videos,
                    verification_status: 'pending',
                    is_emergency,
                    upvotes: 0,
                    downvotes: 0
                };
                const result = await this.userReportModel.create(reportData);
                this.created(res, result, '创建用户报告成功');
            }
            catch (error) {
                console.error('创建用户报告失败:', error);
                this.error(res, '创建用户报告失败: ' + error.message, 500);
            }
        };
        this.verifyUserReport = async (req, res) => {
            try {
                const { id } = req.params;
                const { verification_status, verified_by, verification_notes } = req.body;
                if (!id) {
                    this.error(res, '报告ID不能为空', 400);
                    return;
                }
                if (!verification_status || !verified_by) {
                    this.error(res, '验证状态和验证人ID不能为空', 400);
                    return;
                }
                if (!['verified', 'rejected', 'pending'].includes(verification_status)) {
                    this.error(res, '验证状态无效，必须是verified、rejected或pending', 400);
                    return;
                }
                const result = await this.userReportModel.verifyReport(parseInt(id), {
                    verification_status,
                    verified_by,
                    verification_notes
                });
                if (!result) {
                    this.notFound(res, '用户报告不存在');
                    return;
                }
                this.success(res, result, '验证用户报告成功');
            }
            catch (error) {
                console.error('验证用户报告失败:', error);
                this.error(res, '验证用户报告失败: ' + error.message, 500);
            }
        };
        this.updateVotes = async (req, res) => {
            try {
                const { id } = req.params;
                const { vote_type } = req.body;
                if (!id) {
                    this.error(res, '报告ID不能为空', 400);
                    return;
                }
                if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
                    this.error(res, '投票类型无效，必须是upvote或downvote', 400);
                    return;
                }
                const result = await this.userReportModel.updateVotes(parseInt(id), vote_type);
                if (!result) {
                    this.notFound(res, '用户报告不存在');
                    return;
                }
                this.success(res, result, '更新投票成功');
            }
            catch (error) {
                console.error('更新投票失败:', error);
                this.error(res, '更新投票失败: ' + error.message, 500);
            }
        };
        this.getNearbyReports = async (req, res) => {
            try {
                const { latitude, longitude, radius = 5000, report_type, max_age_hours = 24, min_severity = 1, limit = 10 } = req.query;
                if (!latitude || !longitude) {
                    this.error(res, '经纬度参数不能为空', 400);
                    return;
                }
                const location = {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    radius: parseFloat(radius)
                };
                const options = {
                    report_type: report_type,
                    max_age_hours: parseInt(max_age_hours),
                    min_severity: parseInt(min_severity),
                    limit: parseInt(limit)
                };
                const reports = await this.userReportModel.findNearby(location, options);
                this.success(res, reports, '获取附近用户报告成功');
            }
            catch (error) {
                console.error('获取附近用户报告失败:', error);
                this.error(res, '获取附近用户报告失败: ' + error.message, 500);
            }
        };
        this.getReportTypeStats = async (req, res) => {
            try {
                const stats = await this.userReportModel.getReportTypeStats();
                this.success(res, stats, '获取报告类型统计成功');
            }
            catch (error) {
                console.error('获取报告类型统计失败:', error);
                this.error(res, '获取报告类型统计失败: ' + error.message, 500);
            }
        };
        this.getRecentEmergencyReports = async (req, res) => {
            try {
                const { hours = 24, limit = 10 } = req.query;
                const reports = await this.userReportModel.getRecentEmergencyReports(parseInt(hours), parseInt(limit));
                this.success(res, reports, '获取最近紧急报告成功');
            }
            catch (error) {
                console.error('获取最近紧急报告失败:', error);
                this.error(res, '获取最近紧急报告失败: ' + error.message, 500);
            }
        };
        this.getReportTypes = async (req, res) => {
            try {
                const types = await this.userReportModel.getReportTypes();
                this.success(res, types, '获取报告类型列表成功');
            }
            catch (error) {
                console.error('获取报告类型列表失败:', error);
                this.error(res, '获取报告类型列表失败: ' + error.message, 500);
            }
        };
        this.deleteUserReport = async (req, res) => {
            try {
                const { id } = req.params;
                if (!id) {
                    this.error(res, '报告ID不能为空', 400);
                    return;
                }
                const result = await this.userReportModel.delete(parseInt(id));
                if (!result) {
                    this.notFound(res, '用户报告不存在');
                    return;
                }
                this.success(res, null, '删除用户报告成功');
            }
            catch (error) {
                console.error('删除用户报告失败:', error);
                this.error(res, '删除用户报告失败: ' + error.message, 500);
            }
        };
        this.userReportModel = new UserReportModel_1.UserReportModel();
    }
}
exports.UserReportController = UserReportController;
//# sourceMappingURL=UserReportController.js.map