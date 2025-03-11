
// File: components/ChatInput.tsx
import { transcribeAudio } from '@/utils/transcription';
import { useState, useRef, FormEvent, KeyboardEvent } from 'react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
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
  
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        
        setIsTranscribing(true);
        try {
          const transcribedText = await transcribeAudio(audioBlob);
          onTranscribedText(transcribedText);
          textareaRef.current?.focus();
        } catch (error) {
          console.error('Transcription error:', error);
        } finally {
          setIsTranscribing(false);
        }
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Add a small delay to ensure final data is processed
      setTimeout(() => {
        setIsTranscribing(true);
      }, 500);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        className="w-full px-4 py-3 pr-20 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[52px] max-h-[200px]"
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
      
      <div className="absolute right-2 bottom-2 flex space-x-1">
        {/* Voice recording button */}
        <button
          type="button"
          className={`p-2 rounded-full ${
            isRecording 
              ? 'text-red-500 bg-red-50 animate-pulse'
              : isTranscribing
                ? 'text-yellow-500 bg-yellow-50'
                : 'text-gray-400 hover:text-indigo-500 hover:bg-gray-100'
          }`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isTranscribing}
        >
          {isTranscribing ? (
            <span className="text-xs whitespace-nowrap px-1">Transcribing...</span>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
        
        {/* Send button */}
        <button
          type="submit"
          className={`p-2 rounded-full ${
            value.trim() && !disabled
              ? 'text-indigo-600 hover:bg-indigo-100' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          disabled={!value.trim() || disabled}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </form>
  );
}