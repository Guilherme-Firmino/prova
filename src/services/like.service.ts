import { supabase } from '@/lib/supabase';

export const likeService = {
  async toggleLike(userId: string, videoId: string): Promise<boolean> {
    // Check if already liked
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle();

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;

      // Decrement video owner's total likes
      const { data: video } = await supabase
        .from('videos')
        .select('user_id')
        .eq('id', videoId)
        .single();
      if (video) {
        await supabase.rpc('decrement_user_likes_received', { user_id: video.user_id });
      }

      return false;
    } else {
      // Like
      const { error } = await supabase.from('likes').insert({
        user_id: userId,
        video_id: videoId,
      });
      if (error) throw error;

      // Increment video owner's total likes
      const { data: video } = await supabase
        .from('videos')
        .select('user_id')
        .eq('id', videoId)
        .single();
      if (video && video.user_id !== userId) {
        await supabase.rpc('increment_user_likes_received', { user_id: video.user_id });

        // Create notification
        await supabase.from('notifications').insert({
          user_id: video.user_id,
          type: 'like',
          reference_id: videoId,
        });
      }

      return true;
    }
  },

  async hasLiked(userId: string, videoId: string): Promise<boolean> {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle();
    return !!data;
  },

  async getLikedVideos(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('likes')
      .select('video_id')
      .eq('user_id', userId);
    return (data || []).map((l) => l.video_id);
  },
};
