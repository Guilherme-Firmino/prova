import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, MessageSquare, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

export function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await notificationService.getNotifications(user.id);
        setNotifications(data);
      } catch {
        toast.error('Erro ao carregar notificações');
      } finally {
        setLoading(false);
      }
    };
    load();

    const sub = notificationService.subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      supabase.removeChannel(sub);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Todas notificações marcadas como lidas');
    } catch {
      toast.error('Erro ao marcar como lidas');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
      case 'connection_request':
        return <UserPlus className="h-5 w-5 text-yellow-500" />;
      case 'connection_accepted':
        return <UserCheck className="h-5 w-5 text-green-500" />;
      case 'new_message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'curtiu seu vídeo';
      case 'comment':
        return 'comentou no seu vídeo';
      case 'connection_request':
        return 'enviou uma solicitação de conexão';
      case 'connection_accepted':
        return 'aceitou sua solicitação de conexão';
      case 'new_message':
        return 'enviou uma mensagem';
      default:
        return '';
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (hours < 1) return 'Agora mesmo';
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString('pt-BR');
  };

  if (!user) return null;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notificações</h1>
          {notifications.some((n) => !n.read) && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2" />
              <p>Nenhuma notificação ainda</p>
              <p className="text-sm">Interaja com a comunidade para receber notificações</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  notification.read
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-purple-50 dark:bg-purple-950'
                }`}
                onClick={() => {
                  notificationService.markAsRead(notification.id);
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
                  );
                  // Navigate based on type
                  if (['like', 'comment'].includes(notification.type)) {
                    navigate(`/video/${notification.reference_id}`);
                  } else if (notification.type === 'connection_request' || notification.type === 'connection_accepted') {
                    navigate('/connections');
                  } else if (notification.type === 'new_message') {
                    navigate('/chat');
                  }
                }}
              >
                <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{getText(notification)}</span>
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-purple-600" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
