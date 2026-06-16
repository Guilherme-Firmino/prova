import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ArrowLeft, Send, Trash2, Edit3, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { videoService } from '@/services/video.service';
import { likeService } from '@/services/like.service';
import { commentService } from '@/services/comment.service';
import type { Video, Comment } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

export function VideoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const v = await videoService.getVideo(id);
        if (!v) {
          toast.error('Vídeo não encontrado');
          navigate('/');
          return;
        }
        setVideo(v);
        const cmts = await commentService.getComments(id);
        setComments(cmts);
        if (user) {
          const liked = await likeService.hasLiked(user.id, id);
          setHasLiked(liked);
        }
      } catch {
        toast.error('Erro ao carregar vídeo');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Faça login para curtir');
      return;
    }
    try {
      const liked = await likeService.toggleLike(user.id, video!.id);
      setHasLiked(liked);
      setVideo((prev) =>
        prev ? { ...prev, likes_count: (prev.likes_count || 0) + (liked ? 1 : -1) } : prev
      );
    } catch {
      toast.error('Erro ao curtir');
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;
    setSendingComment(true);
    try {
      const comment = await commentService.addComment(user.id, video!.id, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText('');
      setVideo((prev) =>
        prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : prev
      );
    } catch {
      toast.error('Erro ao comentar');
    } finally {
      setSendingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!user || !editText.trim()) return;
    try {
      await commentService.updateComment(commentId, user.id, editText.trim());
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: editText.trim() } : c))
      );
      setEditingComment(null);
      toast.success('Comentário atualizado');
    } catch {
      toast.error('Erro ao editar comentário');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    if (!window.confirm('Excluir comentário?')) return;
    try {
      await commentService.deleteComment(commentId, user.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comentário excluído');
    } catch {
      toast.error('Erro ao excluir comentário');
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) return;
    try {
      await commentService.toggleCommentLike(user.id, commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, user_has_liked: !c.user_has_liked, likes_count: (c.likes_count || 0) + (c.user_has_liked ? -1 : 1) }
            : c
        )
      );
    } catch {}
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

  if (loading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="aspect-[9/16] rounded-xl mb-4" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="max-w-2xl mx-auto">
        {/* Video */}
        <div className="rounded-xl overflow-hidden bg-black mb-4">
          <video src={video.video_url} poster={video.thumbnail_url || undefined} controls className="w-full aspect-[9/16] max-h-[70vh] object-contain" />
        </div>

        {/* Video Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">{video.category}</Badge>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <button onClick={handleLike} className="flex items-center gap-1">
                <Heart className={`h-4 w-4 ${hasLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                {video.likes_count || 0}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {video.comments_count || 0}
              </span>
            </div>
          </div>
          <h1 className="text-xl font-bold mb-1">{video.title}</h1>
          {video.description && <p className="text-gray-500 text-sm mb-2">{video.description}</p>}
          <div className="flex items-center gap-2">
            <Avatar
              className="h-6 w-6 cursor-pointer"
              onClick={() => navigate(`/profile/${video.profiles?.username}`)}
            >
              <AvatarImage src={video.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {video.profiles?.display_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              className="text-sm font-medium hover:underline"
              onClick={() => navigate(`/profile/${video.profiles?.username}`)}
            >
              {video.profiles?.display_name}
            </button>
            <span className="text-xs text-gray-500">{formatDate(video.created_at)}</span>
          </div>
        </div>

        {/* Comments */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Comentários ({comments.length})</h3>

            {/* Comment Input */}
            {user && (
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Adicione um comentário..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button size="icon" onClick={handleComment} disabled={sendingComment || !commentText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => navigate(`/profile/${comment.profiles?.username}`)}
                  >
                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm font-medium hover:underline"
                        onClick={() => navigate(`/profile/${comment.profiles?.username}`)}
                      >
                        {comment.profiles?.display_name}
                      </button>
                      <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                    </div>

                    {editingComment === comment.id ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-sm"
                        />
                        <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm mt-0.5">{comment.content}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1">
                      <button
                        className="flex items-center gap-1 text-xs text-gray-500"
                        onClick={() => handleCommentLike(comment.id)}
                      >
                        <ThumbsUp className={`h-3 w-3 ${comment.user_has_liked ? 'fill-purple-500 text-purple-500' : ''}`} />
                        {comment.likes_count || 0}
                      </button>
                      {user && comment.user_id === user.id && (
                        <>
                          <button
                            className="text-xs text-gray-500 hover:text-purple-600"
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditText(comment.content);
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            className="text-xs text-gray-500 hover:text-red-600"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
