import { NextResponse } from 'next/server';
import https from 'https';

interface ChatRequest {
  message: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface ChatResponse {
  reply: string;
}

export async function POST(request: Request) {
  try {
    const { message, history }: ChatRequest = await request.json();

    if (!message || !Array.isArray(history)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Use a promise with Node's native HTTPS module
    const openaiResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [...history, { role: 'user', content: message }],
        temperature: 0.7,
      });

      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 30000, // 30 second timeout
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              data: JSON.parse(data)
            });
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(new Error(`Request error: ${e}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.write(postData);
      req.end();
    });

    // @ts-ignore
    if (openaiResponse.statusCode !== 200) {
      // @ts-ignore
      console.error('API Error:', openaiResponse.data);
      return NextResponse.json(
        // @ts-ignore
        { error: `OpenAI API error: ${openaiResponse.data.error?.message || 'Unknown error'}` },
        // @ts-ignore
        { status: openaiResponse.statusCode }
      );
    }

    // @ts-ignore
    const reply = openaiResponse.data.choices[0].message.content;

    return NextResponse.json({ reply } as ChatResponse);
  } catch (error: any) {
    console.error('Error in chat API:', error);
    
    return NextResponse.json(
      { error: `Failed to process chat request: ${error.message}` },
      { status: 500 }
    );
  }
}