import React, { useCallback, useEffect, useState } from 'react';
import { Check, Clock3, Copy, KeyRound, RefreshCw, ShieldCheck, UserPlus, X } from 'lucide-react';
import { invitationApi, PatientInvitation } from '../../api/client';
import { useApp } from '../../store/AppContext';

export const CaregiverFamilyAccess: React.FC = () => {
  const { activePatientId, patientName, showToast } = useApp();
  const [invitations, setInvitations] = useState<PatientInvitation[]>([]);
  const [relationship, setRelationship] = useState('Family member');
  const [accessRole, setAccessRole] = useState<'FAMILY' | 'VIEWER'>('FAMILY');
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadInvitations = useCallback(async () => {
    if (!activePatientId) return;
    try {
      setInvitations(await invitationApi.list(activePatientId));
    } catch (loadError: any) {
      setError(loadError.message || 'Could not load invitations.');
    }
  }, [activePatientId]);

  useEffect(() => {
    // Loading remote invitation state is the synchronization purpose of this effect.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadInvitations();
  }, [loadInvitations]);

  const createInvitation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activePatientId) return;
    setError('');
    setIsLoading(true);
    try {
      const created = await invitationApi.create(activePatientId, {
        accessRole,
        relationship,
        expiresInHours
      });
      setNewCode(created.code);
      showToast('Family invitation created. Share the code privately.', 'success');
      await loadInvitations();
    } catch (createError: any) {
      setError(createError.message || 'Could not create invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (!newCode) return;
    await navigator.clipboard.writeText(newCode);
    showToast('Invitation code copied.', 'info');
  };

  const revokeInvitation = async (invitationId: string) => {
    if (!activePatientId) return;
    try {
      await invitationApi.revoke(activePatientId, invitationId);
      showToast('Invitation revoked.', 'amber');
      await loadInvitations();
    } catch (revokeError: any) {
      setError(revokeError.message || 'Could not revoke invitation.');
    }
  };

  const statusFor = (invitation: PatientInvitation) => {
    if (invitation.status === 'REDEEMED') return { label: 'Redeemed', classes: 'bg-emerald-50 text-emerald-700' };
    if (invitation.status === 'REVOKED') return { label: 'Revoked', classes: 'bg-red-50 text-red-700' };
    if (invitation.status === 'EXPIRED') return { label: 'Expired', classes: 'bg-gray-100 text-gray-600' };
    return { label: 'Active', classes: 'bg-amber-50 text-amber-700' };
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 animate-fadeIn pb-12">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-text">
          <ShieldCheck className="w-4 h-4" /> Secure family workspace
        </div>
        <h1 className="font-serif text-3xl font-bold text-ink-primary mt-2">Family Access</h1>
        <p className="text-ink-secondary mt-1">
          Invite trusted relatives to contribute to {patientName}&apos;s storybook. Codes expire and can be used only once.
        </p>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <form onSubmit={createInvitation} className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-warm-peach text-primary grid place-items-center"><UserPlus className="w-5 h-5" /></div>
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-primary">Create invitation</h2>
              <p className="text-xs text-ink-secondary">The code is shown once after creation.</p>
            </div>
          </div>

          <label className="block text-sm font-semibold text-ink-primary">
            Relationship
            <input
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
              required
              maxLength={100}
              className="mt-2 w-full rounded-2xl border-2 border-warm-sand px-4 py-3 outline-none focus:border-primary"
              placeholder="Daughter, brother, family friend…"
            />
          </label>

          <label className="block text-sm font-semibold text-ink-primary">
            Permission
            <select
              value={accessRole}
              onChange={(event) => setAccessRole(event.target.value as 'FAMILY' | 'VIEWER')}
              className="mt-2 w-full rounded-2xl border-2 border-warm-sand px-4 py-3 bg-white outline-none focus:border-primary"
            >
              <option value="FAMILY">Family contributor</option>
              <option value="VIEWER">View only</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-ink-primary">
            Expires after
            <select
              value={expiresInHours}
              onChange={(event) => setExpiresInHours(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border-2 border-warm-sand px-4 py-3 bg-white outline-none focus:border-primary"
            >
              <option value={24}>24 hours</option>
              <option value={72}>3 days</option>
              <option value={168}>7 days</option>
            </select>
          </label>

          {error && <p className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !relationship.trim()}
            className="w-full min-h-12 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
            Generate secure code
          </button>
        </form>

        <section className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-primary">Invitation history</h2>
              <p className="text-xs text-ink-secondary">Codes are stored as secure hashes and cannot be viewed again.</p>
            </div>
            <button onClick={() => void loadInvitations()} className="p-2.5 rounded-xl hover:bg-warm-cream" aria-label="Refresh invitations">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {invitations.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-warm-sand p-8 text-center text-sm text-ink-secondary">
                No invitations have been created yet.
              </div>
            )}
            {invitations.map((invitation) => {
              const status = statusFor(invitation);
              const canRevoke = status.label === 'Active';
              return (
                <div key={invitation.id} className="rounded-2xl border border-surface-border p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-ink-primary">{invitation.relationship}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${status.classes}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5" /> {invitation.accessRole === 'FAMILY' ? 'Family contributor' : 'View only'} · expires {new Date(invitation.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  {canRevoke && (
                    <button onClick={() => void revokeInvitation(invitation.id)} className="p-2 rounded-xl text-red-600 hover:bg-red-50" aria-label="Revoke invitation">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {newCode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center mx-auto"><Check className="w-7 h-7" /></div>
            <h2 className="font-serif text-2xl font-bold mt-4">Invitation ready</h2>
            <p className="text-sm text-ink-secondary mt-2">Share this code privately. It will not be displayed again.</p>
            <div className="my-5 rounded-2xl bg-warm-cream border-2 border-warm-sand px-4 py-4 font-mono text-2xl font-bold tracking-[0.15em] text-ink-primary">{newCode}</div>
            <div className="flex gap-3">
              <button onClick={() => void copyCode()} className="flex-1 min-h-12 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2"><Copy className="w-4 h-4" /> Copy code</button>
              <button onClick={() => setNewCode(null)} className="px-5 min-h-12 rounded-2xl border border-warm-sand font-bold">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
