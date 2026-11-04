import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { speechService } from '../../services';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  Users, 
  MessageCircleHeart, 
  Music,
  Share2
} from 'lucide-react';

export const CaregiverMemoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { memories, people, songs, playSong } = useApp();

  const memory = memories.find(m => m.id === id) || memories[0];
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const taggedPeople = people.filter(p => memory.peopleIds.includes(p.id));
  const relatedSong = memory.songId ? songs.find(s => s.id === memory.songId) : null;
  const isVerified = memory.status === 'verified';

  const handlePlayAudio = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speechService.speak(memory.story, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/family/library')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-surface-border text-ink-primary font-semibold text-sm hover:bg-warm-cream shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Memory</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF8E7] text-[#D97706] border border-[#FAD7A0] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Pending Verification</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Detail Container */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-soft overflow-hidden p-6 sm:p-8 flex flex-col gap-6">
        {/* Large Main Photo */}
        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-warm-cream relative shadow-soft border border-surface-border">
          <img
            src={memory.media[0]?.url}
            alt={memory.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
            {memory.year} · {memory.era}
          </div>
        </div>

        {/* Title & Metadata */}
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-primary">
            {memory.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-ink-secondary">
            <div className="flex items-center gap-1.5 text-primary-text font-semibold bg-warm-peach px-3 py-1 rounded-lg">
              <MapPin className="w-4 h-4" />
              <span>{memory.location}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-warm-cream px-3 py-1 rounded-lg">
              <Calendar className="w-4 h-4" />
              <span>{memory.dateStr}</span>
            </div>
            {memory.approvedBy && (
              <span className="text-xs text-[#327A55] font-medium">
                Approved by {memory.approvedBy}
              </span>
            )}
          </div>
        </div>

        {/* Story Narrative */}
        <div className="p-6 rounded-2xl bg-warm-cream/40 border border-warm-sand">
          <h3 className="font-serif text-lg font-bold text-ink-primary mb-2">
            Family Story Narrative
          </h3>
          <p className="font-serif text-lg sm:text-xl text-ink-primary leading-relaxed">
            {memory.story}
          </p>
        </div>

        {/* Audio Player and AI Companion Trigger */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handlePlayAudio}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold shadow-soft transition-all ${
              isSpeaking
                ? 'bg-primary text-white animate-pulse'
                : 'bg-warm-peach hover:bg-primary-100 text-primary-text border border-primary-200'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-primary" />}
            <span>{isSpeaking ? 'Pause Story Audio' : 'Play Story Audio (Browser TTS)'}</span>
          </button>

          <button
            onClick={() => navigate(`/patient/companion?prompt=${encodeURIComponent(`Tell me about ${memory.title}`)}`)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-warm-cream border border-surface-border text-ink-primary font-semibold shadow-soft transition-colors"
          >
            <MessageCircleHeart className="w-5 h-5 text-primary" />
            <span>Ask AI Companion About This</span>
          </button>
        </div>

        {/* Connected Family Relatives */}
        {taggedPeople.length > 0 && (
          <div className="pt-4 border-t border-surface-border">
            <h3 className="font-serif text-base font-bold text-ink-primary mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>People Connected to This Memory</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {taggedPeople.map(p => (
                <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-warm-cream border border-surface-border">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white shrink-0">
                    <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-ink-primary">{p.name}</h5>
                    <span className="text-[10px] text-primary-text font-medium">{p.relationship}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Song */}
        {relatedSong && (
          <div className="p-4 rounded-2xl bg-[#EBF4F6] border border-[#B3E5FC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0288D1] text-white flex items-center justify-center shadow-sm">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#0288D1]">Connected Melody</span>
                <h4 className="font-bold text-ink-primary text-sm">{relatedSong.title}</h4>
              </div>
            </div>
            <button
              onClick={() => playSong(relatedSong)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-ink-primary text-xs font-bold shadow-sm hover:text-primary"
            >
              Play Melody
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
