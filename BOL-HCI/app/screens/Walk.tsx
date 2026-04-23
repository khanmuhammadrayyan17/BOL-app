import { motion } from "motion/react";
import { MapPinIcon, ChevronRightIcon } from "../components/AppIcons";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { PetDisplay } from "../components/PetDisplay";
import { MicButton } from "../components/MicButton";
import { PromptCard } from "../components/PromptCard";
import { FeedbackCard } from "../components/FeedbackCard";
import { RewardCard } from "../components/RewardCard";
import React, { useState, useCallback, useRef, useEffect } from "react";
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
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  for (const name of PREFERRED_FEMALE_VOICES) {
    const match = voices.find(v => v.name === name);
    if (match) return match;
  }
  return voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')) ?? null;
}

function speakText(text: string): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
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

const scenarios = [
  {
    location: "Coffee Shop ☕",
    situation: "You're ordering a coffee",
    prompt: "Hello! What would you like to order today?",
    expected: "Any coffee type (e.g., espresso, cappuccino, or black coffee)"
  },
  {
    location: "Doctor's Office 🏥",
    situation: "The doctor asks how you feel",
    prompt: "How are you feeling today? Any symptoms?",
    expected: "I have a headache"
  },
  {
    location: "Restaurant 🍽️",
    situation: "The waiter takes your order",
    prompt: "Are you ready to order?",
    expected: "Yes, I'll have the pasta"
  }
];

export default function Walk() {
  const [currentScene, setCurrentScene] = useState(0);
  const [hasResponded, setHasResponded] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSubmittingRef = useRef(false);

  const { isRecording, audioBlob, volume, error: micError, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  const current = scenarios[currentScene];

  const handleMicToggle = async () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleSpeak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
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
    if (audioBlob && !isSubmittingRef.current) {
      isSubmittingRef.current = true;
      const sendAudio = async () => {
        setChecking(true);
        setFeedback(null);
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'walk.webm');
        formData.append('prompt', `${current.situation}: "${current.prompt}" (Expected: ${current.expected})`);
        formData.append('type', 'conversation');

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
        setHasResponded(true);
        setChecking(false);
        clearAudio();
      };
      sendAudio();
    }
  }, [audioBlob, clearAudio, current]);

  const handleTryAgain = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setFeedback(null);
    setHasResponded(false);
    clearAudio();
    isSubmittingRef.current = false;
  };

  const handleNext = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    if (currentScene < scenarios.length - 1) {
      setCurrentScene(currentScene + 1);
      setHasResponded(false);
      setFeedback(null);
      clearAudio();
      isSubmittingRef.current = false;
    } else {
      setShowReward(true);
    }
  };

  if (showReward) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
        <TopBar showBack />
        <div className="flex-1 flex items-center justify-center p-6">
          <RewardCard
            xp={40}
            diamonds={12}
            message="Great walk! Dino learned real-life conversations!"
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#CFEAFF] via-[#E4F3FF] to-[#F7F2E8] flex flex-col">
      {/* Decorative suburban walk background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-14 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#FFE4A8]/35 blur-2xl" />
        <div className="absolute left-10 top-16 h-8 w-20 rounded-full bg-white/85" />
        <div className="absolute left-16 top-13 h-10 w-14 rounded-full bg-white/80" />
        <div className="absolute right-10 top-20 h-8 w-24 rounded-full bg-white/85" />
        <div className="absolute right-24 top-16 h-10 w-14 rounded-full bg-white/80" />
        <div className="absolute left-0 bottom-28 h-10 w-full bg-[#7EC56E]/80" />
        <div className="absolute right-0 bottom-0 h-44 w-[38%] bg-[#5B6471]" />
        <div className="absolute left-0 bottom-0 h-36 w-full bg-[#D8D2C8]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <TopBar showBack />
        
        <div className="flex-1 overflow-y-auto pb-24 px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-muted-foreground">Conversation Practice</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {currentScene + 1}/{scenarios.length}
              </span>
            </div>
            <h1 className="text-2xl font-bold">Walk! 🚶</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Practice real-life conversations with Dino
            </p>
          </div>

          <div className="h-2 bg-white rounded-full overflow-hidden mb-6">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-400 to-green-400"
              animate={{ width: `${((currentScene + 1) / scenarios.length) * 100}%` }}
            />
          </div>

          <div className="mb-6">
            <PetDisplay mood={hasResponded && !feedback?.error ? "happy" : "learning"} size="md" />
          </div>

          <div className="mb-6">
            <div className="bg-white rounded-2xl p-4 border-2 border-emerald-200 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{current.location.split(' ')[1] || '📍'}</span>
                <h3 className="font-semibold">{current.location.split(' ')[0]}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{current.situation}</p>
            </div>

            <PromptCard title="They Say:" color="green">
              <div className="bg-white rounded-2xl p-4 mt-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                    👤
                  </div>
                  <p className="text-base leading-relaxed pt-1.5 font-medium">
                    "{current.prompt}"
                  </p>
                </div>
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
                <span className="text-sm font-medium">Listening...</span>
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
                <span className="text-sm font-medium">Checking...</span>
              </div>
            </motion.div>
          )}

          {hasResponded && !checking && (
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
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  {isSpeaking ? (
                    <>
                      <span className="text-base">🔇</span> Stop Speaking
                    </>
                  ) : (
                    <>
                      <span className="text-base">🔊</span> Hear Feedback Again
                    </>
                  )}
                </button>
              )}

              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={handleTryAgain}
                  className="w-full border-2 border-emerald-400 text-emerald-700 font-semibold py-3 px-6 rounded-2xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                >
                  🎙️ Try Again
                </button>
                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-emerald-400 to-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                >
                  {currentScene < scenarios.length - 1 ? "Next Scenario" : "Finish & Collect Rewards ✨"}
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {!hasResponded && !checking && (
            <div className="w-full flex flex-col items-center justify-center gap-3">
              <div className="flex flex-col items-center">
                <MicButton
                  isRecording={isRecording}
                  volume={volume}
                  onToggle={handleMicToggle}
                  size="lg"
                />
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  {isRecording ? "Tap to stop" : "Tap to respond"}
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