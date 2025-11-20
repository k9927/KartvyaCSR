-- =============================================
-- UPDATE EXISTING NGOS WITH RANDOM LOGO IMAGES
-- =============================================
-- This script assigns random logo images to existing NGOs that don't have logos
-- Run this after your sample data has been inserted
-- =============================================

-- First, ensure logo_path column exists (if it doesn't already)
ALTER TABLE ngo_profiles
  ADD COLUMN IF NOT EXISTS logo_path VARCHAR(500);

-- Update existing NGOs with online hosted images
-- Using Unsplash and other free image hosting services for NGO/organization images

UPDATE ngo_profiles
SET logo_path = CASE 
    -- Assign different online hosted images based on user_id to ensure variety
    WHEN user_id = 19 THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop'    -- KFC - Business/Organization
    WHEN user_id = 101 THEN 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop'  -- EduSpring Foundation - Education
    WHEN user_id = 102 THEN 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=400&fit=crop'  -- Aarogya Care Trust - Healthcare
    WHEN user_id = 103 THEN 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop'  -- Green Treasures Initiative - Environment
    -- For any other NGOs without logos, assign randomly based on their ID
    ELSE CASE (user_id % 10)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=400&fit=crop'
        WHEN 3 THEN 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop'
        WHEN 4 THEN 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=400&fit=crop'
        WHEN 5 THEN 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=400&fit=crop'
        WHEN 6 THEN 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop'
        WHEN 7 THEN 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=400&fit=crop'
        WHEN 8 THEN 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop'
        WHEN 9 THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop'
    END
END,
updated_at = NOW()
WHERE logo_path IS NULL OR logo_path = '';

-- Verify the updates
SELECT 
    np.id,
    np.user_id,
    np.organization_name,
    np.logo_path,
    np.updated_at
FROM ngo_profiles np
JOIN users u ON np.user_id = u.id
WHERE u.user_type = 'ngo'
ORDER BY np.user_id;

