import React, { useState } from 'react';
import { ArrowRight, HeartHandshake, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { patientApi } from '../api/client';
import { useApp } from '../store/AppContext';

export const SetupPatient: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, refreshData, showToast } = useApp();
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('Primary caregiver');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [biography, setBiography] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const createWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await patientApi.createPatient({
        fullName,
        relationship,
        ...(dateOfBirth ? { dateOfBirth } : {}),
        biography
      });
      await refreshData();
      showToast(`${fullName}'s private family workspace is ready.`, 'success');
      navigate('/family');
    } catch (setupError: any) {
      setError(setupError.message || 'Could not create the patient workspace.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex-1 bg-gradient-to-br from-[#FFFDF9] via-[#FFF7EF] to-[#F5ECE1] p-5 sm:p-8 grid place-items-center">
      <div className="max-w-3xl w-full grid md:grid-cols-[0.8fr_1.2fr] bg-white rounded-[2rem] border border-warm-sand shadow-soft-lg overflow-hidden">
        <aside className="bg-ink-primary text-white p-7 sm:p-9 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-primary grid place-items-center"><HeartHandshake className="w-6 h-6" /></div>
            <p className="text-xs uppercase tracking-wider font-bold text-primary-200 mt-6">First-time setup</p>
            <h1 className="font-serif text-3xl font-bold mt-2">Create a private memory workspace</h1>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">Start with the person your family will support. You can invite relatives and add verified memories afterward.</p>
          </div>
          <div className="mt-8 flex items-start gap-2 text-xs text-white/70"><ShieldCheck className="w-4 h-4 text-primary-200 shrink-0" /> Only invited members can access this workspace.</div>
        </aside>

        <form onSubmit={createWorkspace} className="p-7 sm:p-9 space-y-5">
          <div>
            <p className="text-sm text-ink-secondary">Welcome, <strong>{currentUser?.name}</strong>.</p>
            <h2 className="font-serif text-2xl font-bold text-ink-primary mt-1 flex items-center gap-2"><UserRoundPlus className="w-6 h-6 text-primary" /> Patient details</h2>
          </div>

          <label className="block text-sm font-bold text-ink-primary">
            Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={100} className="mt-2 w-full min-h-12 rounded-2xl border-2 border-warm-sand px-4 outline-none focus:border-primary" placeholder="e.g. Rajiv Sharma" />
          </label>

          <label className="block text-sm font-bold text-ink-primary">
            Your relationship
            <input value={relationship} onChange={(event) => setRelationship(event.target.value)} required maxLength={100} className="mt-2 w-full min-h-12 rounded-2xl border-2 border-warm-sand px-4 outline-none focus:border-primary" placeholder="Spouse, daughter, caregiver…" />
          </label>

          <label className="block text-sm font-bold text-ink-primary">
            Date of birth <span className="font-normal text-ink-muted">(optional)</span>
            <input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="mt-2 w-full min-h-12 rounded-2xl border-2 border-warm-sand px-4 outline-none focus:border-primary" />
          </label>

          <label className="block text-sm font-bold text-ink-primary">
            Short biography <span className="font-normal text-ink-muted">(optional)</span>
            <textarea value={biography} onChange={(event) => setBiography(event.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-2xl border-2 border-warm-sand px-4 py-3 outline-none focus:border-primary resize-none" placeholder="A few family-approved details…" />
          </label>

          {error && <p className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={isSaving || !fullName.trim() || !relationship.trim()} className="w-full min-h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2">
            {isSaving ? 'Creating workspace…' : 'Create workspace'} <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-center text-ink-secondary">Already received an invitation? <Link to="/join" className="font-bold text-primary-text underline">Join with a code</Link></p>
        </form>
      </div>
    </main>
  );
};
