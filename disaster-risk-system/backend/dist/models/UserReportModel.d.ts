import { BaseModel } from './BaseModel';
import { UserReport, LocationQuery } from '../types';
export declare class UserReportModel extends BaseModel {
    constructor();
    findById(id: number): Promise<UserReport | null>;
    create(data: Omit<UserReport, 'id' | 'created_at' | 'updated_at'>): Promise<UserReport>;
    findWithPagination(options: {
        conditions?: any;
        pagination: {
            page: number;
            limit: number;
            offset: number;
        };
        sort: {
            field: string;
            order: 'ASC' | 'DESC';
        };
    }): Promise<{
        data: UserReport[];
        pagination: any;
    }>;
    findNearby(location: LocationQuery, options?: {
        report_type?: string;
        max_age_hours?: number;
        min_severity?: number;
        limit?: number;
    }): Promise<UserReport[]>;
    verifyReport(id: number, data: {
        verification_status: string;
        verified_by: number;
        verification_notes?: string;
    }): Promise<UserReport | null>;
    updateVotes(id: number, voteType: 'upvote' | 'downvote'): Promise<UserReport | null>;
    getReportTypeStats(): Promise<any[]>;
    getRecentEmergencyReports(hours?: number, limit?: number): Promise<UserReport[]>;
    getReportTypes(): Promise<string[]>;
    getStatistics(): Promise<{
        total: number;
        verified: number;
        emergency: number;
        recent: number;
    }>;
}
//# sourceMappingURL=UserReportModel.d.ts.map