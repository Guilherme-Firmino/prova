-- Supabase schema para MemeFlow
-- Extensão para gerar UUIDs
create extension if not exists pgcrypto;

-- Perfis vinculados ao auth.users do Supabase
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  website text,
  created_at timestamptz default now()
);

-- Vídeos
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  owner uuid references profiles(id) not null,
  title text,
  description text,
  storage_path text not null,
  thumbnail_path text,
  duration_seconds integer,
  views_count bigint default 0,
  is_public boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_videos_owner on videos(owner);
create index if not exists idx_videos_created_at on videos(created_at);

-- Likes (um usuário curte um vídeo uma vez)
create table if not exists likes (
  id bigserial primary key,
  video_id uuid references videos(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (video_id, user_id)
);

-- Comentários (suporte a replies via parent_id)
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete set null,
  content text not null,
  created_at timestamptz default now(),
  edited boolean default false
);
create index if not exists idx_comments_video on comments(video_id);

-- Conexões / Seguidores
create table if not exists connections (
  id bigserial primary key,
  follower uuid references profiles(id) on delete cascade,
  following uuid references profiles(id) on delete cascade,
  status text default 'accepted', -- pending, accepted, blocked
  created_at timestamptz default now(),
  unique (follower, following)
);

-- Mensagens privadas
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid references profiles(id) on delete cascade,
  receiver uuid references profiles(id) on delete cascade,
  content text,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_messages_sender_receiver on messages(sender, receiver);

-- Notificações
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_notifications_user on notifications(user_id);

-- Tags e associação de tags com vídeos
create table if not exists tags (
  id bigserial primary key,
  name text unique not null
);

create table if not exists video_tags (
  video_id uuid references videos(id) on delete cascade,
  tag_id bigserial references tags(id) on delete cascade,
  primary key (video_id, tag_id)
);

-- Contadores e views podem ser mantidos em materialized tables ou triggers
-- (omitir triggers aqui para simplicidade; podem ser adicionados conforme necessário)
