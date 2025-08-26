import { BaseModel } from './BaseModel';
export interface RefreshToken {
    id: number;
    user_id: number;
    token: string;
    expires_at: Date;
    created_at: Date;
    updated_at: Date;
}
export declare class RefreshTokenModel extends BaseModel {
    constructor();
    createRefreshToken(userId: number, token: string, expiresAt: Date): Promise<RefreshToken>;
    findByToken(token: string): Promise<RefreshToken | null>;
    findByUserAndToken(userId: number, token: string): Promise<RefreshToken | null>;
    deleteToken(token: string): Promise<boolean>;
    deleteAllUserTokens(userId: number): Promise<number>;
    deleteExpiredTokens(): Promise<number>;
    getUserTokenCount(userId: number): Promise<number>;
    limitUserTokens(userId: number, maxTokens?: number): Promise<void>;
}
//# sourceMappingURL=RefreshTokenModel.d.ts.map