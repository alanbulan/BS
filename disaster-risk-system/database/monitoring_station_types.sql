-- 创建监测站类型字典表
CREATE TABLE IF NOT EXISTS monitoring_station_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_zh VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_zh TEXT,
    description_en TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_monitoring_station_types_code ON monitoring_station_types(code);
CREATE INDEX IF NOT EXISTS idx_monitoring_station_types_active ON monitoring_station_types(is_active);

-- 创建触发器更新 updated_at
CREATE OR REPLACE FUNCTION update_monitoring_station_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_monitoring_station_types_updated_at ON monitoring_station_types;
CREATE TRIGGER trigger_monitoring_station_types_updated_at
    BEFORE UPDATE ON monitoring_station_types
    FOR EACH ROW EXECUTE FUNCTION update_monitoring_station_types_updated_at();

-- 插入初始数据
INSERT INTO monitoring_station_types (code, name_zh, name_en, description_zh, description_en, sort_order) VALUES
('geological', '地质监测', 'Geological Monitoring', '地质结构和岩土变化监测', 'Geological structure and rock soil change monitoring', 1),
('meteorological', '气象监测', 'Meteorological Monitoring', '天气、气候相关参数监测', 'Weather and climate parameter monitoring', 2),
('hydrological', '水文监测', 'Hydrological Monitoring', '水位、流量等水文参数监测', 'Water level, flow and other hydrological parameter monitoring', 3),
('environmental', '环境监测', 'Environmental Monitoring', '环境质量和生态参数监测', 'Environmental quality and ecological parameter monitoring', 4),
('rainfall', '降雨监测', 'Rainfall Monitoring', '降水量及相关参数监测', 'Precipitation and related parameter monitoring', 5),
('seismic', '地震监测', 'Seismic Monitoring', '地震活动及地震波监测', 'Seismic activity and seismic wave monitoring', 6),
('water_level', '水位监测', 'Water Level Monitoring', '河流、湖泊、水库水位监测', 'River, lake, reservoir water level monitoring', 7),
('temperature', '温度监测', 'Temperature Monitoring', '温度变化监测', 'Temperature change monitoring', 8),
('humidity', '湿度监测', 'Humidity Monitoring', '空气湿度监测', 'Air humidity monitoring', 9),
('weather', '天气监测', 'Weather Monitoring', '综合天气参数监测', 'Comprehensive weather parameter monitoring', 10),
('wind', '风力监测', 'Wind Monitoring', '风速、风向监测', 'Wind speed and direction monitoring', 11),
('soil_moisture', '土壤湿度监测', 'Soil Moisture Monitoring', '土壤含水量监测', 'Soil water content monitoring', 12),
('slope', '坡面监测', 'Slope Monitoring', '坡面位移和稳定性监测', 'Slope displacement and stability monitoring', 13),
('groundwater', '地下水监测', 'Groundwater Monitoring', '地下水位和水质监测', 'Groundwater level and quality monitoring', 14)
ON CONFLICT (code) DO UPDATE SET
    name_zh = EXCLUDED.name_zh,
    name_en = EXCLUDED.name_en,
    description_zh = EXCLUDED.description_zh,
    description_en = EXCLUDED.description_en,
    sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;

-- 为 monitoring_stations 表添加外键约束 (如果不存在)
-- 注意：这需要确保现有数据中的 station_type 值在 monitoring_station_types 表中存在
-- 如果有不匹配的数据，需要先清理或插入对应的类型
DO $$
BEGIN
    -- 检查外键约束是否已存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_monitoring_stations_type'
    ) THEN
        -- 在添加外键前，确保所有现有的 station_type 值都在 monitoring_station_types 表中
        INSERT INTO monitoring_station_types (code, name_zh, name_en, description_zh, description_en)
        SELECT DISTINCT 
            ms.station_type,
            COALESCE(ms.station_type, '未知类型'),
            COALESCE(ms.station_type, 'Unknown Type'),
            '系统迁移时自动创建',
            'Auto-created during system migration'
        FROM monitoring_stations ms
        WHERE ms.station_type IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM monitoring_station_types mst 
            WHERE mst.code = ms.station_type
        )
        ON CONFLICT (code) DO NOTHING;

        -- 添加外键约束
        ALTER TABLE monitoring_stations 
        ADD CONSTRAINT fk_monitoring_stations_type 
        FOREIGN KEY (station_type) REFERENCES monitoring_station_types(code);
    END IF;
END $$;

-- 添加注释
COMMENT ON TABLE monitoring_station_types IS '监测站类型字典表';
COMMENT ON COLUMN monitoring_station_types.code IS '类型代码，英文标识符';
COMMENT ON COLUMN monitoring_station_types.name_zh IS '中文名称';
COMMENT ON COLUMN monitoring_station_types.name_en IS '英文名称';
COMMENT ON COLUMN monitoring_station_types.description_zh IS '中文描述';
COMMENT ON COLUMN monitoring_station_types.description_en IS '英文描述';
COMMENT ON COLUMN monitoring_station_types.is_active IS '是否启用';
COMMENT ON COLUMN monitoring_station_types.sort_order IS '排序序号';