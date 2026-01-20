--- Migration: 001_add_signature_image_to_user_profiles.sql ---

ALTER TABLE user_profiles
ADD COLUMN signatureImage TEXT;

--- End Migration --- 