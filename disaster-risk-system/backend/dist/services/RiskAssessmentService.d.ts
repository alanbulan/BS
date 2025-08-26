import { CreateRiskAssessmentData } from '../models/RiskAssessmentModel';
import { Point, RiskAssessment } from '../types';
export interface RiskFactors {
    rainfall: number;
    groundwater: number;
    slope: number;
    soilMoisture: number;
    seismicActivity: number;
    populationDensity: number;
}
export interface RiskWeights {
    rainfall: number;
    groundwater: number;
    slope: number;
    soilMoisture: number;
    seismicActivity: number;
    populationDensity: number;
}
export declare class RiskAssessmentService {
    private riskZoneModel;
    private monitoringDataModel;
    private riskAssessmentModel;
    private highRiskThreshold;
    private readonly disasterWeights;
    constructor();
    private initializeConfigListeners;
    private initializeConfig;
    assessCurrentRisk(zoneId: number): Promise<RiskAssessment>;
    batchAssessRisk(zoneIds: number[]): Promise<RiskAssessment[]>;
    assessLocationRisk(location: Point, radiusKm?: number): Promise<RiskAssessment[]>;
    private getRecentMonitoringData;
    private calculateRiskFactors;
    private groupDataByType;
    private calculateRainfallFactor;
    private calculateGroundwaterFactor;
    private calculateSoilMoistureFactor;
    private calculateSeismicFactor;
    private getDisasterWeights;
    private calculateRiskScore;
    private scoreToRiskLevel;
    private predictFutureRisk;
    private getHistoricalTrends;
    private calculateTrendFactor;
    private adjustFactorsForPrediction;
    private calculateConfidence;
    private saveAssessment;
    getHistoricalAssessments(zoneId: number, days?: number): Promise<RiskAssessment[]>;
    getHighRiskZones(minRiskLevel?: number): Promise<RiskAssessment[]>;
    getAllAssessments(page?: number, limit?: number, filters?: any): Promise<{
        assessments: RiskAssessment[];
        total: number;
    }>;
    getAssessmentById(id: number): Promise<RiskAssessment | null>;
    createAssessment(data: CreateRiskAssessmentData): Promise<RiskAssessment>;
    updateAssessment(id: number, data: Partial<CreateRiskAssessmentData>): Promise<RiskAssessment | null>;
    deleteAssessment(id: number): Promise<boolean>;
    getAssessmentStats(): Promise<any>;
}
//# sourceMappingURL=RiskAssessmentService.d.ts.map