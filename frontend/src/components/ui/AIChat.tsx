import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Send,
  Loader2,
  Sparkles,
  X,
  Trash2,
  Download,
  Maximize2,
  Minimize2,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Square,
  StopCircle,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { apiRequest } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

interface Attachment {
  id: string;
  file: File;
  type: 'image' | 'file';
  preview?: string;
  name: string;
  size: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  'How is my financial health?',
  'Should I prepay my loan?',
  'Am I on track for my goals?',
  'How should I diversify my portfolio?',
  'What insurance do I need?',
  'How can I save tax this year?',
  'Review my mutual fund holdings',
];

const WELCOME_MESSAGE =
  "Hi! I'm FinLeap AI, your personal financial advisor. I can analyze your portfolio, suggest improvements, and answer any finance questions. What would you like to know?";

const SUGGESTION_EMOJIS = ['💚', '🏦', '🎯', '📈', '🛡️', '💰', '📊'];

const EMOJI_PREFIX_RE = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u;

function getAssistantEmoji(content: string): string {
  const lower = content.toLowerCase();
  if (/sorry|error|encountered|unable|couldn't|failed/i.test(lower)) return '😔';
  if (/hello|hi!|how can i help|welcome|cleared/i.test(lower)) return '👋';
  if (/financial health|health score|wellness/i.test(lower)) return '💚';
  if (/loan|emi|prepay|debt|interest/i.test(lower)) return '🏦';
  if (/goal|on track|target|deadline/i.test(lower)) return '🎯';
  if (/portfolio|diversify|allocation|holdings|equity|stock/i.test(lower)) return '📈';
  if (/insurance|cover|policy|premium/i.test(lower)) return '🛡️';
  if (/tax|deduction|regime|80c|saving/i.test(lower)) return '💰';
  if (/mutual fund|nav|sip|\bmf\b/i.test(lower)) return '📊';
  if (/great|excellent|good|positive|strong|well done|\bok\b|sure|absolutely/i.test(lower)) return '✅';
  if (/risk|caution|warning|careful|volatile/i.test(lower)) return '⚠️';
  if (/budget|expense|spending|save/i.test(lower)) return '💡';
  return '✨';
}

function formatAssistantContent(content: string, isStreaming = false): string {
  const trimmed = content.trim();
  if (!trimmed) return isStreaming ? '✨ Thinking…' : '';
  if (EMOJI_PREFIX_RE.test(trimmed)) return trimmed;
  return `${getAssistantEmoji(trimmed)} ${trimmed}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

let attachmentIdCounter = 0;
function createAttachment(file: File): Attachment {
  const isImage = file.type.startsWith('image/');
  const id = `att-${++attachmentIdCounter}-${Date.now()}`;
  return {
    id,
    file,
    type: isImage ? 'image' : 'file',
    preview: isImage ? URL.createObjectURL(file) : undefined,
    name: file.name,
    size: file.size,
  };
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    } else {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isFullscreen, onClose]);

  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.preview) URL.revokeObjectURL(a.preview);
      });
    };
  }, [attachments]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) continue;
      newAttachments.push(createAttachment(file));
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if ((!msg && !attachments.length) || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: msg,
      timestamp: new Date(),
      attachments: attachments.length ? [...attachments] : undefined,
    };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setLoading(true);
    setStreaming(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      try {
        const response = await fetch(`${API_BASE}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ message: msg, history }),
          signal: controller.signal,
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullResponse = '';

          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: '', timestamp: new Date() },
          ]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: 'assistant',
                      content: fullResponse,
                      timestamp: new Date(),
                    };
                    return updated;
                  });
                }
              } catch {
                /* ignore partial JSON */
              }
            }
          }

          setStreaming(false);
          abortRef.current = null;
          return;
        }
      } catch (err) {
        if (controller.signal.aborted) return;
      }

      const data = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msg, history }),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(data.timestamp),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm sorry, I encountered an error. Please make sure the AI service is configured and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setStreaming(false);
  };

  const regenerate = async () => {
    if (loading || regenerating) return;

    let lastUserMsg: Message | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i];
        break;
      }
    }
    if (!lastUserMsg) return;

    setRegenerating(true);
    setMessages((prev) => {
      const filtered = prev[prev.length - 1]?.role === 'assistant'
        ? prev.slice(0, -1)
        : prev;
      return filtered;
    });

    setLoading(true);
    setStreaming(true);

    const history = messages
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_BASE}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: lastUserMsg.content, history }),
        signal: controller.signal,
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', timestamp: new Date() },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: new Date(),
                  };
                  return updated;
                });
              }
            } catch {
              /* ignore partial JSON */
            }
          }
        }
      }
    } catch {
      /* abort or error */
    } finally {
      setLoading(false);
      setStreaming(false);
      setRegenerating(false);
      abortRef.current = null;
    }
  };

  const copyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(index);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard write failed */
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared. How can I help you?',
        timestamp: new Date(),
      },
    ]);
    setAttachments([]);
  };

  const exportChat = () => {
    const chatText = messages
      .map(
        (m) =>
          `${m.role === 'user' ? user?.name || 'You' : 'FinLeap AI'}: ${m.content}`
      )
      .join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finleap-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const showSuggestions = messages.length <= 1 && !loading;
  const hasContent = input.trim() || attachments.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: isFullscreen ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-0 z-40 bg-background/60 backdrop-blur-sm',
              !isFullscreen && 'pointer-events-none'
            )}
            onClick={() => isFullscreen && setIsFullscreen(false)}
          />

          <motion.div
            key="chat-panel"
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden border border-border/60 bg-background shadow-2xl',
              isFullscreen
                ? 'inset-3 sm:inset-5 md:inset-8 rounded-2xl'
                : 'bottom-6 right-6 w-[min(calc(100vw-1.5rem),440px)] h-[min(calc(100vh-5rem),620px)] rounded-2xl'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            <AnimatePresence>
              {dragOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <Paperclip className="h-8 w-8" />
                    <p className="text-sm font-medium">Drop files here</p>
                    <p className="text-xs text-muted-foreground">
                      Images, PDFs, CSVs up to 10MB
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative shrink-0 border-b border-border/60 bg-linear-to-r from-primary/5 via-background to-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                    <Sparkles className="h-5 w-5" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-semibold tracking-tight">
                        FinLeap AI
                      </h2>
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-medium"
                      >
                        {streaming ? '✍️ Typing…' : '🟢 Online'}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      Your personal financial advisor
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={clearChat}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear chat</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={exportChat}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export chat</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsFullscreen((f) => !f)}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onClose}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
            >
              <div
                className={cn(
                  'mx-auto space-y-4',
                  isFullscreen && 'max-w-3xl'
                )}
              >
                {messages.map((msg, i) => {
                  const isLastAssistant =
                    msg.role === 'assistant' &&
                    i === messages.length - 1 &&
                    streaming;
                  const isLastUser =
                    msg.role === 'user' && i === messages.length - 1;
                  const showRegenerate =
                    msg.role === 'assistant' &&
                    i === messages.length - 1 &&
                    !loading &&
                    !streaming;

                  return (
                    <motion.div
                      key={`${msg.timestamp.getTime()}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'group flex gap-2.5',
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {msg.role === 'user' ? (
                          userInitial
                        ) : (
                          <span className="text-sm leading-none" aria-hidden>
                            {getAssistantEmoji(msg.content || (streaming ? 'thinking' : 'hello'))}
                          </span>
                        )}
                      </div>

                      <div
                        className={cn(
                          'flex max-w-[85%] flex-col gap-1',
                          msg.role === 'user' ? 'items-end' : 'items-start'
                        )}
                      >
                        {/* Attachments display */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {msg.attachments.map((att) =>
                              att.type === 'image' && att.preview ? (
                                <div
                                  key={att.id}
                                  className="overflow-hidden rounded-lg border border-border/50"
                                >
                                  <img
                                    src={att.preview}
                                    alt={att.name}
                                    className="h-24 w-24 object-cover"
                                  />
                                </div>
                              ) : (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-2"
                                >
                                  {getFileIcon(att.file.type)}
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium">
                                      {att.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {formatFileSize(att.size)}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                            msg.role === 'user'
                              ? 'rounded-tr-md bg-primary text-primary-foreground'
                              : 'rounded-tl-md border border-border/50 bg-muted/50'
                          )}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-code:before:content-none prose-code:after:content-none">
                              <Markdown
                                components={{
                                  code({ className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(
                                      className || ''
                                    );
                                    const isInline = !match;
                                    if (isInline) {
                                      return (
                                        <code
                                          className={cn(
                                            'rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono',
                                            className
                                          )}
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                      );
                                    }
                                    return (
                                      <div className="relative my-2">
                                        <div className="flex items-center justify-between rounded-t-lg bg-zinc-900 px-4 py-1.5">
                                          <span className="text-xs text-zinc-400">
                                            {match[1]}
                                          </span>
                                        </div>
                                        <pre className="overflow-x-auto rounded-b-lg bg-zinc-950 p-4 text-xs">
                                          <code className={className} {...props}>
                                            {children}
                                          </code>
                                        </pre>
                                      </div>
                                    );
                                  },
                                }}
                              >
                                {formatAssistantContent(
                                  msg.content,
                                  isLastAssistant && !msg.content.trim()
                                )}
                              </Markdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
                          {isLastAssistant && (
                            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary" />
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="px-1 text-[10px] text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {msg.role === 'assistant' && msg.content && (
                            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      copyMessage(msg.content, i)
                                    }
                                  >
                                    {copiedId === i ? (
                                      <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {copiedId === i ? 'Copied!' : 'Copy'}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}

                          {showRegenerate && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                                  onClick={regenerate}
                                  disabled={regenerating}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Regenerate</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {loading && !streaming && (
                  <div className="flex gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
                      ✨
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-border/50 bg-muted/50 px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="shrink-0 overflow-hidden border-t border-border/40 bg-muted/20 px-4 py-3"
                >
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Try asking
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s, i) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        className="h-auto whitespace-normal rounded-full px-3 py-1.5 text-left text-xs leading-snug"
                        onClick={() => sendMessage(s)}
                        disabled={loading}
                      >
                        {SUGGESTION_EMOJIS[i]} {s}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Attachment Previews */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="shrink-0 overflow-hidden border-t border-border/40 bg-muted/20 px-4 py-2"
                >
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <motion.div
                        key={att.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group/att"
                      >
                        {att.type === 'image' && att.preview ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border/50">
                            <img
                              src={att.preview}
                              alt={att.name}
                              className="h-full w-full object-cover"
                            />
                            <button
                              onClick={() => removeAttachment(att.id)}
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover/att:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-2.5 py-1.5">
                            {getFileIcon(att.file.type)}
                            <div className="min-w-0">
                              <p className="max-w-25 truncate text-xs font-medium">
                                {att.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatFileSize(att.size)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeAttachment(att.id)}
                              className="ml-1 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="shrink-0 border-t border-border/60 bg-background p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className={cn(
                  'flex items-end gap-2',
                  isFullscreen && 'mx-auto max-w-3xl'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.csv,.xlsx,.xls,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-xl"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach files</TooltipContent>
                </Tooltip>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Ask about your finances… or paste an image"
                  rows={1}
                  disabled={loading}
                  className={cn(
                    'flex max-h-30 min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm',
                    'ring-offset-background placeholder:text-muted-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                />

                {streaming ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        className="h-11 w-11 shrink-0 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={stopGeneration}
                      >
                        <Square className="h-4 w-4 fill-current" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop generating</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl"
                    disabled={loading || !hasContent}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </form>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Enter to send · Shift+Enter for new line · Esc to{' '}
                {isFullscreen ? 'exit fullscreen' : 'close'}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
