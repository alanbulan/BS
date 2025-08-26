"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromUnixTimestamp = exports.getUnixTimestamp = exports.fromTimestamp = exports.getTimestamp = exports.convertTimezone = exports.getTimeRange = exports.getRelativeTime = exports.isTomorrow = exports.isYesterday = exports.isToday = exports.isSameDay = exports.endOfYear = exports.startOfYear = exports.endOfMonth = exports.startOfMonth = exports.endOfDay = exports.startOfDay = exports.subtractTime = exports.addTime = exports.dateDiff = exports.isValidDate = exports.parseDate = exports.formatDate = exports.beijingNow = exports.utcNow = exports.now = exports.TIMEZONES = exports.DATE_FORMATS = void 0;
exports.DATE_FORMATS = {
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    DATE_ONLY: 'YYYY-MM-DD',
    TIME_ONLY: 'HH:mm:ss',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    CHINESE_DATE: 'YYYY年MM月DD日',
    CHINESE_DATETIME: 'YYYY年MM月DD日 HH:mm:ss'
};
exports.TIMEZONES = {
    UTC: 'UTC',
    BEIJING: 'Asia/Shanghai',
    TOKYO: 'Asia/Tokyo',
    NEW_YORK: 'America/New_York',
    LONDON: 'Europe/London'
};
const now = () => {
    return Date.now();
};
exports.now = now;
const utcNow = () => {
    return new Date();
};
exports.utcNow = utcNow;
const beijingNow = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (8 * 3600000));
};
exports.beijingNow = beijingNow;
const formatDate = (date, format = exports.DATE_FORMATS.DATETIME) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        throw new Error('Invalid date');
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const milliseconds = String(d.getMilliseconds()).padStart(3, '0');
    return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
        .replace('SSS', milliseconds);
};
exports.formatDate = formatDate;
const parseDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: ${dateString}`);
    }
    return date;
};
exports.parseDate = parseDate;
const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
};
exports.isValidDate = isValidDate;
const dateDiff = (date1, date2, unit = 'days') => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    switch (unit) {
        case 'milliseconds':
            return diffMs;
        case 'seconds':
            return Math.floor(diffMs / 1000);
        case 'minutes':
            return Math.floor(diffMs / (1000 * 60));
        case 'hours':
            return Math.floor(diffMs / (1000 * 60 * 60));
        case 'days':
            return Math.floor(diffMs / (1000 * 60 * 60 * 24));
        default:
            return diffMs;
    }
};
exports.dateDiff = dateDiff;
const addTime = (date, amount, unit) => {
    const d = new Date(date);
    switch (unit) {
        case 'milliseconds':
            d.setMilliseconds(d.getMilliseconds() + amount);
            break;
        case 'seconds':
            d.setSeconds(d.getSeconds() + amount);
            break;
        case 'minutes':
            d.setMinutes(d.getMinutes() + amount);
            break;
        case 'hours':
            d.setHours(d.getHours() + amount);
            break;
        case 'days':
            d.setDate(d.getDate() + amount);
            break;
    }
    return d;
};
exports.addTime = addTime;
const subtractTime = (date, amount, unit) => {
    return (0, exports.addTime)(date, -amount, unit);
};
exports.subtractTime = subtractTime;
const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};
exports.startOfDay = startOfDay;
const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};
exports.endOfDay = endOfDay;
const startOfMonth = (date) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};
exports.startOfMonth = startOfMonth;
const endOfMonth = (date) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
};
exports.endOfMonth = endOfMonth;
const startOfYear = (date) => {
    const d = new Date(date);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
};
exports.startOfYear = startOfYear;
const endOfYear = (date) => {
    const d = new Date(date);
    d.setMonth(11, 31);
    d.setHours(23, 59, 59, 999);
    return d;
};
exports.endOfYear = endOfYear;
const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};
exports.isSameDay = isSameDay;
const isToday = (date) => {
    return (0, exports.isSameDay)(date, new Date());
};
exports.isToday = isToday;
const isYesterday = (date) => {
    const yesterday = (0, exports.subtractTime)(new Date(), 1, 'days');
    return (0, exports.isSameDay)(date, yesterday);
};
exports.isYesterday = isYesterday;
const isTomorrow = (date) => {
    const tomorrow = (0, exports.addTime)(new Date(), 1, 'days');
    return (0, exports.isSameDay)(date, tomorrow);
};
exports.isTomorrow = isTomorrow;
const getRelativeTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) {
        const absDiff = Math.abs(diffMs);
        if (absDiff < 60000) {
            return '即将';
        }
        else if (absDiff < 3600000) {
            return `${Math.floor(absDiff / 60000)}分钟后`;
        }
        else if (absDiff < 86400000) {
            return `${Math.floor(absDiff / 3600000)}小时后`;
        }
        else {
            return `${Math.floor(absDiff / 86400000)}天后`;
        }
    }
    else {
        if (diffMs < 60000) {
            return '刚刚';
        }
        else if (diffMs < 3600000) {
            return `${Math.floor(diffMs / 60000)}分钟前`;
        }
        else if (diffMs < 86400000) {
            return `${Math.floor(diffMs / 3600000)}小时前`;
        }
        else if (diffMs < 2592000000) {
            return `${Math.floor(diffMs / 86400000)}天前`;
        }
        else {
            return (0, exports.formatDate)(d, exports.DATE_FORMATS.DATE_ONLY);
        }
    }
};
exports.getRelativeTime = getRelativeTime;
const getTimeRange = (type) => {
    const now = new Date();
    switch (type) {
        case 'today':
            return {
                start: (0, exports.startOfDay)(now),
                end: (0, exports.endOfDay)(now)
            };
        case 'yesterday':
            const yesterday = (0, exports.subtractTime)(now, 1, 'days');
            return {
                start: (0, exports.startOfDay)(yesterday),
                end: (0, exports.endOfDay)(yesterday)
            };
        case 'week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            return {
                start: (0, exports.startOfDay)(startOfWeek),
                end: (0, exports.endOfDay)(now)
            };
        case 'month':
            return {
                start: (0, exports.startOfMonth)(now),
                end: (0, exports.endOfMonth)(now)
            };
        case 'year':
            return {
                start: (0, exports.startOfYear)(now),
                end: (0, exports.endOfYear)(now)
            };
        case 'last7days':
            return {
                start: (0, exports.startOfDay)((0, exports.subtractTime)(now, 7, 'days')),
                end: (0, exports.endOfDay)(now)
            };
        case 'last30days':
            return {
                start: (0, exports.startOfDay)((0, exports.subtractTime)(now, 30, 'days')),
                end: (0, exports.endOfDay)(now)
            };
        default:
            return {
                start: (0, exports.startOfDay)(now),
                end: (0, exports.endOfDay)(now)
            };
    }
};
exports.getTimeRange = getTimeRange;
const convertTimezone = (date, fromTimezone, toTimezone) => {
    const d = new Date(date);
    if (fromTimezone === exports.TIMEZONES.UTC && toTimezone === exports.TIMEZONES.BEIJING) {
        return new Date(d.getTime() + 8 * 3600000);
    }
    else if (fromTimezone === exports.TIMEZONES.BEIJING && toTimezone === exports.TIMEZONES.UTC) {
        return new Date(d.getTime() - 8 * 3600000);
    }
    return d;
};
exports.convertTimezone = convertTimezone;
const getTimestamp = (date) => {
    return date ? new Date(date).getTime() : Date.now();
};
exports.getTimestamp = getTimestamp;
const fromTimestamp = (timestamp) => {
    return new Date(timestamp);
};
exports.fromTimestamp = fromTimestamp;
const getUnixTimestamp = (date) => {
    return Math.floor((0, exports.getTimestamp)(date) / 1000);
};
exports.getUnixTimestamp = getUnixTimestamp;
const fromUnixTimestamp = (timestamp) => {
    return new Date(timestamp * 1000);
};
exports.fromUnixTimestamp = fromUnixTimestamp;
//# sourceMappingURL=dateTime.js.map