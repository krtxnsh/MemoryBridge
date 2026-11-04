import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight, 
  BookOpen 
} from 'lucide-react';

export const CaregiverTimeline: React.FC = () => {
  const navigate = useNavigate();
  const { memories, patientName, people } = useApp();

  const sortedMemories = [...memories].sort((a, b) => a.year - b.year);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
          {patientName}'s Life Timeline
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          A chronological milestone map spanning from childhood in 1960 to golden years.
        </p>
      </div>

      {/* Vertical Interactive Timeline */}
      <div className="relative border-l-3 border-primary/30 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-8 my-4">
        {sortedMemories.map((mem) => {
          const isVerified = mem.status === 'verified';
          const taggedPeople = people.filter(p => mem.peopleIds.includes(p.id));

          return (
            <div
              key={mem.id}
              className="relative group cursor-pointer"
              onClick={() => navigate(`/family/memory/${mem.id}`)}
            >
              {/* Timeline Node Dot */}
              <div className="absolute -left-[35px] sm:-left-[51px] top-4 w-7 h-7 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-soft group-hover:scale-125 transition-transform">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>

              {/* Memory Timeline Card */}
              <div className="bg-white rounded-3xl border border-surface-border p-5 sm:p-6 shadow-soft group-hover:shadow-soft-md group-hover:border-primary transition-all flex flex-col sm:flex-row gap-5 items-start">
                {/* Photo Thumbnail */}
                <div className="w-full sm:w-44 aspect-[4/3] rounded-2xl overflow-hidden bg-warm-cream shrink-0 border border-warm-sand shadow-sm">
                  <img src={mem.media[0]?.url} alt={mem.title} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary text-white">
                      {mem.year} · {mem.era}
                    </span>

                    {isVerified ? (
                      <span className="text-[11px] font-bold text-[#327A55] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#D97706] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-xl font-bold text-ink-primary group-hover:text-primary transition-colors mt-1">
                    {mem.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-ink-secondary mt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{mem.location}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-ink-secondary mt-2 line-clamp-2 leading-relaxed">
                    {mem.story}
                  </p>

                  {/* People */}
                  {taggedPeople.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border">
                      <span className="text-[10px] font-bold uppercase text-ink-secondary">With:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {taggedPeople.map(p => (
                          <span key={p.id} className="text-xs font-medium px-2 py-0.5 rounded bg-warm-cream text-ink-primary border border-surface-border">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex items-center self-center text-ink-muted group-hover:text-primary transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
