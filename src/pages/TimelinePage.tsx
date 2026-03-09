import { useMemo, useState } from "react";
import { useInvestigation } from "@/contexts/InvestigationContext";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Calendar } from "lucide-react";

export default function TimelinePage() {
  const { data } = useInvestigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const sortedChats = useMemo(() => {
    if (!data) return [];
    
    return data.chats
      .filter(chat => {
        const matchesSearch = chat.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             chat.from.includes(searchTerm) ||
                             chat.to.includes(searchTerm);
        const matchesContact = !selectedContact || chat.from === selectedContact || chat.to === selectedContact;
        return matchesSearch && matchesContact;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data, searchTerm, selectedContact]);

  const contacts = useMemo(() => {
    if (!data) return [];
    const uniqueContacts = new Set<string>();
    data.chats.forEach(chat => {
      uniqueContacts.add(chat.from);
      uniqueContacts.add(chat.to);
    });
    return Array.from(uniqueContacts).sort();
  }, [data]);

  const messagesByDate = useMemo(() => {
    const grouped: Record<string, typeof sortedChats> = {};
    sortedChats.forEach(chat => {
      const date = new Date(chat.timestamp).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(chat);
    });
    return Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [sortedChats]);

  if (!data) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold font-mono text-primary cyber-text-glow">
            Message Timeline
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {sortedChats.length} messages across {messagesByDate.length} days
        </p>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-border space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contact Filter */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-mono">FILTER BY CONTACT</p>
          <div className="flex gap-2 flex-wrap max-h-20 overflow-y-auto">
            <button
              onClick={() => setSelectedContact(null)}
              className={`px-3 py-1 text-sm rounded border font-mono ${
                selectedContact === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              All
            </button>
            {contacts.slice(0, 10).map(contact => (
              <button
                key={contact}
                onClick={() => setSelectedContact(contact)}
                className={`px-2 py-1 text-xs rounded border font-mono truncate max-w-[200px] ${
                  selectedContact === contact
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-accent"
                }`}
                title={contact}
              >
                {contact}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-4">
        {messagesByDate.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messagesByDate.map(([date, messages]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-4 mb-4 sticky top-0 bg-background py-2">
                  <div className="text-sm font-mono text-primary border-b border-primary pb-1">
                    {date}
                  </div>
                  <div className="flex-1 border-b border-border" />
                  <Badge variant="outline" className="text-xs">
                    {messages.length} messages
                  </Badge>
                </div>

                {/* Messages */}
                <div className="space-y-3 ml-4">
                  {messages.map((chat, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-cyan-400/30 pl-4 py-2 hover:border-cyan-400 transition-colors"
                    >
                      {/* Time and Participants */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {new Date(chat.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-cyan-400">→</span>
                        <span className="text-xs font-mono text-foreground">{chat.from}</span>
                        <span className="text-xs text-yellow-400">→</span>
                        <span className="text-xs font-mono text-foreground">{chat.to}</span>
                        {chat.platform && (
                          <Badge variant="outline" className="ml-auto text-[10px]">
                            {chat.platform}
                          </Badge>
                        )}
                      </div>

                      {/* Message */}
                      <p className="text-sm text-foreground break-words bg-secondary rounded px-3 py-2">
                        {chat.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
