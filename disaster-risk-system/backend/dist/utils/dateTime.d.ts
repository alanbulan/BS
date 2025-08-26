export declare const DATE_FORMATS: {
    ISO: string;
    DATE_ONLY: string;
    TIME_ONLY: string;
    DATETIME: string;
    CHINESE_DATE: string;
    CHINESE_DATETIME: string;
};
export declare const TIMEZONES: {
    UTC: string;
    BEIJING: string;
    TOKYO: string;
    NEW_YORK: string;
    LONDON: string;
};
export declare const now: () => number;
export declare const utcNow: () => Date;
export declare const beijingNow: () => Date;
export declare const formatDate: (date: Date | string | number, format?: string) => string;
export declare const parseDate: (dateString: string) => Date;
export declare const isValidDate: (date: any) => boolean;
export declare const dateDiff: (date1: Date | string, date2: Date | string, unit?: "days" | "hours" | "minutes" | "seconds" | "milliseconds") => number;
export declare const addTime: (date: Date | string, amount: number, unit: "days" | "hours" | "minutes" | "seconds" | "milliseconds") => Date;
export declare const subtractTime: (date: Date | string, amount: number, unit: "days" | "hours" | "minutes" | "seconds" | "milliseconds") => Date;
export declare const startOfDay: (date: Date | string) => Date;
export declare const endOfDay: (date: Date | string) => Date;
export declare const startOfMonth: (date: Date | string) => Date;
export declare const endOfMonth: (date: Date | string) => Date;
export declare const startOfYear: (date: Date | string) => Date;
export declare const endOfYear: (date: Date | string) => Date;
export declare const isSameDay: (date1: Date | string, date2: Date | string) => boolean;
export declare const isToday: (date: Date | string) => boolean;
export declare const isYesterday: (date: Date | string) => boolean;
export declare const isTomorrow: (date: Date | string) => boolean;
export declare const getRelativeTime: (date: Date | string) => string;
export declare const getTimeRange: (type: "today" | "yesterday" | "week" | "month" | "year" | "last7days" | "last30days") => {
    start: Date;
    end: Date;
};
export declare const convertTimezone: (date: Date | string, fromTimezone: string, toTimezone: string) => Date;
export declare const getTimestamp: (date?: Date | string) => number;
export declare const fromTimestamp: (timestamp: number) => Date;
export declare const getUnixTimestamp: (date?: Date | string) => number;
export declare const fromUnixTimestamp: (timestamp: number) => Date;
//# sourceMappingURL=dateTime.d.ts.map