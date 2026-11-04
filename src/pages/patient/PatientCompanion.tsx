import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { conversationService, speechService, voiceService } from '../../services';
import { MascotMira } from '../../components/common/MascotMira';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  MapPin, 
  Calendar,
  Music,
  Smile
} from 'lucide-react';
import { ChatMessage, Memory } from '../../types';

export const PatientCompanion: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt');

  const { memories, people, patientName, playSong, songs, voiceEnabled } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'companion',
      text: `Hello ${patientName}! Would you like to revisit a beautiful memory together today?`,
      timestamp: 'Just now',
      suggestedPrompts: [
        'Tell me about my family',
        'What happened on my wedding day?',
        'Tell me about my Goa trip',
        'Tell me about my childhood',
        'Let’s listen to my favourite music'
      ]
    }
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string>('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Handle passed initial prompt
  useEffect(() => {
    if (initialPrompt) {
      handleUserSubmit(initialPrompt);
    }
  }, [initialPrompt]);

  const handleUserSubmit = (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    // Stop ongoing speech
    speechService.stop();
    setIsSpeaking(false);

    // 2. Deterministic AI response with verified memory safety check
    setTimeout(() => {
      const aiResult = conversationService.respond(text, memories, people, patientName);
      
      const companionMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'companion',
        text: aiResult.text,
        timestamp: 'Just now',
        memoryCard: aiResult.memoryCard,
        suggestedPrompts: aiResult.suggestedPrompts
      };

      setMessages(prev => [...prev, companionMsg]);
      setIsThinking(false);

      // Auto-speak if voice is enabled
      if (voiceEnabled) {
        setIsSpeaking(true);
        speechService.speak(aiResult.text, () => {
          setIsSpeaking(false);
        });
      }
    }, 600);
  };

  const handleMicToggle = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      setVoiceNotice('Listening to your voice...');
      setIsListening(true);
      voiceService.startListening(
        (transcript) => {
          setIsListening(false);
          setVoiceNotice('');
          handleUserSubmit(transcript);
        },
        (errorMsg) => {
          setIsListening(false);
          setVoiceNotice(errorMsg);
          setTimeout(() => setVoiceNotice(''), 4000);
        }
      );
    }
  };

  const handlePlayVoice = (text: string) => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speechService.speak(text, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full h-full flex-1 animate-fadeIn pb-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => {
            speechService.stop();
            navigate('/patient');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-warm-sand hover:border-primary shadow-soft text-ink-primary font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#327A55] animate-ping" />
          <span className="font-serif text-lg font-bold text-ink-primary">
            Talking with Mira · MemoryBridge Companion
          </span>
        </div>
      </div>

      {/* Main Conversation Container (Sofia reference image 4 layout) */}
      <div className="flex-1 bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F3] to-[#F5ECE1] rounded-3xl border-3 border-warm-sand shadow-soft-lg p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
        
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.sender === 'companion' ? (
                <div className="flex items-start gap-3 sm:gap-4 max-w-3xl w-full">
                  {/* Mira Mascot Avatar */}
                  <div className="shrink-0 mt-1">
                    <MascotMira
                      state={isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle'}
                      size="sm"
                    />
                  </div>

                  {/* Speech Card */}
                  <div className="flex-1 bg-white rounded-3xl p-5 sm:p-6 shadow-soft border-2 border-warm-peach">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-text">
                        Mira Companion
                      </span>
                      <button
                        onClick={() => handlePlayVoice(msg.text)}
                        className="p-1.5 rounded-xl hover:bg-warm-peach text-ink-secondary hover:text-primary transition-colors"
                        title="Read message aloud"
                        aria-label="Read message aloud"
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4 text-primary" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <p className="font-serif text-lg sm:text-xl text-ink-primary leading-relaxed">
                      {msg.text}
                    </p>

                    {/* Verified Memory Spotlight Card Attachment (Sofia reference photo card) */}
                    {msg.memoryCard && (
                      <div className="mt-4 pt-4 border-t border-warm-sand bg-warm-cream/50 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-full sm:w-44 aspect-[4/3] rounded-xl overflow-hidden bg-white shadow-soft shrink-0 border border-white">
                          <img
                            src={msg.memoryCard.media[0]?.url}
                            alt={msg.memoryCard.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>{msg.memoryCard.dateStr}</span>
                            <span>·</span>
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span>{msg.memoryCard.location}</span>
                          </div>
                          <h4 className="font-serif text-lg font-bold text-ink-primary mt-1">
                            {msg.memoryCard.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-ink-secondary mt-1 line-clamp-2">
                            {msg.memoryCard.story}
                          </p>

                          <button
                            onClick={() => navigate(`/patient/memories?album=${msg.memoryCard?.albumId}`)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-soft hover:scale-105 active:scale-95 transition-transform"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Explore this memory in storybook →</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Suggested Follow-up Prompts */}
                    {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-warm-sand flex flex-wrap gap-2">
                        {msg.suggestedPrompts.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleUserSubmit(prompt)}
                            className="px-3 py-1.5 rounded-xl bg-warm-cream hover:bg-warm-peach text-ink-primary font-medium text-xs sm:text-sm border border-warm-sand transition-all hover:scale-105 active:scale-95"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* User speech bubble */
                <div className="bg-primary text-white rounded-3xl rounded-tr-sm px-5 py-3.5 max-w-lg shadow-soft font-medium text-base sm:text-lg">
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* Thinking / listening animation indicator */}
          {isThinking && (
            <div className="flex items-center gap-3">
              <MascotMira state="thinking" size="sm" />
              <div className="bg-white rounded-2xl px-4 py-3 shadow-soft border border-warm-sand flex items-center gap-2">
                <span className="text-sm text-ink-secondary font-medium">Mira is looking through your memory album...</span>
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Voice Feedback Notice */}
        {voiceNotice && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-warm-yellow text-amber-900 border border-amber-300 text-xs font-semibold text-center">
            {voiceNotice}
          </div>
        )}

        {/* Input Bar with Large Mic Button */}
        <div className="mt-4 pt-3 border-t border-warm-sand flex items-center gap-3">
          {/* Big Mic Button */}
          <button
            onClick={handleMicToggle}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-soft transition-all hover:scale-105 active:scale-95 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
            title={isListening ? "Stop listening" : "Talk with your voice"}
            aria-label={isListening ? "Stop voice listening" : "Start voice listening"}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text input with fallback */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUserSubmit(inputText)}
              placeholder="Type anything or ask a question about your memories..."
              className="w-full bg-white rounded-2xl py-3.5 pl-4 pr-12 text-ink-primary placeholder:text-ink-muted border-2 border-warm-sand focus:border-primary shadow-sm outline-none text-base sm:text-lg"
            />
            <button
              onClick={() => handleUserSubmit(inputText)}
              disabled={!inputText.trim()}
              className="absolute right-2.5 p-2 rounded-xl bg-primary text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-primary-hover transition-colors"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
