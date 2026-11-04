import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { memoryService } from '../../services';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  Users,
  Eye,
  Check
} from 'lucide-react';
import { Memory } from '../../types';

export const CaregiverLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { memories, albums, people, deleteMemory, updateMemory } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');
  
  // Modals
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  // Filtered memories
  let displayedMemories = memoryService.searchMemories(memories, searchQuery);

  if (selectedAlbum !== 'all') {
    displayedMemories = displayedMemories.filter(m => m.albumId === selectedAlbum);
  }
  if (selectedPerson !== 'all') {
    displayedMemories = displayedMemories.filter(m => m.peopleIds.includes(selectedPerson));
  }
  if (statusFilter !== 'all') {
    displayedMemories = displayedMemories.filter(m => 
      statusFilter === 'verified' ? m.status === 'verified' : (m.status === 'pending' || m.status === 'ai-suggested')
    );
  }

  const handleDeleteConfirm = () => {
    if (memoryToDelete) {
      deleteMemory(memoryToDelete.id);
      setMemoryToDelete(null);
    }
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMemory) {
      updateMemory(editingMemory.id, editingMemory);
      setEditingMemory(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
      {/* Header & New Storybook CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
            Memory Library & Storybooks
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Browse, curate, and verify memories for Rajiv’s personal archive.
          </p>
        </div>

        <button
          onClick={() => navigate('/family/create-storybook')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-soft hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>New Memory Storybook</span>
        </button>
      </div>

      {/* Album Covers Showcase Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          onClick={() => setSelectedAlbum('all')}
          className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
            selectedAlbum === 'all'
              ? 'bg-primary text-white border-primary shadow-soft'
              : 'bg-white hover:bg-warm-peach border-surface-border'
          }`}
        >
          <span className="text-xs font-bold uppercase">All Albums</span>
          <span className="text-2xl font-bold font-serif my-2">{memories.length}</span>
          <span className="text-[11px] opacity-80">Full collection</span>
        </div>

        {albums.map((album) => {
          const isSelected = selectedAlbum === album.id;
          return (
            <div
              key={album.id}
              onClick={() => setSelectedAlbum(isSelected ? 'all' : album.id)}
              className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-warm-peach border-primary shadow-soft'
                  : 'bg-white hover:bg-warm-cream border-surface-border'
              }`}
            >
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-warm-cream mb-2 shadow-sm">
                <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
              </div>
              <h4 className="font-bold text-ink-primary text-xs line-clamp-1">{album.title}</h4>
              <span className="text-[10px] text-ink-secondary">{album.yearRange}</span>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-soft flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location, year, or person..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-warm-cream border border-surface-border text-sm text-ink-primary focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Person Filter */}
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="px-3 py-2 rounded-xl bg-warm-cream border border-surface-border text-xs text-ink-primary font-medium focus:outline-none"
          >
            <option value="all">All People</option>
            {people.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.relationship})</option>
            ))}
          </select>

          {/* Verification Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-warm-cream border border-surface-border text-xs text-ink-primary font-medium focus:outline-none"
          >
            <option value="all">All Verification Statuses</option>
            <option value="verified">Verified Only (Approved)</option>
            <option value="pending">Pending / AI Suggested</option>
          </select>
        </div>
      </div>

      {/* Memories List / Table View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedMemories.map((memory) => {
          const isVerified = memory.status === 'verified';
          return (
            <div
              key={memory.id}
              className="bg-white rounded-2xl border border-surface-border shadow-soft overflow-hidden flex flex-col justify-between hover:shadow-soft-md transition-shadow"
            >
              <div>
                {/* Photo Header */}
                <div className="w-full aspect-[16/10] bg-warm-cream relative overflow-hidden">
                  <img
                    src={memory.media[0]?.url}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    {isVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF8E7] text-[#D97706] border border-[#FAD7A0] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                    {memory.year}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-serif text-lg font-bold text-ink-primary leading-snug line-clamp-1">
                    {memory.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-ink-secondary">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{memory.location}</span>
                  </div>
                  <p className="text-xs text-ink-secondary mt-2 line-clamp-3 leading-relaxed">
                    {memory.story}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {memory.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-warm-cream text-ink-secondary">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 bg-[#FCFAF6] border-t border-surface-border flex items-center justify-between">
                <button
                  onClick={() => navigate(`/family/memory/${memory.id}`)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingMemory(memory)}
                    className="p-1.5 rounded-lg hover:bg-warm-peach text-ink-secondary hover:text-primary transition-colors"
                    title="Edit memory"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMemoryToDelete(memory)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-ink-secondary hover:text-red-600 transition-colors"
                    title="Delete memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Delete (Destructive Action - Caregiver App Only) */}
      {memoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-fadeIn">
            <h3 className="font-serif text-xl font-bold text-ink-primary">
              Delete Memory?
            </h3>
            <p className="text-sm text-ink-secondary mt-2">
              Are you sure you want to remove <span className="font-semibold text-ink-primary">"{memoryToDelete.title}"</span>? This will remove it from Rajiv’s storybook and AI companion responses.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setMemoryToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-secondary hover:bg-warm-cream"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-soft"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Memory Modal */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleEditSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-surface-border animate-fadeIn flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-serif text-xl font-bold text-ink-primary">
              Edit Memory: {editingMemory.title}
            </h3>

            <div>
              <label className="text-xs font-bold text-ink-secondary uppercase">Memory Title</label>
              <input
                type="text"
                value={editingMemory.title}
                onChange={(e) => setEditingMemory({ ...editingMemory, title: e.target.value })}
                className="mt-1 w-full p-2.5 rounded-xl border border-surface-border text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-ink-secondary uppercase">Year</label>
                <input
                  type="number"
                  value={editingMemory.year}
                  onChange={(e) => setEditingMemory({ ...editingMemory, year: Number(e.target.value) })}
                  className="mt-1 w-full p-2.5 rounded-xl border border-surface-border text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-secondary uppercase">Location</label>
                <input
                  type="text"
                  value={editingMemory.location}
                  onChange={(e) => setEditingMemory({ ...editingMemory, location: e.target.value })}
                  className="mt-1 w-full p-2.5 rounded-xl border border-surface-border text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-secondary uppercase">Story Text</label>
              <textarea
                rows={4}
                value={editingMemory.story}
                onChange={(e) => setEditingMemory({ ...editingMemory, story: e.target.value })}
                className="mt-1 w-full p-2.5 rounded-xl border border-surface-border text-sm"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setEditingMemory(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-secondary hover:bg-warm-cream"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-hover text-white shadow-soft"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
