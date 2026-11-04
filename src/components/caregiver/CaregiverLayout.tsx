import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  Users, 
  History, 
  Share2, 
  MessageCircleHeart, 
  CalendarCheck, 
  ShieldCheck, 
  Settings,
  ExternalLink,
  HeartHandshake
} from 'lucide-react';

export const CaregiverLayout: React.FC = () => {
  const navigate = useNavigate();
  const { memories, patientName } = useApp();

  const pendingCount = memories.filter(m => m.status === 'pending' || m.status === 'ai-suggested').length;

  const navItems = [
    { to: '/family', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/family/library', label: 'Memory Library', icon: BookOpen },
    { to: '/family/create-storybook', label: 'Create Storybook', icon: PlusCircle, highlight: true },
    { to: '/family/people', label: 'People & Family', icon: Users },
    { to: '/family/timeline', label: 'Life Timeline', icon: History },
    { to: '/family/connections', label: 'Memory Connections', icon: Share2 },
    { to: '/family/companion', label: 'AI Companion', icon: MessageCircleHeart },
    { to: '/family/routine', label: 'Daily Routine', icon: CalendarCheck },
    { to: '/family/verification', label: 'Verification', icon: ShieldCheck, badge: pendingCount },
    { to: '/family/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#F8F4EE] flex flex-col md:flex-row">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#FFFDF9] border-r border-surface-border p-4 justify-between shrink-0 select-none shadow-sm">
        <div>
          {/* Patient Quick Profile Header */}
          <div className="p-3.5 rounded-2xl bg-warm-cream border border-warm-sand mb-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm shadow-sm">
              RK
            </div>
            <div>
              <h3 className="font-serif font-bold text-ink-primary text-sm leading-tight">
                {patientName}'s Care Hub
              </h3>
              <span className="text-[11px] text-ink-secondary">Family Admin & Storybank</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-soft font-semibold'
                        : item.highlight
                          ? 'bg-warm-peach text-primary-text hover:bg-primary-100 font-semibold'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-warm-cream'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D97706] text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Switcher Card to Patient View */}
        <div className="pt-4 border-t border-surface-border">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FFF5EC] to-[#FED7C3] border border-primary-200">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-text mb-1">
              <HeartHandshake className="w-4 h-4 text-primary" />
              <span>Patient Experience</span>
            </div>
            <p className="text-[11px] text-ink-secondary mb-2.5">
              Review how memories appear to {patientName} on the tablet.
            </p>
            <button
              onClick={() => navigate('/patient')}
              className="w-full py-2 px-3 rounded-xl bg-white text-ink-primary hover:text-primary font-semibold text-xs border border-warm-sand shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch Patient App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-surface-border p-2 flex items-center justify-around shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center p-1 rounded-xl text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary font-bold' : 'text-ink-secondary'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* CAREGIVER MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto pb-24 md:pb-10">
        <Outlet />
      </main>
    </div>
  );
};
