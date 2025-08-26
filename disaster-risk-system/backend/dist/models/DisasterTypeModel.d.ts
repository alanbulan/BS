import { BaseModel } from './BaseModel';
import { DisasterType } from '../types';
export declare class DisasterTypeModel extends BaseModel {
    constructor();
    createDisasterType(data: Omit<DisasterType, 'id' | 'created_at'>): Promise<DisasterType>;
    findByName(name: string): Promise<DisasterType | null>;
    getActiveTypes(): Promise<DisasterType[]>;
    getByRiskLevel(riskLevel: number): Promise<DisasterType[]>;
    updateDisasterType(id: number, data: Partial<DisasterType>): Promise<DisasterType | null>;
    toggleActive(id: number, isActive: boolean): Promise<DisasterType | null>;
    nameExists(name: string, excludeId?: number): Promise<boolean>;
    getTypeStats(): Promise<any>;
    checkReferences(disasterTypeId: number): Promise<{
        hasReferences: boolean;
        referencedTables: string[];
    }>;
    checkRiskZoneReferences(disasterTypeId: number): Promise<boolean>;
}
//# sourceMappingURL=DisasterTypeModel.d.ts.map