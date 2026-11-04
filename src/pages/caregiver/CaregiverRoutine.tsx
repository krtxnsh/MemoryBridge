import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { RoutineItem } from '../../types';
import { 
  CalendarCheck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Coffee,
  Pill,
  Activity,
  PhoneCall
} from 'lucide-react';

export const CaregiverRoutine: React.FC = () => {
  const { routine, addRoutineItem, deleteRoutineItem, toggleRoutineCompleted, patientName } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('11:00 AM');
  const [period, setPeriod] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [category, setCategory] = useState<'activity' | 'meal' | 'medication' | 'family_call' | 'walk'>('activity');
  const [notes, setNotes] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addRoutineItem({
      title,
      time,
      period,
      category,
      notes: notes || 'Caregiver routine reminder.',
      completed: false,
      reminderStatus: 'Active'
    });

    setTitle('');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
            {patientName}’s Daily Routine & Reminders
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Organize soothing daily activities, walks, meals, and caregiver-entered medication reminders.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-soft hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Add Routine Item</span>
        </button>
      </div>

      {/* Dementia Dignity Note Banner */}
      <div className="bg-[#EBF4F6] border border-[#B3E5FC] p-4 rounded-2xl flex items-start gap-3">
        <Clock className="w-5 h-5 text-[#0288D1] shrink-0 mt-0.5" />
        <div className="text-xs text-[#01579B]">
          <span className="font-bold block text-sm mb-0.5">Gentle Routine Philosophy:</span>
          Reminders are phrased in simple, warm words on {patientName}'s tablet. No intrusive alarm sounds or rigid timers. Medication entries are plain caregiver notes without clinical analytics.
        </div>
      </div>

      {/* Routine Items List */}
      <div className="space-y-3">
        {routine.map((item) => (
          <div
            key={item.id}
            className={`p-4 sm:p-5 rounded-2xl border bg-white flex items-center justify-between gap-4 shadow-soft transition-all ${
              item.completed ? 'opacity-60 bg-gray-50' : 'hover:border-primary'
            }`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleRoutineCompleted(item.id)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  item.completed ? 'bg-[#327A55] text-white' : 'border-2 border-surface-border hover:border-primary text-transparent'
                }`}
                title={item.completed ? "Mark incomplete" : "Mark completed"}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-warm-cream border border-warm-sand text-ink-secondary">
                    {item.time}
                  </span>
                  <span className="text-xs font-semibold text-primary-text">
                    {item.period} · {item.category.toUpperCase()}
                  </span>
                </div>
                <h4 className={`font-serif text-lg font-bold mt-1 ${item.completed ? 'line-through text-ink-muted' : 'text-ink-primary'}`}>
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
                  {item.notes}
                </p>
              </div>
            </div>

            <button
              onClick={() => deleteRoutineItem(item.id)}
              className="p-2 rounded-xl text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete routine item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-fadeIn flex flex-col gap-4"
          >
            <h3 className="font-serif text-xl font-bold text-ink-primary">
              New Routine Activity
            </h3>

            <div>
              <label className="text-xs font-bold text-ink-secondary uppercase block mb-1">Activity Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Afternoon Tea in Verandah"
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-ink-secondary uppercase block mb-1">Time</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-secondary uppercase block mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-secondary uppercase block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-surface-border text-sm"
              >
                <option value="activity">Cognitive / Relaxation Activity</option>
                <option value="meal">Meal or Snack</option>
                <option value="walk">Garden Walk / Fresh Air</option>
                <option value="medication">Medication Reminder</option>
                <option value="family_call">Family Phone / Video Call</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-secondary uppercase block mb-1">Gentle Note for Patient</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Enjoy a warm cup of jasmine tea with toast..."
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
                Add to Daily Plan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
