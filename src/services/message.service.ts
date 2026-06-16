import { supabase } from '@/lib/supabase';
import type { Message } from '@/types';

export const messageService = {
  async createConversation(participantIds: string[]): Promise<string> {
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();
    if (error) throw error;

    const participants = participantIds.map((userId) => ({
      conversation_id: conv.id,
      user_id: userId,
    }));

    const { error: insertError } = await supabase
      .from('conversation_participants')
      .insert(participants);
    if (insertError) throw insertError;

    return conv.id;
  },

  async getOrCreateConversation(userId1: string, userId2: string): Promise<string> {
    // Check if conversation already exists
    const { data: existing } = await supabase.rpc('get_conversation_between_users', {
      user1_id: userId1,
      user2_id: userId2,
    });

    if (existing && existing.length > 0) {
      return existing[0].conversation_id;
    }

    return this.createConversation([userId1, userId2]);
  },

  async getConversations(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(
        `
        conversation_id,
        conversations!inner (id, created_at),
        user_id,
        profiles!conversation_participants_user_id_fkey (id, username, display_name, avatar_url)
      `
      )
      .eq('user_id', userId);
    if (error) throw error;

    // Group rows by conversation_id and build participants list (exclude current user)
    const rows = (data as any[]) || [];
    const map: Record<string, any> = {};
    for (const row of rows) {
      const cid = row.conversation_id;
      if (!map[cid]) {
        map[cid] = {
          id: cid,
          created_at: row.conversations?.created_at,
          participants: [],
        };
      }

      // profiles may come as object or array from Supabase; normalize to single profile object
      const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (prof && prof.id !== userId) {
        map[cid].participants.push(prof);
      }
    }

    return Object.values(map);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(
        `
        *,
        profiles!messages_sender_id_fkey (id, username, display_name, avatar_url)
      `
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('read', false);

    return data || [];
  },

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        read: false,
      })
      .select(
        `
        *,
        profiles!messages_sender_id_fkey (id, username, display_name, avatar_url)
      `
      )
      .single();
    if (error) throw error;

    return data;
  },

  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          const { data } = await supabase
            .from('messages')
            .select(
              `
              *,
              profiles!messages_sender_id_fkey (id, username, display_name, avatar_url)
            `
            )
            .eq('id', payload.new.id)
            .single();
          if (data) callback(data);
        }
      )
      .subscribe();
  },

  async deleteConversation(conversationId: string, _userId: string) {
    // Delete messages
    await supabase.from('messages').delete().eq('conversation_id', conversationId);
    // Delete participants
    await supabase.from('conversation_participants').delete().eq('conversation_id', conversationId);
    // Delete conversation
    await supabase.from('conversations').delete().eq('id', conversationId);
  },
};
