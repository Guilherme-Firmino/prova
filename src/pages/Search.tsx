import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Users, Film, User } from 'lucide-react';
import { profileService } from '@/services/profile.service';
import { videoService } from '@/services/video.service';
import type { Profile, Video } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [users, setUsers] = useState<Profile[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'videos' | 'users'>('videos');

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      if (searchMode === 'users') {
        const result = await profileService.searchProfiles(q);
        setUsers(result);
        setVideos([]);
      } else {
        const result = await videoService.getVideos({ search: q });
        setVideos(result);
        setUsers([]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Pesquisar memes, usuários..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <SearchIcon className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>

        <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="videos">
              <Film className="h-4 w-4 mr-2" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <Card
                    key={video.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/video/${video.id}`)}
                  >
                    <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 relative">
                      <video src={video.video_url} className="w-full h-full object-cover" />
                      <Badge variant="secondary" className="absolute top-2 left-2">
                        {video.category}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm truncate">{video.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={video.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {video.profiles?.display_name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">{video.profiles?.display_name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : query ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Film className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhum vídeo encontrado para "{query}"</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <SearchIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Pesquise por memes ou usuários</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 cursor-pointer transition-colors"
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
                ))}
              </div>
            ) : query ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhum usuário encontrado para "{query}"</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <SearchIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Pesquise por usuários</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
