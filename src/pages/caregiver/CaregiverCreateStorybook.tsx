import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { storyService, mediaService, voiceService } from '../../services';
import { MascotMira } from '../../components/common/MascotMira';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Mic, 
  MicOff, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { MemoryMedia } from '../../types';
import { createSvgPhoto } from '../../assets/placeholders';

export const CaregiverCreateStorybook: React.FC = () => {
  const navigate = useNavigate();
  const { addMemory, people, albums, patientName } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [promptStory, setPromptStory] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([
    createSvgPhoto('family', 'Uploaded Memory Photograph', 'New')
  ]);
  const [title, setTitle] = useState<string>('Afternoon in the Courtyard');
  const [year, setYear] = useState<number>(1995);
  const [location, setLocation] = useState<string>('Family Courtyard, Delhi');
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>(['p-rajiv', 'p-anita']);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('album-trips');
  const [generatedStory, setGeneratedStory] = useState<string>('');
  const [autoApprove, setAutoApprove] = useState<boolean>(true);

  // Step 1: Voice input handler
  const handleToggleVoice = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceService.startListening(
        (transcript) => {
          setPromptStory(prev => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        },
        () => setIsListening(false)
      );
    }
  };

  // Step 2: File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newUrls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        try {
          const dataUrl = await mediaService.readFileAsDataUrl(e.target.files[i]);
          newUrls.push(dataUrl);
        } catch {
          // fallback
        }
      }
      setUploadedPhotos(prev => [...prev, ...newUrls]);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // Move from Step 3 to Step 4: Generate story draft
  const handleProceedToPreview = () => {
    const selectedPeopleNames = people
      .filter(p => selectedPeopleIds.includes(p.id))
      .map(p => p.name);

    const draft = storyService.generateStoryDraft({
      title,
      year,
      location,
      peopleNames: selectedPeopleNames,
      description: promptStory
    });

    setGeneratedStory(draft);
    setCurrentStep(4);
  };

  // Step 4: Save & Commit to Memory Store
  const handleFinalSave = () => {
    const mediaItems: MemoryMedia[] = uploadedPhotos.map((url, i) => ({
      id: `med-${Date.now()}-${i}`,
      url,
      type: 'image',
      caption: title
    }));

    addMemory({
      title,
      year,
      dateStr: `${year}`,
      location,
      albumId: selectedAlbumId,
      peopleIds: selectedPeopleIds,
      media: mediaItems,
      story: generatedStory,
      status: autoApprove ? 'verified' : 'pending',
      source: 'caregiver',
      approvedBy: autoApprove ? 'Anita (Family Caregiver)' : undefined,
      era: year < 1970 ? 'Childhood' : year < 1980 ? 'College' : year < 1990 ? 'Career' : 'Wedding & Family',
      tags: [location.split(',')[0], 'Family', `${year}`]
    });

    navigate('/family/library');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/family')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-surface-border text-ink-primary font-semibold text-sm hover:bg-warm-cream shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          <span>Exit Wizard</span>
        </button>

        {/* Stepper Pill Badges */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                currentStep === step
                  ? 'bg-primary text-white shadow-soft scale-110'
                  : currentStep > step
                    ? 'bg-[#327A55] text-white'
                    : 'bg-warm-cream text-ink-secondary border border-warm-sand'
              }`}
            >
              {currentStep > step ? '✓' : step}
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-soft p-6 sm:p-10 relative overflow-hidden">
        
        {/* ======================================================== */}
        {/* STEP 1: Tell me about the story (Sofia reference) */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <div className="flex flex-col md:flex-row gap-8 items-center animate-fadeIn">
            {/* Mascot Helper */}
            <div className="w-full md:w-5/12 flex flex-col items-center text-center">
              <MascotMira
                state={isListening ? 'listening' : 'waving'}
                size="lg"
                speechText={`Hi! I'm Mira. Let's create a warm memory book for ${patientName}. What is this special moment about?`}
              />
              <span className="text-xs text-ink-secondary mt-2">
                Step 1 of 4: The Story Inspiration
              </span>
            </div>

            {/* Input Form */}
            <div className="w-full md:w-7/12 flex flex-col gap-4">
              <h2 className="font-serif text-2xl font-bold text-ink-primary">
                Tell us about {patientName}'s story
              </h2>
              <p className="text-sm text-ink-secondary">
                You can speak naturally using your microphone, or simply type your recollections below.
              </p>

              <div className="relative">
                <textarea
                  rows={5}
                  value={promptStory}
                  onChange={(e) => setPromptStory(e.target.value)}
                  placeholder="e.g. It was a pleasant autumn afternoon in 1995. Rajiv and Anita made cardamom tea in the courtyard while listening to old songs..."
                  className="w-full p-4 rounded-2xl bg-warm-cream/50 border-2 border-warm-sand focus:border-primary text-ink-primary text-base outline-none resize-none"
                />
                
                {/* Voice Input Button inside box */}
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-warm-peach text-primary-text border border-primary-200 hover:bg-primary-100'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isListening ? 'Listening... Tap to stop' : 'Speak with Voice'}</span>
                  </button>

                  <span className="text-xs text-ink-secondary">
                    {promptStory.length} characters
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-soft hover:scale-105 active:scale-95 transition-transform"
                >
                  <span>Next: Add Photographs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: Upload Images or Videos (Sofia reference) */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <div className="flex flex-col md:flex-row gap-8 items-center animate-fadeIn">
            <div className="w-full md:w-5/12 flex flex-col items-center text-center">
              <MascotMira
                state="reading"
                size="lg"
                speechText="Photographs help bring this moment alive for Rajiv! Add one or more photos."
              />
              <span className="text-xs text-ink-secondary mt-2">
                Step 2 of 4: Visual Memories
              </span>
            </div>

            <div className="w-full md:w-7/12 flex flex-col gap-4">
              <h2 className="font-serif text-2xl font-bold text-ink-primary">
                Upload Photographs
              </h2>
              <p className="text-sm text-ink-secondary">
                Drag and drop scans, family snapshots, or select local files.
              </p>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-primary/50 hover:border-primary rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-warm-cream/30 hover:bg-warm-peach/40 transition-colors">
                <Upload className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-semibold text-ink-primary">Click or drop photos here</span>
                <span className="text-xs text-ink-secondary mt-1">PNG, JPG or WEBP (local session)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Previews Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-2">
                {uploadedPhotos.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-warm-cream border border-warm-sand shadow-sm group">
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-sm font-semibold text-ink-secondary hover:text-ink-primary"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-soft hover:scale-105 active:scale-95 transition-transform"
                >
                  <span>Next: Memory Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: Details (Title, Date, People, Album) */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-ink-primary">
                Memory Details & Connections
              </h2>
              <p className="text-sm text-ink-secondary mt-1">
                Pinpoint the facts. The AI uses strictly these fields to compose the story.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Storybook Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-warm-cream border border-surface-border text-sm font-semibold text-ink-primary focus:border-primary outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Album / Category
                </label>
                <select
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-warm-cream border border-surface-border text-sm font-semibold text-ink-primary focus:border-primary outline-none"
                >
                  {albums.map(a => (
                    <option key={a.id} value={a.id}>{a.title} ({a.yearRange})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Approximate Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-warm-cream border border-surface-border text-sm font-semibold text-ink-primary focus:border-primary outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Location / Place
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 rounded-xl bg-warm-cream border border-surface-border text-sm font-semibold text-ink-primary focus:border-primary outline-none"
                  required
                />
              </div>
            </div>

            {/* People Multi-Select Tags */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-2">
                Who was with Rajiv in this memory?
              </label>
              <div className="flex flex-wrap gap-2.5">
                {people.map((person) => {
                  const isChecked = selectedPeopleIds.includes(person.id);
                  return (
                    <button
                      type="button"
                      key={person.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedPeopleIds(prev => prev.filter(id => id !== person.id));
                        } else {
                          setSelectedPeopleIds(prev => [...prev, person.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors ${
                        isChecked
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-warm-cream text-ink-secondary border-surface-border hover:bg-warm-peach'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-white shrink-0">
                        <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover" />
                      </div>
                      <span>{person.name} ({person.relationship})</span>
                      {isChecked && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-surface-border">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-sm font-semibold text-ink-secondary hover:text-ink-primary"
              >
                Back
              </button>
              <button
                onClick={handleProceedToPreview}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-soft hover:scale-105 active:scale-95 transition-transform"
              >
                <span>Generate Preview & Verify</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: Preview & Save (Deterministic Story + Verification) */}
        {/* ======================================================== */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Safety Disclaimer Banner */}
            <div className="bg-[#FEF8E7] border border-[#FAD7A0] p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <span className="font-bold block text-sm mb-0.5">Family Verification Rule:</span>
                AI-drafted text is built only from verified facts you entered. It remains a draft suggestion until approved by a family caregiver. Once approved, it appears instantly in {patientName}'s tablet app.
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-warm-cream/50 rounded-2xl p-6 border border-warm-sand flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-52 aspect-[4/3] rounded-xl overflow-hidden bg-white shadow-soft shrink-0 border border-white">
                <img src={uploadedPhotos[0]} alt={title} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1">
                <span className="text-xs font-bold text-primary-text uppercase">{year} · {location}</span>
                <h3 className="font-serif text-2xl font-bold text-ink-primary mt-1">{title}</h3>
                
                {/* Editable Final Story Draft */}
                <div className="mt-3">
                  <label className="text-[11px] font-bold text-ink-secondary uppercase block mb-1">
                    Editable Story Narrative:
                  </label>
                  <textarea
                    rows={4}
                    value={generatedStory}
                    onChange={(e) => setGeneratedStory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white border border-warm-sand text-sm font-serif text-ink-primary leading-relaxed focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Immediate Verification Checkbox */}
            <div className="p-4 rounded-2xl bg-white border border-surface-border flex items-center justify-between">
              <div>
                <h4 className="font-bold text-ink-primary text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#327A55]" />
                  <span>Approve & Verify Immediately</span>
                </h4>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Check this to make it available to {patientName} right away. Uncheck to save in Verification Queue.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-surface-border">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 text-sm font-semibold text-ink-secondary hover:text-ink-primary"
              >
                Back to Edit Details
              </button>
              <button
                onClick={handleFinalSave}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-soft hover:scale-105 active:scale-95 transition-transform"
              >
                <Check className="w-4 h-4" />
                <span>Save to Memory Library</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
