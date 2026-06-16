import { supabase } from '@/lib/supabase';
import type { Connection } from '@/types';

export const connectionService = {
  async sendRequest(requesterId: string, receiverId: string) {
    const { data, error } = await supabase
      .from('connections')
      .insert({ requester_id: requesterId, receiver_id: receiverId, status: 'pending' })
      .select()
      .single();
    if (error) throw error;

    // Notify receiver
    await supabase.from('notifications').insert({
      user_id: receiverId,
      type: 'connection_request',
      reference_id: requesterId,
    });

    return data;
  },

  async acceptRequest(connectionId: string) {
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId)
      .select()
      .single();
    if (error) throw error;

    // Notify requester
    await supabase.from('notifications').insert({
      user_id: data.requester_id,
      type: 'connection_accepted',
      reference_id: data.receiver_id,
    });

    return data;
  },

  async rejectRequest(connectionId: string) {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .eq('id', connectionId);
    if (error) throw error;
  },

  async removeConnection(connectionId: string) {
    const { error } = await supabase.from('connections').delete().eq('id', connectionId);
    if (error) throw error;
  },

  async getConnections(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('connections')
      .select(
        `
        *,
        profiles!connections_requester_id_fkey (id, username, display_name, avatar_url),
        profiles!connections_receiver_id_fkey (id, username, display_name, avatar_url)
      `
      )
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getPendingRequests(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('connections')
      .select(
        `
        *,
        profiles!connections_requester_id_fkey (id, username, display_name, avatar_url)
      `
      )
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async areConnected(userId1: string, userId2: string): Promise<boolean> {
    const { data } = await supabase
      .from('connections')
      .select('id')
      .or(
        `and(requester_id.eq.${userId1},receiver_id.eq.${userId2}),and(requester_id.eq.${userId2},receiver_id.eq.${userId1})`
      )
      .eq('status', 'accepted')
      .maybeSingle();
    return !!data;
  },
};
