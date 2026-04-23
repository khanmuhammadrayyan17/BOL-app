import { motion } from "motion/react";
import { SproutIcon, DropletIcon } from "../components/AppIcons";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { MicButton } from "../components/MicButton";
import { FeedbackCard } from "../components/FeedbackCard";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

interface Plant {
  word: string;
  growth: number;
  emoji: string;
}

/** Priority list of female voices. */
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

export default function PetGarden() {
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null);
  const [plants, setPlants] = useState<Plant[]>([
    { word: "happy", growth: 80, emoji: "🌻" },
    { word: "beautiful", growth: 60, emoji: "🌷" },
    { word: "explore", growth: 40, emoji: "🌱" },
    { word: "adventure", growth: 20, emoji: "🌿" },
  ]);

  const [feedback, setFeedback] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { isRecording, audioBlob, volume, error: micError, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  const handleMicToggle = async () => {
    if (!isRecording && selectedPlant !== null) {
      startRecording();
    } else if (isRecording) {
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
    if (audioBlob && selectedPlant !== null) {
      const sendAudio = async () => {
        setChecking(true);
        setFeedback(null);
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);

        const currentWord = plants[selectedPlant].word;
        const formData = new FormData();
        formData.append('audio', audioBlob, 'garden.webm');
        formData.append('prompt', `(Target: ${currentWord})`);
        formData.append('type', 'vocabulary');

        try {
          const baseUrl = import.meta.env.VITE_API_URL || '/backend';
          const res = await fetch(`${baseUrl}/voice-check`, {
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

            // Only grow the plant if the backend explicitly flagged it as CORRECT
            if (!data.error && data.isCorrect === true) {
              setPlants(prev => prev.map((p, i) => 
                i === selectedPlant ? { ...p, growth: Math.min(100, p.growth + 20) } : p
              ));
            }

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
  }, [audioBlob, clearAudio, selectedPlant]);

  const handleTryAgain = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setFeedback(null);
    setHasResponded(false);
    clearAudio();
  };

  const handleFinish = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setFeedback(null);
    setHasResponded(false);
    setSelectedPlant(null);
    clearAudio();
  };

  const feedbackText = feedback?.error
    ? feedback.error
    : feedback?.result
    ? feedback.result
    : feedback
    ? 'No feedback from backend.'
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50 to-[#FFF8F0] flex flex-col">
      <TopBar showBack />
      
      <div className="flex-1 overflow-y-auto pb-24 px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <SproutIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">Vocabulary Garden</span>
          </div>
          <h1 className="text-2xl font-bold">Pet Garden 🌱</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grow vocabulary words by using them in sentences
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl p-6 mb-6 border-2 border-green-200 min-h-64 shadow-inner">
          <div className="grid grid-cols-2 gap-4">
            {plants.map((plant, idx) => (
              <motion.button
                key={idx}
                onClick={() => {
                  if (!checking && !isRecording) {
                    setSelectedPlant(idx);
                    setFeedback(null);
                    setHasResponded(false);
                  }
                }}
                className={`bg-white rounded-2xl p-4 border-2 transition-all shadow-sm ${
                  selectedPlant === idx 
                    ? "border-green-500 scale-105 ring-4 ring-green-100" 
                    : "border-green-200 hover:border-green-300"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-4xl mb-2">{plant.emoji}</div>
                <p className="font-semibold text-sm mb-2">{plant.word}</p>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-400"
                    animate={{ width: `${plant.growth}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plant.growth}%</p>
              </motion.button>
            ))}
          </div>
        </div>

        {selectedPlant !== null && !hasResponded && !checking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-white rounded-3xl p-5 border-2 border-green-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <DropletIcon className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-green-800">Water this plant!</h3>
              </div>
              <p className="text-base mb-3 leading-relaxed text-gray-700">
                Say a sentence using the word <span className="font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">"{plants[selectedPlant].word}"</span>
              </p>
              <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-xs text-muted-foreground italic">
                  Example: "The flower is very {plants[selectedPlant].word}!"
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-red-100">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-600 uppercase tracking-wide">Listening...</span>
            </div>
          </motion.div>
        )}

        {checking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-orange-100">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-orange-600">Analyzing speech...</span>
            </div>
          </motion.div>
        )}

        {hasResponded && !checking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <FeedbackCard
              correct={!feedback?.error}
              feedback={feedbackText}
              suggestion={typeof feedback?.details === 'string' ? feedback.details : undefined}
            />
            
            {feedbackText && (
              <button
                onClick={() => handleSpeak(feedbackText)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border-2 border-green-200 text-green-700 text-sm font-semibold hover:bg-green-50 transition-colors shadow-sm"
              >
                {isSpeaking ? (
                   <>
                     <span className="text-base">🔇</span> Stop Speaking
                   </>
                ) : (
                   <>
                     <span className="text-base">🔊</span> Hear Correction Again
                   </>
                )}
              </button>
            )}

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleTryAgain}
                className="w-full border-2 border-green-500 text-green-700 font-bold py-4 px-6 rounded-2xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                🎙️ Try Another Sentence
              </button>
              <button
                onClick={handleFinish}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
              >
                Done with this plant ✨
              </button>
            </div>
          </motion.div>
        )}

        {/* Standard Centered Mic Button Area */}
        {!hasResponded && !checking && (
          <div className="w-full flex flex-col items-center justify-center py-8">
            <MicButton
              isRecording={isRecording}
              volume={volume}
              onToggle={handleMicToggle}
              disabled={selectedPlant === null}
              size="lg"
            />
            <p className={`text-sm font-medium mt-4 transition-colors ${selectedPlant === null ? 'text-gray-400' : 'text-green-700'}`}>
              {selectedPlant === null 
                ? "Select a plant to start" 
                : isRecording 
                  ? "Stop when finished" 
                  : "Tap to water the plant"}
            </p>
            
            {micError && (
              <div className="mt-4 max-w-xs bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-4 text-xs text-center font-medium animate-bounce">
                ⚠️ {micError}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}