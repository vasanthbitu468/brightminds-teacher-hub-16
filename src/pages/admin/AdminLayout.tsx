import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Users, Megaphone, Settings, LogOut, Home, ChevronLeft, UserPlus, User, LayoutDashboard, BookOpen, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation: { name: string; href: string; icon: typeof Users; disabled?: boolean }[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Teachers', href: '/admin/teachers', icon: Users },
    { name: 'Teacher Availability', href: '/admin/availability', icon: Users },
    { name: 'Students', href: '/admin/students', icon: User },
    { name: 'Class Configuration', href: '/admin/classes', icon: BookOpen },
    { name: 'Class Schedule', href: '/admin/schedule', icon: Calendar },
    { name: 'Onboard Teacher', href: '/admin/onboard', icon: UserPlus },
    { name: 'Announcements', href: '/admin/newsletters', icon: Megaphone },
    { name: 'School Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right whitespace-nowrap">
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="rounded-full h-8 w-8 p-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.disabled ? '#' : item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
