// 加密工具函数
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

// 加密配置
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltRounds: 12
};

// JWT配置接口
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

// 生成随机字符串
export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// 生成随机数字
export const generateRandomNumber = (min: number = 100000, max: number = 999999): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 生成UUID
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

// 生成密钥
export const generateKey = (length: number = ENCRYPTION_CONFIG.keyLength): Buffer => {
  return crypto.randomBytes(length);
};

// 生成初始化向量
export const generateIV = (length: number = ENCRYPTION_CONFIG.ivLength): Buffer => {
  return crypto.randomBytes(length);
};

// AES加密
export const encrypt = (text: string, key: string | Buffer): { encrypted: string; iv: string; tag: string } => {
  try {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
    const iv = generateIV();
    const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, keyBuffer);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 简化版本，不使用GCM模式
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: '' // 简化版本不使用tag
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// AES解密
export const decrypt = (encryptedData: { encrypted: string; iv: string; tag: string }, key: string | Buffer): string => {
  try {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
    const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.algorithm, keyBuffer);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 简单加密（用于非敏感数据）
export const simpleEncrypt = (text: string, key: string): string => {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const cipher = crypto.createCipher(algorithm, keyHash);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// 简单解密
export const simpleDecrypt = (encryptedText: string, key: string): string => {
  const algorithm = 'aes-256-cbc';
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const decipher = crypto.createDecipher(algorithm, keyHash);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// 哈希函数
export const hash = (text: string, algorithm: string = 'sha256'): string => {
  return crypto.createHash(algorithm).update(text).digest('hex');
};

// HMAC
export const hmac = (text: string, key: string, algorithm: string = 'sha256'): string => {
  return crypto.createHmac(algorithm, key).update(text).digest('hex');
};

// MD5哈希
export const md5 = (text: string): string => {
  return hash(text, 'md5');
};

// SHA256哈希
export const sha256 = (text: string): string => {
  return hash(text, 'sha256');
};

// SHA512哈希
export const sha512 = (text: string): string => {
  return hash(text, 'sha512');
};

// 密码哈希
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, ENCRYPTION_CONFIG.saltRounds);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 验证密码
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error(`Password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 生成JWT令牌
export const generateJWT = (payload: JWTPayload, secret: string, options: JWTOptions = {}): string => {
  try {
    const defaultOptions: jwt.SignOptions = {
      expiresIn: options.expiresIn || '24h',
      issuer: options.issuer || 'disaster-risk-system',
      audience: options.audience
    };
    
    return jwt.sign(payload, secret, defaultOptions);
  } catch (error) {
    throw new Error(`JWT generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 验证JWT令牌
export const verifyJWT = (token: string, secret: string): JWTPayload => {
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error(`JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// 解码JWT令牌（不验证）
export const decodeJWT = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error(`JWT decoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 生成刷新令牌
export const generateRefreshToken = (): string => {
  return generateRandomString(64);
};

// 生成API密钥
export const generateAPIKey = (prefix: string = 'drs'): string => {
  const timestamp = Date.now().toString(36);
  const random = generateRandomString(16);
  return `${prefix}_${timestamp}_${random}`;
};

// 生成重置令牌
export const generateResetToken = (): string => {
  return generateRandomString(32);
};

// 生成验证码
export const generateVerificationCode = (length: number = 6): string => {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return code;
};

// Base64编码
export const base64Encode = (text: string): string => {
  return Buffer.from(text, 'utf8').toString('base64');
};

// Base64解码
export const base64Decode = (encodedText: string): string => {
  return Buffer.from(encodedText, 'base64').toString('utf8');
};

// URL安全的Base64编码
export const base64UrlEncode = (text: string): string => {
  return base64Encode(text)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// URL安全的Base64解码
export const base64UrlDecode = (encodedText: string): string => {
  let base64 = encodedText
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // 添加填充
  while (base64.length % 4) {
    base64 += '=';
  }
  
  return base64Decode(base64);
};

// 生成数字签名
export const generateSignature = (data: string, privateKey: string): string => {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
};

// 验证数字签名
export const verifySignature = (data: string, signature: string, publicKey: string): boolean => {
  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'base64');
  } catch (error) {
    return false;
  }
};

// 生成密钥对
export const generateKeyPair = (): { publicKey: string; privateKey: string } => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
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

// 安全比较字符串（防止时序攻击）
export const safeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// 生成CSRF令牌
export const generateCSRFToken = (): string => {
  return generateRandomString(32);
};

// 加密敏感数据
export const encryptSensitiveData = (data: any, key: string): string => {
  const jsonString = JSON.stringify(data);
  return simpleEncrypt(jsonString, key);
};

// 解密敏感数据
export const decryptSensitiveData = (encryptedData: string, key: string): any => {
  const jsonString = simpleDecrypt(encryptedData, key);
  return JSON.parse(jsonString);
};