import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  Apple,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const menuItems = [
  { id: 'dashboard' as Page, label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'patients' as Page, label: 'العملاء', icon: Users },
  { id: 'diet-plans' as Page, label: 'الأنظمة الغذائية', icon: ClipboardList },
  { id: 'settings' as Page, label: 'الإعدادات', icon: Settings },
];

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitial = () => {
    const email = user?.email;
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow-md"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 z-40 ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <Apple className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">fuelx</h1>
              <p className="text-xs text-gray-500">إدارة التغذية</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-l from-primary-50 to-primary-100 text-primary-700 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-primary-600' : ''} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="mr-auto w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 right-0 left-0 p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{getUserInitial()}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">المسؤول</p>
                <p className="text-xs text-gray-500 truncate max-w-[120px]" dir="ltr">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl transition-all duration-200"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
