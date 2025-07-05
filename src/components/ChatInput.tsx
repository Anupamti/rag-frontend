"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Square, FileText, Loader2 } from "lucide-react";

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onTranscribedText: (text: string) => void;
  isProcessing: boolean;
  hasFiles: boolean;
}

// Mock transcription functions - replace with your actual Deepgram implementation
const startTranscription = async (
  stream: MediaStream,
  onUpdate: (text: string) => void,
  onComplete: (text: string) => void
) => {
  // This is a placeholder - replace with your actual Deepgram transcription logic
  console.log("Starting Deepgram transcription...");
  // Your actual transcription implementation goes here
};

const stopTranscription = () => {
  // This is a placeholder - replace with your actual Deepgram stop logic
  console.log("Stopping Deepgram transcription...");
  return ""; // Return final transcript if available
};

export default function ChatInput({
  inputValue,
  setInputValue,
  onSendMessage,
  onTranscribedText,
  isProcessing,
  hasFiles,
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
  const SILENCE_THRESHOLD = 0.05;
  const SILENCE_DURATION = 2000;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isProcessing && inputValue.trim()) {
        onSendMessage();
      }
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

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

  // Calculate audio energy level from frequency data
  const calculateAudioEnergy = (dataArray: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / (dataArray.length * 255);
  };

  // Check for silence and handle silence detection
  const handleSilenceDetection = (energy: number) => {
    if (!isRecording) return;

    const now = Date.now();

    if (energy < SILENCE_THRESHOLD) {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = now;
        console.log("Silence started");
      } else if (now - silenceStartRef.current >= SILENCE_DURATION) {
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

      const energyLevel = calculateAudioEnergy(dataArray);
      handleSilenceDetection(energyLevel);

      const levels = Array.from({ length: 5 }, (_, i) => {
        const index = Math.floor(i * (bufferLength / 5));
        return dataArray[index] / 255;
      });

      setAudioLevel(levels);
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    updateVisualizer();
  };

  // Start recording
  const startRecording = async () => {
    try {
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

      setStatus("Setting up audio processing...");
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.5;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      console.log("Audio context state:", audioContextRef.current.state);

      visualizeAudio();

      setTranscriptionText("");
      setStatus("Starting transcription...");

      const handleTranscriptionUpdate = (text: string) => {
        console.log("Transcription update:", text);
        setTranscriptionText(text);
        setStatus(text ? "Transcribing..." : "Listening...");
      };

      const handleTranscriptionComplete = (finalText: string) => {
        console.log("Transcription complete:", finalText);
        if (finalText) {
          // Add to existing input value instead of replacing
          const newText = inputValue + (inputValue ? " " : "") + finalText;
          setInputValue(newText);
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

  // Stop recording
  const stopRecording = () => {
    if (isRecording) {
      setStatus("Stopping transcription...");
      const finalText = stopTranscription();
      cleanupResources();
      setIsRecording(false);
      setAudioLevel([]);
    }
  };

  const canSend = !isProcessing && inputValue.trim().length > 0;

  return (
    <div className="border-t border-gray-200 bg-white ">
      <div className="max-w-4xl mx-auto p-4">
        {/* File indicator */}
        {/* {hasFiles && (
          <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>Ready to chat about your uploaded documents</span>
          </div>
        )} */}

        {/* Status and transcription indicators */}
        <div className="relative">
          {/* Status indicator */}
          {status && (
            <div className="mb-2 bg-blue-100 p-2 rounded text-sm text-blue-700 max-w-full overflow-hidden text-ellipsis">
              {status}
            </div>
          )}

          {/* Transcription preview */}
          {transcriptionText && (
            <div className="mb-2 bg-gray-100 p-2 rounded text-sm text-gray-700 max-w-full overflow-hidden text-ellipsis">
              {transcriptionText}
            </div>
          )}

          <div className="flex items-center space-x-3">
            {/* Voice input button with visualizer */}
            <div className="flex items-center space-x-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                  isRecording
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title={isRecording ? "Stop recording" : "Start voice input"}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <Square className="h-5 w-5 fill-current" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              {/* Audio visualizer */}
              {isRecording && audioLevel.length > 0 && (
                <div className="flex items-end h-6 space-x-px">
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
            </div>

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  hasFiles
                    ? "Ask me anything about your uploaded documents..."
                    : "Type your message here... (Upload documents to chat about them)"
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-[150px] overflow-y-auto text-black"
                rows={1}
                disabled={isProcessing || isRecording}
              />

              {/* Character count */}
              <div className="absolute bottom-1 right-12 text-xs text-gray-400">
                {inputValue.length}
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={onSendMessage}
              disabled={!canSend}
              className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                canSend
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title="Send message"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Voice recording indicator */}
        {isRecording && (
          <div className="flex items-center justify-center space-x-2 mt-3 text-sm text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>
              Recording... Speak now (will auto-stop after 2s of silence)
            </span>
          </div>
        )}

        {/* Tips */}
        {/* <div className="mt-3 text-xs text-gray-500 text-center">
          Press Enter to send • Shift+Enter for new line • Click mic for voice
          input
        </div> */}
      </div>
    </div>
  );
}
