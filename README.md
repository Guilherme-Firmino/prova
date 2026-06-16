# 🎬 MemeFlow

**MemeFlow** é uma rede social moderna focada em vídeos curtos de memes, reações e conteúdos de humor. A plataforma oferece uma experiência semelhante às principais plataformas de vídeos curtos, totalmente voltada para entretenimento e compartilhamento de memes.

## Funcionalidades

### Autenticação
- Cadastro de usuários por e-mail
- Login e Logout
- Recuperação de senha ("Esqueci minha senha")
- Redefinição de senha por e-mail
- Persistência de sessão
- Proteção de rotas privadas

### Perfis de Usuário
- Nome de exibição, username único, avatar, bio
- Estilo de humor favorito
- Estatísticas (total de posts, curtidas recebidas)
- Editar perfil e alterar avatar
- Visualizar vídeos publicados

### Feed de Vídeos
- Feed infinito com rolagem vertical
- Reprodução automática com Intersection Observer
- Controles de som (mute/unmute)
- Informações do criador, curtidas e comentários
- Navegação estilo TikTok

### CRUD de Vídeos
- Publicar vídeos via upload ou URL externa
- Categorias de humor (Memes, Reações, Pegadinhas, etc.)
- Status: Publicado, Rascunho, Arquivado
- Editar e excluir próprios vídeos

### Interações
- Curtir/descurtir vídeos
- Comentários com edição, exclusão e curtidas
- Sistema de conexões (solicitar, aceitar, recusar, remover)
- Chat privado em tempo real com Supabase Realtime
- Central de notificações

### Pesquisa
- Busca global por vídeos e usuários
- Filtro por categorias

### Dashboard
- Estatísticas do usuário
- Vídeo com melhor desempenho

### Tema
- Modo claro e escuro
- Alternância salva no localStorage
- Design responsivo (desktop, tablet, smartphone)

## Tecnologias Utilizadas

