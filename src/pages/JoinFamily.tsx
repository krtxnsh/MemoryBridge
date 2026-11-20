import React, { useState } from 'react';
import { ArrowRight, KeyRound, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { invitationApi } from '../api/client';
import { useApp } from '../store/AppContext';

export const JoinFamily: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, refreshData, showToast } = useApp();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const join = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      setError('Sign in using the button above before joining a family workspace.');
      return;
    }
    setIsJoining(true);
    setError('');
    try {
      const result = await invitationApi.redeem(code);
      await refreshData();
      showToast(`You joined ${result.patient.fullName}'s family workspace.`, 'success');
      navigate('/family');
    } catch (joinError: any) {
      setError(joinError.message || 'The invitation could not be redeemed.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="flex-1 grid place-items-center bg-gradient-to-br from-[#FFFDF9] via-[#FFF8F1] to-[#F5ECE1] p-5">
      <div className="max-w-lg w-full bg-white rounded-[2rem] border border-warm-sand shadow-soft-lg p-7 sm:p-9">
        <div className="w-14 h-14 rounded-2xl bg-warm-peach text-primary grid place-items-center"><Users className="w-7 h-7" /></div>
        <div className="mt-5 text-xs font-bold uppercase tracking-wider text-primary-text flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Private family access</div>
        <h1 className="font-serif text-3xl font-bold text-ink-primary mt-2">Join a family workspace</h1>
        <p className="text-ink-secondary mt-2">Enter the one-time code shared with you by a caregiver. You must be signed in to redeem it.</p>

        <form onSubmit={join} className="mt-7 space-y-4">
          <label className="block text-sm font-bold text-ink-primary">
            Invitation code
            <div className="mt-2 relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="ABCDE-23456"
                autoComplete="one-time-code"
                className="w-full min-h-14 rounded-2xl border-2 border-warm-sand pl-12 pr-4 font-mono text-lg font-bold tracking-wider outline-none focus:border-primary"
              />
            </div>
          </label>
          {currentUser && <p className="text-xs text-ink-secondary">Signed in as <strong>{currentUser.name}</strong>.</p>}
          {error && <p className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={isJoining || code.replace(/[^A-Z0-9]/g, '').length < 8}
            className="w-full min-h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isJoining ? 'Joining securely…' : 'Join family workspace'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </main>
  );
};
