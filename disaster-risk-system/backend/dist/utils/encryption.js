"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptSensitiveData = exports.encryptSensitiveData = exports.generateCSRFToken = exports.safeCompare = exports.generateKeyPair = exports.verifySignature = exports.generateSignature = exports.base64UrlDecode = exports.base64UrlEncode = exports.base64Decode = exports.base64Encode = exports.generateVerificationCode = exports.generateResetToken = exports.generateAPIKey = exports.generateRefreshToken = exports.decodeJWT = exports.verifyJWT = exports.generateJWT = exports.verifyPassword = exports.hashPassword = exports.sha512 = exports.sha256 = exports.md5 = exports.hmac = exports.hash = exports.simpleDecrypt = exports.simpleEncrypt = exports.decrypt = exports.encrypt = exports.generateIV = exports.generateKey = exports.generateUUID = exports.generateRandomNumber = exports.generateRandomString = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt = __importStar(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ENCRYPTION_CONFIG = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltRounds: 12
};
const generateRandomString = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
exports.generateRandomString = generateRandomString;
const generateRandomNumber = (min = 100000, max = 999999) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.generateRandomNumber = generateRandomNumber;
const generateUUID = () => {
    return crypto_1.default.randomUUID();
};
exports.generateUUID = generateUUID;
const generateKey = (length = ENCRYPTION_CONFIG.keyLength) => {
    return crypto_1.default.randomBytes(length);
};
exports.generateKey = generateKey;
const generateIV = (length = ENCRYPTION_CONFIG.ivLength) => {
    return crypto_1.default.randomBytes(length);
};
exports.generateIV = generateIV;
const encrypt = (text, key) => {
    try {
        const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
        const iv = (0, exports.generateIV)();
        const cipher = crypto_1.default.createCipher(ENCRYPTION_CONFIG.algorithm, keyBuffer);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: ''
        };
    }
    catch (error) {
        throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.encrypt = encrypt;
const decrypt = (encryptedData, key) => {
    try {
        const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
        const decipher = crypto_1.default.createDecipher(ENCRYPTION_CONFIG.algorithm, keyBuffer);
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.decrypt = decrypt;
const simpleEncrypt = (text, key) => {
    const algorithm = 'aes-256-cbc';
    const iv = crypto_1.default.randomBytes(16);
    const keyHash = crypto_1.default.createHash('sha256').update(key).digest();
    const cipher = crypto_1.default.createCipher(algorithm, keyHash);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};
exports.simpleEncrypt = simpleEncrypt;
const simpleDecrypt = (encryptedText, key) => {
    const algorithm = 'aes-256-cbc';
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const keyHash = crypto_1.default.createHash('sha256').update(key).digest();
    const decipher = crypto_1.default.createDecipher(algorithm, keyHash);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.simpleDecrypt = simpleDecrypt;
const hash = (text, algorithm = 'sha256') => {
    return crypto_1.default.createHash(algorithm).update(text).digest('hex');
};
exports.hash = hash;
const hmac = (text, key, algorithm = 'sha256') => {
    return crypto_1.default.createHmac(algorithm, key).update(text).digest('hex');
};
exports.hmac = hmac;
const md5 = (text) => {
    return (0, exports.hash)(text, 'md5');
};
exports.md5 = md5;
const sha256 = (text) => {
    return (0, exports.hash)(text, 'sha256');
};
exports.sha256 = sha256;
const sha512 = (text) => {
    return (0, exports.hash)(text, 'sha512');
};
exports.sha512 = sha512;
const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, ENCRYPTION_CONFIG.saltRounds);
    }
    catch (error) {
        throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.hashPassword = hashPassword;
const verifyPassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    }
    catch (error) {
        throw new Error(`Password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.verifyPassword = verifyPassword;
const generateJWT = (payload, secret, options = {}) => {
    try {
        const defaultOptions = {
            expiresIn: options.expiresIn || '24h',
            issuer: options.issuer || 'disaster-risk-system',
            audience: options.audience
        };
        return jsonwebtoken_1.default.sign(payload, secret, defaultOptions);
    }
    catch (error) {
        throw new Error(`JWT generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.generateJWT = generateJWT;
const verifyJWT = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Token expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        else {
            throw new Error(`JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.verifyJWT = verifyJWT;
const decodeJWT = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        throw new Error(`JWT decoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.decodeJWT = decodeJWT;
const generateRefreshToken = () => {
    return (0, exports.generateRandomString)(64);
};
exports.generateRefreshToken = generateRefreshToken;
const generateAPIKey = (prefix = 'drs') => {
    const timestamp = Date.now().toString(36);
    const random = (0, exports.generateRandomString)(16);
    return `${prefix}_${timestamp}_${random}`;
};
exports.generateAPIKey = generateAPIKey;
const generateResetToken = () => {
    return (0, exports.generateRandomString)(32);
};
exports.generateResetToken = generateResetToken;
const generateVerificationCode = (length = 6) => {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
};
exports.generateVerificationCode = generateVerificationCode;
const base64Encode = (text) => {
    return Buffer.from(text, 'utf8').toString('base64');
};
exports.base64Encode = base64Encode;
const base64Decode = (encodedText) => {
    return Buffer.from(encodedText, 'base64').toString('utf8');
};
exports.base64Decode = base64Decode;
const base64UrlEncode = (text) => {
    return (0, exports.base64Encode)(text)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};
exports.base64UrlEncode = base64UrlEncode;
const base64UrlDecode = (encodedText) => {
    let base64 = encodedText
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return (0, exports.base64Decode)(base64);
};
exports.base64UrlDecode = base64UrlDecode;
const generateSignature = (data, privateKey) => {
    const sign = crypto_1.default.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'base64');
};
exports.generateSignature = generateSignature;
const verifySignature = (data, signature, publicKey) => {
    try {
        const verify = crypto_1.default.createVerify('RSA-SHA256');
        verify.update(data);
        return verify.verify(publicKey, signature, 'base64');
    }
    catch (error) {
        return false;
    }
};
exports.verifySignature = verifySignature;
const generateKeyPair = () => {
    const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    return { publicKey, privateKey };
};
exports.generateKeyPair = generateKeyPair;
const safeCompare = (a, b) => {
    if (a.length !== b.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};
exports.safeCompare = safeCompare;
const generateCSRFToken = () => {
    return (0, exports.generateRandomString)(32);
};
exports.generateCSRFToken = generateCSRFToken;
const encryptSensitiveData = (data, key) => {
    const jsonString = JSON.stringify(data);
    return (0, exports.simpleEncrypt)(jsonString, key);
};
exports.encryptSensitiveData = encryptSensitiveData;
const decryptSensitiveData = (encryptedData, key) => {
    const jsonString = (0, exports.simpleDecrypt)(encryptedData, key);
    return JSON.parse(jsonString);
};
exports.decryptSensitiveData = decryptSensitiveData;
//# sourceMappingURL=encryption.js.map