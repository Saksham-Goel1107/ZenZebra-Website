'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, ChevronDown, Loader2, RefreshCcw, Send, Sparkles, Trash2, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    isStreaming?: boolean;
}

interface AnalyticsChatbotProps {
    analysisData: any;
    analysisMetadata?: {
        stockFileName: string;
        salesFileName: string;
        analyzedAt: string;
    };
}

export default function AnalyticsChatbot({ analysisData, analysisMetadata }: AnalyticsChatbotProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [contextSummary, setContextSummary] = useState<string>('');

    // Generate detailed context summary
    useEffect(() => {
        if (!analysisData) return;
        try {
            const cleanData = { ...analysisData };
            const summary = JSON.stringify(cleanData, null, 2);
            setContextSummary(summary);
        } catch (e) {
            console.error("Failed to serialize analysis data", e);
            setContextSummary("Error generating context from data.");
        }
    }, [analysisData, analysisMetadata]);

    // Load chat history
    useEffect(() => {
        const saved = localStorage.getItem('zenzebra_chat_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.map((m: any) => ({ ...m, isStreaming: false })));
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save chat history
    useEffect(() => {
        if (isLoaded) {
            // Don't save empty streaming messages that might be in transient state
            const validMessages = messages.filter(m => !m.isStreaming || m.content.length > 0);
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
        toast.success("Chat history cleared");
    };

    const processAIResponse = async (text: string, history: Message[]) => {
        setLoading(true);
        try {
            // strictly format history for API
            const conversationHistory = history.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('/api/admin/analytics/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    context: contextSummary,
                    conversationHistory,
                }),
            });

            if (!response.ok || !response.body) throw new Error('Failed to connect to AI');

            // Initialize empty assistant message
            const assistantMsgId = Date.now();
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '', timestamp: assistantMsgId, isStreaming: true }
            ]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let currentContent = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: !done });
                currentContent += chunkValue;

                // Update the last message with new content
                setMessages(prev => prev.map(msg =>
                    msg.timestamp === assistantMsgId
                        ? { ...msg, content: currentContent }
                        : msg
                ));
            }

            // Mark streaming as done
            setMessages(prev => prev.map(msg =>
                msg.timestamp === assistantMsgId
                    ? { ...msg, isStreaming: false }
                    : msg
            ));

        } catch (error) {
            console.error('Chat error:', error);
            toast.error('AI connection failed. Please try again.');
            // Remove the failed placeholder if empty
            setMessages(prev => prev.filter(m => m.content !== '' || m.role !== 'assistant'));
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const text = input.trim();
        const newMessage: Message = { role: 'user', content: text, timestamp: Date.now() };

        setMessages(prev => [...prev, newMessage]);
        setInput('');

        await processAIResponse(text, messages);
    };

    const regenerateResponse = async () => {
        if (loading || messages.length === 0) return;
        const lastUserIdx = messages.findLastIndex(m => m.role === 'user');
        if (lastUserIdx === -1) return;

        const text = messages[lastUserIdx].content;
        const history = messages.slice(0, lastUserIdx);

        // Reset to state before the last answer
        setMessages([...history, messages[lastUserIdx]]);
        await processAIResponse(text, history);
    };

    // Suggested questions based on data presence
    const suggestedQuestions = [
        "💰 Total revenue overview",
        "🏆 Top best selling products",
        "📉 Identify dead stock",
        "📊 Summarize this report",
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
                        className="fixed bottom-6 right-6 z-50 w-[450px] flex flex-col shadow-2xl rounded-xl overflow-hidden"
                    >
                        <Card className="flex flex-col h-[650px] border-0 shadow-none bg-background/95 backdrop-blur-supports-[backdrop-filter]:bg-background/60">
                            {/* Header */}
                            <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row justify-between items-center space-y-0 shrink-0">
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
                                                        "flex gap-3 max-w-[90%]",
                                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                                                        msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-card text-primary"
                                                    )}>
                                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                                    </div>

                                                    <div className={cn(
                                                        "p-3.5 rounded-2xl text-sm shadow-sm",
                                                        msg.role === 'user'
                                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                            : "bg-card border rounded-tl-sm"
                                                    )}>
                                                        {msg.role === 'assistant' ? (
                                                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:p-2 prose-pre:rounded-md">
                                                                <ReactMarkdown
                                                                    components={{
                                                                        strong: ({ node, ...props }) => <span className="font-semibold text-primary" {...props} />,
                                                                        a: ({ node, ...props }) => <a className="text-primary underline underline-offset-2 hover:opacity-80" target="_blank" {...props} />
                                                                    }}
                                                                >
                                                                    {msg.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            msg.content
                                                        )}

                                                        {/* Regenerate Button for last AI message */}
                                                        {!loading && msg.role === 'assistant' && idx === messages.length - 1 && (
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
                                            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
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
                                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                                    className="flex w-full items-center gap-2"
                                >
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask about your data..."
                                        disabled={loading}
                                        className="rounded-full bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-input transition-all"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={loading || !input.trim()}
                                        className="rounded-full h-10 w-10 shrink-0 shadow-sm"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
