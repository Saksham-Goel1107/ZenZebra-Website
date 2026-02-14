'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit2,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  RefreshCcw,
  Send,
  Sparkles,
  Trash2,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

interface Message {
  id: string; // Add stable ID
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean; // Track error state
}

const ChartRenderer = ({ data }: { data: any }) => {
  if (!data || !data.type || !data.data) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (data.type === 'bar') {
    return (
      <div className="w-full h-64 my-4 p-2 bg-white/5 rounded-lg border border-white/10">
        <p className="text-center text-xs font-semibold mb-2">{data.title}</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey={data.xKey || 'name'} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                color: '#f3f4f6',
              }}
              itemStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
            <Bar dataKey={data.yKey || 'value'} fill="#8884d8" radius={[4, 4, 0, 0]}>
              {data.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (data.type === 'line') {
    return (
      <div className="w-full h-64 my-4 p-2 bg-white/5 rounded-lg border border-white/10">
        <p className="text-center text-xs font-semibold mb-2">{data.title}</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey={data.xKey || 'name'} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                color: '#f3f4f6',
              }}
              itemStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={data.yKey || 'value'}
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (data.type === 'pie') {
    return (
      <div className="w-full h-64 my-4 p-2 bg-white/5 rounded-lg border border-white/10">
        <p className="text-center text-xs font-semibold mb-2">{data.title}</p>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={data.yKey || 'value'}
            >
              {data.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                color: '#f3f4f6',
              }}
              itemStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (data.type === 'area') {
    return (
      <div className="w-full h-64 my-4 p-2 bg-white/5 rounded-lg border border-white/10">
        <p className="text-center text-xs font-semibold mb-2">{data.title}</p>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey={data.xKey || 'name'} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                color: '#f3f4f6',
              }}
              itemStyle={{ color: '#f3f4f6' }}
            />
            <Area
              type="monotone"
              dataKey={data.yKey || 'value'}
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (data.type === 'radar') {
    return (
      <div className="w-full h-64 my-4 p-2 bg-white/5 rounded-lg border border-white/10">
        <p className="text-center text-xs font-semibold mb-2">{data.title}</p>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.data}>
            <PolarGrid opacity={0.2} />
            <PolarAngleAxis dataKey={data.xKey || 'subject'} fontSize={10} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} fontSize={10} />
            <Radar
              name={data.title}
              dataKey={data.yKey || 'value'}
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                color: '#f3f4f6',
              }}
              itemStyle={{ color: '#f3f4f6' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (data.type === 'composed') {
    return (
      <div className="w-full h-64 my-4 p-2 bg-white/5 rounded-lg border border-white/10">
        <p className="text-center text-xs font-semibold mb-2">{data.title}</p>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey={data.xKey || 'name'} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                color: '#f3f4f6',
              }}
              itemStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={data.areaKey || 'amt'}
              fill="#8884d8"
              stroke="#8884d8"
              fillOpacity={0.2}
            />
            <Bar dataKey={data.barKey || 'value'} barSize={20} fill="#413ea0" />
            <Line type="monotone" dataKey={data.lineKey || 'trend'} stroke="#ff7300" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return null;
};

const MarkdownContent = ({ content }: { content: string }) => {
  const components = useMemo(
    () => ({
      // Text formatting
      h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
      h2: ({ node, ...props }: any) => (
        <h2 className="text-lg font-semibold mt-3 mb-2" {...props} />
      ),
      h3: ({ node, ...props }: any) => <h3 className="text-md font-medium mt-2 mb-1" {...props} />,
      p: ({ node, ...props }: any) => <p className="leading-relaxed mb-2 last:mb-0" {...props} />,
      ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
      ol: ({ node, ...props }: any) => (
        <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />
      ),
      li: ({ node, ...props }: any) => <li className="pl-1" {...props} />,
      blockquote: ({ node, ...props }: any) => (
        <blockquote
          className="border-l-4 border-primary/50 pl-4 italic my-2 bg-muted/30 py-2 rounded-r"
          {...props}
        />
      ),

      // Inline styles
      strong: ({ node, ...props }: any) => <span className="font-bold text-primary" {...props} />,
      a: ({ node, ...props }: any) => (
        <a
          className="text-primary underline underline-offset-2 hover:opacity-80"
          target="_blank"
          {...props}
        />
      ),

      // Tables
      table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto my-4 rounded-lg border bg-card/50">
          <table className="w-full text-sm text-left border-collapse" {...props} />
        </div>
      ),
      thead: ({ node, ...props }: any) => (
        <thead className="bg-muted/50 text-xs uppercase" {...props} />
      ),
      tbody: ({ node, ...props }: any) => (
        <tbody className="divide-y dark:divide-gray-800" {...props} />
      ),
      tr: ({ node, ...props }: any) => (
        <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors" {...props} />
      ),
      th: ({ node, ...props }: any) => (
        <th
          className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap bg-muted/20"
          {...props}
        />
      ),
      td: ({ node, ...props }: any) => <td className="px-4 py-3 align-top" {...props} />,

      // Code & Charts
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const isChart = match && match[1] === 'chart';

        if (!inline && isChart) {
          try {
            const data = JSON.parse(String(children).replace(/\n$/, ''));
            return <ChartRenderer data={data} />;
          } catch (e) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }
        return (
          <code
            className={cn('bg-muted px-1.5 py-0.5 rounded text-[0.9em] font-mono', className)}
            {...props}
          >
            {children}
          </code>
        );
      },
      pre: ({ node, ...props }: any) => (
        <pre
          className="bg-zinc-950 p-4 rounded-lg overflow-x-auto my-2 text-xs text-zinc-50"
          {...props}
        />
      ),
    }),
    [],
  );

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as any}>
      {content}
    </ReactMarkdown>
  );
};

