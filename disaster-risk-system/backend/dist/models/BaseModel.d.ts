import { QueryResult } from '../types';
export declare abstract class BaseModel {
    protected tableName: string;
    constructor(tableName: string);
    protected executeQuery(sql: string, params?: any[]): Promise<QueryResult>;
    findById(id: number): Promise<any>;
    findAll(limit?: number, offset?: number): Promise<any[]>;
    findWhere(conditions: Record<string, any>): Promise<any[]>;
    findOneWhere(conditions: Record<string, any>): Promise<any>;
    create(data: Record<string, any>): Promise<any>;
    update(id: number, data: Record<string, any>): Promise<any>;
    delete(id: number): Promise<boolean>;
    softDelete(id: number): Promise<any>;
    count(conditions?: Record<string, any>): Promise<number>;
    exists(id: number): Promise<boolean>;
    paginate(page?: number, limit?: number, conditions?: Record<string, any>): Promise<{
        data: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    batchInsert(dataArray: Record<string, any>[]): Promise<any[]>;
    rawQuery(sql: string, params?: any[]): Promise<QueryResult>;
}
//# sourceMappingURL=BaseModel.d.ts.map