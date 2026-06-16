import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Film, Heart, MessageCircle, Calendar, Edit3, Trash2, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile.service';
import { videoService } from '@/services/video.service';
import { connectionService } from '@/services/connection.service';
import type { Profile as ProfileType, Video } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import toast from 'react-hot-toast';

export function Profile() {
  const { username } = useParams();
  const { user, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  // const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const p = await profileService.getProfileByUsername(username);
        if (!p) {
          toast.error('Perfil não encontrado');
          navigate('/');
          return;
        }
        setProfile(p);
        const vids = await videoService.getUserVideos(p.id);
        setVideos(vids);

        if (user && user.id !== p.id) {
          const connected = await connectionService.areConnected(user.id, p.id);
          setIsConnected(connected);
        }
      } catch {
        toast.error('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username, user]);

  const handleConnect = async () => {
    if (!user || !profile) return;
    setConnectionLoading(true);
    try {
      await connectionService.sendRequest(user.id, profile.id);
      toast.success('Solicitação enviada!');
    } catch {
      toast.error('Erro ao enviar solicitação');
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja excluir este vídeo?')) return;
    try {
      await videoService.deleteVideo(videoId, user.id);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      toast.success('Vídeo excluído');
    } catch {
      toast.error('Erro ao excluir vídeo');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-purple-100 dark:ring-purple-900">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              <p className="text-gray-500">@{profile.username}</p>
              {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
              {profile.favorite_humor_style && (
                <Badge variant="secondary" className="mt-2">
                  {profile.favorite_humor_style}
                </Badge>
              )}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Film className="h-4 w-4" /> {profile.total_posts} posts
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" /> {profile.total_likes_received} curtidas
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Desde {formatDate(profile.created_at)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                    <Edit3 className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : user ? (
                isConnected ? (
                  <Button variant="outline" size="sm" disabled>
                    <UserCheck className="h-4 w-4 mr-1" /> Conectado
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleConnect} disabled={connectionLoading}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    {connectionLoading ? 'Enviando...' : 'Conectar'}
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Videos */}
      <Tabs defaultValue="videos">
        <TabsList className="mb-4">
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
          <TabsTrigger value="liked">Curtidos</TabsTrigger>
        </TabsList>
        <TabsContent value="videos">
          {videos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Film className="h-12 w-12 mx-auto mb-2" />
                <p>Nenhum vídeo publicado ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden group">
                  <div className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-800">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      poster={video.thumbnail_url || undefined}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute top-2 left-2">
                      <Badge variant={video.status === 'published' ? 'default' : 'secondary'}>
                        {video.status === 'published' ? 'Publicado' : video.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {video.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {video.comments_count || 0}
                        </span>
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{video.title}</p>
                    <p className="text-xs text-gray-500">{video.category}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="liked">
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-2" />
              <p>Vídeos curtidos aparecerão aqui</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {profile && (
        <EditProfileDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          profile={profile}
          onUpdate={refreshProfile}
        />
      )}
    </div>
  );
}
