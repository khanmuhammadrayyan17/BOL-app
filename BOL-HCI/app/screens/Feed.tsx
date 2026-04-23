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

const questions = [
  {
    sentence: "Yesterday, I ___ to the park.",
    options: ["go", "went", "going"],
    correct: "went",
    tense: "Past Simple"
  },
  {
    sentence: "She ___ English every day.",
    options: ["study", "studies", "studied"],
    correct: "studies",
    tense: "Present Simple"
  },
  {
    sentence: "They ___ a movie right now.",
    options: ["watch", "watching", "are watching"],
    correct: "are watching",
    tense: "Present Continuous"
  }
];

export default function Feed() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSubmittingRef = useRef(false);

  const { isRecording, audioBlob, volume, error: micError, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  const currentQ = questions[currentQuestion];

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
    if (audioBlob && !isSubmittingRef.current) {
      isSubmittingRef.current = true;
      const sendAudio = async () => {
        setChecking(true);
        setFeedback(null);
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'feed.webm');
        formData.append('prompt', `${currentQ.sentence} (Expected: ${currentQ.correct})`);
        formData.append('type', 'grammar-check');

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
        setHasAnswered(true);
        setChecking(false);
        clearAudio();
      };
      sendAudio();
    }
  }, [audioBlob, clearAudio, currentQ]);

  const handleTryAgain = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setFeedback(null);
    setHasAnswered(false);
    clearAudio();
    isSubmittingRef.current = false;
  };

  const handleNext = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setHasAnswered(false);
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
            xp={30}
            diamonds={8}
            message="Dino is full and happy! Great grammar work!"
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FFF2DC] via-[#FDE8CB] to-[#F7E3CF] flex flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-40 w-full bg-gradient-to-b from-[#F8D7AE] to-[#F2C897]" />
        <div className="absolute left-1/2 top-[13.5rem] h-18 w-[78%] -translate-x-1/2 rounded-2xl bg-gradient-to-b from-[#B87D4E] to-[#9D693E] shadow-[0_12px_24px_rgba(90,55,30,0.28)]" />
        <div className="absolute left-1/2 top-[14.15rem] h-8 w-16 -translate-x-1/2 rounded-b-[999px] rounded-t-[999px] border-2 border-white/70 bg-[#FDFCF8]" />
        <div className="absolute left-1/2 top-[14.35rem] h-3 w-10 -translate-x-1/2 rounded-full bg-[#F5B35B]" />
        <div className="absolute -top-12 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#FFD9A6]/35 blur-2xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <TopBar showBack />
        
        <div className="flex-1 overflow-y-auto pb-24 px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">Feeding Time</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {currentQuestion + 1}/{questions.length}
              </span>
            </div>
            <h1 className="text-2xl font-bold">Feed Dino! 🍎</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Say the correct verb form to feed your pet
            </p>
          </div>

          <div className="h-2 bg-white rounded-full overflow-hidden mb-6">
            <motion.div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="mb-6">
            <PetDisplay mood={hasAnswered && !feedback?.error ? "happy" : "hungry"} size="lg" />
          </div>

          <div className="mb-6">
            <PromptCard title={`Tense: ${currentQ.tense}`} color="green">
              <div className="bg-white rounded-2xl p-4 mt-3">
                <p className="text-lg font-medium text-center leading-relaxed">
                  {currentQ.sentence}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Choose one and say it:</p>
                {currentQ.options.map((option, idx) => (
                  <div key={idx} className={`bg-white rounded-xl px-4 py-3 text-center font-bold border-2 ${hasAnswered && option === currentQ.correct ? 'border-green-400 text-green-600' : 'border-gray-100'}`}>
                    {option}
                  </div>
                ))}
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

          {hasAnswered && !checking && (
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
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  {isSpeaking ? "🔇 Stop Speaking" : "🔊 Hear Feedback Again"}
                </button>
              )}

              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={handleTryAgain}
                  className="w-full border-2 border-green-400 text-green-700 font-semibold py-3 px-6 rounded-2xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  🎙️ Try Again
                </button>
                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-400 text-white font-semibold py-4 px-6 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                >
                  {currentQuestion < questions.length - 1 ? "Next Question" : "Finish & Collect Rewards ✨"}
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {!hasAnswered && !checking && (
            <div className="w-full flex flex-col items-center justify-center gap-3">
              <div className="flex flex-col items-center">
                <MicButton
                  isRecording={isRecording}
                  volume={volume}
                  onToggle={handleMicToggle}
                  size="lg"
                />
                <p className="text-sm text-muted-foreground mt-3 text-center">
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
