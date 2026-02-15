'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { account } from '@/lib/appwrite';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit2,
  Loader2,
  Lock,
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
  const [isFeatureEnabled, setIsFeatureEnabled] = useState<boolean>(true); // Assume enabled by default
  const [checkingFeature, setCheckingFeature] = useState<boolean>(true);

  // Check if chatbot is enabled
  useEffect(() => {
    const checkFeatureStatus = async () => {
      try {
        const { jwt } = await account.createJWT();
        const res = await fetch('/api/settings', {
          headers: {
            'X-Appwrite-JWT': jwt,
          },
        });
        if (res.ok) {
          const settings = await res.json();
          // Use explicit check for false, default to true if undefined
          setIsFeatureEnabled(settings.analyticsChatbotEnabled !== false);
        }
      } catch (error) {
        console.error('Failed to check chatbot status:', error);
      } finally {
        setCheckingFeature(false);
      }
    };
    checkFeatureStatus();
  }, []);

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

  if (checkingFeature) {
    return null;
  }

  if (!isFeatureEnabled) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center justify-center w-14 h-14 bg-[#CC2224] text-white rounded-full shadow-[0_4px_14px_0_rgba(204,34,36,0.39)] hover:shadow-[0_6px_20px_rgba(204,34,36,0.23)] hover:bg-[#b01c1e] transition-all duration-300"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              width: isExpanded ? '800px' : '400px',
              height: isExpanded ? '80vh' : '600px',
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed bottom-6 right-6 z-50 flex flex-col bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-[2rem] overflow-hidden',
              isExpanded ? 'max-w-[calc(100vw-48px)]' : 'w-[400px] max-h-[80vh]',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CC2224] to-[#ff4d4f] flex items-center justify-center shadow-lg shadow-[#CC2224]/20">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-tight">ZenZebra Intelligence</h3>
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    AI-Powered Analytics
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Minimize' : 'Expand'}
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
                  className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={clearChat}
                  title="Clear Chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-muted/5 relative">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-2">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">How can I help you today?</h4>
                    <p className="text-sm text-muted-foreground max-w-[260px]">
                      I can analyze your sales trends, identify dead stock, or summarize your
                      inventory status.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(q);
                          // Optional: Auto-send?
                          // setInput(q);
                          // setTimeout(() => sendMessage(), 100);
                        }}
                        className="text-xs text-left px-4 py-3 rounded-xl bg-background border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 shadow-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pb-4">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        'flex gap-3 max-w-[90%]',
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto',
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border border-border',
                        )}
                      >
                        {msg.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4 text-primary" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div className="flex flex-col gap-1 min-w-0">
                        {/* Thinking Process Display */}
                        {msg.role === 'assistant' && msg.thinkingSteps && (
                          <ThinkingProcess
                            steps={msg.thinkingSteps}
                            isStreaming={msg.isStreaming && index === messages.length - 1}
                          />
                        )}

                        <div
                          className={cn(
                            'p-4 rounded-2xl shadow-sm text-sm overflow-hidden break-words relative group',
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : cn(
                                  'bg-background border border-border rounded-tl-sm text-foreground',
                                  msg.isError && 'border-destructive/50 bg-destructive/5',
                                ),
                          )}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {msg.content ? (
                                <MarkdownContent content={msg.content} />
                              ) : (
                                msg.isStreaming && (
                                  <span className="flex items-center gap-1 opacity-50">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                                  </span>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          )}

                          {/* Message Actions */}
                          {!msg.isStreaming && !msg.isError && (
                            <div
                              className={cn(
                                'absolute -bottom-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1',
                                msg.role === 'user' ? 'right-0' : 'left-0',
                              )}
                            >
                              <button
                                onClick={() => handleCopy(msg.content)}
                                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {msg.role === 'assistant' && (
                                <button
                                  onClick={() =>
                                    isSpeaking ? stopSpeaking() : handleSpeak(msg.content)
                                  }
                                  className={cn(
                                    'p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors',
                                    isSpeaking && 'text-primary animate-pulse',
                                  )}
                                  title="Read Aloud"
                                >
                                  {isSpeaking ? (
                                    <VolumeX className="w-3 h-3" />
                                  ) : (
                                    <Volume2 className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                              {msg.role === 'user' && (
                                <button
                                  onClick={() => handleEdit(msg)}
                                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => handleRetry(msg)}
                                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Regenerate"
                              >
                                <RefreshCcw className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[10px] text-muted-foreground/50 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-background border-t">
              <div className="flex items-end gap-2 bg-muted/50 p-2 rounded-[1.5rem] border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-all shadow-inner">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-10 w-10 rounded-full shrink-0 transition-colors',
                    isListening
                      ? 'bg-red-500/10 text-red-500 animate-pulse'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
                  )}
                  onClick={toggleListening}
                  disabled={loading}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={loading}
                  placeholder="Ask about your data..."
                  className="flex-1 max-h-[120px] min-h-[40px] py-2.5 bg-transparent border-none focus:ring-0 text-sm placeholder:text-muted-foreground resize-none custom-scrollbar"
                  rows={1}
                />

                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className={cn(
                    'h-10 w-10 rounded-full shrink-0 shadow-lg transition-all',
                    !input.trim() || loading
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-[#CC2224] hover:bg-[#b01c1e] text-white hover:scale-105 active:scale-95',
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[9px] text-muted-foreground/60 font-medium">
                  AI responses may refer to real-time data but should be verified.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
