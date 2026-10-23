'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatService, ChatMessage, ChatProductCard as ChatProductCardData } from '@/lib/api/chat';
import ChatProductCard from './chat-product-card';

interface DisplayMessage extends ChatMessage {
  products?: ChatProductCardData[];
  isError?: boolean;
}

const STORAGE_KEY = 'chat-widget-messages';
// Only the most recent turns are sent, to keep each request small
const HISTORY_LIMIT = 10;
const MAX_LENGTH = 1000;

const TEXT = {
  vi: {
    title: 'Trợ lý mua sắm',
    subtitle: 'Hỏi mình để tìm sản phẩm phù hợp',
    greeting: 'Xin chào! 👋 Mình có thể giúp bạn tìm sản phẩm phù hợp. Bạn đang cần mua gì?',
    placeholder: 'Nhập câu hỏi...',
    reset: 'Cuộc trò chuyện mới',
    error: 'Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé.',
    suggestions: ['Tư vấn điện thoại chụp ảnh đẹp', 'Laptop cho sinh viên', 'Sản phẩm đang giảm giá'],
  },
  en: {
    title: 'Shopping assistant',
    subtitle: 'Ask me to find the right product',
    greeting: "Hi! 👋 I can help you find the right product. What are you looking for?",
    placeholder: 'Type a question...',
    reset: 'New conversation',
    error: "Sorry, something went wrong. Please try again later.",
    suggestions: ['Phone with a great camera', 'Laptop for students', 'Products on sale'],
  },
};

function loadMessages(): DisplayMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: DisplayMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Storage unavailable (private mode, quota): the chat still works for this page view
  }
}

// Minimal formatting for model output: **bold** and line breaks
function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, index) =>
    chunk.startsWith('**') && chunk.endsWith('**') ? (
      <strong key={index}>{chunk.slice(2, -2)}</strong>
    ) : (
      <Fragment key={index}>{chunk.replace(/^\s*[*-]\s+/gm, '• ')}</Fragment>
    ),
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] === 'en' ? 'en' : 'vi';
  const t = TEXT[locale];

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, open]);

  if (pathname?.includes('/admin')) return null;

  const updateMessages = (next: DisplayMessage[]) => {
    setMessages(next);
    saveMessages(next);
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;

    const withUser: DisplayMessage[] = [...messages, { role: 'user', content }];
    updateMessages(withUser);
    setInput('');
    setSending(true);

    try {
      const history = withUser
        .filter((message) => !message.isError)
        .slice(-HISTORY_LIMIT)
        .map(({ role, content }) => ({ role, content }));
      // The API requires the conversation to start with a user turn
      while (history.length && history[0].role !== 'user') history.shift();

      const { reply, products } = await chatService.send(history);
      updateMessages([...withUser, { role: 'assistant', content: reply, products }]);
    } catch (error) {
      updateMessages([
        ...withUser,
        { role: 'assistant', content: getErrorMessage(error, t.error), isError: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(600px,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <Bot className="h-6 w-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{t.title}</p>
              <p className="truncate text-xs opacity-80">{t.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => updateMessages([])}
              className="rounded p-1 opacity-80 hover:opacity-100"
              title={t.reset}
              aria-label={t.reset}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 opacity-80 hover:opacity-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm shadow-sm">
              {t.greeting}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {t.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-primary/30 bg-white px-3 py-1 text-xs text-primary hover:bg-primary/5"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, index) =>
              message.role === 'user' ? (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={index} className="space-y-2">
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl rounded-tl-sm px-3 py-2 text-sm shadow-sm ${
                      message.isError ? 'bg-red-50 text-red-700' : 'bg-white text-gray-800'
                    }`}
                  >
                    {renderText(message.content)}
                  </div>
                  {message.products?.map((product) => (
                    <ChatProductCard key={product.slug} product={product} locale={locale} />
                  ))}
                </div>
              ),
            )}

            {sending && (
              <div className="flex w-fit gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t bg-white p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              maxLength={MAX_LENGTH}
              disabled={sending}
              className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-50"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-full"
              disabled={sending || !input.trim()}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Floating toggle */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label={t.title}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
