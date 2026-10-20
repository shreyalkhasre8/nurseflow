import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoRoleBanner } from '../components/common/DemoRoleBanner';
import { GlobalSearchModal } from '../components/search/GlobalSearchModal';
import { NotificationDrawer } from '../components/notifications/NotificationDrawer';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Package,
  CalendarDays,
  ArrowRightLeft,
  BarChart3,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Building2,
  Clock,
  Shield,
  Activity,
  User as UserIcon,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout, hasRole, isNurse, isSupervisor, isInventoryManager, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock for hospital shift awareness
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const data = await api.getNotifications();
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 25000);
    return () => clearInterval(interval);
  }, []);

  // Determine current active shift based on hospital hours (Morning: 07-15, Evening: 15-23, Night: 23-07)
  const currentHour = currentTime.getHours();
  let currentShiftName = 'Morning Shift';
  let shiftCode = 'MORN';
  if (currentHour >= 15 && currentHour < 23) {
    currentShiftName = 'Evening Shift';
    shiftCode = 'EVE';
  } else if (currentHour >= 23 || currentHour < 7) {
    currentShiftName = 'Night Shift';
    shiftCode = 'NIGHT';
  }

  // Navigation Items with RBAC visibility rules
  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: isNurse ? 'My Tasks' : 'Tasks Management',
      href: '/tasks',
      icon: CheckSquare,
      visible: true,
    },
    {
      label: 'Digital Registers',
      href: '/registers',
      icon: BookOpen,
      visible: isNurse || isSupervisor || isAdmin,
    },
    {
      label: 'Ward & Store Inventory',
      href: '/inventory',
      icon: Package,
      visible: true,
    },
    {
      label: 'Shift & Handover',
      href: '/handover',
      icon: ArrowRightLeft,
      visible: isNurse || isSupervisor || isAdmin,
    },
    {
      label: 'Shift Roster & Staff',
      href: '/shifts',
      icon: CalendarDays,
      visible: isSupervisor || isAdmin,
    },
    {
      label: 'Reports & Analytics',
      href: '/reports',
      icon: BarChart3,
      visible: isSupervisor || isInventoryManager || isAdmin,
    },
    {
      label: 'Staff Directory',
      href: '/staff',
      icon: Users,
      visible: isSupervisor || isAdmin,
    },
    {
      label: 'Administration',
      href: '/admin',
      icon: Settings,
      visible: isAdmin,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1-Click Clinical Role Switcher for seamless previewing & evaluation */}
      <DemoRoleBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Brand Logo & Name */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-clinical bg-teal-600 flex items-center justify-center text-white shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white block leading-none">
                  NurseFlow
                </span>
                <span className="text-[10px] text-teal-400 font-medium tracking-wider uppercase block mt-0.5">
                  Clinical Operations
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Ward & Shift Context Card in Sidebar */}
          <div className="p-4 mx-3 my-3 rounded-clinical bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 text-slate-400 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="font-medium truncate text-slate-300">
                {user?.wardName || user?.departmentName || 'Central Operations'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-300">{currentShiftName} ({shiftCode})</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-clinical text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-teal-600/20 text-teal-300 border-l-2 border-teal-400 pl-2.5 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>

          {/* User Profile Mini Footer */}
          <div className="p-3 border-t border-slate-800/90 bg-slate-950/30">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || 'RN'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-teal-400 truncate">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded transition-colors"
                title="Sign out of shift"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
            {/* Left Header Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-slate-500 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Current Ward Pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-clinical bg-slate-100/80 border border-slate-200 text-xs">
                <Building2 className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-slate-500 font-medium">Ward:</span>
                <span className="font-semibold text-slate-800">
                  {user?.wardName || 'General Facility'}
                </span>
              </div>

              {/* Current Shift & Live Clock */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-clinical bg-teal-50/70 border border-teal-200 text-xs text-teal-900">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                <span className="font-semibold">{currentShiftName}</span>
                <span className="text-teal-600 font-mono">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-2.5">
              {/* Global Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-clinical border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs transition-colors"
                title="Search tasks, medications, patients, staff"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono text-slate-400">
                  Ctrl K
                </kbd>
              </button>

              {/* Notifications Bell */}
              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-clinical transition-colors"
                title="View clinical notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Online Clinical System Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium">Online</span>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 rounded-clinical hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                    {user?.name?.slice(0, 1)}
                  </div>
                  <span className="hidden md:block text-xs font-semibold text-slate-800 text-left leading-tight">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-clinical-lg bg-white shadow-xl border border-slate-200 py-1.5 z-50 text-xs"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                      <p className="font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-[11px] text-slate-500">{user?.employeeId} • {user?.role}</p>
                      <p className="text-[11px] text-teal-700 font-medium mt-0.5">{user?.email}</p>
                    </div>

                    <Link
                      to="/tasks"
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                      My Assigned Shift Tasks
                    </Link>

                    <Link
                      to="/handover"
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                      Shift Handover Reports
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 text-left transition-colors border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      End Shift & Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main View Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* In-app Notification Slide-Over */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUpdated={loadUnreadCount}
      />
    </div>
  );
};
