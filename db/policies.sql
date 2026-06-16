-- Políticas RLS para MemeFlow
-- Ativar RLS e políticas básicas

-- Profiles
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "profiles_modify_self" ON profiles FOR UPDATE, DELETE USING (id = auth.uid());
CREATE POLICY IF NOT EXISTS "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Videos
ALTER TABLE IF EXISTS videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "videos_select_public_or_owner" ON videos FOR SELECT USING (is_public = true OR owner = auth.uid());
CREATE POLICY IF NOT EXISTS "videos_insert_owner" ON videos FOR INSERT WITH CHECK (owner = auth.uid());
CREATE POLICY IF NOT EXISTS "videos_modify_owner" ON videos FOR UPDATE, DELETE USING (owner = auth.uid());

-- Comments
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "comments_select_video_public_or_participant" ON comments FOR SELECT USING (
  (EXISTS (SELECT 1 FROM videos v WHERE v.id = comments.video_id AND (v.is_public = true OR v.owner = auth.uid())))
  OR (comments.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "comments_insert_auth" ON comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "comments_modify_self" ON comments FOR UPDATE, DELETE USING (user_id = auth.uid());

-- Likes
ALTER TABLE IF EXISTS likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "likes_insert_user" ON likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "likes_select" ON likes FOR SELECT USING (true);
CREATE POLICY IF NOT_EXISTS "likes_delete_self" ON likes FOR DELETE USING (user_id = auth.uid());

-- Connections (seguidores)
ALTER TABLE IF EXISTS connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "connections_insert_follower" ON connections FOR INSERT WITH CHECK (follower = auth.uid());
CREATE POLICY IF NOT_EXISTS "connections_select" ON connections FOR SELECT USING (follower = auth.uid() OR following = auth.uid());
CREATE POLICY IF NOT_EXISTS "connections_delete_self" ON connections FOR DELETE USING (follower = auth.uid() OR following = auth.uid());

-- Messages
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "messages_insert_sender" ON messages FOR INSERT WITH CHECK (sender = auth.uid());
CREATE POLICY IF NOT_EXISTS "messages_select_participant" ON messages FOR SELECT USING (sender = auth.uid() OR receiver = auth.uid());
CREATE POLICY IF NOT_EXISTS "messages_delete_sender" ON messages FOR DELETE USING (sender = auth.uid());

-- Notifications
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT_EXISTS "notifications_select_user" ON notifications FOR SELECT USING (user_id = auth.uid());
-- Inserts for notifications are usually done server-side with service_role key

-- Tags and video_tags are public for reading
ALTER TABLE IF EXISTS tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "tags_select" ON tags FOR SELECT USING (true);

ALTER TABLE IF EXISTS video_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT_EXISTS "video_tags_select" ON video_tags FOR SELECT USING (true);

-- Nota: revise e ajuste conforme regras de negócio específicas.
