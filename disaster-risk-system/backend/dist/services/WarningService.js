"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningService = void 0;
const WarningModel_1 = require("../models/WarningModel");
const RiskZoneModel_1 = require("../models/RiskZoneModel");
const DisasterTypeModel_1 = require("../models/DisasterTypeModel");
const RiskAssessmentService_1 = require("./RiskAssessmentService");
const ConfigService_1 = require("./ConfigService");
class WarningService {
    constructor() {
        this.autoWarningEnabled = true;
        this.autoWarningConfig = {
            enabled: true,
            conditions: {
                '1': {
                    riskLevel: 4,
                    confidenceThreshold: 0.7,
                    populationThreshold: 100,
                    timeWindow: 6
                },
                '2': {
                    riskLevel: 4,
                    confidenceThreshold: 0.8,
                    populationThreshold: 50,
                    timeWindow: 3
                },
                '3': {
                    riskLevel: 3,
                    confidenceThreshold: 0.6,
                    populationThreshold: 1000,
                    timeWindow: 1
                },
                '4': {
                    riskLevel: 4,
                    confidenceThreshold: 0.7,
                    populationThreshold: 200,
                    timeWindow: 12
                }
            },
            defaultCondition: {
                riskLevel: 4,
                confidenceThreshold: 0.7,
                populationThreshold: 100,
                timeWindow: 6
            }
        };
        this.warningModel = new WarningModel_1.WarningModel();
        this.riskZoneModel = new RiskZoneModel_1.RiskZoneModel();
        this.disasterTypeModel = new DisasterTypeModel_1.DisasterTypeModel();
        this.riskAssessmentService = new RiskAssessmentService_1.RiskAssessmentService();
        this.initializeConfigListeners();
        this.initializeConfig().catch(console.error);
    }
    initializeConfigListeners() {
        ConfigService_1.configService.on('configChanged', (key, value) => {
            if (key === 'warning.auto_send') {
                console.log(`自动预警开关配置已变更: ${this.autoWarningEnabled} -> ${value}`);
                this.autoWarningEnabled = value;
                this.autoWarningConfig.enabled = value;
            }
        });
    }
    async initializeConfig() {
        this.autoWarningEnabled = await ConfigService_1.configService.getConfig('warning.auto_send');
        this.autoWarningConfig.enabled = this.autoWarningEnabled;
    }
    async createWarning(warningData, createdBy) {
        try {
            if (!warningData.warning_id) {
                warningData.warning_id = await this.generateWarningId(warningData.disaster_type_id);
            }
            await this.validateWarningData(warningData);
            const processedData = await this.processWarningData(warningData);
            const warning = await WarningModel_1.WarningModel.create(processedData);
            console.log(`预警创建成功: ${warning.warning_id} - 等级: ${warning.warning_level} - 创建者: ${createdBy || 'system'}`);
            await this.triggerWarningNotifications(warning);
            return warning;
        }
        catch (error) {
            console.error('创建预警失败:', error);
            throw error;
        }
    }
    async updateWarning(id, updateData, updatedBy) {
        try {
            const existingWarning = await WarningModel_1.WarningModel.findById(id);
            if (!existingWarning) {
                throw new Error('预警不存在');
            }
            if (updateData.status !== 'cancelled' && updateData.status !== 'expired') {
                updateData.update_sequence = (existingWarning.update_sequence || 1) + 1;
            }
            const updatedWarning = await WarningModel_1.WarningModel.update(id, updateData);
            if (!updatedWarning) {
                throw new Error('更新失败');
            }
            console.log(`预警更新成功: ${updatedWarning.warning_id} - 序号: ${updatedWarning.update_sequence} - 更新者: ${updatedBy || 'system'}`);
            if (this.isImportantUpdate(existingWarning, updatedWarning)) {
                await this.triggerWarningNotifications(updatedWarning);
            }
            return updatedWarning;
        }
        catch (error) {
            console.error('更新预警失败:', error);
            throw error;
        }
    }
    async autoAssessAndWarn(zoneId) {
        const autoSendEnabled = await ConfigService_1.configService.getConfig('warning.auto_send');
        if (!autoSendEnabled) {
            console.log('自动预警已禁用，跳过预警生成');
            return [];
        }
        try {
            const warnings = [];
            if (zoneId) {
                const warning = await this.assessZoneAndCreateWarning(zoneId);
                if (warning)
                    warnings.push(warning);
            }
            else {
                const monitoredZones = await this.getMonitoredZones();
                for (const zone of monitoredZones) {
                    try {
                        const warning = await this.assessZoneAndCreateWarning(zone.id);
                        if (warning)
                            warnings.push(warning);
                    }
                    catch (error) {
                        console.error(`区域 ${zone.id} 自动评估失败:`, error);
                    }
                }
            }
            if (warnings.length > 0) {
                console.log(`自动预警完成，生成 ${warnings.length} 条预警`);
            }
            return warnings;
        }
        catch (error) {
            console.error('自动预警评估失败:', error);
            throw error;
        }
    }
    async assessZoneAndCreateWarning(zoneId) {
        try {
            const zone = await this.riskZoneModel.findById(zoneId);
            if (!zone) {
                throw new Error(`区域 ${zoneId} 不存在`);
            }
            const assessment = await this.riskAssessmentService.assessCurrentRisk(zoneId);
            const condition = this.getWarningCondition(zone.disaster_type_id.toString());
            if (!this.shouldTriggerWarning(assessment, zone, condition)) {
                return null;
            }
            const existingWarnings = await WarningModel_1.WarningModel.findByZone(zoneId);
            const activeWarning = existingWarnings.find((w) => w.status === 'active' &&
                (w.expiry_time === null || (w.expiry_time && new Date(w.expiry_time) > new Date())));
            if (activeWarning) {
                if (Math.abs(activeWarning.warning_level - assessment.current_risk_level) >= 1) {
                    return await this.updateWarning(activeWarning.id, {
                        warning_level: assessment.current_risk_level,
                        content: this.generateWarningContent(assessment, zone),
                        status: 'updated'
                    });
                }
                return null;
            }
            const warningData = await this.buildWarningFromAssessment(assessment, zone);
            return await this.createWarning(warningData);
        }
        catch (error) {
            console.error(`评估区域 ${zoneId} 失败:`, error);
            return null;
        }
    }
    async buildWarningFromAssessment(assessment, zone) {
        const disasterType = await this.disasterTypeModel.findById(zone.disaster_type_id);
        return {
            zone_id: zone.id,
            disaster_type_id: zone.disaster_type_id,
            warning_level: assessment.current_risk_level,
            title: this.generateWarningTitle(assessment, zone, disasterType),
            content: this.generateWarningContent(assessment, zone),
            affected_area: zone.geometry,
            estimated_affected_population: zone.population_density ?
                Math.round(zone.population_density * this.calculateAreaKm2(zone.geometry)) : undefined,
            issue_time: new Date(),
            effective_time: new Date(),
            expiry_time: this.calculateExpiryTime(assessment.current_risk_level),
            issuing_authority: '智能地质灾害监测系统',
            contact_info: zone.emergency_contact || this.getDefaultContactInfo(),
            recommended_actions: this.generateRecommendedActions(assessment, zone),
            evacuation_required: assessment.current_risk_level >= 4,
            shelter_recommendations: assessment.current_risk_level >= 4 ?
                await this.getNearestShelters(zone.geometry) : null,
            status: 'active',
            update_sequence: 1
        };
    }
    generateWarningTitle(assessment, zone, disasterType) {
        const levelNames = ['', '蓝色', '黄色', '橙色', '红色', '紫色'];
        const levelName = levelNames[assessment.current_risk_level] || '未知';
        const typeName = disasterType?.name || '地质灾害';
        return `${zone.name}${typeName}${levelName}预警`;
    }
    generateWarningContent(assessment, zone) {
        const riskLevelDesc = this.getRiskLevelDescription(assessment.current_risk_level);
        const factors = assessment.contributing_factors?.factors;
        let content = `根据最新监测数据分析，${zone.name}地区${riskLevelDesc}。\n\n`;
        if (factors) {
            content += '主要风险因素：\n';
            if (factors.rainfall > 3)
                content += `- 降雨量较大，当前风险系数：${factors.rainfall.toFixed(1)}\n`;
            if (factors.groundwater > 3)
                content += `- 地下水位上升，当前风险系数：${factors.groundwater.toFixed(1)}\n`;
            if (factors.soilMoisture > 3)
                content += `- 土壤含水量偏高，当前风险系数：${factors.soilMoisture.toFixed(1)}\n`;
            if (factors.seismicActivity > 2)
                content += `- 地震活动异常，当前风险系数：${factors.seismicActivity.toFixed(1)}\n`;
        }
        if (assessment.predicted_risk_24h && assessment.predicted_risk_24h > assessment.current_risk_level) {
            content += `\n预计未来24小时风险等级可能上升至${assessment.predicted_risk_24h}级。`;
        }
        content += '\n\n请相关部门和公众密切关注，做好防范准备。';
        return content;
    }
    generateRecommendedActions(assessment, zone) {
        const actions = [];
        switch (assessment.current_risk_level) {
            case 5:
                actions.push('立即启动应急预案');
                actions.push('组织人员紧急疏散');
                actions.push('封闭危险区域');
                actions.push('准备救援物资');
                break;
            case 4:
                actions.push('启动应急响应');
                actions.push('组织易受影响人员撤离');
                actions.push('加强监测频次');
                actions.push('准备应急物资');
                break;
            case 3:
                actions.push('加强巡查监测');
                actions.push('通知相关人员注意安全');
                actions.push('检查应急设备');
                actions.push('做好疏散准备');
                break;
            case 2:
                actions.push('保持正常监测');
                actions.push('关注天气变化');
                actions.push('检查防护设施');
                break;
            default:
                actions.push('继续日常监测');
                actions.push('定期巡查检查');
        }
        return { actions, timestamp: new Date().toISOString() };
    }
    getWarningCondition(disasterTypeId) {
        return this.autoWarningConfig.conditions[disasterTypeId] || this.autoWarningConfig.defaultCondition;
    }
    shouldTriggerWarning(assessment, zone, condition) {
        if (assessment.current_risk_level < condition.riskLevel) {
            return false;
        }
        if (assessment.confidence_score && assessment.confidence_score < condition.confidenceThreshold) {
            return false;
        }
        if (zone.population_density && zone.population_density < condition.populationThreshold) {
            return false;
        }
        return true;
    }
    isImportantUpdate(oldWarning, newWarning) {
        if (Math.abs((oldWarning.warning_level || 0) - (newWarning.warning_level || 0)) >= 1) {
            return true;
        }
        if (oldWarning.evacuation_required !== newWarning.evacuation_required) {
            return true;
        }
        if (newWarning.status === 'cancelled' || newWarning.status === 'expired') {
            return true;
        }
        return false;
    }
    async validateWarningData(data) {
        if (!data.title || data.title.trim().length === 0) {
            throw new Error('预警标题不能为空');
        }
        if (!data.content || data.content.trim().length === 0) {
            throw new Error('预警内容不能为空');
        }
        if (data.warning_level && (data.warning_level < 1 || data.warning_level > 5)) {
            throw new Error('预警等级必须在1-5之间');
        }
        if (data.zone_id) {
            const zone = await this.riskZoneModel.findById(data.zone_id);
            if (!zone) {
                throw new Error('指定的风险区域不存在');
            }
        }
        if (data.disaster_type_id) {
            const disasterType = await this.disasterTypeModel.findById(data.disaster_type_id);
            if (!disasterType) {
                throw new Error('指定的灾害类型不存在');
            }
        }
        if (data.warning_id && await WarningModel_1.WarningModel.warningIdExists(data.warning_id)) {
            throw new Error('预警编号已存在');
        }
    }
    async processWarningData(data) {
        const processed = { ...data };
        if (!processed.issue_time) {
            processed.issue_time = new Date();
        }
        if (!processed.effective_time) {
            processed.effective_time = processed.issue_time;
        }
        if (!processed.expiry_time && processed.warning_level) {
            processed.expiry_time = this.calculateExpiryTime(processed.warning_level);
        }
        if (!processed.issuing_authority) {
            processed.issuing_authority = '智能地质灾害监测系统';
        }
        if (!processed.status) {
            processed.status = 'active';
        }
        return processed;
    }
    async generateWarningId(disasterTypeId) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        let prefix = 'W';
        if (disasterTypeId) {
            const typeMap = {
                1: 'SL',
                2: 'DF',
                3: 'EQ',
                4: 'FL'
            };
            prefix = typeMap[disasterTypeId] || 'W';
        }
        return `${prefix}-${dateStr}-${timeStr}`;
    }
    calculateExpiryTime(warningLevel) {
        const now = new Date();
        const hours = warningLevel >= 4 ? 24 : warningLevel >= 3 ? 12 : 6;
        return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
    async getMonitoredZones() {
        const result = await this.riskZoneModel.paginate(1, 100, { is_monitored: true });
        return result.data;
    }
    async triggerWarningNotifications(warning) {
        try {
            console.log(`触发预警通知: ${warning.warning_id}`);
            const notificationPromises = [
                this.sendSMSNotification(warning),
                this.sendEmailNotification(warning),
                this.sendPushNotification(warning),
                this.sendWebSocketNotification(warning),
                this.sendThirdPartyNotification(warning)
            ];
            const results = await Promise.allSettled(notificationPromises);
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const notificationTypes = ['SMS', '邮件', '推送', 'WebSocket', '第三方系统'];
                    console.error(`${notificationTypes[index]}通知发送失败:`, result.reason);
                }
            });
        }
        catch (error) {
            console.error('预警通知发送失败:', error);
        }
    }
    async sendSMSNotification(warning) {
        try {
            console.log(`发送短信通知: ${warning.title}`);
            const smsContent = `【灾害预警】${warning.title}，风险等级：${warning.warning_level}级，请及时关注并采取相应措施。`;
        }
        catch (error) {
            throw new Error(`短信通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async sendEmailNotification(warning) {
        try {
            console.log(`发送邮件通知: ${warning.title}`);
            const emailContent = {
                subject: `【灾害预警】${warning.title}`,
                html: `
          <h2>${warning.title}</h2>
          <p><strong>预警等级：</strong>${warning.warning_level}级</p>
          <p><strong>影响区域：</strong>${warning.affected_area || '详见附件'}</p>
          <p><strong>预警内容：</strong></p>
          <div>${warning.content}</div>
          <p><strong>建议措施：</strong></p>
          <div>${JSON.stringify(warning.recommended_actions)}</div>
        `
            };
        }
        catch (error) {
            throw new Error(`邮件通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async sendPushNotification(warning) {
        try {
            console.log(`发送推送通知: ${warning.title}`);
            const pushData = {
                title: warning.title,
                body: `风险等级：${warning.warning_level}级，请及时关注`,
                data: {
                    warning_id: warning.warning_id,
                    warning_level: warning.warning_level,
                    type: 'disaster_warning'
                }
            };
        }
        catch (error) {
            throw new Error(`推送通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async sendWebSocketNotification(warning) {
        try {
            console.log(`发送WebSocket通知: ${warning.title}`);
            const wsMessage = {
                type: 'warning_alert',
                data: {
                    warning_id: warning.warning_id,
                    title: warning.title,
                    level: warning.warning_level,
                    content: warning.content,
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            throw new Error(`WebSocket通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async sendThirdPartyNotification(warning) {
        try {
            console.log(`发送第三方系统通知: ${warning.title}`);
            const thirdPartyData = {
                warning_id: warning.warning_id,
                title: warning.title,
                level: warning.warning_level,
                content: warning.content,
                affected_area: warning.affected_area,
                source_system: 'disaster-risk-system',
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new Error(`第三方系统通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    getRiskLevelDescription(level) {
        const descriptions = [
            '',
            '存在轻微地质灾害风险',
            '存在一定地质灾害风险',
            '存在较高地质灾害风险',
            '存在高地质灾害风险',
            '存在极高地质灾害风险'
        ];
        return descriptions[level] || '风险等级未知';
    }
    getDefaultContactInfo() {
        return {
            emergency: '119',
            monitoring_center: '400-123-4567',
            local_government: '12345'
        };
    }
    calculateAreaKm2(geometry) {
        return 10;
    }
    async getNearestShelters(geometry) {
        return {
            shelters: [
                { name: '市民广场避难场所', distance: 1.2, capacity: 1000 },
                { name: '体育馆避难场所', distance: 2.5, capacity: 2000 }
            ]
        };
    }
    async processExpiredWarnings() {
        try {
            const expiredCount = await WarningModel_1.WarningModel.markExpiredWarnings();
            if (expiredCount > 0) {
                console.log(`处理过期预警 ${expiredCount} 条`);
            }
            return expiredCount;
        }
        catch (error) {
            console.error('处理过期预警失败:', error);
            throw error;
        }
    }
    async getWarningStatistics() {
        try {
            return await WarningModel_1.WarningModel.getWarningStats();
        }
        catch (error) {
            console.error('获取预警统计失败:', error);
            throw error;
        }
    }
}
exports.WarningService = WarningService;
//# sourceMappingURL=WarningService.js.map