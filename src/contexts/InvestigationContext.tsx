import React, { createContext, useContext, useState, ReactNode } from "react";
import { InvestigationData, SuspiciousItem, SUSPICIOUS_KEYWORDS, CRYPTO_WALLET_PATTERNS, isInternationalNumber, ChatRecord } from "@/lib/types";

interface InvestigationContextType {
  data: InvestigationData | null;
  setData: (data: InvestigationData) => void;
  clearData: () => void;
  suspiciousItems: SuspiciousItem[];
  foreignNumbers: string[];
  cryptoWallets: string[];
  searchChats: (query: string) => ChatRecord[];
}

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

export function InvestigationProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<InvestigationData | null>(null);

  const setData = (newData: InvestigationData) => {
    setDataState(newData);
  };

  const clearData = () => setDataState(null);

  const suspiciousItems: SuspiciousItem[] = React.useMemo(() => {
    if (!data) return [];
    const items: SuspiciousItem[] = [];

    data.chats.forEach((chat) => {
      const msgLower = chat.message.toLowerCase();
      const matchedKeywords = SUSPICIOUS_KEYWORDS.filter((kw) => msgLower.includes(kw));
      if (matchedKeywords.length > 0) {
        items.push({
          record: chat,
          reason: `Contains keywords: ${matchedKeywords.join(", ")}`,
          severity: matchedKeywords.length >= 3 ? "high" : matchedKeywords.length >= 2 ? "medium" : "low",
        });
      }

      CRYPTO_WALLET_PATTERNS.forEach((pattern) => {
        if (pattern.test(chat.message)) {
          items.push({
            record: chat,
            reason: "Contains crypto wallet address",
            severity: "high",
          });
        }
      });
    });

    return items;
  }, [data]);

  const foreignNumbers = React.useMemo(() => {
    if (!data) return [];
    const numbers = new Set<string>();
    data.chats.forEach((c) => {
      if (isInternationalNumber(c.from)) numbers.add(c.from);
      if (isInternationalNumber(c.to)) numbers.add(c.to);
    });
    data.calls.forEach((c) => {
      if (isInternationalNumber(c.from)) numbers.add(c.from);
      if (isInternationalNumber(c.to)) numbers.add(c.to);
    });
    data.contacts.forEach((c) => {
      if (isInternationalNumber(c.phone)) numbers.add(c.phone);
    });
    return Array.from(numbers);
  }, [data]);

  const cryptoWallets = React.useMemo(() => {
    if (!data) return [];
    const wallets = new Set<string>();
    data.chats.forEach((chat) => {
      CRYPTO_WALLET_PATTERNS.forEach((pattern) => {
        const matches = chat.message.match(pattern);
        if (matches) matches.forEach((m) => wallets.add(m));
      });
    });
    return Array.from(wallets);
  }, [data]);

  const searchChats = (query: string): ChatRecord[] => {
    if (!data) return [];
    const q = query.toLowerCase();
    return data.chats.filter(
      (c) =>
        c.message.toLowerCase().includes(q) ||
        c.from.toLowerCase().includes(q) ||
        c.to.toLowerCase().includes(q) ||
        (c.platform && c.platform.toLowerCase().includes(q))
    );
  };

  return (
    <InvestigationContext.Provider
      value={{ data, setData, clearData, suspiciousItems, foreignNumbers, cryptoWallets, searchChats }}
    >
      {children}
    </InvestigationContext.Provider>
  );
}

export function useInvestigation() {
  const ctx = useContext(InvestigationContext);
  if (!ctx) throw new Error("useInvestigation must be used within InvestigationProvider");
  return ctx;
}
