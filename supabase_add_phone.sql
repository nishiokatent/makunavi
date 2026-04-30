-- profiles テーブルに phone カラムを追加
-- Supabase の SQL Editor で1回実行してください

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN profiles.phone IS '電話番号（任意・非公開）';
