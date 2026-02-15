import { getSystemSettings } from '@/lib/admin-settings';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { Tool } from '@langchain/core/tools';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { encode as toonEncode } from '@toon-format/toon';
import * as cheerio from 'cheerio';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { NextRequest, NextResponse } from 'next/server';

// Custom Web Search Tool using DuckDuckGo HTML
class WebSearchTool extends Tool {
  name = 'web_search';
  description =
    'Search the web for information using DuckDuckGo. Use this tool when you need current information, competitor analysis, or data not present in the provided context.';

  async _call(query: string): Promise<string> {
    try {
      console.log(`Searching for: ${query}`);
      const response = await fetch(
        `https://html.duckduckgo.com/html?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        },
      );

      const html = await response.text();
      const $ = cheerio.load(html);

      const results: string[] = [];
      $('.result__body').each((i, elem) => {
        if (i < 5) {
          // Limit to top 5 results
          const title = $(elem).find('.result__title').text().trim();
          const snippet = $(elem).find('.result__snippet').text().trim();
          const url = $(elem).find('.result__url').attr('href')?.trim();
          if (title && snippet) {
            results.push(`Title: ${title}\nSnippet: ${snippet}\nURL: ${url}\n`);
          }
        }
      });

      return results.length > 0 ? results.join('\n---\n') : 'No relevant results found.';
    } catch (error) {
      console.error('Search error:', error);
      return 'Failed to perform search.';
    }
  }
}

// System prompt optimized for RAW DATA analysis
const SYSTEM_PROMPT_CONTENT = `You are ZenZebra Intelligence, an expert business analytics assistant.

**CONTEXT:**
You have been provided with the **FULL RAW DATA** of the business analysis report in **TOON (Token-Oriented Object Notation)** format. This is a token-efficient format that uses indentation for hierarchy and specific markers like [length]{fields} for arrays.

**CRITICAL INSTRUCTIONS:**
1. **Analyze EVERYTHING:** Do not just summarize. Use the granularity of the data to answer specific questions (e.g., specific product details, daily trends, location performance).
2. **Be Exact:** Quote exact numbers. Do not round off significantly unless asked.
3. **Inference:** If a user asks something not explicitly pre-calculated (like "forecast for next week"), use the "dailyTrends" or historical data provided to make a reasonable projection or trend analysis.
4. **Data Integrity:** If the data is truly missing (e.g., no "gender" field exists), admit it. **DO NOT HALLUCINATE OR INVENT DATA.** If you cannot find the answer in the provided context, clearly state that the information is not available in the report.
5. **Currency:** Always use Indian Rupee (₹) formatting.
6. **Tone:** Professional, intelligent, and proactive.
7. **Strict Scope:** only answer questions related to the business analysis, sales, stock, and performance. Do not engage in general conversation unrelated to the data.

**VISUALIZATION & FORMATTING RULES:**
- **Tables:** If the answer involves listing multiple items, comparing data points, or showing a breakdown, YOU MUST use a Markdown table.
- **Charts:** If the user asks for a comparison, trend, distribution, or if a visual would help explain the data, YOU MUST generate a chart.
To generate a chart, output a Markdown code block with the language identifier "chart".
The content of the block must be a valid JSON object with the following structure:
\`\`\`chart
{
  "type": "bar" | "line" | "pie",
  "title": "Short Chart Title",
  "data": [
    { "name": "Category A", "value": 120 },
    { "name": "Category B", "value": 85 }
  ],
  "xKey": "name", // Optional, defaults to "name"
  "yKey": "value", // Optional, defaults to "value"
  "barKey": "value", // Optional, for composed charts
  "lineKey": "trend", // Optional, for composed charts
  "areaKey": "amt" // Optional, for composed charts
}
\`\`\`
Supported chart types:
- "bar": comparisons
- "line": trends over time
- "pie": proportions
- "area": volume trends
- "radar": multi-variable comparison (e.g. product metrics)
- "composed": mixed bar/line/area (e.g. revenue vs profit margin)

Ensure the JSON in the chart block is valid. Do not use TOON for charts, only for the context provided to you.

**YOUR GOAL:** Act as a real-time, dynamic data scientist who has full access to the database.`;

export async function POST(request: NextRequest) {
  try {
    const { message, context, conversationHistory } = await request.json();

    // Check if chatbot is enabled globally
    const settings = await getSystemSettings();
    if (settings.analyticsChatbotEnabled === false) {
      return NextResponse.json(
        { error: 'Analytics Chatbot is currently disabled by the administrator.' },
        { status: 403 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Convert context to TOON format for token savings
    const toonContext = toonEncode(context);

    // Initialize LangChain Gemini Chat Model
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY,
      streaming: true,
      temperature: 0.2,
    });

    if (process.env.LANGCHAIN_TRACING_V2 === 'true') {
      console.log('LangSmith tracing enabled.');
    } else {
      console.warn('LangSmith tracing is disabled. Set LANGCHAIN_TRACING_V2=true to enable.');
    }

    // Define Tools
    const tools = [new WebSearchTool()];

    // Create Agent Prompt
    // Combine System Prompt and Context into one SystemMessage
    const combinedSystemPrompt = `${SYSTEM_PROMPT_CONTENT}\n\nHere is the business data context in TOON format:\n${toonContext}`;

    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(combinedSystemPrompt),
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Create Agent
    const agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });

    // Format History
    const chatHistory = (conversationHistory || []).map((msg: any) => {
      return msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content);
    });

    // Stream Event Log
    const logStream = await agentExecutor.streamEvents(
      {
        input: message,
        chat_history: chatHistory,
        context: context,
      },
      { version: 'v2' },
    );

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of logStream) {
            if (event.event === 'on_chat_model_stream') {
              if (event.data?.chunk?.content) {
                // Send chunk event
                const chunkData = JSON.stringify({
                  type: 'chunk',
                  content: event.data.chunk.content,
                });
                controller.enqueue(encoder.encode(chunkData + '\n'));
              }
            } else if (event.event === 'on_chat_model_start') {
              // Send model start event - shows when the AI begins reasoning
              const stepData = JSON.stringify({
                type: 'step',
                content: 'Reasoning and formulating response...',
              });
              controller.enqueue(encoder.encode(stepData + '\n'));
            } else if (event.event === 'on_tool_start') {
              // Send tool start event
              const toolName = event.name;
              const input = JSON.stringify(event.data.input);
              const stepData = JSON.stringify({
                type: 'tool_call',
                name: toolName === 'web_search' ? 'Web Search' : toolName,
                input,
              });
              controller.enqueue(encoder.encode(stepData + '\n'));
            } else if (event.event === 'on_tool_end') {
              // Send tool end event
              const output = event.data.output;
              const stepData = JSON.stringify({ type: 'tool_result', output });
              controller.enqueue(encoder.encode(stepData + '\n'));
            } else if (event.event === 'on_chain_start' && event.name === 'AgentExecutor') {
              // Initial step
              const stepData = JSON.stringify({
                type: 'step',
                content: 'Analyzing your request against business data...',
              });
              controller.enqueue(encoder.encode(stepData + '\n'));
            } else if (event.event === 'on_chain_start' && event.name === 'RunnableSequence') {
              // Internal sequence start
              const stepData = JSON.stringify({
                type: 'step',
                content: 'Processing context and tools...',
              });
              controller.enqueue(encoder.encode(stepData + '\n'));
            }
          }
          const doneData = JSON.stringify({ type: 'done' });
          controller.enqueue(encoder.encode(doneData + '\n'));
          controller.close();
        } catch (err) {
          console.error('Streaming error:', err);
          const errorData = JSON.stringify({ type: 'error', content: 'Streaming failed' });
          controller.enqueue(encoder.encode(errorData + '\n'));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 },
    );
  }
}
