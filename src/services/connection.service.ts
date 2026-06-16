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
    // Step 1: fetch accepted connections involving user
    const { data: conns, error: connsErr } = await supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    if (connsErr) throw connsErr;

    const rows = conns || [];
    if (rows.length === 0) return [];

    // collect other participant ids
    const otherIds = rows.map((r: any) => (r.requester_id === userId ? r.receiver_id : r.requester_id));
    const uniqIds = Array.from(new Set(otherIds));

    // fetch profiles for other participants
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', uniqIds);
    if (profilesErr) throw profilesErr;

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // attach profile to connection
    return rows.map((r: any) => ({
      ...r,
      requester: profileMap.get(r.requester_id) || null,
      receiver: profileMap.get(r.receiver_id) || null,
    }));
  },

  async getPendingRequests(userId: string): Promise<Connection[]> {
    const { data: rows, error } = await supabase
      .from('connections')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const requesterIds = Array.from(new Set((rows || []).map((r: any) => r.requester_id)));
    if (requesterIds.length === 0) return rows || [];

    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', requesterIds);
    if (profilesErr) throw profilesErr;

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return (rows || []).map((r: any) => ({ ...r, requester: profileMap.get(r.requester_id) || null }));
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
