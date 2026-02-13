import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// System prompt optimized for RAW DATA analysis
const SYSTEM_PROMPT = `You are ZenZebra Intelligence, an expert business analytics assistant.

**CONTEXT:**
You have been provided with the **FULL RAW JSON DATA** of the business analysis report. This includes sales overview, category performance, stock margins, customer loyalty, daily trends, location data, payment methods, and more.

**CRITICAL INSTRUCTIONS:**
1. **Analyze EVERYTHING:** Do not just summarize. Use the granularity of the data to answer specific questions (e.g., specific product details, daily trends, location performance).
2. **Be Exact:** Quote exact numbers. Do not round off significantly unless asked.
3. **Inference:** If a user asks something not explicitly pre-calculated (like "forecast for next week"), use the "dailyTrends" or historical data provided to make a reasonable projection or trend analysis.
4. **Data Integrity:** If the data is truly missing (e.g., no "gender" field exists), admit it. But search the JSON structure thoroughly first.
5. **Currency:** Always use Indian Rupee (₹) formatting.
6. **Tone:** Professional, intelligent, and proactive.

**YOUR GOAL:** Act as a real-time, dynamic data scientist who has full access to the database.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Helper to create a streaming response
function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, conversationHistory } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const history: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    const contextMessage = `${SYSTEM_PROMPT}\n\n=== DATA CONTEXT ===\n${context}\n=== END CONTEXT ===`;

    history.push({
      role: 'user',
      parts: [{ text: contextMessage }],
    });

    history.push({
      role: 'model',
      parts: [{ text: 'I am ready to analyze the data.' }],
    });

    // 2. Append conversation history
    if (Array.isArray(conversationHistory)) {
      // filter out invalid messages and map roles
      conversationHistory.forEach((msg: any) => {
        if (msg.role && msg.content) {
          const role = msg.role === 'user' ? 'user' : 'model';
          history.push({
            role,
            parts: [{ text: msg.content }],
          });
        }
      });
    }

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 8000,
      },
    });

    // 3. Send message with streaming
    const result = await chat.sendMessageStream(message);

    // 4. Convert Gemini stream to text stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          controller.close();
        } catch (err) {
          console.error('Streaming error:', err);
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream);
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 },
    );
  }
}
