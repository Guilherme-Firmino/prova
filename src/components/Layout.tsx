import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Upload,
  Bell,
  MessageCircle,
  Search,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Users,
  Film,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {}
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/upload', icon: Upload, label: 'Publicar' },
    { path: '/search', icon: Search, label: 'Buscar' },
    { path: '/notifications', icon: Bell, label: 'Notificações' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-gray-900 dark:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-lg border-b border-purple-100 dark:border-purple-900">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <Film className="h-6 w-6 text-purple-600" />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              MemeFlow
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="fixed right-0 top-14 bottom-0 w-64 bg-white dark:bg-gray-900 p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-600'
                      : 'hover:bg-purple-50 dark:hover:bg-purple-950'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <Link
                to={`/profile/${profile?.username}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(`/profile/${profile?.username}`)
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600'
                    : 'hover:bg-purple-50 dark:hover:bg-purple-950'
                }`}
              >
                <User className="h-5 w-5" />
                Perfil
              </Link>
              <Link
                to="/connections"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/connections')
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600'
                    : 'hover:bg-purple-50 dark:hover:bg-purple-950'
                }`}
              >
                <Users className="h-5 w-5" />
                Conexões
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-purple-100 dark:border-purple-900 bg-white dark:bg-gray-900 p-4">
        <Link to="/" className="flex items-center gap-2 px-3 py-4 mb-6">
          <Film className="h-7 w-7 text-purple-600" />
          <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            MemeFlow
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-600'
                  : 'hover:bg-purple-50 dark:hover:bg-purple-950'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <Link
            to={`/profile/${profile?.username}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(`/profile/${profile?.username}`)
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600'
                : 'hover:bg-purple-50 dark:hover:bg-purple-950'
            }`}
          >
            <User className="h-5 w-5" />
            Perfil
          </Link>
          <Link
            to="/connections"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/connections')
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600'
                : 'hover:bg-purple-50 dark:hover:bg-purple-950'
            }`}
          >
            <Users className="h-5 w-5" />
            Conexões
          </Link>
        </nav>

        <div className="border-t border-purple-100 dark:border-purple-900 pt-4 space-y-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full justify-start">
            {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{profile?.display_name || 'Usuário'}</p>
                  <p className="text-xs text-gray-500 truncate">@{profile?.username}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/profile/${profile?.username}`)}>
                <User className="h-4 w-4 mr-2" />
                Ver Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-lg border-t border-purple-100 dark:border-purple-900">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-colors ${
                isActive(item.path) ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
