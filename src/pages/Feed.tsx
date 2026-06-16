import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Play, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { videoService } from '@/services/video.service';
import { likeService } from '@/services/like.service';
import type { Video } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

function VideoCard({ video, onLike }: { video: Video; onLike: (id: string) => void }) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible && loaded) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible, loaded]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Faça login para curtir');
      return;
    }
    try {
      await likeService.toggleLike(user.id, video.id);
      onLike(video.id);
    } catch {
      toast.error('Erro ao curtir');
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

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-sm mx-auto bg-black rounded-xl overflow-hidden mb-4 snap-start"
    >
      {/* Video */}
      {!loaded && (
        <div className="aspect-[9/16] bg-gray-800 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url || undefined}
        className={`w-full aspect-[9/16] object-cover ${loaded ? 'block' : 'hidden'}`}
        loop
        muted={isMuted}
        playsInline
        onLoadedData={() => setLoaded(true)}
        onClick={() => setIsMuted(!isMuted)}
      />

      {/* Mute button */}
      {loaded && (
        <button
          className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-6">
        {/* Creator info */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar
            className="h-8 w-8 cursor-pointer ring-2 ring-purple-500"
            onClick={() => navigate(`/profile/${video.profiles?.username}`)}
          >
            <AvatarImage src={video.profiles?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {video.profiles?.display_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <button
              className="text-white font-medium text-sm hover:underline"
              onClick={() => navigate(`/profile/${video.profiles?.username}`)}
            >
              {video.profiles?.display_name}
            </button>
            <p className="text-gray-300 text-xs">{formatDate(video.created_at)}</p>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white font-medium text-sm mb-1">{video.title}</h3>
        {video.description && (
          <p className="text-gray-300 text-xs mb-2 line-clamp-2">{video.description}</p>
        )}

        {/* Category badge */}
        <Badge variant="secondary" className="text-xs">
          {video.category}
        </Badge>
      </div>

      {/* Action buttons on the right */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className="p-2 bg-black/50 rounded-full">
            <Heart
              className={`h-5 w-5 ${video.user_has_liked ? 'fill-pink-500 text-pink-500' : 'text-white'}`}
            />
          </div>
          <span className="text-white text-xs">{video.likes_count || 0}</span>
        </button>
        <button
          onClick={() => navigate(`/video/${video.id}`)}
          className="flex flex-col items-center gap-1"
        >
          <div className="p-2 bg-black/50 rounded-full">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <span className="text-white text-xs">{video.comments_count || 0}</span>
        </button>
      </div>
    </div>
  );
}

export function Feed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchVideos = async (page: number) => {
    const limit = 5;
    const data = await videoService.getVideos({
      limit,
      offset: page * limit,
    });
    return data;
  };

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        const data = await fetchVideos(0);
        setVideos(data);
        setHasMore(data.length === 5);
      } catch {
        toast.error('Erro ao carregar vídeos');
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          pageRef.current += 1;
          try {
            const data = await fetchVideos(pageRef.current);
            setVideos((prev) => [...prev, ...data]);
            setHasMore(data.length === 5);
          } catch {
            toast.error('Erro ao carregar mais vídeos');
          } finally {
            setLoadingMore(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  const handleLike = (videoId: string) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const hasLiked = v.user_has_liked;
          return {
            ...v,
            user_has_liked: !hasLiked,
            likes_count: (v.likes_count || 0) + (hasLiked ? -1 : 1),
          };
        }
        return v;
      })
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 pt-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-full max-w-sm">
            <Skeleton className="aspect-[9/16] rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-4 pb-20 lg:pb-4 snap-y snap-mandatory overflow-y-auto h-[calc(100vh-3.5rem)] lg:h-screen">
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Play className="h-16 w-16 mb-4 text-purple-300" />
          <h2 className="text-xl font-semibold mb-2">Nenhum meme por aqui ainda</h2>
          <p className="text-sm">Seja o primeiro a publicar!</p>
        </div>
      ) : (
        videos.map((video) => (
          <VideoCard key={video.id} video={video} onLike={handleLike} />
        ))
      )}
      <div ref={observerRef} className="h-20 flex items-center justify-center">
        {loadingMore && <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />}
      </div>
    </div>
  );
}