| Tecnologia | Versão |
|------------|--------|
| Vite | ^7.3.2 |
| React | ^19.2.6 |
| TypeScript | ^5.9.3 |
| Tailwind CSS | ^4.1.17 |
| Supabase | (Auth, Database, Storage, Realtime) |
| shadcn/ui | (Radix UI components) |
| React Router DOM | ^7.x |
| TanStack Query | ^5.x |
| React Hook Form | ^7.x |
| Zod | ^3.x |
| Lucide React | (Ícones) |
| date-fns | (Datas) |
| React Hot Toast | (Notificações) |

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com)
- Conta no [GitHub](https://github.com)
- Conta na [Vercel](https://vercel.com)

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/memeflow.git
cd memeflow
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor** e execute o script SQL abaixo para criar as tabelas:

```sql
-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  favorite_humor_style TEXT,
  total_posts INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment Likes
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- Connections
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Participants
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'connection_request', 'connection_accepted', 'new_message')),
  reference_id TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Functions
CREATE OR REPLACE FUNCTION increment_user_posts(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET total_posts = total_posts + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_user_likes_received(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET total_likes_received = total_likes_received + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_user_likes_received(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET total_likes_received = GREATEST(total_likes_received - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_conversation_between_users(user1_id UUID, user2_id UUID)
RETURNS TABLE(conversation_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT cp1.conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = user1_id AND cp2.user_id = user2_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: everyone can read, only owner can update
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Videos: published are viewable by all, owner can CRUD
CREATE POLICY "Published videos are viewable by all" ON videos FOR SELECT USING (status = 'published' OR auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON videos FOR DELETE USING (auth.uid() = user_id);

-- Likes
CREATE POLICY "Likes are viewable by all" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own like" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Comments are viewable by all" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Comment Likes
CREATE POLICY "Comment likes viewable by all" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own comment like" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Connections
CREATE POLICY "Connections viewable by participants" ON connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send requests" ON connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update relevant connections" ON connections FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can delete own connections" ON connections FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Conversations & Participants
CREATE POLICY "Conversations viewable by participants" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "Conversation participants viewable by participants" ON conversation_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can add participants" ON conversation_participants FOR INSERT WITH CHECK (true);

-- Messages
CREATE POLICY "Messages viewable by conversation participants" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Notifications
CREATE POLICY "Notifications viewable by owner" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications can be inserted" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Storage buckets
-- Create buckets: avatars (public), videos (public), thumbnails (public)
```

3. No Supabase, vá em **Storage** e crie os buckets:
   - `avatars` (público)
   - `videos` (público)
   - `thumbnails` (público)

4. Configure as políticas de Storage:
```sql
-- Bucket: avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Bucket: videos
CREATE POLICY "Videos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Users can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own videos" ON storage.objects FOR UPDATE USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Bucket: thumbnails
CREATE POLICY "Thumbnails are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Users can upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
```

### 4. Configure o arquivo .env

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_APP_NAME=MemeFlow
VITE_APP_URL=http://localhost:5173
VITE_NODE_ENV=development
```

### 5. Execute localmente

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
```

O build será gerado na pasta `dist/`.

## Deploy na Vercel

1. Faça o push do código para o GitHub
2. Acesse [Vercel](https://vercel.com) e importe o repositório
3. Configure as variáveis de ambiente no Vercel (mesmas do `.env`)
4. O framework será detectado automaticamente como Vite
5. Clique em **Deploy**

## Políticas RLS (Row Level Security)

O MemeFlow utiliza RLS do Supabase para garantir a segurança dos dados:

### Tabela `profiles`
- **SELECT**: Todos podem ver perfis
- **INSERT**: Apenas o próprio usuário pode criar seu perfil
- **UPDATE**: Apenas o próprio usuário pode editar seu perfil
- **DELETE**: Apenas o próprio usuário (via cascade do auth.users)

### Tabela `videos`
- **SELECT**: Vídeos publicados são visíveis para todos; o autor pode ver seus rascunhos
- **INSERT**: Apenas usuários autenticados podem criar vídeos
- **UPDATE**: Apenas o autor pode editar
- **DELETE**: Apenas o autor pode excluir

### Tabela `likes`
- **SELECT**: Visível para todos
- **INSERT**: Apenas o próprio usuário (garante uma curtida por vídeo via UNIQUE)
- **DELETE**: Apenas o próprio usuário pode remover sua curtida

### Tabela `comments`
- **SELECT**: Visível para todos
- **INSERT**: Apenas o próprio usuário
- **UPDATE**: Apenas o autor do comentário
- **DELETE**: Apenas o autor do comentário

### Tabela `connections`
- **SELECT**: Visível apenas para os participantes da conexão
- **INSERT**: Apenas o solicitante
- **UPDATE**: Ambos os participantes podem atualizar (aceitar/recusar)
- **DELETE**: Ambos os participantes podem remover

### Tabela `messages`
- **SELECT**: Apenas participantes da conversa
- **INSERT**: Apenas participantes autenticados da conversa

### Tabela `notifications`
- **SELECT**: Apenas o dono da notificação
- **INSERT**: Qualquer usuário autenticado pode criar (para notificar outros)
- **UPDATE**: Apenas o dono pode marcar como lida

## Estrutura do Projeto

```
memeflow/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   └── ui/          # Componentes shadcn/ui (button, input, card, etc.)
│   ├── contexts/         # Contextos (AuthContext, ThemeContext)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilitários (supabase client, validações)
│   ├── pages/            # Páginas da aplicação
│   ├── routes/           # Configuração de rotas
│   ├── services/         # Serviços de API (auth, profile, video, etc.)
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Funções utilitárias
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globais
├── .env.example          # Exemplo de variáveis de ambiente
├── .gitignore            # Arquivos ignorados pelo Git
├── index.html            # HTML principal
├── package.json          # Dependências e scripts
├── vite.config.ts        # Configuração do Vite
└── tsconfig.json         # Configuração do TypeScript
```

## Licença

MIT
#   p r o v a  
 