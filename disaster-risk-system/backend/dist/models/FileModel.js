"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileModel = void 0;
const BaseModel_1 = require("./BaseModel");
class FileModel extends BaseModel_1.BaseModel {
    constructor() {
        super('files');
    }
    async createFile(fileData) {
        const result = await this.create(fileData);
        return result;
    }
    async findById(id) {
        const result = await super.findById(id);
        return result;
    }
    async findByRelation(relatedType, relatedId, category) {
        const conditions = {
            related_type: relatedType,
            related_id: relatedId
        };
        if (category) {
            conditions.category = category;
        }
        return await this.findWhere(conditions);
    }
    async findByUser(userId, category, page = 1, limit = 20) {
        const conditions = {
            uploaded_by: userId
        };
        if (category) {
            conditions.category = category;
        }
        const offset = (page - 1) * limit;
        const files = await this.findWhere(conditions);
        const total = files.length;
        return { files, total };
    }
    async deleteById(id) {
        const result = await this.delete(id);
        return result;
    }
    async updateById(id, updates) {
        const result = await this.update(id, updates);
        return result;
    }
    async updateFile(id, updates) {
        return await this.updateById(id, updates);
    }
    async getStats(userId) {
        const conditions = userId ? { uploaded_by: userId } : {};
        const total = await this.count(conditions);
        return {
            total_files: total,
            total_size: 0,
            by_category: {}
        };
    }
    async getFileStats(userId) {
        return await this.getStats(userId);
    }
    async deleteFile(id) {
        return await this.deleteById(id);
    }
    async findOrphanFiles() {
        const allFiles = await this.findAll();
        return allFiles.filter(file => !file.related_type && !file.related_id);
    }
}
exports.FileModel = FileModel;
//# sourceMappingURL=FileModel.js.map