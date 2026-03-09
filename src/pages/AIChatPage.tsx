import { useState, useRef, useEffect } from "react";
import { useInvestigation } from "@/contexts/InvestigationContext";
import { Navigate } from "react-router-dom";
import { Send, Bot, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { SUSPICIOUS_KEYWORDS, CRYPTO_WALLET_PATTERNS, isInternationalNumber } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Show chats mentioning Bitcoin",
  "Find foreign contacts",
  "Show suspicious transactions",
  "Find crypto wallet addresses",
  "List all WhatsApp messages",
  "Show call logs with longest duration",
];

export default function AIChatPage() {
  const { data, searchChats, suspiciousItems, foreignNumbers, cryptoWallets } = useInvestigation();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "🔍 **FORENSIX AI Search Ready**\n\nI can help you investigate the loaded forensic data. Try asking questions about chats, contacts, calls, or suspicious patterns.\n\n*Examples: \"Show chats mentioning Bitcoin\", \"Find foreign contacts\"*" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!data) return <Navigate to="/" replace />;

  const processQuery = (query: string): string => {
    const q = query.toLowerCase();

    // Crypto wallet search
    if (q.includes("wallet") || q.includes("crypto") || q.includes("bitcoin") || q.includes("btc") || q.includes("ethereum") || q.includes("eth")) {
      const walletChats = data.chats.filter(c => {
        const msg = c.message.toLowerCase();
        return CRYPTO_WALLET_PATTERNS.some(p => p.test(c.message)) || 
               msg.includes("bitcoin") || msg.includes("btc") || msg.includes("crypto") || 
               msg.includes("wallet") || msg.includes("ethereum") || msg.includes("eth");
      });

      if (walletChats.length === 0) return "No chats related to cryptocurrency found.";

      let result = `**Found ${walletChats.length} crypto-related messages:**\n\n`;
      walletChats.forEach((c, i) => {
        result += `**${i + 1}.** \`${c.from}\` → \`${c.to}\`\n> ${c.message}\n> _${c.timestamp} · ${c.platform}_\n\n`;
      });

      if (cryptoWallets.length > 0) {
        result += `\n**Detected wallet addresses:**\n`;
        cryptoWallets.forEach(w => { result += `- \`${w}\`\n`; });
      }
      return result;
    }

    // Foreign contacts
    if (q.includes("foreign") || q.includes("international") || q.includes("overseas")) {
      if (foreignNumbers.length === 0) return "No foreign/international phone numbers detected.";

      let result = `**Found ${foreignNumbers.length} foreign numbers:**\n\n`;
      foreignNumbers.forEach(num => {
        const contact = data.contacts.find(c => c.phone === num);
        const prefix = num.startsWith("+44") ? "🇬🇧 UK" : num.startsWith("+971") ? "🇦🇪 UAE" : num.startsWith("+86") ? "🇨🇳 China" : "🌍 International";
        result += `- \`${num}\` — ${prefix}${contact ? ` (${contact.name})` : ""}\n`;
      });
      return result;
    }

    // Suspicious
    if (q.includes("suspicious") || q.includes("flagged") || q.includes("alert")) {
      if (suspiciousItems.length === 0) return "No suspicious items flagged.";

      let result = `**⚠️ ${suspiciousItems.length} suspicious messages flagged:**\n\n`;
      suspiciousItems.slice(0, 10).forEach((item, i) => {
        const c = item.record as any;
        result += `**${i + 1}.** [${item.severity.toUpperCase()}] \`${c.from}\` → \`${c.to}\`\n> ${c.message}\n> _Reason: ${item.reason}_\n\n`;
      });
      return result;
    }

    // Call logs
    if (q.includes("call") || q.includes("phone log") || q.includes("duration")) {
      const sorted = [...data.calls].sort((a, b) => (b.duration || 0) - (a.duration || 0));
      let result = `**${data.calls.length} call records found:**\n\n`;
      sorted.forEach((c, i) => {
        const dur = c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : "N/A";
        result += `**${i + 1}.** \`${c.from}\` → \`${c.to}\` · ${dur} · ${c.direction} · ${c.timestamp}\n`;
      });
      return result;
    }

    // Contacts
    if (q.includes("contact") || q.includes("people") || q.includes("person")) {
      let result = `**${data.contacts.length} contacts found:**\n\n`;
      data.contacts.forEach((c, i) => {
        result += `**${i + 1}. ${c.name}**\n- Phone: \`${c.phone}\`${c.email ? `\n- Email: ${c.email}` : ""}${c.organization ? `\n- Org: ${c.organization}` : ""}\n\n`;
      });
      return result;
    }

    // Platform filter
    const platforms = ["whatsapp", "telegram", "signal", "imessage"];
    const matchedPlatform = platforms.find(p => q.includes(p));
    if (matchedPlatform) {
      const filtered = data.chats.filter(c => c.platform?.toLowerCase() === matchedPlatform);
      if (filtered.length === 0) return `No ${matchedPlatform} messages found.`;

      let result = `**${filtered.length} ${matchedPlatform} messages:**\n\n`;
      filtered.forEach((c, i) => {
        result += `**${i + 1}.** \`${c.from}\` → \`${c.to}\`\n> ${c.message}\n> _${c.timestamp}_\n\n`;
      });
      return result;
    }

    // General search
    const results = searchChats(query);
    if (results.length > 0) {
      let result = `**Found ${results.length} matching records:**\n\n`;
      results.slice(0, 15).forEach((c, i) => {
        result += `**${i + 1}.** \`${c.from}\` → \`${c.to}\`\n> ${c.message}\n> _${c.timestamp} · ${c.platform}_\n\n`;
      });
      return result;
    }

    return `No results found for "${query}". Try searching for specific keywords, phone numbers, or platforms.`;
  };

  const handleSend = (text?: string) => {
    const query = text || input.trim();
    if (!query) return;

    const userMsg: Message = { role: "user", content: query };
    const response = processQuery(query);
    const assistantMsg: Message = { role: "assistant", content: response };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold font-mono text-primary cyber-text-glow flex items-center gap-2">
          <Search className="h-5 w-5" /> AI Investigation Search
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Search across {data.rawRecords.length} forensic records</p>
      </div>

      {/* Suggestions */}
      <div className="p-3 border-b border-border flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            className="text-xs bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary px-3 py-1.5 rounded-full border border-border hover:border-primary/30 transition-all font-mono"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="shrink-0 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center cyber-border">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary/10 cyber-border"
                      : "bg-card border border-border"
                  }`}
                >
                  {msg.content.split(/(\*\*.*?\*\*|`.*?`|_.*?_|> .*)/g).map((part, j) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={j}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith("`") && part.endsWith("`")) {
                      return <code key={j} className="bg-secondary px-1 rounded text-primary font-mono text-xs">{part.slice(1, -1)}</code>;
                    }
                    if (part.startsWith("_") && part.endsWith("_")) {
                      return <em key={j} className="text-muted-foreground text-xs">{part.slice(1, -1)}</em>;
                    }
                    if (part.startsWith("> ")) {
                      return <span key={j} className="block border-l-2 border-primary/30 pl-2 my-1 text-foreground/80">{part.slice(2)}</span>;
                    }
                    return <span key={j}>{part}</span>;
                  })}
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Search forensic data... (e.g., 'Show chats mentioning Bitcoin')"
            className="font-mono text-sm bg-secondary border-border focus:border-primary"
          />
          <Button onClick={() => handleSend()} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
