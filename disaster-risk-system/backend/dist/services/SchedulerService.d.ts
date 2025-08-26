export declare class SchedulerService {
    private warningService;
    private refreshTokenModel;
    private passwordResetTokenModel;
    private intervals;
    private currentCollectionInterval;
    constructor();
    startAllTasks(): Promise<void>;
    stopAllTasks(): void;
    private startAutoWarningTask;
    private startExpiredWarningTask;
    private setupConfigListeners;
    private restartAutoWarningTask;
    private startTokenCleanupTask;
    private cleanupExpiredTokens;
    manualAutoAssess(): Promise<any[]>;
    manualProcessExpiredWarnings(): Promise<number>;
    manualCleanupTokens(): Promise<{
        refreshTokens: number;
        resetTokens: number;
    }>;
    getTaskStatus(): any;
}
//# sourceMappingURL=SchedulerService.d.ts.map