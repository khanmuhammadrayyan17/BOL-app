import { useState, useCallback, useRef, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { PetDisplay } from "../components/PetDisplay";
import { MicButton } from "../components/MicButton";
import { PromptCard } from "../components/PromptCard";
import { FeedbackCard } from "../components/FeedbackCard";
import { RewardCard } from "../components/RewardCard";
import { motion } from "motion/react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

/** Priority list of female voices to try. */
const PREFERRED_FEMALE_VOICES = [
  "Google UK English Female",
  "Google US English",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Zira - English (United States)",
  "Samantha",
  "Karen",
  "Moira",
];

function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const name of PREFERRED_FEMALE_VOICES) {
    const match = voices.find(v => v.name === name);
    if (match) return match;
  }
  return voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')) ?? null;
}

function speakText(text: string): SpeechSynthesisUtterance | null {
  if (!window.speechSynthesis) return null;
  window.speechSynthesis.cancel();
  
  const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);

  const setVoiceAndSpeak = () => {
    const voice = pickFemaleVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      setVoiceAndSpeak();
    };
  } else {
    setVoiceAndSpeak();
  }

  return utterance;
}

export default function MorningGreeting() {
  const [hasSpoken, setHasSpoken] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { isRecording, audioBlob, volume, error: micError, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  const prompt = "She sells sea shells by the sea shore";

  const handleMicToggle = async () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleSpeak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utt = speakText(text);
    if (!utt) return;
    utteranceRef.current = utt;
    setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
  }, [isSpeaking]);

  useEffect(() => {
    if (audioBlob) {
      const sendAudio = async () => {
        setChecking(true);
        setFeedback(null);
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'greeting.webm');
        formData.append('prompt', prompt);
        formData.append('type', 'tongue-twister');

        try {
          const res = await fetch('/backend/voice-check', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) {
            const text = await res.text();
            const errMsg = `HTTP ${res.status}: ${text}`;
            setFeedback({ error: errMsg });
            speakText(errMsg);
            setIsSpeaking(true);
          } else {
            const data = await res.json();
            setFeedback(data);
            const toSpeak = data?.result || data?.error || 'No feedback from backend.';
            const utt = speakText(toSpeak);
            if (utt) {
              utteranceRef.current = utt;
              setIsSpeaking(true);
              utt.onend = () => setIsSpeaking(false);
              utt.onerror = () => setIsSpeaking(false);
            }
          }
        } catch (e: any) {
          const errMsg = 'Error contacting backend: ' + (e?.message || e);
          setFeedback({ error: errMsg });
          speakText(errMsg);
          setIsSpeaking(true);
        }
        setHasSpoken(true);
        setChecking(false);
        clearAudio();
      };
      sendAudio();
    }
  }, [audioBlob, clearAudio]);

  const handleTryAgain = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setFeedback(null);
    setHasSpoken(false);
    clearAudio();
  };

  if (showReward) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
        <TopBar showBack />
        <div className="flex-1 flex items-center justify-center p-6">
          <RewardCard
            xp={25}
            diamonds={5}
            message="You woke up Dino with a perfect tongue twister!"
            onContinue={() => window.history.back()}
          />
        </div>
      </div>
    );
  }

  const feedbackText = feedback?.error
    ? feedback.error
    : feedback?.result
    ? feedback.result
    : feedback
    ? 'No feedback from backend.'
    : '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FBE6A2] via-[#F7E9B7] to-[#D8EEFF] flex flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-8 h-52 w-52 -translate-x-1/2 rounded-full bg-[#FFD86B] blur-2xl opacity-70" />
        <div className="absolute left-1/2 top-10 h-32 w-32 -translate-x-1/2 rounded-full bg-[#FFD34D] shadow-[0_0_80px_20px_rgba(255,200,80,0.45)]" />
        <div className="absolute left-1/2 top-6 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,225,120,0.35)_0%,rgba(255,225,120,0.18)_35%,rgba(255,225,120,0)_70%)]" />
        <div className="absolute left-10 top-24 h-8 w-20 rounded-full bg-white/85 blur-[0.4px]" />
        <div className="absolute left-20 top-20 h-10 w-14 rounded-full bg-white/80" />
        <div className="absolute right-12 top-28 h-8 w-24 rounded-full bg-white/85 blur-[0.4px]" />
        <div className="absolute right-24 top-22 h-10 w-14 rounded-full bg-white/80" />
        <div className="absolute -bottom-20 left-[-6%] h-52 w-[68%] rounded-[50%] bg-gradient-to-b from-[#A7DB75] to-[#6FB74F]" />
        <div className="absolute -bottom-24 right-[-10%] h-60 w-[72%] rounded-[50%] bg-gradient-to-b from-[#95D56A] to-[#5CA53F]" />
        <div className="absolute bottom-0 left-0 h-20 w-full bg-gradient-to-b from-[#82C75C]/70 to-[#6FB74F]/80" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <TopBar showBack />
        
        <div className="flex-1 overflow-y-auto pb-24 px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-[14px] font-medium text-muted-foreground">Morning Routine</span>
            </div>
            <h1 className="text-[32px] font-bold leading-none">Wake Up Dino! 🌅</h1>
            <p className="text-[16px] text-muted-foreground mt-2">
              Say the tongue twister to wake your sleepy pet
            </p>
          </div>

          <div className="mb-6">
            <PetDisplay mood={hasSpoken && !feedback?.error ? "happy" : "sleepy"} size="lg" />
          </div>

          <div className="mb-6">
            <PromptCard title="Say This:" color="yellow">
              <div className="bg-white rounded-2xl p-4 mt-3">
                <p className="text-[18px] font-medium text-center leading-relaxed">
                  "{prompt}"
                </p>
              </div>
            </PromptCard>
          </div>

          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[14px] font-medium">Recording...</span>
              </div>
            </motion.div>
          )}

          {checking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <span className="text-[14px] font-medium">Checking...</span>
              </div>
            </motion.div>
          )}

          {hasSpoken && !checking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <FeedbackCard
                correct={!feedback?.error}
                feedback={feedbackText}
                suggestion={typeof feedback?.details === 'string' ? feedback.details : undefined}
              />
              {feedbackText && (
                <button
                  onClick={() => handleSpeak(feedbackText)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-medium hover:bg-yellow-100 transition-colors"
                >
                  {isSpeaking ? "🔇 Stop Speaking" : "🔊 Hear Feedback Again"}
                </button>
              )}

              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={handleTryAgain}
                  className="w-full border-2 border-yellow-400 text-yellow-700 font-semibold py-3 px-6 rounded-2xl hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
                >
                  🎙️ Try Again
                </button>
                <button
                  onClick={() => setShowReward(true)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold py-4 px-6 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                >
                  Dino is Awake! Collect Rewards ✨
                </button>
              </div>
            </motion.div>
          )}

          {!hasSpoken && !checking && (
            <div className="w-full flex flex-col items-center justify-center gap-3">
              <div className="flex flex-col items-center">
                <MicButton
                  isRecording={isRecording}
                  volume={volume}
                  onToggle={handleMicToggle}
                  size="lg"
                />
                <p className="text-[14px] text-muted-foreground mt-3 text-center">
                  {isRecording ? "Tap to stop" : "Tap to speak"}
                </p>
              </div>
              {micError && (
                <div className="max-w-xs mx-auto bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-4 text-sm text-center">
                  ⚠️ {micError}
                </div>
              )}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}