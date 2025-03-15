import { NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";

export async function POST(request: Request) {
  try {
    // Parse form data from the incoming request
    const formData = await request.formData();
    const file = formData.get("audio");

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Get the file as an ArrayBuffer
    const fileBuffer = await (file as File).arrayBuffer();

    // Initialize Deepgram client with environment variable
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

    // Check if API key exists
    if (!deepgramApiKey) {
      console.error("Missing Deepgram API key");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const deepgram = createClient(deepgramApiKey);

    // Log file details for debugging
    console.log("Processing audio file:", {
      type: (file as File).type,
      size: (file as File).size,
      name: (file as File).name,
    });

    // Send the file to Deepgram for transcription
    const response = await deepgram.listen.prerecorded(
      {
        buffer: Buffer.from(fileBuffer),
        mimetype: (file as File).type,
      },
      {
        smart_format: true,
        model: "nova-2",
        language: "en-US",
      }
    );

    // Enhanced error checking
    if (!response) {
      console.error("Empty response from Deepgram");
      return NextResponse.json(
        { error: "Empty response from transcription service" },
        { status: 500 }
      );
    }

    // Log the structure of the response for debugging
    console.log(
      "Deepgram response structure:",
      JSON.stringify(response, null, 2)
    );

    // Carefully extract transcription with detailed error checking
    let transcript = "";
    let confidence = 0;

    if (
      response.results?.channels &&
      response.results.channels.length > 0 &&
      response.results.channels[0]?.alternatives &&
      response.results.channels[0].alternatives.length > 0
    ) {
      transcript =
        response.results.channels[0].alternatives[0].transcript || "";
      confidence = response.results.channels[0].alternatives[0].confidence || 0;
    } else {
      console.warn("Unexpected response structure from Deepgram:", response);
    }

    if (!transcript) {
      console.warn("Received empty transcript from Deepgram");
    }

    return NextResponse.json({
      text: transcript,
      confidence: confidence,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
