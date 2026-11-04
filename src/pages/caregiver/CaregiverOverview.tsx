import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { MascotMira } from '../../components/common/MascotMira';
import { 
  BookOpen, 
  ShieldCheck, 
  Users, 
  PlusCircle, 
  CalendarCheck, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Heart
} from 'lucide-react';

export const CaregiverOverview: React.FC = () => {
  const navigate = useNavigate();
  const { memories, people, albums, routine, toggleRoutineCompleted, patientName } = useApp();

  const verifiedCount = memories.filter(m => m.status === 'verified').length;
  const pendingMemories = memories.filter(m => m.status === 'pending' || m.status === 'ai-suggested');
  const todaysMemory = memories.find(m => m.id === 'mem-1998') || memories[0];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">
      {/* Overview Greeting Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-surface-border shadow-soft">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-text">
            Caregiver Management Hub
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-ink-primary mt-1">
            Good morning, welcome back.
          </h1>
          <p className="text-ink-secondary text-sm sm:text-base mt-1">
            "Every memory is a piece of someone's story."
          </p>
        </div>

        {/* Quick Mascot Guide Panel */}
        <div className="flex items-center gap-3 bg-warm-cream/80 p-3 rounded-2xl border border-warm-sand">
          <MascotMira state="waving" size="sm" />
          <div>
            <p className="text-xs font-semibold text-ink-primary leading-tight">
              Would you like to create a new memory story today?
            </p>
            <button
              onClick={() => navigate('/family/create-storybook')}
              className="mt-1.5 text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Start Storybook Wizard</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Five Essential Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Memories */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-soft">
          <div className="flex items-center justify-between text-ink-secondary mb-1">
            <span className="text-xs font-semibold">Total Memories</span>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-ink-primary font-serif">
            {memories.length}
          </span>
          <span className="text-[11px] text-ink-secondary block mt-0.5">In family archive</span>
        </div>

        {/* Verified Memories */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-soft">
          <div className="flex items-center justify-between text-[#327A55] mb-1">
            <span className="text-xs font-semibold">Verified</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-ink-primary font-serif">
            {verifiedCount}
          </span>
          <span className="text-[11px] text-[#327A55] block mt-0.5 font-medium">Safe for patient AI</span>
        </div>

        {/* Family Members */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-soft">
          <div className="flex items-center justify-between text-ink-secondary mb-1">
            <span className="text-xs font-semibold">Family Circle</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-ink-primary font-serif">
            {people.length}
          </span>
          <span className="text-[11px] text-ink-secondary block mt-0.5">Confirmed relatives</span>
        </div>

        {/* Storybooks Created */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-soft">
          <div className="flex items-center justify-between text-ink-secondary mb-1">
            <span className="text-xs font-semibold">Storybooks</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-ink-primary font-serif">
            {albums.length}
          </span>
          <span className="text-[11px] text-ink-secondary block mt-0.5">Themed albums</span>
        </div>

        {/* Upcoming Routine Items */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-soft col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-ink-secondary mb-1">
            <span className="text-xs font-semibold">Today's Routine</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-ink-primary font-serif">
            {routine.filter(r => !r.completed).length}
          </span>
          <span className="text-[11px] text-ink-secondary block mt-0.5">Pending activities</span>
        </div>
      </div>

      {/* Pending Verification Banner (if items exist) */}
      {pendingMemories.length > 0 && (
        <div className="bg-[#FEF8E7] border-2 border-[#FAD7A0] p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-ink-primary text-sm sm:text-base">
                {pendingMemories.length} Pending Memory Stories Awaiting Approval
              </h4>
              <p className="text-xs text-ink-secondary">
                AI drafts and contributed family stories remain hidden from {patientName} until verified by you.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/family/verification')}
            className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            Review Queue →
          </button>
        </div>
      )}

      {/* Main Grid: Today's Memory Spotlight + Today's Routine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TODAY'S MEMORY FEATURE (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-surface-border p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-text flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-primary text-primary" />
                <span>Today's Memory Feature</span>
              </span>
              <span className="text-xs text-ink-secondary font-medium">
                {todaysMemory.year} · {todaysMemory.location}
              </span>
            </div>

            <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-warm-cream shadow-sm border border-warm-sand mb-4 relative">
              <img
                src={todaysMemory.media[0]?.url}
                alt={todaysMemory.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                Verified
              </div>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-primary">
              {todaysMemory.title}
            </h3>
            <p className="text-ink-secondary text-sm sm:text-base mt-2 leading-relaxed">
              {todaysMemory.story}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between">
            <span className="text-xs text-ink-secondary">
              Tagged: {todaysMemory.tags.join(', ')}
            </span>
            <button
              onClick={() => navigate(`/family/library`)}
              className="text-primary text-xs font-bold hover:underline"
            >
              Explore in Library →
            </button>
          </div>
        </div>

        {/* TODAY'S ACTIVITIES & QUICK ACTIONS (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl border border-surface-border p-5 shadow-soft">
            <h3 className="font-serif text-lg font-bold text-ink-primary mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate('/family/create-storybook')}
                className="p-3 rounded-2xl bg-warm-peach/80 hover:bg-warm-peach text-primary-text font-semibold text-xs border border-primary-200 flex flex-col items-center text-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-5 h-5 text-primary" />
                <span>Add Storybook</span>
              </button>
              <button
                onClick={() => navigate('/family/people')}
                className="p-3 rounded-2xl bg-[#E8F8F5] hover:bg-[#D1F2EB] text-[#117A65] font-semibold text-xs border border-[#A2D9CE] flex flex-col items-center text-center gap-1.5 transition-colors"
              >
                <Users className="w-5 h-5 text-[#117A65]" />
                <span>Add Relative</span>
              </button>
            </div>
          </div>

          {/* Today's Activities Checklist */}
          <div className="bg-white rounded-3xl border border-surface-border p-5 shadow-soft flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-bold text-ink-primary flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                  <span>{patientName}'s Routine Today</span>
                </h3>
                <button
                  onClick={() => navigate('/family/routine')}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Manage
                </button>
              </div>

              <div className="space-y-2.5">
                {routine.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleRoutineCompleted(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      item.completed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-warm-cream/40 border-warm-sand'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                        item.completed ? 'bg-[#327A55] text-white' : 'border border-ink-muted'
                      }`}>
                        {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <h4 className={`text-xs font-semibold ${item.completed ? 'line-through text-ink-muted' : 'text-ink-primary'}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-ink-secondary">{item.time}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-primary-text font-medium">{item.category}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-ink-secondary mt-3 pt-3 border-t border-surface-border">
              Gentle routine without strict deadlines or alarms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
