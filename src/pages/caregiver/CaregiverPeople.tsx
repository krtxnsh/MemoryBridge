import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { Person } from '../../types';
import { 
  Users, 
  Plus, 
  Edit3, 
  Heart, 
  ShieldCheck, 
  BookOpen, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { createSvgAvatar } from '../../assets/placeholders';

export const CaregiverPeople: React.FC = () => {
  const { people, addPerson, updatePerson, memories } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // New person form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Relative');
  const [bio, setBio] = useState('');

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    addPerson({
      name,
      relationship,
      bio,
      avatarUrl: createSvgAvatar(initials, '#FDEEE4', relationship),
      confirmedByFamily: true,
      sharedMemoryCount: 0
    });

    setName('');
    setBio('');
    setIsAdding(false);
  };

  const handleUpdatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPerson) {
      updatePerson(editingPerson.id, editingPerson);
      setEditingPerson(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
            People & Family Directory
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Caregiver-managed directory of confirmed family members, friends, and relationships.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-soft hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Family Privacy Disclaimer Banner */}
      <div className="bg-[#EBF4F6] border border-[#B3E5FC] p-4 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0288D1] shrink-0 mt-0.5" />
        <div className="text-xs text-[#01579B]">
          <span className="font-bold block text-sm mb-0.5">Privacy & Safety Notice:</span>
          No facial recognition is used. All identity labels, relationships, and tags are manually entered and confirmed by family caregivers.
        </div>
      </div>

      {/* People Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {people.map((person) => {
          const sharedCount = memories.filter(m => m.peopleIds.includes(person.id)).length;
          return (
            <div
              key={person.id}
              className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft flex flex-col justify-between hover:shadow-soft-md transition-shadow relative"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden shadow-soft border-3 border-warm-peach shrink-0">
                    <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover" />
                  </div>

                  <button
                    onClick={() => setEditingPerson(person)}
                    className="p-2 rounded-xl hover:bg-warm-peach text-ink-secondary hover:text-primary transition-colors"
                    title="Edit profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-ink-primary">
                    {person.name}
                  </h3>
                  {person.isMainPatient && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-white">
                      Patient
                    </span>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-warm-peach text-primary-text font-bold text-xs mt-1">
                  <Heart className="w-3 h-3 fill-primary text-primary" />
                  <span>{person.relationship}</span>
                </div>

                <p className="text-ink-secondary text-xs sm:text-sm mt-3 leading-relaxed line-clamp-3">
                  {person.bio}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-ink-secondary font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>{sharedCount} shared memories</span>
                </span>
                <span className="text-[#327A55] font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmed</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Person Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePerson}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-fadeIn flex flex-col gap-4"
          >
            <h3 className="font-serif text-xl font-bold text-ink-primary">
              Add New Family Member
            </h3>

            <div>
              <label className="text-xs font-bold uppercase text-ink-secondary block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya"
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-ink-secondary block mb-1">Relationship to Rajiv</label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Sister, Granddaughter"
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-ink-secondary block mb-1">Short Biography / Introduction</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Key memories, favorite shared experiences..."
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-semibold text-ink-secondary hover:bg-warm-cream rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-soft"
              >
                Add Person
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Person Modal */}
      {editingPerson && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdatePerson}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-fadeIn flex flex-col gap-4"
          >
            <h3 className="font-serif text-xl font-bold text-ink-primary">
              Edit: {editingPerson.name}
            </h3>

            <div>
              <label className="text-xs font-bold uppercase text-ink-secondary block mb-1">Name</label>
              <input
                type="text"
                value={editingPerson.name}
                onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-ink-secondary block mb-1">Relationship</label>
              <input
                type="text"
                value={editingPerson.relationship}
                onChange={(e) => setEditingPerson({ ...editingPerson, relationship: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-ink-secondary block mb-1">Bio</label>
              <textarea
                rows={3}
                value={editingPerson.bio}
                onChange={(e) => setEditingPerson({ ...editingPerson, bio: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setEditingPerson(null)}
                className="px-4 py-2 text-sm font-semibold text-ink-secondary hover:bg-warm-cream rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-soft"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
