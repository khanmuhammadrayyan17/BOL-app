import { useRef, useState, useCallback } from 'react';

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Guard against duplicate onstop events producing the same blob twice
  const lastBlobRef = useRef<{ size: number; ts: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    setAudioBlob(null);
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setVolume(0);

    // Check secure context (required for microphone on mobile)
    if (!window.isSecureContext) {
      setError('Microphone requires HTTPS. Please access the app via the localtunnel HTTPS URL.');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Microphone API not available. Please use HTTPS or a supported browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Web Audio API for volume detection ONLY (Diagnostic)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const updateVolume = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const threshold = 20;
        const normalizedVolume = average > threshold ? ((average - threshold) / (255 - threshold)) * 100 : 0;
        setVolume(Math.round(normalizedVolume));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Determine supported MIME type
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ].find(type => window.MediaRecorder.isTypeSupported(type)) || '';

      console.log('Using MIME type:', mimeType);

      // Record DIRECTLY from the microphone stream
      const mediaRecorder = new window.MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log(`Chunk received: ${(e.data.size / 1024).toFixed(2)} KB`);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        console.log('Recording finished. Total size:', (finalBlob.size / 1024).toFixed(2), 'KB');
        // If we recently set a blob with the same size, assume this is a duplicate onstop
        const now = Date.now();
        if (lastBlobRef.current && lastBlobRef.current.size === finalBlob.size && (now - lastBlobRef.current.ts) < 3000) {
          console.warn('Duplicate recording onstop detected; ignoring second blob');
        } else {
          setAudioBlob(finalBlob);
          lastBlobRef.current = { size: finalBlob.size, ts: now };
        }
        setAudioUrl(URL.createObjectURL(finalBlob));
        
        // Stop all tracks in the microphone stream
        stream.getTracks().forEach((track) => track.stop());
        
        // Clean up audio context
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) {
          source.disconnect();
          analyser.disconnect();
          audioContextRef.current.close();
        }
        setVolume(0);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access and try again.');
      } else if (err?.name === 'NotFoundError') {
        setError('No microphone found on this device.');
      } else {
        setError(`Microphone error: ${err?.message || err}`);
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const clearAudio = useCallback(() => {
    setAudioBlob(null);
  }, []);

  const revokeAudio = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  return { isRecording, audioBlob, audioUrl, volume, error, startRecording, stopRecording, clearAudio, revokeAudio };
}
