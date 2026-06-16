import { supabase } from '@/lib/supabase';
import type { Video, HumorCategory } from '@/types';

export const videoService = {
  async getVideos(params?: {
    category?: HumorCategory;
    userId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Video[]> {
    let query = supabase
      .from('videos')
      .select(
        `
        *,
        profiles!videos_user_id_fkey (id, username, display_name, avatar_url),
        likes_count:likes(count),
        comments_count:comments(count)
      `
      )
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (params?.category) {
      query = query.eq('category', params.category);
    }
    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }
    if (params?.search) {
      query = query.or(
        `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
      );
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((video: any) => ({
      ...video,
      likes_count: video.likes_count?.[0]?.count || 0,
      comments_count: video.comments_count?.[0]?.count || 0,
    }));
  },

  async getVideo(id: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from('videos')
      .select(
        `
        *,
        profiles!videos_user_id_fkey (id, username, display_name, avatar_url),
        likes_count:likes(count),
        comments_count:comments(count)
      `
      )
      .eq('id', id)
      .single();
    if (error) throw error;
    return {
      ...data,
      likes_count: data.likes_count?.[0]?.count || 0,
      comments_count: data.comments_count?.[0]?.count || 0,
    } as any;
  },

  async createVideo(video: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'likes_count' | 'comments_count' | 'user_has_liked'>) {
    const { data, error } = await supabase
      .from('videos')
      .insert(video)
      .select()
      .single();
    if (error) throw error;

    await supabase.rpc('increment_user_posts', { user_id: video.user_id });

    return data;
  },

  async updateVideo(id: string, userId: string, updates: Partial<Video>) {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteVideo(id: string, userId: string) {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async uploadVideo(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const filePath = `videos/${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async uploadThumbnail(videoId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const filePath = `thumbnails/${videoId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async getUserVideos(userId: string): Promise<Video[]> {
    const { data, error } = await supabase
      .from('videos')
      .select(
        `
        *,
        profiles!videos_user_id_fkey (id, username, display_name, avatar_url),
        likes_count:likes(count),
        comments_count:comments(count)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((video: any) => ({
      ...video,
      likes_count: video.likes_count?.[0]?.count || 0,
      comments_count: video.comments_count?.[0]?.count || 0,
    }));
  },
};
