import type { StringValue } from 'ms';
export interface JWTPayload {
    userId: string;
    email: string;
    role?: string;
    [key: string]: any;
}
export interface JWTOptions {
    expiresIn?: StringValue | number;
    issuer?: string;
    audience?: string | string[];
}
export declare const generateRandomString: (length?: number) => string;
export declare const generateRandomNumber: (min?: number, max?: number) => number;
export declare const generateUUID: () => string;
export declare const generateKey: (length?: number) => Buffer;
export declare const generateIV: (length?: number) => Buffer;
export declare const encrypt: (text: string, key: string | Buffer) => {
    encrypted: string;
    iv: string;
    tag: string;
};
export declare const decrypt: (encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
}, key: string | Buffer) => string;
export declare const simpleEncrypt: (text: string, key: string) => string;
export declare const simpleDecrypt: (encryptedText: string, key: string) => string;
export declare const hash: (text: string, algorithm?: string) => string;
export declare const hmac: (text: string, key: string, algorithm?: string) => string;
export declare const md5: (text: string) => string;
export declare const sha256: (text: string) => string;
export declare const sha512: (text: string) => string;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const verifyPassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const generateJWT: (payload: JWTPayload, secret: string, options?: JWTOptions) => string;
export declare const verifyJWT: (token: string, secret: string) => JWTPayload;
export declare const decodeJWT: (token: string) => any;
export declare const generateRefreshToken: () => string;
export declare const generateAPIKey: (prefix?: string) => string;
export declare const generateResetToken: () => string;
export declare const generateVerificationCode: (length?: number) => string;
export declare const base64Encode: (text: string) => string;
export declare const base64Decode: (encodedText: string) => string;
export declare const base64UrlEncode: (text: string) => string;
export declare const base64UrlDecode: (encodedText: string) => string;
export declare const generateSignature: (data: string, privateKey: string) => string;
export declare const verifySignature: (data: string, signature: string, publicKey: string) => boolean;
export declare const generateKeyPair: () => {
    publicKey: string;
    privateKey: string;
};
export declare const safeCompare: (a: string, b: string) => boolean;
export declare const generateCSRFToken: () => string;
export declare const encryptSensitiveData: (data: any, key: string) => string;
export declare const decryptSensitiveData: (encryptedData: string, key: string) => any;
//# sourceMappingURL=encryption.d.ts.map