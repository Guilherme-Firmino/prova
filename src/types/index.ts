export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  favorite_humor_style: string | null;
  total_posts: number;
  total_likes_received: number;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: HumorCategory;
  video_url: string;
  thumbnail_url: string | null;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  likes_count?: number;
  user_has_liked?: boolean;
}

export interface CommentLike {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: string;
}

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  profiles?: Profile;
}

export interface Conversation {
  id: string;
  created_at: string;
  participants?: Profile[];
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'connection_request' | 'connection_accepted' | 'new_message';
  reference_id: string;
  read: boolean;
  created_at: string;
  actor?: Profile;
}

export type HumorCategory =
  | 'Memes'
  | 'Reações'
  | 'Pegadinhas'
  | 'Animais Engraçados'
  | 'Humor Nerd'
  | 'Humor Ácido'
  | 'Humor Aleatório'
  | 'Trends'
  | 'Games'
  | 'Outros';

export const HUMOR_CATEGORIES: HumorCategory[] = [
  'Memes',
  'Reações',
  'Pegadinhas',
  'Animais Engraçados',
  'Humor Nerd',
  'Humor Ácido',
  'Humor Aleatório',
  'Trends',
  'Games',
  'Outros',
];
