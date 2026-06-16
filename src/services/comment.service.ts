import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types';

export const commentService = {
  async getComments(videoId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        *,
        profiles!comments_user_id_fkey (id, username, display_name, avatar_url),
        comment_likes(count)
      `
      )
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((c: any) => ({
      ...c,
      likes_count: c.comment_likes?.[0]?.count || 0,
    }));
  },

  async addComment(userId: string, videoId: string, content: string) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: userId, video_id: videoId, content })
      .select(
        `
        *,
        profiles!comments_user_id_fkey (id, username, display_name, avatar_url)
      `
      )
      .single();
    if (error) throw error;

    // Notify video owner
    const { data: video } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', videoId)
      .single();
    if (video && video.user_id !== userId) {
      await supabase.from('notifications').insert({
        user_id: video.user_id,
        type: 'comment',
        reference_id: videoId,
      });
    }

    return data;
  },

  async updateComment(commentId: string, userId: string, content: string) {
    const { data, error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteComment(commentId: string, userId: string) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async toggleCommentLike(userId: string, commentId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .maybeSingle();

    if (existing) {
      await supabase.from('comment_likes').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('comment_likes').insert({ user_id: userId, comment_id: commentId });
      return true;
    }
  },

  async hasLikedComment(userId: string, commentId: string): Promise<boolean> {
    const { data } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .maybeSingle();
    return !!data;
  },
};
