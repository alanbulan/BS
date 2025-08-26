import { BaseModel } from './BaseModel';
import { User, CreateUserData, UpdateUserData, Point } from '../types';
export declare class UserModel extends BaseModel {
    constructor();
    paginate(page?: number, limit?: number, conditions?: Record<string, any>): Promise<{
        data: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findById(id: number): Promise<any>;
    createUser(userData: CreateUserData): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    validatePassword(user: User, password: string): Promise<boolean>;
    updateUser(id: number, userData: UpdateUserData): Promise<User | null>;
    updatePassword(id: number, newPassword: string): Promise<boolean>;
    updateLocation(id: number, location: Point): Promise<User | null>;
    getUserLocation(id: number): Promise<Point | null>;
    findNearbyUsers(location: Point, radiusKm?: number): Promise<User[]>;
    toggleUserStatus(id: number, isActive: boolean): Promise<User | null>;
    usernameExists(username: string, excludeId?: number): Promise<boolean>;
    emailExists(email: string, excludeId?: number): Promise<boolean>;
    findByRole(role: string): Promise<User[]>;
    getUserStats(): Promise<any>;
    searchUsers(query: string, limit?: number): Promise<User[]>;
    getRecentUsers(limit?: number): Promise<User[]>;
    deleteUser(id: number): Promise<boolean>;
    updateLastLogin(id: number): Promise<boolean>;
    permanentDeleteUser(id: number): Promise<boolean>;
    batchUpdateStatus(userIds: number[], isActive: boolean): Promise<User[]>;
}
//# sourceMappingURL=UserModel.d.ts.map