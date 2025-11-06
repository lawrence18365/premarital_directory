ALTER TABLE posts
ADD COLUMN meta_title text,
ADD COLUMN meta_description text,
ADD COLUMN featured_image_url text,
ADD COLUMN author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN status text DEFAULT 'draft' NOT NULL;
