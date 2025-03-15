import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

// Store the transcription in progress
let currentTranscription = "";
let connection: any = null;

// Initialize the Deepgram client
const initializeDeepgram = () => {
  const deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  if (!deepgramApiKey) {
    console.error("Missing Deepgram API key in environment variables");
    throw new Error("Deepgram API key not configured");
  }

  return createClient(deepgramApiKey);
};

export const startTranscription = async (
  audioStream: MediaStream,
  onTranscriptionUpdate: (text: string) => void,
  onTranscriptionComplete: (finalText: string) => void
) => {
  try {
    // Verify we have audio tracks
    if (!audioStream || audioStream.getAudioTracks().length === 0) {
      throw new Error("No audio tracks found in the media stream");
    }

    console.log(
      "Starting transcription with audio tracks:",
      audioStream.getAudioTracks().length
    );

    // Reset the current transcription
    currentTranscription = "";

    // Initialize Deepgram client
    const deepgram = initializeDeepgram();

    // Create a connection for live transcription
    connection = deepgram.listen.live({
      smart_format: true,
      model: "nova-2",
      language: "en-US",
      interim_results: true,
      punctuate: true,
      endpointing: true,
    });

    // Handle connection open
    connection.on(LiveTranscriptionEvents.Open, async () => {
      console.log("Deepgram connection established");

      // Listen for transcripts
      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        // Log incoming transcript data for debugging
        console.log("Received transcript data:", JSON.stringify(data));

        // Check if we have a valid transcript
        if (
          data.channel &&
          data.channel.alternatives &&
          data.channel.alternatives.length > 0
        ) {
          const transcript = data.channel.alternatives[0].transcript;

          // For final results (not interim)
          if (!data.is_final) {
            // Update with interim results
            onTranscriptionUpdate(transcript);
          } else {
            // Append to our current transcription
            if (transcript.trim()) {
              currentTranscription +=
                (currentTranscription ? " " : "") + transcript;
              // Update the UI with the current full transcription
              onTranscriptionUpdate(currentTranscription);
              console.log("Accumulated transcription:", currentTranscription);
            }
          }
        } else {
          console.warn("Received transcript data without alternatives:", data);
        }
      });

      // Handle errors
      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error("Deepgram error:", error);
        onTranscriptionUpdate("Transcription error occurred");
      });

      // Handle close
      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log("Deepgram connection closed");
        onTranscriptionComplete(currentTranscription);
      });

      try {
        // Simplified audio processing approach
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(audioStream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (!connection) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Convert audio data for transmission
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            int16Data[i] = Math.max(
              -32768,
              Math.min(32767, inputData[i] * 32768)
            );
          }

          // Check for non-zero audio (to avoid sending silence)
          let hasAudio = false;
          for (let i = 0; i < int16Data.length; i++) {
            if (int16Data[i] !== 0) {
              hasAudio = true;
              break;
            }
          }

          if (hasAudio) {
            connection.send(int16Data.buffer);
          }
        };

        // Store references for cleanup
        connection.audioContext = audioContext;
        connection.audioProcessor = processor;
        connection.audioSource = source;

        console.log("Audio processing setup complete");
      } catch (audioError) {
        console.error("Audio processing error:", audioError);
        onTranscriptionUpdate("Audio processing error");
        stopTranscription();
      }
    });

    return connection;
  } catch (error) {
    console.error("Error starting transcription:", error);
    onTranscriptionComplete("");
    throw error;
  }
};

export const stopTranscription = () => {
  if (connection) {
    console.log("Stopping transcription...");

    try {
      // Store final transcription before cleaning up
      const finalTranscription = currentTranscription;

      // Clean up audio processing
      if (connection.audioProcessor) {
        connection.audioProcessor.disconnect();
      }
      if (connection.audioSource) {
        connection.audioSource.disconnect();
      }
      if (connection.audioContext) {
        connection.audioContext
          .close()
          .catch((err) => console.error("Error closing audio context:", err));
      }

      // Close the connection
      if (typeof connection.finish === "function") {
        connection.finish();
      }

      // Reset state
      connection = null;
      currentTranscription = "";

      console.log("Transcription stopped, final text:", finalTranscription);
      return finalTranscription;
    } catch (error) {
      console.error("Error in stopTranscription:", error);
      return currentTranscription || "";
    }
  }
  return "";
};
