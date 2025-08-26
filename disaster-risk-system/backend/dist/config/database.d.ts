import { Pool } from 'pg';
export declare const pool: Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const query: (text: string, params?: any[]) => Promise<any>;
export declare const transaction: (callback: (client: any) => Promise<any>) => Promise<any>;
export declare const closeConnection: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map