import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Edit3, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Memory } from '../../types';

export const CaregiverVerification: React.FC = () => {
  const { memories, approveMemory, rejectMemory, updateMemory, patientName } = useApp();

  const pendingMemories = memories.filter(
    m => m.status === 'pending' || m.status === 'ai-suggested'
  );

  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const handleApprove = (id: string) => {
    approveMemory(id, 'Anita (Family Admin)');
  };

  const handleReject = (id: string) => {
    rejectMemory(id);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMemory) {
      updateMemory(editingMemory.id, editingMemory);
      setEditingMemory(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
          Family Verification Queue
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Review, approve, or edit AI-suggested memory drafts before they are shared with {patientName}.
        </p>
      </div>

      {/* Safety Notice Card */}
      <div className="bg-[#FEF8E7] border-2 border-[#FAD7A0] p-5 rounded-3xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-[#D97706] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-amber-950 text-base">
            Strict AI Safety & Verification Boundary
          </h3>
          <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed">
            MemoryBridge’s AI strictly references verified memories. Unverified memories in this queue will never be asserted as fact to {patientName}. Approving a memory immediately makes it available across the patient tablet app and conversational assistant.
          </p>
        </div>
      </div>

      {/* Pending Items List */}
      {pendingMemories.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-ink-primary">
            Pending Approval ({pendingMemories.length})
          </h2>

          {pendingMemories.map((mem) => (
            <div
              key={mem.id}
              className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft flex flex-col md:flex-row gap-6 items-start"
            >
              {/* Thumbnail */}
              <div className="w-full md:w-52 aspect-[4/3] rounded-2xl overflow-hidden bg-warm-cream shrink-0 border border-warm-sand shadow-sm">
                <img src={mem.media[0]?.url} alt={mem.title} className="w-full h-full object-cover" />
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF8E7] text-[#D97706] border border-[#FAD7A0]">
                    {mem.source === 'ai_drafted' ? 'AI Draft Suggestion' : 'Family Contributed'}
                  </span>
                  <span className="text-xs font-semibold text-ink-secondary">
                    Year: {mem.year}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-ink-primary">
                  {mem.title}
                </h3>

                <div className="flex items-center gap-2 mt-1 text-xs text-ink-secondary">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{mem.location}</span>
                </div>

                <p className="text-sm text-ink-secondary mt-3 p-3 rounded-xl bg-warm-cream/50 border border-warm-sand leading-relaxed">
                  "{mem.story}"
                </p>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleApprove(mem.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#327A55] hover:bg-[#276344] text-white text-xs font-bold shadow-soft transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve for {patientName}</span>
                  </button>

                  <button
                    onClick={() => setEditingMemory(mem)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-warm-cream hover:bg-warm-peach text-ink-primary text-xs font-semibold border border-warm-sand transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Facts</span>
                  </button>

                  <button
                    onClick={() => handleReject(mem.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Decline Draft</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-surface-border p-8 shadow-soft">
          <ShieldCheck className="w-12 h-12 text-[#327A55] mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-ink-primary">
            Verification Queue is All Clear!
          </h3>
          <p className="text-sm text-ink-secondary mt-1">
            All memories in the archive are verified and active in {patientName}'s companion app.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleEditSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-surface-border animate-fadeIn flex flex-col gap-4"
          >
            <h3 className="font-serif text-xl font-bold text-ink-primary">
              Edit & Verify Memory
            </h3>

            <div>
              <label className="text-xs font-bold text-ink-secondary uppercase block mb-1">Title</label>
              <input
                type="text"
                value={editingMemory.title}
                onChange={(e) => setEditingMemory({ ...editingMemory, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-ink-secondary uppercase block mb-1">Year</label>
                <input
                  type="number"
                  value={editingMemory.year}
                  onChange={(e) => setEditingMemory({ ...editingMemory, year: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-secondary uppercase block mb-1">Location</label>
                <input
                  type="text"
                  value={editingMemory.location}
                  onChange={(e) => setEditingMemory({ ...editingMemory, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-secondary uppercase block mb-1">Story Draft</label>
              <textarea
                rows={4}
                value={editingMemory.story}
                onChange={(e) => setEditingMemory({ ...editingMemory, story: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setEditingMemory(null)}
                className="px-4 py-2 text-sm font-semibold text-ink-secondary hover:bg-warm-cream rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-soft"
              >
                Save & Keep Pending
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
