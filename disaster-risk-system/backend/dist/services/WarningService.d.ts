import { Warning } from '../types';
export interface WarningTriggerCondition {
    riskLevel: number;
    confidenceThreshold: number;
    populationThreshold: number;
    timeWindow: number;
}
export interface AutoWarningConfig {
    enabled: boolean;
    conditions: Record<string, WarningTriggerCondition>;
    defaultCondition: WarningTriggerCondition;
}
export declare class WarningService {
    private warningModel;
    private riskZoneModel;
    private disasterTypeModel;
    private riskAssessmentService;
    private autoWarningEnabled;
    private autoWarningConfig;
    constructor();
    private initializeConfigListeners;
    private initializeConfig;
    createWarning(warningData: Omit<Warning, 'id' | 'created_at'>, createdBy?: number): Promise<Warning>;
    updateWarning(id: number, updateData: Partial<Warning>, updatedBy?: number): Promise<Warning | null>;
    autoAssessAndWarn(zoneId?: number): Promise<Warning[]>;
    private assessZoneAndCreateWarning;
    private buildWarningFromAssessment;
    private generateWarningTitle;
    private generateWarningContent;
    private generateRecommendedActions;
    private getWarningCondition;
    private shouldTriggerWarning;
    private isImportantUpdate;
    private validateWarningData;
    private processWarningData;
    private generateWarningId;
    private calculateExpiryTime;
    private getMonitoredZones;
    private triggerWarningNotifications;
    private sendSMSNotification;
    private sendEmailNotification;
    private sendPushNotification;
    private sendWebSocketNotification;
    private sendThirdPartyNotification;
    private getRiskLevelDescription;
    private getDefaultContactInfo;
    private calculateAreaKm2;
    private getNearestShelters;
    processExpiredWarnings(): Promise<number>;
    getWarningStatistics(): Promise<any>;
}
//# sourceMappingURL=WarningService.d.ts.map