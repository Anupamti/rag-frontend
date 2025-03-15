import { startTranscription, stopTranscription } from "@/utils/transcription";
import { useState, useRef, FormEvent, KeyboardEvent, useEffect } from "react";

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
  onTranscribedText,
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number[]>([]);
  const [status, setStatus] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);

  // Configuration for silence detection
  const SILENCE_THRESHOLD = 0.05; // Adjust threshold based on testing (0-1)
  const SILENCE_DURATION = 2000; // Stop after 2 seconds of silence

  // Auto-resize textarea
  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
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
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Handle key press
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();

        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    }
  };

  // Clean up audio resources
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  // Cleanup function for all resources
  const cleanupResources = () => {
    setStatus("Cleaning up resources...");

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current
        .close()
        .catch((err) => console.error("Error closing audio context:", err));
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Audio track stopped");
      });
      streamRef.current = null;
    }

    analyserRef.current = null;
    silenceStartRef.current = null;
    setStatus("");
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Clean up any previous session
      cleanupResources();

      setStatus("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      console.log(
        "Microphone access granted:",
        stream.getAudioTracks().length,
        "audio tracks"
      );

      // Set up audio context and analyzer for visualization
      setStatus("Setting up audio processing...");
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; // More detailed for better silence detection
      analyserRef.current.smoothingTimeConstant = 0.5;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      console.log("Audio context state:", audioContextRef.current.state);

      // Start visualization and silence detection
      visualizeAudio();

      // Start Deepgram transcription
      setTranscriptionText("");
      setStatus("Starting transcription...");

      // Handler for real-time transcription updates
      const handleTranscriptionUpdate = (text: string) => {
        console.log("Transcription update:", text);
        setTranscriptionText(text);
        setStatus(text ? "Transcribing..." : "Listening...");
      };

      // Handler for when transcription is complete
      const handleTranscriptionComplete = (finalText: string) => {
        console.log("Transcription complete:", finalText);
        if (finalText) {
          onTranscribedText(finalText);
          textareaRef.current?.focus();
          setStatus("Transcription complete");
        } else {
          setStatus("No transcription received");
        }
        setTranscriptionText("");
        setIsRecording(false);
        setAudioLevel([]);
        setTimeout(() => setStatus(""), 2000);
      };

      // Start the transcription
      await startTranscription(
        stream,
        handleTranscriptionUpdate,
        handleTranscriptionComplete
      );
      console.log("Transcription started");

      setIsRecording(true);
      setStatus("Recording...");
    } catch (error) {
      console.error("Recording error:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setTimeout(() => setStatus(""), 3000);
    }
  };

  // Calculate audio energy level from frequency data
  const calculateAudioEnergy = (dataArray: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / (dataArray.length * 255); // Normalized energy level (0-1)
  };

  // Check for silence and handle silence detection
  const handleSilenceDetection = (energy: number) => {
    if (!isRecording) return;

    const now = Date.now();

    // If audio level is below threshold, start counting silence
    if (energy < SILENCE_THRESHOLD) {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = now;
        console.log("Silence started");
      } else if (now - silenceStartRef.current >= SILENCE_DURATION) {
        // Silence duration threshold reached
        console.log(
          "Silence detected for",
          SILENCE_DURATION,
          "ms, stopping recording"
        );
        setStatus("Silence detected, stopping...");
        stopRecording();
        return;
      }
    } else {
      // Reset silence timer if audio detected
      if (silenceStartRef.current !== null) {
        console.log("Sound detected, resetting silence timer");
        silenceStartRef.current = null;
      }
    }
  };

  // Visualize audio and detect silence
  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVisualizer = () => {
      if (!analyserRef.current || !isRecording) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate overall energy level for silence detection
      const energyLevel = calculateAudioEnergy(dataArray);

      // Check for silence
      handleSilenceDetection(energyLevel);

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
    if (isRecording) {
      setStatus("Stopping transcription...");
      // Stop Deepgram transcription
      const finalText = stopTranscription();

      // Clean up resources
      cleanupResources();

      // Update UI state
      setIsRecording(false);
      setAudioLevel([]);
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
        disabled={disabled || isRecording}
        rows={1}
      />

      {/* Status indicator */}
      {status && (
        <div className="absolute left-0 right-0 -top-10 bg-blue-100 p-2 rounded text-sm text-blue-700 max-w-full overflow-hidden text-ellipsis">
          {status}
        </div>
      )}

      {/* Transcription preview showing below status if both are present */}
      {transcriptionText && (
        <div
          className={`absolute left-0 right-0 ${
            status ? "-top-20" : "-top-10"
          } bg-gray-100 p-2 rounded text-sm text-gray-700 max-w-full overflow-hidden text-ellipsis`}
        >
          {transcriptionText}
        </div>
      )}

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
                  transition: "height 0.1s ease",
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
                ? "text-red-500 bg-red-50"
                : "text-gray-400 hover:text-indigo-500 hover:bg-gray-100"
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
                ? "text-indigo-600 hover:bg-indigo-100"
                : "text-gray-300 cursor-not-allowed"
            }`}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
