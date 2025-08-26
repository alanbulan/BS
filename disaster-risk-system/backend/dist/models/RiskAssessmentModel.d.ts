import { BaseModel } from './BaseModel';
import { RiskAssessment } from '../types';
export interface CreateRiskAssessmentData {
    zone_id: number;
    assessment_time: Date;
    current_risk_level: number;
    predicted_risk_24h?: number;
    predicted_risk_72h?: number;
    contributing_factors?: any;
    confidence_score?: number;
    assessment_method?: string;
    model_version?: string;
    weather_conditions?: any;
    historical_comparison?: any;
    recommendations?: string;
    created_by?: number;
}
export interface UpdateRiskAssessmentData {
    zone_id?: number;
    assessment_time?: Date;
    current_risk_level?: number;
    predicted_risk_24h?: number;
    predicted_risk_72h?: number;
    contributing_factors?: any;
    confidence_score?: number;
    assessment_method?: string;
    model_version?: string;
    weather_conditions?: any;
    historical_comparison?: any;
    recommendations?: string;
    created_by?: number;
}
export interface RiskAssessmentQuery {
    zone_id?: number;
    risk_level_min?: number;
    risk_level_max?: number;
    start_time?: Date;
    end_time?: Date;
    created_by?: number;
    assessment_method?: string;
}
export declare class RiskAssessmentModel extends BaseModel {
    constructor();
    create(data: CreateRiskAssessmentData): Promise<RiskAssessment>;
    updateById(id: number, data: UpdateRiskAssessmentData): Promise<RiskAssessment | null>;
    getLatestByZoneId(zoneId: number): Promise<RiskAssessment | null>;
    getHistoryByZoneId(zoneId: number, days?: number, limit?: number): Promise<RiskAssessment[]>;
    getHighRiskAssessments(minRiskLevel?: number): Promise<RiskAssessment[]>;
    findByTimeRange(startTime: Date, endTime: Date, zoneId?: number): Promise<RiskAssessment[]>;
    getRiskTrendStats(zoneId: number, days?: number): Promise<any>;
    getCurrentRiskStatus(): Promise<any[]>;
    findByQuery(query: RiskAssessmentQuery): Promise<RiskAssessment[]>;
    deleteOldAssessments(daysToKeep?: number): Promise<number>;
    getAssessmentStats(): Promise<any>;
    getAll(page?: number, limit?: number, filters?: any): Promise<{
        assessments: RiskAssessment[];
        total: number;
    }>;
    getById(id: number): Promise<RiskAssessment | null>;
    update(id: number, data: Partial<CreateRiskAssessmentData>): Promise<RiskAssessment | null>;
    delete(id: number): Promise<boolean>;
    getStats(): Promise<any>;
    getHighRiskZones(minRiskLevel?: number): Promise<RiskAssessment[]>;
}
//# sourceMappingURL=RiskAssessmentModel.d.ts.map