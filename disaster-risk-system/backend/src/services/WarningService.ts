import { WarningModel, CreateWarningData } from '../models/WarningModel';
import { RiskZoneModel } from '../models/RiskZoneModel';
import { DisasterTypeModel } from '../models/DisasterTypeModel';
import { RiskAssessmentService } from './RiskAssessmentService';
import { Warning, Point, Polygon, RiskAssessment } from '../types';
import { configService } from './ConfigService';

export interface WarningTriggerCondition {
  riskLevel: number;
  confidenceThreshold: number;
  populationThreshold: number;
  timeWindow: number; // 小时
}

export interface AutoWarningConfig {
  enabled: boolean;
  conditions: Record<string, WarningTriggerCondition>; // 按灾害类型配置
  defaultCondition: WarningTriggerCondition;
}

export class WarningService {
  private warningModel: WarningModel;
  private riskZoneModel: RiskZoneModel;
  private disasterTypeModel: DisasterTypeModel;
  private riskAssessmentService: RiskAssessmentService;
  private autoWarningEnabled: boolean = true; // 缓存的自动预警开关

  // 自动预警配置（保留硬编码的条件配置，但开关状态从配置读取）
  private autoWarningConfig: AutoWarningConfig = {
    enabled: true,
    conditions: {
      '1': { // 滑坡
        riskLevel: 4,
        confidenceThreshold: 0.7,
        populationThreshold: 100,
        timeWindow: 6
      },
      '2': { // 泥石流
        riskLevel: 4,
        confidenceThreshold: 0.8,
        populationThreshold: 50,
        timeWindow: 3
      },
      '3': { // 地震
        riskLevel: 3,
        confidenceThreshold: 0.6,
        populationThreshold: 1000,
        timeWindow: 1
      },
      '4': { // 洪水
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

  constructor() {
    this.warningModel = new WarningModel();
    this.riskZoneModel = new RiskZoneModel();
    this.disasterTypeModel = new DisasterTypeModel();
    this.riskAssessmentService = new RiskAssessmentService();
    this.initializeConfigListeners();
    // 异步初始化配置
    this.initializeConfig().catch(console.error);
  }

  /**
   * 初始化配置监听器
   */
  private initializeConfigListeners(): void {
    configService.on('configChanged', (key: string, value: any) => {
      if (key === 'warning.auto_send') {
        console.log(`自动预警开关配置已变更: ${this.autoWarningEnabled} -> ${value}`);
        this.autoWarningEnabled = value;
        this.autoWarningConfig.enabled = value;
      }
    });
  }

  /**
   * 初始化配置缓存
   */
  private async initializeConfig(): Promise<void> {
    this.autoWarningEnabled = await configService.getConfig('warning.auto_send');
    this.autoWarningConfig.enabled = this.autoWarningEnabled;
  }

  /**
   * 创建预警信息
   */
  async createWarning(warningData: Omit<Warning, 'id' | 'created_at'>, createdBy?: number): Promise<Warning> {
    try {
      // 生成预警ID
      if (!warningData.warning_id) {
        warningData.warning_id = await this.generateWarningId(warningData.disaster_type_id);
      }

      // 验证预警数据
      await this.validateWarningData(warningData);

      // 设置默认值
      const processedData = await this.processWarningData(warningData);

      // 创建预警
      const warning = await WarningModel.create(processedData as CreateWarningData);

      // 记录创建日志
      console.log(`预警创建成功: ${warning.warning_id} - 等级: ${warning.warning_level} - 创建者: ${createdBy || 'system'}`);

      // 触发预警通知
      await this.triggerWarningNotifications(warning);

      return warning;
    } catch (error) {
      console.error('创建预警失败:', error);
      throw error;
    }
  }

  /**
   * 更新预警信息
   */
  async updateWarning(id: number, updateData: Partial<Warning>, updatedBy?: number): Promise<Warning | null> {
    try {
      // 获取原预警信息
      const existingWarning = await WarningModel.findById(id);
      if (!existingWarning) {
        throw new Error('预警不存在');
      }

      // 增加更新序号
      if (updateData.status !== 'cancelled' && updateData.status !== 'expired') {
        updateData.update_sequence = (existingWarning.update_sequence || 1) + 1;
      }

      // 更新预警
      const updatedWarning = await WarningModel.update(id, updateData);
      if (!updatedWarning) {
        throw new Error('更新失败');
      }

      // 记录更新日志
      console.log(`预警更新成功: ${updatedWarning.warning_id} - 序号: ${updatedWarning.update_sequence} - 更新者: ${updatedBy || 'system'}`);

      // 如果是重要更新，触发通知
      if (this.isImportantUpdate(existingWarning, updatedWarning)) {
        await this.triggerWarningNotifications(updatedWarning);
      }

      return updatedWarning;
    } catch (error) {
      console.error('更新预警失败:', error);
      throw error;
    }
  }

  /**
   * 自动风险评估并生成预警
   */
  async autoAssessAndWarn(zoneId?: number): Promise<Warning[]> {
    // 检查配置的自动预警开关
    const autoSendEnabled = await configService.getConfig('warning.auto_send');
    if (!autoSendEnabled) {
      console.log('自动预警已禁用，跳过预警生成');
      return [];
    }

    try {
      const warnings: Warning[] = [];
      
      if (zoneId) {
        // 评估指定区域
        const warning = await this.assessZoneAndCreateWarning(zoneId);
        if (warning) warnings.push(warning);
      } else {
        // 评估所有监测区域
        const monitoredZones = await this.getMonitoredZones();
        
        for (const zone of monitoredZones) {
          try {
            const warning = await this.assessZoneAndCreateWarning(zone.id);
            if (warning) warnings.push(warning);
          } catch (error) {
            console.error(`区域 ${zone.id} 自动评估失败:`, error);
          }
        }
      }

      if (warnings.length > 0) {
        console.log(`自动预警完成，生成 ${warnings.length} 条预警`);
      }

      return warnings;
    } catch (error) {
      console.error('自动预警评估失败:', error);
      throw error;
    }
  }

  /**
   * 评估单个区域并创建预警
   */
  private async assessZoneAndCreateWarning(zoneId: number): Promise<Warning | null> {
    try {
      // 获取区域信息
      const zone = await this.riskZoneModel.findById(zoneId);
      if (!zone) {
        throw new Error(`区域 ${zoneId} 不存在`);
      }

      // 进行风险评估
      const assessment = await this.riskAssessmentService.assessCurrentRisk(zoneId);
      
      // 获取预警条件
      const condition = this.getWarningCondition(zone.disaster_type_id.toString());
      
      // 检查是否需要发布预警
      if (!this.shouldTriggerWarning(assessment, zone, condition)) {
        return null;
      }

      // 检查是否已有活跃预警
      const existingWarnings = await WarningModel.findByZone(zoneId);
      const activeWarning = existingWarnings.find((w: Warning) => 
        w.status === 'active' && 
        (w.expiry_time === null || (w.expiry_time && new Date(w.expiry_time) > new Date()))
      );

      if (activeWarning) {
        // 如果风险等级有显著变化，更新现有预警
        if (Math.abs(activeWarning.warning_level! - assessment.current_risk_level) >= 1) {
          return await this.updateWarning(activeWarning.id, {
            warning_level: assessment.current_risk_level,
            content: this.generateWarningContent(assessment, zone),
            status: 'updated'
          });
        }
        return null; // 无需更新
      }

      // 创建新预警
      const warningData = await this.buildWarningFromAssessment(assessment, zone);
      return await this.createWarning(warningData);

    } catch (error) {
      console.error(`评估区域 ${zoneId} 失败:`, error);
      return null;
    }
  }

  /**
   * 根据风险评估构建预警数据
   */
  private async buildWarningFromAssessment(assessment: RiskAssessment, zone: any): Promise<Omit<Warning, 'id' | 'created_at'>> {
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

  /**
   * 生成预警标题
   */
  private generateWarningTitle(assessment: RiskAssessment, zone: any, disasterType: any): string {
    const levelNames = ['', '蓝色', '黄色', '橙色', '红色', '紫色'];
    const levelName = levelNames[assessment.current_risk_level] || '未知';
    const typeName = disasterType?.name || '地质灾害';
    
    return `${zone.name}${typeName}${levelName}预警`;
  }

  /**
   * 生成预警内容
   */
  private generateWarningContent(assessment: RiskAssessment, zone: any): string {
    const riskLevelDesc = this.getRiskLevelDescription(assessment.current_risk_level);
    const factors = assessment.contributing_factors?.factors;
    
    let content = `根据最新监测数据分析，${zone.name}地区${riskLevelDesc}。\n\n`;
    
    if (factors) {
      content += '主要风险因素：\n';
      if (factors.rainfall > 3) content += `- 降雨量较大，当前风险系数：${factors.rainfall.toFixed(1)}\n`;
      if (factors.groundwater > 3) content += `- 地下水位上升，当前风险系数：${factors.groundwater.toFixed(1)}\n`;
      if (factors.soilMoisture > 3) content += `- 土壤含水量偏高，当前风险系数：${factors.soilMoisture.toFixed(1)}\n`;
      if (factors.seismicActivity > 2) content += `- 地震活动异常，当前风险系数：${factors.seismicActivity.toFixed(1)}\n`;
    }
    
    if (assessment.predicted_risk_24h && assessment.predicted_risk_24h > assessment.current_risk_level) {
      content += `\n预计未来24小时风险等级可能上升至${assessment.predicted_risk_24h}级。`;
    }
    
    content += '\n\n请相关部门和公众密切关注，做好防范准备。';
    
    return content;
  }

  /**
   * 生成建议措施
   */
  private generateRecommendedActions(assessment: RiskAssessment, zone: any): any {
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

  /**
   * 获取预警条件
   */
  private getWarningCondition(disasterTypeId: string): WarningTriggerCondition {
    return this.autoWarningConfig.conditions[disasterTypeId] || this.autoWarningConfig.defaultCondition;
  }

  /**
   * 判断是否应该触发预警
   */
  private shouldTriggerWarning(assessment: RiskAssessment, zone: any, condition: WarningTriggerCondition): boolean {
    // 风险等级检查
    if (assessment.current_risk_level < condition.riskLevel) {
      return false;
    }

    // 置信度检查
    if (assessment.confidence_score && assessment.confidence_score < condition.confidenceThreshold) {
      return false;
    }

    // 人口密度检查
    if (zone.population_density && zone.population_density < condition.populationThreshold) {
      return false;
    }

    return true;
  }

  /**
   * 判断是否为重要更新
   */
  private isImportantUpdate(oldWarning: Warning, newWarning: Warning): boolean {
    // 预警等级变化
    if (Math.abs((oldWarning.warning_level || 0) - (newWarning.warning_level || 0)) >= 1) {
      return true;
    }

    // 疏散要求变化
    if (oldWarning.evacuation_required !== newWarning.evacuation_required) {
      return true;
    }

    // 状态重要变化
    if (newWarning.status === 'cancelled' || newWarning.status === 'expired') {
      return true;
    }

    return false;
  }

  /**
   * 验证预警数据
   */
  private async validateWarningData(data: Omit<Warning, 'id' | 'created_at'>): Promise<void> {
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

    if (data.warning_id && await WarningModel.warningIdExists(data.warning_id)) {
      throw new Error('预警编号已存在');
    }
  }

  /**
   * 处理预警数据
   */
  private async processWarningData(data: Omit<Warning, 'id' | 'created_at'>): Promise<Omit<Warning, 'id' | 'created_at'>> {
    const processed = { ...data };

    // 设置默认发布时间
    if (!processed.issue_time) {
      processed.issue_time = new Date();
    }

    // 设置默认生效时间
    if (!processed.effective_time) {
      processed.effective_time = processed.issue_time;
    }

    // 设置默认过期时间
    if (!processed.expiry_time && processed.warning_level) {
      processed.expiry_time = this.calculateExpiryTime(processed.warning_level);
    }

    // 设置默认发布机构
    if (!processed.issuing_authority) {
      processed.issuing_authority = '智能地质灾害监测系统';
    }

    // 设置默认状态
    if (!processed.status) {
      processed.status = 'active';
    }

    return processed;
  }

  /**
   * 生成预警ID
   */
  private async generateWarningId(disasterTypeId?: number): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    
    let prefix = 'W';
    if (disasterTypeId) {
      const typeMap: Record<number, string> = {
        1: 'SL', // 滑坡 Slide
        2: 'DF', // 泥石流 Debris Flow
        3: 'EQ', // 地震 Earthquake
        4: 'FL'  // 洪水 Flood
      };
      prefix = typeMap[disasterTypeId] || 'W';
    }
    
    return `${prefix}-${dateStr}-${timeStr}`;
  }

  /**
   * 计算过期时间
   */
  private calculateExpiryTime(warningLevel: number): Date {
    const now = new Date();
    const hours = warningLevel >= 4 ? 24 : warningLevel >= 3 ? 12 : 6;
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  /**
   * 获取监测区域
   */
  private async getMonitoredZones(): Promise<any[]> {
    // 这里应该查询有监测设备的区域
    // 暂时返回所有区域
    const result = await this.riskZoneModel.paginate(1, 100, { is_monitored: true });
    return result.data;
  }

  /**
   * 触发预警通知
   */
  private async triggerWarningNotifications(warning: Warning): Promise<void> {
    try {
      console.log(`触发预警通知: ${warning.warning_id}`);
      
      // 并行执行各种通知方式
      const notificationPromises = [
        this.sendSMSNotification(warning),
        this.sendEmailNotification(warning),
        this.sendPushNotification(warning),
        this.sendWebSocketNotification(warning),
        this.sendThirdPartyNotification(warning)
      ];
      
      // 等待所有通知完成，但不因单个失败而中断
      const results = await Promise.allSettled(notificationPromises);
      
      // 记录失败的通知
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const notificationTypes = ['SMS', '邮件', '推送', 'WebSocket', '第三方系统'];
          console.error(`${notificationTypes[index]}通知发送失败:`, result.reason);
        }
      });
      
    } catch (error) {
      console.error('预警通知发送失败:', error);
    }
  }

  /**
   * 发送短信通知
   */
  private async sendSMSNotification(warning: Warning): Promise<void> {
    try {
      // 这里应该集成短信服务提供商的API
      // 例如：阿里云短信、腾讯云短信等
      console.log(`发送短信通知: ${warning.title}`);
      
      // 模拟短信发送
      const smsContent = `【灾害预警】${warning.title}，风险等级：${warning.warning_level}级，请及时关注并采取相应措施。`;
      
      // 这里应该调用实际的短信API
      // await smsProvider.send(phoneNumbers, smsContent);
      
    } catch (error) {
       throw new Error(`短信通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
     }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(warning: Warning): Promise<void> {
    try {
      console.log(`发送邮件通知: ${warning.title}`);
      
      // 这里应该集成邮件服务
      // 例如：nodemailer、SendGrid等
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
      
      // 这里应该调用实际的邮件API
      // await emailProvider.send(emailAddresses, emailContent);
      
    } catch (error) {
       throw new Error(`邮件通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
     }
  }

  /**
   * 发送推送通知
   */
  private async sendPushNotification(warning: Warning): Promise<void> {
    try {
      console.log(`发送推送通知: ${warning.title}`);
      
      // 这里应该集成推送服务
      // 例如：Firebase Cloud Messaging、极光推送等
      const pushData = {
        title: warning.title,
        body: `风险等级：${warning.warning_level}级，请及时关注`,
        data: {
          warning_id: warning.warning_id,
          warning_level: warning.warning_level,
          type: 'disaster_warning'
        }
      };
      
      // 这里应该调用实际的推送API
      // await pushProvider.send(deviceTokens, pushData);
      
    } catch (error) {
       throw new Error(`推送通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
     }
  }

  /**
   * 发送WebSocket实时通知
   */
  private async sendWebSocketNotification(warning: Warning): Promise<void> {
    try {
      console.log(`发送WebSocket通知: ${warning.title}`);
      
      // 这里应该通过WebSocket服务器广播消息
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
      
      // 这里应该调用WebSocket服务器的广播方法
      // await wsServer.broadcast(wsMessage);
      
    } catch (error) {
       throw new Error(`WebSocket通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
     }
  }

  /**
   * 发送第三方系统通知
   */
  private async sendThirdPartyNotification(warning: Warning): Promise<void> {
    try {
      console.log(`发送第三方系统通知: ${warning.title}`);
      
      // 这里应该调用第三方系统的API
      // 例如：政府应急系统、气象局系统等
      const thirdPartyData = {
        warning_id: warning.warning_id,
        title: warning.title,
        level: warning.warning_level,
        content: warning.content,
        affected_area: warning.affected_area,
        source_system: 'disaster-risk-system',
        timestamp: new Date().toISOString()
      };
      
      // 这里应该调用实际的第三方API
      // await thirdPartyAPI.sendWarning(thirdPartyData);
      
    } catch (error) {
       throw new Error(`第三方系统通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
     }
  }

  /**
   * 获取风险等级描述
   */
  private getRiskLevelDescription(level: number): string {
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

  /**
   * 获取默认联系信息
   */
  private getDefaultContactInfo(): any {
    return {
      emergency: '119',
      monitoring_center: '400-123-4567',
      local_government: '12345'
    };
  }

  /**
   * 计算区域面积（平方公里）
   */
  private calculateAreaKm2(geometry: any): number {
    // 这里应该实现实际的几何面积计算
    // 暂时返回估算值
    return 10;
  }

  /**
   * 获取最近的避难场所
   */
  private async getNearestShelters(geometry: any): Promise<any> {
    // 这里应该查询最近的避难场所
    // 暂时返回示例数据
    return {
      shelters: [
        { name: '市民广场避难场所', distance: 1.2, capacity: 1000 },
        { name: '体育馆避难场所', distance: 2.5, capacity: 2000 }
      ]
    };
  }

  /**
   * 批量处理过期预警
   */
  async processExpiredWarnings(): Promise<number> {
    try {
      const expiredCount = await WarningModel.markExpiredWarnings();
      if (expiredCount > 0) {
        console.log(`处理过期预警 ${expiredCount} 条`);
      }
      return expiredCount;
    } catch (error) {
      console.error('处理过期预警失败:', error);
      throw error;
    }
  }

  /**
   * 获取预警统计信息
   */
  async getWarningStatistics(): Promise<any> {
    try {
      return await WarningModel.getWarningStats();
    } catch (error) {
      console.error('获取预警统计失败:', error);
      throw error;
    }
  }
}