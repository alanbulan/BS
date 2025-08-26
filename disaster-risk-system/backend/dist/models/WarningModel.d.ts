export interface Warning {
    id: number;
    warning_id: string;
    zone_id: number;
    disaster_type_id: number;
    warning_level: number;
    title: string;
    content: string;
    affected_area?: any;
    estimated_affected_population?: number;
    issue_time: Date;
    effective_time?: Date;
    expiry_time?: Date;
    issuing_authority?: string;
    contact_info?: any;
    recommended_actions?: any;
    evacuation_required: boolean;
    shelter_recommendations?: any;
    status: string;
    update_sequence: number;
    parent_warning_id?: number;
    created_at: Date;
}
export interface CreateWarningData {
    warning_id: string;
    zone_id: number;
    disaster_type_id: number;
    warning_level: number;
    title: string;
    content: string;
    affected_area?: any;
    estimated_affected_population?: number;
    issue_time: Date;
    effective_time?: Date;
    expiry_time?: Date;
    issuing_authority?: string;
    contact_info?: any;
    recommended_actions?: any;
    evacuation_required?: boolean;
    shelter_recommendations?: any;
    status?: string;
    update_sequence?: number;
    parent_warning_id?: number;
}
export interface UpdateWarningData {
    warning_level?: number;
    title?: string;
    content?: string;
    affected_area?: any;
    estimated_affected_population?: number;
    effective_time?: Date;
    expiry_time?: Date;
    issuing_authority?: string;
    contact_info?: any;
    recommended_actions?: any;
    evacuation_required?: boolean;
    shelter_recommendations?: any;
    status?: string;
    update_sequence?: number;
}
export declare class WarningModel {
    static findAll(page?: number, limit?: number, sortBy?: string, sortOrder?: 'ASC' | 'DESC', filters?: {
        zone_id?: number;
        disaster_type_id?: number;
        warning_level?: number;
        status?: string;
        evacuation_required?: boolean;
        title?: string;
    }): Promise<any[]>;
    static findById(id: number): Promise<Warning | null>;
    static findByWarningId(warningId: string): Promise<Warning | null>;
    static create(data: CreateWarningData): Promise<Warning>;
    static update(id: number, data: UpdateWarningData): Promise<Warning | null>;
    static delete(id: number): Promise<boolean>;
    static findActiveWarnings(): Promise<Warning[]>;
    static findByZone(zoneId: number): Promise<Warning[]>;
    static count(): Promise<number>;
    static countAll(filters?: {
        zone_id?: number;
        disaster_type_id?: number;
        warning_level?: number;
        status?: string;
        evacuation_required?: boolean;
        title?: string;
    }): Promise<number>;
    static warningIdExists(warningId: string): Promise<boolean>;
    static markExpiredWarnings(): Promise<number>;
    static getWarningStats(): Promise<any>;
}
//# sourceMappingURL=WarningModel.d.ts.map