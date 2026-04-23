import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { BookOpenIcon, ChevronRightIcon } from "../components/AppIcons";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { PetDisplay } from "../components/PetDisplay";
import { MicButton } from "../components/MicButton";
import { PromptCard } from "../components/PromptCard";
import { FeedbackCard } from "../components/FeedbackCard";
import { RewardCard } from "../components/RewardCard";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

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

// Pulled out to avoid React rendering loop dependency issues
const story = [
  { text: "Once upon a time, there was a little dinosaur named Dino who loved to learn new words.", image: "🦕" },
  { text: "Every day, Dino would practice speaking English with friends from around the world.", image: "🌍" },
  { text: "The more Dino practiced, the more confident and happy Dino became!", image: "⭐" }
];

const question = {
  q: "What did Dino love to do?",
  a: "Learn new words"
};

export default function StoryTime() {
  const [currentPage, setCurrentPage] = useState(0);
  const [hasRead, setHasRead] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSubmittingRef = useRef(false);

  const { isRecording, audioBlob, volume, error: micError, startRecording, stopRecording, clearAudio } = useAudioRecorder();

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
        formData.append('audio', audioBlob, showQuestion ? 'answer.webm' : 'reading.webm');
        
        if (showQuestion) {
          formData.append('prompt', `${question.q} (Expected: ${question.a})`);
          formData.append('type', 'comprehension');
        } else {
          formData.append('prompt', story[currentPage].text);
          formData.append('type', 'reading');
        }

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
        
        if (showQuestion) {
          setHasAnswered(true);
        } else {
          setHasRead(true);
        }
        setChecking(false);
        clearAudio();
        isSubmittingRef.current = false;
      };
      
      sendAudio();
    }
  }, [audioBlob, clearAudio, showQuestion, currentPage]);

  const handleNext = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setFeedback(null);
    clearAudio();
    
    if (currentPage < story.length - 1) {
      setCurrentPage(currentPage + 1);
      setHasRead(false);
    } else {
      setShowQuestion(true);
    }
  };

  const handleSkipToQuestion = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setFeedback(null);
    clearAudio();
    setShowQuestion(true);
  };

  const handleTryAgain = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setFeedback(null);
    if (showQuestion) setHasAnswered(false);
    else setHasRead(false);
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
            message="You successfully read the story and answered the question!"
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-[#FFF8F0] flex flex-col">
      <TopBar showBack />
      
      <div className="flex-1 overflow-y-auto pb-24 px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Story Time</span>
            </div>
            {!showQuestion && (
              <span className="text-sm font-medium text-muted-foreground">
                Page {currentPage + 1}/{story.length}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">Story Time 📖</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read aloud and answer comprehension questions
          </p>
        </div>

        {/* Progress */}
        {!showQuestion && (
          <div className="h-2 bg-white rounded-full overflow-hidden mb-6">
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-400"
              animate={{ width: `${((currentPage + 1) / story.length) * 100}%` }}
            />
          </div>
        )}

        <div className="mb-6">
          <PetDisplay mood="learning" size="md" />
        </div>

        {!showQuestion ? (
          <>
            {/* Story Page */}
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl p-8 border-2 border-orange-200 text-center mb-4 shadow-sm">
                <div className="text-7xl mb-4">{story[currentPage].image}</div>
                <p className="text-lg leading-relaxed font-medium">
                  {story[currentPage].text}
                </p>
              </div>
            </motion.div>

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

            {hasRead && !checking && (
              <>
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
                      className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border-2 border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition-colors shadow-sm"
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
                </motion.div>

                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={handleTryAgain}
                    className="w-full border-2 border-orange-400 text-orange-700 font-semibold py-3 px-6 rounded-2xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                  >
                    🎙️ Try Again
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold py-4 px-6 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
                  >
                    {currentPage < story.length - 1 ? "Next Page" : "Answer Question"}
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {!hasRead && !checking && (
              <div className="w-full flex flex-col items-center justify-center gap-3 mt-4">
                <div className="flex flex-col items-center">
                  <MicButton
                    isRecording={isRecording}
                    volume={volume}
                    onToggle={handleMicToggle}
                    size="lg"
                  />
                  <p className="text-sm font-medium text-muted-foreground mt-4 text-center">
                    {isRecording ? "Tap to stop" : "Tap to speak"}
                  </p>
                </div>
                {micError && (
                  <div className="mt-2 max-w-xs mx-auto bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-4 text-sm text-center">
                    ⚠️ {micError}
                  </div>
                )}
                
                <button 
                  onClick={handleSkipToQuestion}
                  className="mt-6 text-sm font-bold text-orange-400 hover:text-orange-500 transition-colors"
                >
                  Skip to Question ⏭️
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Comprehension Question */}
            <div className="mb-6">
              <PromptCard title="Comprehension Question:" color="orange">
                <div className="bg-white rounded-2xl p-4 mt-3">
                  <p className="text-lg font-medium text-center leading-relaxed">
                    {question.q}
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
                  <span className="text-sm font-medium text-orange-600">Checking answer...</span>
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
                    className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border-2 border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition-colors shadow-sm"
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
                    className="w-full border-2 border-orange-400 text-orange-700 font-semibold py-3 px-6 rounded-2xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    🎙️ Try Again
                  </button>
                  <button
                    onClick={() => setShowReward(true)}
                    className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white font-bold py-4 px-6 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                  >
                    Finish Story ✨
                  </button>
                </div>
              </motion.div>
            )}

            {!hasAnswered && !checking && (
              <div className="w-full flex flex-col items-center justify-center gap-3 py-6">
                <div className="flex flex-col items-center">
                  <MicButton
                    isRecording={isRecording}
                    volume={volume}
                    onToggle={handleMicToggle}
                    size="lg"
                  />
                  <p className="text-sm font-medium text-muted-foreground mt-4 text-center">
                    {isRecording ? "Tap to stop" : "Tap to speak your answer"}
                  </p>
                </div>
                {micError && (
                  <div className="mt-2 max-w-xs mx-auto bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-4 text-sm text-center font-medium animate-bounce">
                    ⚠️ {micError}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}