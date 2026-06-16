import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, UserCheck, UserX, Search, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { connectionService } from '@/services/connection.service';
import { profileService } from '@/services/profile.service';
import type { Connection, Profile } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

export function Connections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [conns, reqs] = await Promise.all([
          connectionService.getConnections(user.id),
          connectionService.getPendingRequests(user.id),
        ]);
        setConnections(conns);
        setRequests(reqs);
      } catch {
        toast.error('Erro ao carregar conexões');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await profileService.searchProfiles(searchQuery);
      setSearchResults(results.filter((p) => p.id !== user?.id));
    } catch {
      toast.error('Erro ao pesquisar');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!user) return;
    try {
      await connectionService.sendRequest(user.id, receiverId);
      toast.success('Solicitação enviada!');
    } catch {
      toast.error('Erro ao enviar solicitação');
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await connectionService.acceptRequest(connectionId);
      setRequests((prev) => prev.filter((r) => r.id !== connectionId));
      toast.success('Conexão aceita!');
      // Reload connections
      const conns = await connectionService.getConnections(user!.id);
      setConnections(conns);
    } catch {
      toast.error('Erro ao aceitar');
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await connectionService.rejectRequest(connectionId);
      setRequests((prev) => prev.filter((r) => r.id !== connectionId));
      toast.success('Solicitação recusada');
    } catch {
      toast.error('Erro ao recusar');
    }
  };

  const handleRemove = async (connectionId: string) => {
    if (!window.confirm('Remover conexão?')) return;
    try {
      await connectionService.removeConnection(connectionId);
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      toast.success('Conexão removida');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-purple-600" />
          Conexões
        </h1>

        <Tabs defaultValue="connections">
          <TabsList className="mb-4">
            <TabsTrigger value="connections">
              <UserCheck className="h-4 w-4 mr-2" />
              Conexões ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UserPlus className="h-4 w-4 mr-2" />
              Solicitações ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections">
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : connections.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhuma conexão ainda</p>
                  <p className="text-sm">Busque por usuários para se conectar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {connections.map((conn) => {
                  const other = conn.requester_id === user.id
                    ? (conn as any).profiles?.[0]
                    : (conn as any).profiles?.[1];
                  return (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => navigate(`/profile/${other?.username}`)}
                      >
                        <Avatar>
                          <AvatarImage src={other?.avatar_url || undefined} />
                          <AvatarFallback>{other?.display_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{other?.display_name}</p>
                          <p className="text-xs text-gray-500">@{other?.username}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(conn.id)}>
                        <UserX className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <UserPlus className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhuma solicitação pendente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => navigate(`/profile/${(req as any).profiles?.username}`)}
                    >
                      <Avatar>
                        <AvatarImage src={(req as any).profiles?.avatar_url || undefined} />
                        <AvatarFallback>{(req as any).profiles?.display_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{(req as any).profiles?.display_name}</p>
                        <p className="text-xs text-gray-500">@{(req as any).profiles?.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => handleAccept(req.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Buscar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => navigate(`/profile/${p.username}`)}
                    >
                      <Avatar>
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback>{p.display_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{p.display_name}</p>
                        <p className="text-xs text-gray-500">@{p.username}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleSendRequest(p.id)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Conectar
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchQuery && !searching ? (
              <Card>
                <CardContent className="p-4 text-center text-gray-500">
                  <p>Nenhum usuário encontrado</p>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
