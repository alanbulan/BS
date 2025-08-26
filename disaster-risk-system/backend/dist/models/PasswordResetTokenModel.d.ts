import { BaseModel } from './BaseModel';
export interface PasswordResetToken {
    id: number;
    user_id: number;
    token: string;
    expires_at: Date;
    used: boolean;
    created_at: Date;
}
export declare class PasswordResetTokenModel extends BaseModel {
    constructor();
    createResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken>;
    findByToken(token: string): Promise<PasswordResetToken | null>;
    markAsUsed(tokenId: number): Promise<boolean>;
    deleteUserTokens(userId: number): Promise<number>;
    deleteExpiredTokens(): Promise<number>;
    getUserActiveTokenCount(userId: number): Promise<number>;
}
//# sourceMappingURL=PasswordResetTokenModel.d.ts.map