const ThinkingProcess = ({ steps, isStreaming }: { steps: string[]; isStreaming?: boolean }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-open is handled by the initial state and streaming status
  useEffect(() => {
    if (isStreaming) setIsOpen(true);
  }, [isStreaming]);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="mb-4 text-xs font-mono overflow-hidden">
      <div
        className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-primary transition-colors select-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-1.5 p-1 px-2 rounded-md bg-muted/50 border border-muted-foreground/10 group-hover:border-primary/30 transition-all">
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Sparkles className={cn('w-3 h-3', isStreaming && 'animate-pulse text-primary')} />
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Internal Reasoning
          </span>
          <span className="opacity-50 ml-1">({steps.length})</span>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-3.5 pl-4 border-l-2 border-primary/10 space-y-2 py-1">
              {steps.map((step, idx) => {
                const isLatest = idx === steps.length - 1 && isStreaming;
                const isTool = step.startsWith('Calling') || step.startsWith('Tool Result');

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'flex gap-2 items-start transition-colors',
                      isLatest ? 'text-primary' : 'text-muted-foreground/80',
                    )}
                  >
                    <div className="mt-1.5">
                      {isLatest ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      ) : (
                        <div
                          className={cn(
                            'w-1 h-1 rounded-full',
                            isTool ? 'bg-amber-500/50' : 'bg-muted-foreground/30',
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        'leading-relaxed break-words',
                        isTool && 'font-medium text-[11px] text-amber-500/90',
                      )}
                    >
                      {step}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface Message {
  id: string; // Add stable ID
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean; // Track error state
  thinkingSteps?: string[]; // Add thinking steps
}

interface AnalyticsChatbotProps {
  analysisData: any;
  analysisMetadata?: {
    stockFileName: string;
    salesFileName: string;
    deadStockFileName?: string;
    analyzedAt: string;
  };
}

export default function AnalyticsChatbot({
  analysisData,
  analysisMetadata,
}: AnalyticsChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false); // Voice input state
  const [isSpeaking, setIsSpeaking] = useState(false); // TTS state
  const [isExpanded, setIsExpanded] = useState(false); // Expanded view state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [contextSummary, setContextSummary] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null); // For editing messages

  // Generate detailed context summary
  useEffect(() => {
    if (!analysisData) return;
    try {
      const cleanData = { ...analysisData };
      const summary = JSON.stringify(cleanData, null, 2);
      setContextSummary(summary);
    } catch (e) {
      console.error('Failed to serialize analysis data', e);
      setContextSummary('Error generating context from data.');
    }
  }, [analysisData, analysisMetadata]);

  // Load chat history
  useEffect(() => {
    const saved = localStorage.getItem('zenzebra_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure messages have IDs if migrating from old format
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            id: m.id || `msg-${Date.now()}-${Math.random()}`,
            isStreaming: false,
          })),
        );
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save chat history
  useEffect(() => {
    if (isLoaded) {
      // Don't save empty streaming messages that might be in transient state
      const validMessages = messages.filter((m) => !m.isStreaming || m.content.length > 0);
      localStorage.setItem('zenzebra_chat_history', JSON.stringify(validMessages));
    }
  }, [messages, isLoaded]);

  // Robust Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('zenzebra_chat_history');
    toast.success('Chat history cleared');
  };

  const processAIResponse = async (text: string, history: Message[]) => {
    setLoading(true);
    try {
      // strictly format history for API
      const conversationHistory = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/admin/analytics/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: contextSummary,
          conversationHistory,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) throw new Error('Failed to connect to AI');

      // Initialize empty assistant message
      const assistantMsgId = `msg-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
          thinkingSteps: [],
        },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let currentContent = '';
      let currentThinkingSteps: string[] = [];
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });

        buffer += chunkValue;
        const lines = buffer.split('\n');
        // Keep the last part in buffer as it might be incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const event = JSON.parse(line);

            const addStep = (step: string) => {
              // Don't add if it's the exact same as the last step
              if (
                currentThinkingSteps.length > 0 &&
                currentThinkingSteps[currentThinkingSteps.length - 1] === step
              ) {
                return;
              }
              currentThinkingSteps = [...currentThinkingSteps, step];
            };

            if (event.type === 'step') {
              addStep(event.content);
            } else if (event.type === 'chunk') {
              currentContent += event.content;
            } else if (event.type === 'tool_call') {
              try {
                const inputObj = JSON.parse(event.input);
                const inputStr = inputObj.query || inputObj.input || event.input;
                addStep(`Searching for information: ${inputStr}`);
              } catch {
                addStep(`Executing ${event.name}...`);
              }
            } else if (event.type === 'tool_result') {
              addStep(`Retrieved relevant data from the web (analysis in progress...)`);
            }
          } catch (e) {
            // Fallback for simple string if not JSON (legacy support)
            if (!line.startsWith('{')) {
              currentContent += line;
            }
          }
        }

        // Update the last message with new content and thinking steps
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: currentContent, thinkingSteps: currentThinkingSteps }
              : msg,
          ),
        );
      }

      // Mark streaming as done
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg)),
      );
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
        toast.info('Response generation stopped');
      } else {
        console.error('Chat error:', error);
        toast.error('AI connection failed. Please try again.');
        // Remove the failed placeholder if empty, better UX: keep last user message and show error state
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.role !== 'assistant' || m.content !== '');
          // Mark the last user message as error if assistant failed completely
          if (filtered.length > 0 && filtered[filtered.length - 1].role === 'user') {
            return filtered.map((m, idx) =>
              idx === filtered.length - 1 ? { ...m, isError: true } : m,
            );
          }
          return filtered;
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    stopSpeaking();
    const text = input.trim();
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    await processAIResponse(text, messages);
  };

  const regenerateResponse = async () => {
    if (loading || messages.length === 0) return;
    const lastUserIdx = messages.findLastIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;

    const text = messages[lastUserIdx].content;
    const history = messages.slice(0, lastUserIdx);

    // Reset to state before the last answer
    setMessages([...history, messages[lastUserIdx]]);
    await processAIResponse(text, history);
  };

  const toggleListening = () => {
    if (isListening) {
      window.speechSynthesis.cancel(); // Stop speaking if meaningful
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech error', event);
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Strip out markdown code blocks for speech
      const cleanText = text
        .replace(/```[\s\S]*?```/g, ' I have generated a chart for you. ')
        .replace(/[*_#]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleEdit = (msg: Message) => {
    setInput(msg.content);
    // Optional: delete the message and its response if user wants to 'correct' it
    // For now, just populating input is safer UX without destroying history unexpectedly
    // But the user asked to "edit previous message".
    // Let's implement delete-and-retry flow for better "edit" feel?
    // Actually, let's just populate input. The user can clear and type.
    // If we want real edit:
    // setMessages(messages.filter(m => m.timestamp < msg.timestamp));
    // setInput(msg.content);
  };

  const handleRetry = async (msg: Message) => {
    // Remove error state
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isError: undefined } : m)));
    await processAIResponse(
      msg.content,
      messages.slice(
        0,
        messages.findIndex((m) => m.id === msg.id),
      ),
    );
  };

  // Suggested questions based on data presence
  const suggestedQuestions = [
    '💰 Total revenue overview',
    '🏆 Top best selling products',
    '📉 Identify dead stock',
    '📊 Summarize this report',
  ];

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground p-0 flex items-center justify-center transition-all hover:scale-105"
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className={cn(
              'fixed z-50 flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ease-in-out',
              isExpanded
                ? 'inset-0 sm:inset-6 w-full h-full sm:rounded-xl'
                : 'inset-0 sm:inset-auto sm:bottom-4 sm:right-4 w-full sm:w-[450px] h-full sm:h-[85vh] sm:max-h-[650px] sm:rounded-xl',
            )}
          >
            <Card className="flex flex-col h-full border-0 shadow-none bg-background/95 backdrop-blur-supports-[backdrop-filter]:bg-background/60 rounded-none sm:rounded-xl">
              {/* Header */}
              <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row justify-between items-center space-y-0 shrink-0 cursor-move">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">ZenZebra Intelligence</h3>
                    <div className="flex items-center gap-1.5 opacity-90">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                      <span className="text-[10px] font-medium">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isSpeaking && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={stopSpeaking}
                      className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-full transition-colors animate-pulse bg-red-500/20"
                      title="Stop speaking"
                    >
                      <VolumeX className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-full transition-colors hidden sm:flex"
                    title={isExpanded ? 'Minimize' : 'Maximize'}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearChat}
                    className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-full transition-colors"
                    title="Clear conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>

              {/* Chat Area */}
              <CardContent className="flex-1 p-0 overflow-hidden relative bg-muted/30">
                <ScrollArea className="h-full px-4 py-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full mt-10 space-y-6 text-center px-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center animate-in zoom-in-50 duration-500">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">How can I help you?</h3>
                        <p className="text-sm text-muted-foreground">
                          I've analyzed your latest stock & sales data. Ask me anything!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                        {suggestedQuestions.map((q, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            className="justify-start h-auto py-3 text-xs w-full font-normal hover:bg-primary/5 hover:text-primary transition-colors border-dashed"
                            onClick={() => setInput(q)}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {messages.map((msg, idx) => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={idx}
                          className={cn(
                            'flex gap-3 max-w-[90%]',
                            msg.role === 'user' ? 'ml-auto flex-row-reverse' : '',
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm',
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card text-primary',
                            )}
                          >
                            {msg.role === 'user' ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                          </div>

                          <div
                            className={cn(
                              'group relative p-3.5 rounded-2xl text-sm shadow-sm max-w-full overflow-hidden',
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-card border rounded-tl-sm pl-4 pr-4',
                              msg.isError
                                ? 'border-destructive/50 bg-destructive/10 text-destructive'
                                : '',
                            )}
                          >
                            {msg.role === 'assistant' ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none w-full overflow-hidden">
                                {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                                  <ThinkingProcess
                                    steps={msg.thinkingSteps}
                                    isStreaming={msg.isStreaming}
                                  />
                                )}
                                <MarkdownContent content={msg.content} />
                              </div>
                            ) : (
                              <div className="break-words">{msg.content}</div>
                            )}

                            {/* Error State: Retry Button */}
                            {msg.isError && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs font-medium">Failed to send</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => handleRetry(msg)}
                                >
                                  <RefreshCcw className="w-3 h-3 mr-1" /> Retry
                                </Button>
                              </div>
                            )}

                            {/* Action Buttons (Hover) */}
                            <div
                              className={cn(
                                'absolute -bottom-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 border shadow-sm',
                                msg.role === 'user' ? 'right-0' : 'left-0',
                              )}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-muted"
                                onClick={() => handleCopy(msg.content)}
                                title="Copy text"
                              >
                                <Copy className="w-3 h-3 text-muted-foreground" />
                              </Button>
                              {msg.role === 'assistant' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-muted"
                                  onClick={() => handleSpeak(msg.content)}
                                  title="Read aloud"
                                >
                                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              )}
                              {msg.role === 'user' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-muted"
                                  onClick={() => handleEdit(msg)}
                                  title="Edit message"
                                >
                                  <Edit2 className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              )}
                            </div>

                            {/* Regenerate Button for last AI message */}
                            {!loading &&
                              msg.role === 'assistant' &&
                              idx === messages.length - 1 &&
                              !msg.isStreaming && (
                                <div className="flex justify-end mt-2 opacity-50 hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={regenerateResponse}
                                    className="h-6 px-2 text-[10px] gap-1 hover:bg-muted"
                                  >
                                    <RefreshCcw className="w-3 h-3" /> Regenerate
                                  </Button>
                                </div>
                              )}
                          </div>
                        </motion.div>
                      ))}
                      {loading &&
                        messages.length > 0 &&
                        messages[messages.length - 1]?.role !== 'assistant' && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-card border text-primary flex items-center justify-center shrink-0">
                              <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-card border p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="text-xs text-muted-foreground">Thinking...</span>
                            </div>
                          </div>
                        )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Footer / Input */}
              <CardFooter className="p-3 bg-background border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex w-full items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask ZenZebra..."
                      disabled={loading}
                      className="rounded-full bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-input transition-all pr-10"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={toggleListening}
                      className={cn(
                        'absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full transition-colors',
                        isListening
                          ? 'text-red-500 bg-red-100 dark:bg-red-900/20 animate-pulse'
                          : 'text-muted-foreground hover:bg-background',
                      )}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      if (loading) {
                        stopGeneration();
                      } else {
                        sendMessage();
                      }
                    }}
                    size="icon"
                    className={cn(
                      'rounded-full h-10 w-10 shrink-0 shadow-sm transition-all duration-300 ml-2',
                      loading
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white',
                    )}
                  >
                    {loading ? (
                      <div className="h-3 w-3 rounded-sm bg-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
