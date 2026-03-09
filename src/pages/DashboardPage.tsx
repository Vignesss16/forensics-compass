import { useInvestigation } from "@/contexts/InvestigationContext";
import { Navigate } from "react-router-dom";
import { MessageSquare, Phone, Users, Image, AlertTriangle, Globe, Wallet, Shield } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardPage() {
  const { data, suspiciousItems, foreignNumbers, cryptoWallets } = useInvestigation();

  if (!data) return <Navigate to="/" replace />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-primary cyber-text-glow">Investigation Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Analysis of {data.rawRecords.length} forensic records</p>
        </div>
        <Badge variant="outline" className="font-mono text-xs cyber-border">
          <Shield className="h-3 w-3 mr-1" /> CASE ACTIVE
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Chats" value={data.chats.length} icon={<MessageSquare className="h-5 w-5" />} />
        <StatCard title="Call Logs" value={data.calls.length} icon={<Phone className="h-5 w-5" />} />
        <StatCard title="Contacts" value={data.contacts.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Images" value={data.images.length} icon={<Image className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Suspicious Keywords" value={suspiciousItems.length} icon={<AlertTriangle className="h-5 w-5" />} variant="danger" />
        <StatCard title="Foreign Numbers" value={foreignNumbers.length} icon={<Globe className="h-5 w-5" />} variant="warning" />
        <StatCard title="Crypto Wallets" value={cryptoWallets.length} icon={<Wallet className="h-5 w-5" />} variant="accent" />
      </div>

      {/* Suspicious Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-lg cyber-border p-5">
          <h2 className="text-sm font-mono text-destructive uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Flagged Messages
          </h2>
          <ScrollArea className="h-72">
            <div className="space-y-3 pr-3">
              {suspiciousItems.slice(0, 20).map((item, i) => {
                const chat = item.record as any;
                return (
                  <div key={i} className="bg-secondary rounded-md p-3 border-l-2 border-destructive/60">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{chat.from} → {chat.to}</span>
                      <Badge variant="destructive" className="text-[10px] h-4">
                        {item.severity}
                      </Badge>
                    </div>
                    <p className="text-sm mb-1">{chat.message}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{item.reason}</p>
                  </div>
                );
              })}
              {suspiciousItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No suspicious items detected</p>
              )}
            </div>
          </ScrollArea>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-lg cyber-border p-5">
            <h2 className="text-sm font-mono text-warning uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4" /> Foreign Numbers
            </h2>
            <div className="space-y-2">
              {foreignNumbers.map((num, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary rounded px-3 py-2">
                  <span className="font-mono text-sm">{num}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {num.startsWith("+44") ? "UK" : num.startsWith("+971") ? "UAE" : num.startsWith("+86") ? "CN" : "INT"}
                  </Badge>
                </div>
              ))}
              {foreignNumbers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">None detected</p>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-lg cyber-border p-5">
            <h2 className="text-sm font-mono text-accent uppercase tracking-wider mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Crypto Wallets
            </h2>
            <div className="space-y-2">
              {cryptoWallets.map((w, i) => (
                <div key={i} className="bg-secondary rounded px-3 py-2 font-mono text-xs break-all">{w}</div>
              ))}
              {cryptoWallets.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">None detected</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
