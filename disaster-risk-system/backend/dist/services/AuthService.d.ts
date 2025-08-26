import { CreateUserData, User } from '../types';
export interface LoginResult {
    user: Omit<User, 'password_hash'>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface RefreshTokenResult {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthService {
    private userModel;
    private refreshTokenModel;
    private passwordResetTokenModel;
    private readonly ACCESS_TOKEN_EXPIRES;
    private readonly REFRESH_TOKEN_EXPIRES;
    private readonly RESET_TOKEN_EXPIRES;
    constructor();
    register(userData: CreateUserData): Promise<LoginResult>;
    login(username: string, password: string, rememberMe?: boolean): Promise<LoginResult>;
    loginByEmail(email: string, password: string, rememberMe?: boolean): Promise<LoginResult>;
    refreshToken(refreshToken: string): Promise<RefreshTokenResult>;
    logout(refreshToken: string): Promise<void>;
    getCurrentUser(userId: number): Promise<Omit<User, 'password_hash'>>;
    changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    checkUsernameAvailability(username: string): Promise<boolean>;
    checkEmailAvailability(email: string): Promise<boolean>;
    private generateTokens;
    private generateResetToken;
    private getTokenExpiresIn;
    private saveRefreshToken;
    private validateRefreshToken;
    private revokeRefreshToken;
    private revokeAllRefreshTokens;
    private savePasswordResetToken;
    private validatePasswordResetToken;
    private markPasswordResetTokenAsUsed;
    private sendPasswordResetEmail;
}
//# sourceMappingURL=AuthService.d.ts.map