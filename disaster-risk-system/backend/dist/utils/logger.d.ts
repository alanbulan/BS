import winston from 'winston';
declare const logger: winston.Logger;
export declare const log: {
    error: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    info: (message: string, meta?: any) => void;
    http: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
};
export declare const dbLog: {
    query: (sql: string, params?: any[], duration?: number) => void;
    error: (error: Error, sql?: string, params?: any[]) => void;
    transaction: (action: string, duration?: number) => void;
};
export declare const apiLog: {
    request: (method: string, url: string, ip: string, userAgent?: string) => void;
    response: (method: string, url: string, statusCode: number, duration: number) => void;
    error: (method: string, url: string, error: Error, statusCode?: number) => void;
};
export declare const businessLog: {
    userAction: (userId: number, action: string, details?: any) => void;
    systemEvent: (event: string, details?: any) => void;
    securityEvent: (event: string, ip: string, details?: any) => void;
    performanceMetric: (metric: string, value: number, unit: string) => void;
};
export declare const formatError: (error: Error) => string;
export declare const createChildLogger: (service: string) => {
    error: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    info: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
};
export default logger;
//# sourceMappingURL=logger.d.ts.map