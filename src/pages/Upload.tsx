import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload as UploadIcon, Film, X, Link as LinkIcon } from 'lucide-react';
import { videoSchema, type VideoFormData } from '@/lib/validations';
import { useAuth } from '@/contexts/AuthContext';
import { videoService } from '@/services/video.service';
import { HUMOR_CATEGORIES } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

export function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('url');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      description: '',
      video_url: '',
      status: 'published' as const,
      category: 'Memes',
    },
  });

  const category = watch('category');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Vídeo deve ter no máximo 100MB');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: VideoFormData) => {
    if (!user) {
      toast.error('Faça login para publicar');
      return;
    }

    if (uploadMode === 'file' && !videoFile) {
      toast.error('Selecione um vídeo');
      return;
    }

    if (uploadMode === 'url' && !data.video_url) {
      toast.error('Informe a URL do vídeo');
      return;
    }

    setLoading(true);
    try {
      let videoUrl = data.video_url || '';

      if (uploadMode === 'file' && videoFile) {
        videoUrl = await videoService.uploadVideo(user.id, videoFile);
      }

      await videoService.createVideo({
        user_id: user.id,
        title: data.title,
        description: data.description || '',
        category: data.category as any,
        video_url: videoUrl,
        thumbnail_url: null,
        status: data.status as any,
      });

      toast.success('Meme publicado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao publicar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5 text-purple-600" />
            Publicar Novo Meme
          </CardTitle>
          <CardDescription>Compartilhe seu meme com a comunidade</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Upload Mode Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={uploadMode === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('url')}
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                URL
              </Button>
              <Button
                type="button"
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('file')}
              >
                <UploadIcon className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>

            {/* Video Upload */}
            {uploadMode === 'file' ? (
              <div>
                {videoPreview ? (
                  <div className="relative">
                    <video
                      src={videoPreview}
                      className="w-full rounded-lg max-h-64 object-cover"
                      controls
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                      onClick={clearVideo}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Film className="h-12 w-12 mx-auto mb-2 text-purple-400" />
                    <p className="text-sm text-gray-500">Clique para selecionar um vídeo</p>
                    <p className="text-xs text-gray-400 mt-1">MP4, WebM, até 100MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="video_url">URL do Vídeo</Label>
                <Input
                  id="video_url"
                  placeholder="https://exemplo.com/video.mp4"
                  {...register('video_url')}
                />
                {errors.video_url && typeof errors.video_url.message === 'string' && (
                  <p className="text-sm text-red-500">{errors.video_url.message}</p>
                )}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" placeholder="Título do meme" {...register('title')} />
              {errors.title && typeof errors.title.message === 'string' && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva seu meme..."
                {...register('description')}
              />
              {errors.description && typeof errors.description.message === 'string' && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={category}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {HUMOR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && typeof errors.category.message === 'string' && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Publicando...' : 'Publicar Meme'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
