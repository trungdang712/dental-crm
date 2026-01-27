-- Add image columns to crm_leads for patient photos and X-rays
-- Images will be stored in Supabase storage, URLs stored here as JSONB

-- Add patient photos column (array of {type, url, uploadedAt})
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS patient_photos JSONB DEFAULT '[]';

-- Add X-ray photos column (array of {type, url, uploadedAt})
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS xray_photos JSONB DEFAULT '[]';

-- Comment for documentation
COMMENT ON COLUMN crm_leads.patient_photos IS 'Patient dental photos: [{type: "front_smile"|"right_bite"|"left_bite"|"upper_occlusal"|"lower_occlusal", url: string, uploadedAt: string}]';
COMMENT ON COLUMN crm_leads.xray_photos IS 'X-ray images: [{type: "opg"|"cephalometric"|"periapical"|"cbct"|"bitewing", url: string, uploadedAt: string}]';
