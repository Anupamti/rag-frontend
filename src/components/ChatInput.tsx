import { transcribeAudio } from '@/utils/transcription';
import { useState, useRef, FormEvent, KeyboardEvent, useEffect } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  onTranscribedText: (text: string) => void;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  onTranscribedText
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Auto-resize textarea
  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  // Handle key press
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
        
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };
  
  // Clean up audio resources
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context and analyzer for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 32; // Small for simple visualization
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Start visualization
      visualizeAudio();
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        // Stop visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        setIsTranscribing(true);
        try {
          const transcribedText = await transcribeAudio(audioBlob);
          onTranscribedText(transcribedText);
          textareaRef.current?.focus();
        } catch (error) {
          console.error('Transcription error:', error);
        } finally {
          setIsTranscribing(false);
          setAudioLevel([]); // Clear visualizer
        }
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };
  
  // Visualize audio
  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVisualizer = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Sample a few values from the frequency data for visualization
      const levels = Array.from({ length: 5 }, (_, i) => {
        const index = Math.floor(i * (bufferLength / 5));
        return dataArray[index] / 255; // Normalize to 0-1
      });
      
      setAudioLevel(levels);
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };
    
    updateVisualizer();
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <textarea
        ref={textareaRef}
        className="w-full px-4 py-3 pr-24 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[52px] max-h-[200px]"
        placeholder="Message..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled || isRecording || isTranscribing}
        rows={1}
      />
      
      {/* Container for visualizer and buttons with fixed positioning */}
      <div className="absolute right-2 bottom-1 flex items-center">
        {/* Audio visualizer - reduced size for mobile */}
        {isRecording && audioLevel.length > 0 && (
          <div className="flex items-end h-6 space-x-px mr-2">
            {audioLevel.map((level, index) => (
              <div 
                key={index}
                className="w-1 bg-red-500 rounded-t"
                style={{ 
                  height: `${Math.max(3, level * 18)}px`,
                  transition: 'height 0.1s ease'
                }}
              />
            ))}
          </div>
        )}
        
        <div className="flex space-x-2">
          {/* Voice recording button - fixed width for consistency */}
          <button
            type="button"
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              isRecording 
                ? 'text-red-500 bg-red-50'
                : isTranscribing
                  ? 'text-yellow-500 bg-yellow-50'
                  : 'text-gray-400 hover:text-indigo-500 hover:bg-gray-100'
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isTranscribing}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : isTranscribing ? (
              <div className="animate-spin">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="30 30" strokeDashoffset="0" />
                  <path d="M12 2C6.5 2 2 6.5 2 12" />
                </svg>
              </div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
          
          {/* Send button - fixed width for consistency */}
          <button
            type="submit"
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              value.trim() && !disabled
                ? 'text-indigo-600 hover:bg-indigo-100' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Transcribing indicator - shown below textarea when active */}
      {isTranscribing && (
        <div className="absolute left-4 -bottom-6 flex items-center text-yellow-500 text-xs">
          <div className="animate-spin mr-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="30 30" strokeDashoffset="0" />
              <path d="M12 2C6.5 2 2 6.5 2 12" />
            </svg>
          </div>
          <span>Transcribing...</span>
        </div>
      )}
    </form>
  );
}