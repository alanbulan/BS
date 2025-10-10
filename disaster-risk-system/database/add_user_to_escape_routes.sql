-- 为escape_routes表添加user_id字段，支持用户关联和个人路径管理

-- 1. 添加user_id字段（可为空，因为系统预设路线没有用户）
ALTER TABLE escape_routes 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- 2. 添加is_user_generated标识（区分用户生成和系统预设）
ALTER TABLE escape_routes 
ADD COLUMN IF NOT EXISTS is_user_generated BOOLEAN DEFAULT false;

-- 3. 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_escape_routes_user_id ON escape_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_escape_routes_user_generated ON escape_routes(user_id, is_user_generated) WHERE is_user_generated = true;

-- 4. 添加created_by_name字段（冗余，方便显示）
ALTER TABLE escape_routes 
ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100);

-- 验证修改
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'escape_routes' 
  AND column_name IN ('user_id', 'is_user_generated', 'created_by_name')
ORDER BY ordinal_position;

-- 显示表结构
SELECT '✓ escape_routes表已更新，支持用户路径管理' as status;


