import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Heart, MessageCircle, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { videoService } from '@/services/video.service';
import { connectionService } from '@/services/connection.service';
import type { Video } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [vids, conns] = await Promise.all([
          videoService.getUserVideos(user.id),
          connectionService.getConnections(user.id),
        ]);
        setVideos(vids);
        setConnections(conns);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalLikes = videos.reduce((sum, v) => sum + (v.likes_count || 0), 0);
  const totalComments = videos.reduce((sum, v) => sum + (v.comments_count || 0), 0);
  const bestVideo = videos.length > 0
    ? videos.reduce((best, v) => ((v.likes_count || 0) > (best.likes_count || 0) ? v : best), videos[0])
    : null;

  if (!user) return null;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-purple-600" />
          Dashboard
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Film className="h-4 w-4 text-purple-600" />
                    Vídeos Publicados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl font-bold">{videos.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Curtidas Recebidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl font-bold">{totalLikes}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-purple-600" />
                    Comentários Recebidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl font-bold">{totalComments}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    Conexões
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl font-bold">{connections.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Best Video */}
            {bestVideo && (
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    Vídeo com Melhor Desempenho
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <video
                        src={bestVideo.video_url}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium truncate cursor-pointer hover:text-purple-600"
                        onClick={() => navigate(`/video/${bestVideo.id}`)}
                      >
                        {bestVideo.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{bestVideo.category}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-pink-500" /> {bestVideo.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3 text-purple-500" /> {bestVideo.comments_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
