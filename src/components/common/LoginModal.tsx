import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { ShieldCheck, User, Mail, Lock, X, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, register, showToast } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CAREGIVER' | 'FAMILY_MEMBER'>('CAREGIVER');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await register(email, password, name, role);
        showToast(`Welcome to MemoryBridge, ${name}!`, 'success');
      } else {
        await login(email, password);
        showToast('Signed in successfully!', 'success');
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string, label: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      showToast(`Signed in as ${label}`, 'success');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#FFFDF9] rounded-3xl border border-surface-border shadow-soft-xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-warm-cream to-[#FFF5EC] border-b border-surface-border relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-ink-muted hover:text-ink-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 text-primary mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isRegister ? 'Create Family Account' : 'Caregiver Authentication'}
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-ink-primary">
            {isRegister ? 'Join MemoryBridge' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            {isRegister
              ? 'Set up your account to help preserve and cherish family memories.'
              : 'Sign in to manage memories, routine reminders, and family storybooks.'}
          </p>
        </div>

        {/* Quick Demo Logins Banner */}
        <div className="px-6 pt-4 pb-2 bg-warm-peach/40 border-b border-primary-100 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-primary-text flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Quick Demo Logins (1-Click):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('anita@example.com', 'Password123!', 'Anita (Caregiver)')}
              className="py-1.5 px-3 rounded-xl bg-white border border-primary-200 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all shadow-xs text-left"
            >
              Anita (Caregiver)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('riya@example.com', 'Password123!', 'Riya (Family Member)')}
              className="py-1.5 px-3 rounded-xl bg-white border border-primary-200 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all shadow-xs text-left"
            >
              Riya (Family)
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-ink-primary mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Anita Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-warm-cream border border-surface-border text-sm text-ink-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-ink-primary mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-warm-cream border border-surface-border text-sm text-ink-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-primary mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-warm-cream border border-surface-border text-sm text-ink-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-ink-primary mb-1">Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('CAREGIVER')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    role === 'CAREGIVER'
                      ? 'bg-primary text-white border-primary shadow-soft'
                      : 'bg-warm-cream border-surface-border text-ink-secondary'
                  }`}
                >
                  Caregiver
                </button>
                <button
                  type="button"
                  onClick={() => setRole('FAMILY_MEMBER')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    role === 'FAMILY_MEMBER'
                      ? 'bg-primary text-white border-primary shadow-soft'
                      : 'bg-warm-cream border-surface-border text-ink-secondary'
                  }`}
                >
                  Family Member
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-soft flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="text-xs text-ink-secondary hover:text-primary font-semibold underline"
            >
              {isRegister
                ? 'Already have an account? Sign in here'
                : "Don't have an account? Register as family"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
