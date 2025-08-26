-- 创建身份认证相关表

-- 1. 刷新Token表
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 2. 密码重置Token表
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- 3. 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. 为refresh_tokens表创建更新时间触发器
DROP TRIGGER IF EXISTS update_refresh_tokens_updated_at ON refresh_tokens;
CREATE TRIGGER update_refresh_tokens_updated_at
    BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 创建清理过期Token的函数
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_refresh_tokens INTEGER;
    deleted_reset_tokens INTEGER;
BEGIN
    -- 清理过期的刷新Token
    DELETE FROM refresh_tokens WHERE expires_at <= NOW();
    GET DIAGNOSTICS deleted_refresh_tokens = ROW_COUNT;
    
    -- 清理过期的密码重置Token
    DELETE FROM password_reset_tokens WHERE expires_at <= NOW();
    GET DIAGNOSTICS deleted_reset_tokens = ROW_COUNT;
    
    -- 记录清理结果
    RAISE NOTICE '清理过期Token完成: 刷新Token: %, 重置Token: %', deleted_refresh_tokens, deleted_reset_tokens;
    
    RETURN deleted_refresh_tokens + deleted_reset_tokens;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建用户登录日志表（可选）
CREATE TABLE IF NOT EXISTS user_login_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    login_type VARCHAR(20) NOT NULL, -- 'username', 'email'
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_login_time ON user_login_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_success ON user_login_logs(success);

-- 7. 插入一些示例数据（可选）
-- 注意：这里不插入实际的Token数据，因为它们应该由应用程序动态生成

-- 8. 创建定期清理任务的存储过程（需要pg_cron扩展）
-- 如果安装了pg_cron扩展，可以创建定期清理任务
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

COMMENT ON TABLE refresh_tokens IS '用户刷新Token表';
COMMENT ON TABLE password_reset_tokens IS '密码重置Token表';
COMMENT ON TABLE user_login_logs IS '用户登录日志表';
COMMENT ON FUNCTION cleanup_expired_tokens() IS '清理过期Token的函数';