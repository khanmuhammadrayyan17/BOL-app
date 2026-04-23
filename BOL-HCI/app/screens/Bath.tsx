import { useState, useCallback, useRef, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { PetDisplay } from "../components/PetDisplay";
import { MicButton } from "../components/MicButton";
import { PromptCard } from "../components/PromptCard";
import { FeedbackCard } from "../components/FeedbackCard";
import { RewardCard } from "../components/RewardCard";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { ChevronRightIcon } from "../components/AppIcons";

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

export default function Bath() {
  const [hasSpoken, setHasSpoken] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [bubbles, setBubbles] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { isRecording, audioBlob, volume, error: micError, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  const imageContext = "A beautiful mountain landscape with a clear blue sky, fresh air, and a tranquil lake.";

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
    if (audioBlob) {
      const sendAudio = async () => {
        setChecking(true);
        setFeedback(null);
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'bath.webm');
        formData.append('prompt', imageContext);
        formData.append('type', 'description');

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
            if (data.bubbles) {
              setBubbles(data.bubbles);
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
    setBubbles(0);
    clearAudio();
  };

  if (showReward) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
        <TopBar showBack />
        <div className="flex-1 flex items-center justify-center p-6">
          <RewardCard
            xp={35}
            diamonds={10}
            message={`You described ${bubbles} details! Dino is squeaky clean!`}
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-[#FFF8F0] flex flex-col">
      <TopBar showBack />
      
      <div className="flex-1 overflow-y-auto pb-24 px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">Bath Time</span>
          </div>
          <h1 className="text-2xl font-bold">Bath Time! 🛁</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Describe the image in English - more details = more bubbles!
          </p>
        </div>

        <div className="mb-6">
          <PetDisplay mood={hasSpoken && !feedback?.error ? "happy" : "dirty"} size="lg" showBubbles={hasSpoken && bubbles > 0} />
        </div>

        {/* Bubble Counter */}
        {hasSpoken && !checking && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-6 flex justify-center"
          >
            <div className="bg-blue-100 border-2 border-blue-200 rounded-2xl px-6 py-3 flex items-center gap-2 shadow-sm">
              <span className="text-3xl">🫧</span>
              <div>
                <p className="text-sm text-muted-foreground">Bubbles Created</p>
                <p className="text-2xl font-bold text-blue-600">{bubbles}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-6">
          <PromptCard title="Describe This Picture:" color="blue">
            <div className="bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl p-4 mt-3 aspect-video flex items-center justify-center shadow-inner overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
                alt="Mountain landscape"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Try to describe: <span className="font-medium text-blue-700 underline underline-offset-2 decoration-blue-200">what you see</span>, colors, objects, location, weather, feelings
            </p>
          </PromptCard>
        </div>

        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-red-100">
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
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-orange-100">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-orange-600">Analyzing your description...</span>
            </div>
          </motion.div>
        )}

        {hasSpoken && !checking && (
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
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border-2 border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm"
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

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleTryAgain}
                className="w-full border-2 border-blue-400 text-blue-700 font-bold py-4 px-6 rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                🎙️ Try Again
              </button>
              <button
                onClick={() => setShowReward(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-sky-600 text-white font-bold py-4 px-6 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
              >
                Finish & Collect Rewards ✨
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {!hasSpoken && !checking && (
          <div className="w-full flex flex-col items-center justify-center py-8">
            <MicButton
              isRecording={isRecording}
              volume={volume}
              onToggle={handleMicToggle}
              size="lg"
            />
            <p className="text-sm font-medium text-blue-700 mt-4 text-center">
              {isRecording ? "Keep describing..." : "Tap and describe"}
            </p>
            {micError && (
              <div className="mt-4 max-w-xs bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-4 text-xs text-center font-medium">
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
