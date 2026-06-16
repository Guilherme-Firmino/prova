import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/services/message.service';
import type { Message } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

interface ConversationSummary {
  id: string;
  created_at: string;
  participants: { id: string; username: string; display_name: string; avatar_url: string | null }[];
  last_message?: Message;
}

export function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const convs = await messageService.getConversations(user.id);
        setConversations(convs);
      } catch {
        toast.error('Erro ao carregar conversas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedConv) return;

    const loadMessages = async () => {
      try {
        const msgs = await messageService.getMessages(selectedConv);
        setMessages(msgs);
      } catch {
        toast.error('Erro ao carregar mensagens');
      }
    };
    loadMessages();

    const sub = messageService.subscribeToMessages(selectedConv, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      sub.unsubscribe();
    };
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !selectedConv || !messageText.trim()) return;
    setSending(true);
    try {
      const msg = await messageService.sendMessage(selectedConv, user.id, messageText.trim());
      setMessages((prev) => [...prev, msg]);
      setMessageText('');
    } catch {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (convId: string) => {
    if (!window.confirm('Excluir conversa?')) return;
    try {
      await messageService.deleteConversation(convId, user!.id);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selectedConv === convId) {
        setSelectedConv(null);
        setMessages([]);
      }
      toast.success('Conversa excluída');
    } catch {
      toast.error('Erro ao excluir conversa');
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Agora mesmo';
    if (hours < 24) return `${hours}h`;
    return d.toLocaleDateString('pt-BR');
  };

  if (!user) return null;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-purple-600" />
          Chat
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-2">
                {loading ? (
                  <div className="space-y-2 p-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">Nenhuma conversa ainda</p>
                    <p className="text-xs">Conecte-se com usuários para conversar</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => {
                      const other = conv.participants?.[0];
                      return (
                        <div
                          key={conv.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedConv === conv.id
                              ? 'bg-purple-100 dark:bg-purple-900'
                              : 'hover:bg-purple-50 dark:hover:bg-purple-950'
                          }`}
                          onClick={() => setSelectedConv(conv.id)}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={other?.avatar_url || undefined} />
                            <AvatarFallback>{other?.display_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{other?.display_name}</p>
                            <p className="text-xs text-gray-500 truncate">@{other?.username}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Messages */}
          <div className="lg:col-span-2">
            {selectedConv ? (
              <Card className="h-[60vh] flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-purple-100 dark:border-purple-900">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedConv(null); setMessages([]); }}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => deleteConversation(selectedConv)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.sender_id === user.id
                            ? 'bg-purple-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.sender_id === user.id ? 'text-purple-200' : 'text-gray-500'
                          }`}
                        >
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2 p-3 border-t border-purple-100 dark:border-purple-900">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button size="icon" onClick={sendMessage} disabled={sending || !messageText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>Selecione uma conversa</p>
                  <p className="text-sm">Escolha uma conversa à esquerda para começar</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
