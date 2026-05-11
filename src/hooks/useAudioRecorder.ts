import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Audio recording is not supported in this browser. If you are on iOS, please use Safari.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // collect 100ms chunks of data
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      
      if (err.name === 'NotAllowedError' || err.message === 'Permission denied') {
        toast.error('Microphone access denied. Please allow microphone permissions in your browser. If you are in the AI Studio preview, you may need to open the app in a new tab.');
      } else if (err.name === 'NotFoundError') {
        toast.error('No microphone found on your device.');
      } else {
        toast.error(`Could not access microphone: ${err.message || 'Unknown error'}`);
      }
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Cleanup stream
        mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
        
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingTime(0);
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    mediaRecorderRef.current.onstop = () => {
      // Cleanup stream
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
    };

    mediaRecorderRef.current.stop();
  }, []);

  return { isRecording, recordingTime, startRecording, stopRecording, cancelRecording };
}
