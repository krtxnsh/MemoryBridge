import React, { useCallback, useEffect, useState } from 'react';
import { Check, Clock3, Copy, Crown, KeyRound, RefreshCw, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react';
import { accessApi, invitationApi, PatientInvitation, WorkspaceMember } from '../../api/client';
import { useApp } from '../../store/AppContext';

export const CaregiverFamilyAccess: React.FC = () => {
  const { activePatientId, activePatient, patientName, showToast } = useApp();
  const canViewAccess = ['OWNER', 'CAREGIVER'].includes(activePatient?.accessRole || '');
  const [invitations, setInvitations] = useState<PatientInvitation[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [relationship, setRelationship] = useState('Family member');
  const [accessRole, setAccessRole] = useState<'FAMILY' | 'VIEWER'>('FAMILY');
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadInvitations = useCallback(async () => {
    if (!activePatientId || !canViewAccess) return;
    try {
      setInvitations(await invitationApi.list(activePatientId));
    } catch (loadError: any) {
      setError(loadError.message || 'Could not load invitations.');
    }
  }, [activePatientId, canViewAccess]);

  const loadMembers = useCallback(async () => {
    if (!activePatientId || !canViewAccess) return;
    try {
      setMembers(await accessApi.list(activePatientId));
    } catch (loadError: any) {
      setError(loadError.message || 'Could not load family members.');
    }
  }, [activePatientId, canViewAccess]);

  useEffect(() => {
    // Loading remote invitation state is the synchronization purpose of this effect.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadInvitations();
    void loadMembers();
  }, [loadInvitations, loadMembers]);

  const currentMember = members.find((member) => member.isCurrentUser);
  const canManageMembers = currentMember?.accessRole === 'OWNER';

  const updateMemberRole = async (
    member: WorkspaceMember,
    accessRole: 'CAREGIVER' | 'FAMILY' | 'VIEWER'
  ) => {
    if (!activePatientId) return;
    setError('');
    setMemberBusyId(member.id);
    try {
      const updated = await accessApi.update(activePatientId, member.id, { accessRole });
      setMembers((current) => current.map((item) => item.id === member.id ? updated : item));
      showToast(`${member.user.name}'s permission was updated.`, 'success');
    } catch (updateError: any) {
      setError(updateError.message || 'Could not update family access.');
      await loadMembers();
    } finally {
      setMemberBusyId(null);
    }
  };

  const removeMember = async (member: WorkspaceMember) => {
    if (!activePatientId) return;
    const confirmed = window.confirm(`Remove ${member.user.name} from ${patientName}'s workspace?`);
    if (!confirmed) return;
    setError('');
    setMemberBusyId(member.id);
    try {
      await accessApi.remove(activePatientId, member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      showToast(`${member.user.name}'s access was removed.`, 'amber');
    } catch (removeError: any) {
      setError(removeError.message || 'Could not remove family access.');
    } finally {
      setMemberBusyId(null);
    }
  };

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

  if (!canViewAccess) {
    return (
      <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-surface-border p-8 shadow-soft text-center">
        <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-ink-primary mt-4">Caregiver access required</h1>
        <p className="text-ink-secondary mt-2">Only the workspace owner or a caregiver can view invitations and members.</p>
      </div>
    );
  }

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

      {error && <p className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-warm-peach text-primary grid place-items-center"><Users className="w-5 h-5" /></div>
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-primary">Workspace members</h2>
              <p className="text-xs text-ink-secondary">
                {canManageMembers ? 'As owner, you can change permissions or remove access.' : 'Only the workspace owner can change permissions.'}
              </p>
            </div>
          </div>
          <button onClick={() => void loadMembers()} className="p-2.5 rounded-xl hover:bg-warm-cream" aria-label="Refresh members">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-surface-border">
          {members.map((member) => {
            const isOwner = member.accessRole === 'OWNER';
            const isBusy = memberBusyId === member.id;
            return (
              <div key={member.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink-primary">{member.user.name}</span>
                    {isOwner && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-bold"><Crown className="w-3 h-3" /> Owner</span>}
                    {member.isCurrentUser && <span className="rounded-full bg-warm-cream px-2 py-0.5 text-[11px] font-bold text-ink-secondary">You</span>}
                  </div>
                  <p className="text-xs text-ink-secondary mt-1 truncate">{member.user.email} · {member.relationship}</p>
                </div>

                {isOwner ? (
                  <span className="min-w-40 rounded-xl bg-warm-cream border border-warm-sand px-3 py-2 text-sm font-semibold text-ink-secondary">Full ownership</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.accessRole}
                      onChange={(event) => void updateMemberRole(member, event.target.value as 'CAREGIVER' | 'FAMILY' | 'VIEWER')}
                      disabled={!canManageMembers || isBusy}
                      aria-label={`Permission for ${member.user.name}`}
                      className="min-w-40 rounded-xl bg-white border border-warm-sand px-3 py-2 text-sm font-semibold disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="CAREGIVER">Caregiver</option>
                      <option value="FAMILY">Family contributor</option>
                      <option value="VIEWER">View only</option>
                    </select>
                    {canManageMembers && (
                      <button
                        onClick={() => void removeMember(member)}
                        disabled={isBusy}
                        className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Remove ${member.user.name}`}
                      >
                        {isBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
