-- Shelter Occupancy History Table and Triggers Creation Script

-- 1. Create shelter occupancy history table
CREATE TABLE shelters_occupancy_history (
    id SERIAL PRIMARY KEY,
    shelter_id INTEGER NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
    capacity INTEGER NOT NULL,
    old_occupancy INTEGER NOT NULL,
    new_occupancy INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    change_reason VARCHAR(100) DEFAULT 'System Update',
    changed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indexes for better query performance
CREATE INDEX idx_shelters_occupancy_history_shelter_id ON shelters_occupancy_history (shelter_id);
CREATE INDEX idx_shelters_occupancy_history_created_at ON shelters_occupancy_history (created_at DESC);
CREATE INDEX idx_shelters_occupancy_history_shelter_time ON shelters_occupancy_history (shelter_id, created_at DESC);

-- 3. Create trigger function to automatically log occupancy changes
CREATE OR REPLACE FUNCTION log_shelter_occupancy_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only record when current_occupancy changes
    IF NEW.current_occupancy != OLD.current_occupancy THEN
        INSERT INTO shelters_occupancy_history (
            shelter_id,
            capacity,
            old_occupancy,
            new_occupancy,
            change_amount,
            change_reason
        ) VALUES (
            NEW.id,
            NEW.capacity,
            OLD.current_occupancy,
            NEW.current_occupancy,
            NEW.current_occupancy - OLD.current_occupancy,
            CASE 
                WHEN NEW.current_occupancy > OLD.current_occupancy THEN 'Occupancy Increased'
                WHEN NEW.current_occupancy < OLD.current_occupancy THEN 'Occupancy Decreased'
                ELSE 'Occupancy Adjusted'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically record history when shelters table is updated
CREATE TRIGGER shelter_occupancy_change_trigger
    BEFORE UPDATE ON shelters
    FOR EACH ROW
    EXECUTE FUNCTION log_shelter_occupancy_change();

-- 5. Create initial history records for existing shelters (optional)
INSERT INTO shelters_occupancy_history (
    shelter_id,
    capacity,
    old_occupancy,
    new_occupancy,
    change_amount,
    change_reason,
    created_at
)
SELECT 
    id,
    capacity,
    0,
    current_occupancy,
    current_occupancy,
    'Initial State',
    created_at
FROM shelters
WHERE current_occupancy > 0;

-- 6. Create view for easier access to latest occupancy history
CREATE VIEW v_shelter_latest_history AS
SELECT DISTINCT ON (shelter_id)
    soh.id,
    soh.shelter_id,
    s.name as shelter_name,
    soh.capacity,
    soh.new_occupancy as current_occupancy,
    soh.change_amount,
    soh.change_reason,
    soh.created_at
FROM shelters_occupancy_history soh
INNER JOIN shelters s ON soh.shelter_id = s.id
ORDER BY shelter_id, created_at DESC;

-- 7. Add table comments
COMMENT ON TABLE shelters_occupancy_history IS 'Shelter occupancy history records';
COMMENT ON COLUMN shelters_occupancy_history.shelter_id IS 'Associated shelter ID';
COMMENT ON COLUMN shelters_occupancy_history.capacity IS 'Shelter capacity';
COMMENT ON COLUMN shelters_occupancy_history.old_occupancy IS 'Occupancy before change';
COMMENT ON COLUMN shelters_occupancy_history.new_occupancy IS 'Occupancy after change';
COMMENT ON COLUMN shelters_occupancy_history.change_amount IS 'Change amount (positive for increase, negative for decrease)';
COMMENT ON COLUMN shelters_occupancy_history.change_reason IS 'Reason for change';
COMMENT ON COLUMN shelters_occupancy_history.changed_by IS 'User ID who made the change';
COMMENT ON COLUMN shelters_occupancy_history.created_at IS 'Record creation timestamp';