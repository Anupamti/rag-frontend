import { NextResponse } from 'next/server';
import { setGlobalDispatcher, Agent } from 'undici';

setGlobalDispatcher(new Agent({ connectTimeout: 30000 }));

export const config = {
  api: {
    bodyParser: false, // disable default body parsing for multipart forms
  },
};

export async function POST(request) {
  try {
    // Parse form data from the incoming request
    const formData = await request.formData();
    const file = formData.get('audio');
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    // Log audio file information for debugging
    console.log("Audio file details:", {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Get a ReadableStream from the Web File object
    const fileStream = file.stream();

    // Create an AbortController to extend the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000); // set timeout to 30 seconds

    // Upload the audio file to AssemblyAI with extended timeout and duplex option
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      duplex: 'half',
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: fileStream,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Read response text and try to parse JSON (helps debug empty responses)
    const uploadResponseText = await uploadResponse.text();
    console.log("Upload response:", uploadResponseText);
    
    // Check if upload was successful
    if (!uploadResponse.ok) {
      const errorMessage = `Upload failed with status ${uploadResponse.status}: ${uploadResponseText}`;
      console.error(errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: uploadResponse.status });
    }
    
    // Now parse the successful response
    let uploadData;
    try {
      uploadData = JSON.parse(uploadResponseText);
    } catch (err) {
      console.error('Error parsing upload response JSON:', uploadResponseText, err);
      return NextResponse.json({ error: 'Failed to parse upload response' }, { status: 500 });
    }
    
    // Check for the correct property name: upload_url
    if (!uploadData.upload_url) {
      console.error('Missing upload_url in response:', uploadData);
      return NextResponse.json({ error: 'Upload response missing upload_url' }, { status: 500 });
    }
    
    // Request a new transcript using the uploaded audio URL
    // Add additional options for better transcription
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadData.upload_url,
        language_detection: true, // Automatically detect language
        punctuate: true, // Add punctuation
        format_text: true, // Format text with basic capitalization
        speaker_labels: true // Identify different speakers if applicable
      }),
    });
    
    // Check if transcript request was successful
    if (!transcriptResponse.ok) {
      const transcriptResponseText = await transcriptResponse.text();
      const errorMessage = `Transcript request failed with status ${transcriptResponse.status}: ${transcriptResponseText}`;
      console.error(errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: transcriptResponse.status });
    }
    
    const transcriptResponseText = await transcriptResponse.text();
    console.log("Transcript response:", transcriptResponseText);
    
    let transcriptData;
    try {
      transcriptData = JSON.parse(transcriptResponseText);
    } catch (err) {
      console.error('Error parsing transcript response JSON:', transcriptResponseText, err);
      return NextResponse.json({ error: 'Failed to parse transcript response' }, { status: 500 });
    }
    
    if (!transcriptData.id) {
      console.error('Transcript response missing id:', transcriptData);
      return NextResponse.json({ error: 'Transcript response missing id' }, { status: 500 });
    }
    
    // Poll for transcription result until completed or error
    const pollingUrl = `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`;
    let attempts = 0;
    const maxAttempts = 30; // Limit polling to avoid infinite loops
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}`);
      
      const pollingResponse = await fetch(pollingUrl, {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY,
        },
      });
      
      // Check if polling request was successful
      if (!pollingResponse.ok) {
        const pollingResponseText = await pollingResponse.text();
        const errorMessage = `Polling request failed with status ${pollingResponse.status}: ${pollingResponseText}`;
        console.error(errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: pollingResponse.status });
      }
      
      const pollingResponseText = await pollingResponse.text();
      console.log(`Polling response (attempt ${attempts}):`, pollingResponseText);
      
      let pollingData;
      try {
        pollingData = JSON.parse(pollingResponseText);
      } catch (err) {
        console.error('Error parsing polling response JSON:', pollingResponseText, err);
        return NextResponse.json({ error: 'Failed to parse polling response' }, { status: 500 });
      }
      
      if (pollingData.status === 'completed') {
        // Return full data if text is empty for diagnostic purposes
        if (!pollingData.text || pollingData.text.trim() === '') {
          console.log('Warning: Empty transcription text returned');
          return NextResponse.json({ 
            text: '',
            warning: 'Transcription completed but no text was detected',
            details: {
              audio_duration: pollingData.audio_duration,
              confidence: pollingData.confidence,
              status: pollingData.status,
              words: pollingData.words || []
            }
          });
        }
        
        return NextResponse.json({ 
          text: pollingData.text,
          audio_duration: pollingData.audio_duration,
          confidence: pollingData.confidence,
        });
      } else if (pollingData.status === 'error') {
        return NextResponse.json({ error: pollingData.error || 'Transcription error' }, { status: 500 });
      } else if (pollingData.status === 'processing') {
        console.log('Transcription still processing...');
      }
      
      // Wait 2 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    
    return NextResponse.json({ 
      error: 'Polling timeout - transcription took too long', 
      id: transcriptData.id 
    }, { status: 408 });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}