import { useMemo, useRef, useCallback } from "react";
import { useInvestigation } from "@/contexts/InvestigationContext";
import { Navigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { CRYPTO_WALLET_PATTERNS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";

export default function NetworkGraphPage() {
  const { data } = useInvestigation();
  const graphRef = useRef<any>();

  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };

    const nodesMap = new Map<string, { id: string; label: string; type: string; val: number }>();
    const links: { source: string; target: string; label: string }[] = [];

    const addNode = (id: string, label: string, type: string) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, label, type, val: 1 });
      } else {
        nodesMap.get(id)!.val += 1;
      }
    };

    // Contacts as persons
    data.contacts.forEach(c => {
      addNode(c.phone, c.name || c.phone, "person");
    });

    // Chats: add phone nodes and links
    data.chats.forEach(c => {
      addNode(c.from, c.from, "phone");
      addNode(c.to, c.to, "phone");
      links.push({ source: c.from, target: c.to, label: "chat" });

      // Check for crypto wallets in message
      CRYPTO_WALLET_PATTERNS.forEach(p => {
        const matches = c.message.match(p);
        if (matches) {
          matches.forEach(w => {
            const wId = `wallet:${w.slice(0, 10)}`;
            addNode(wId, w.slice(0, 12) + "...", "wallet");
            links.push({ source: c.from, target: wId, label: "wallet" });
          });
        }
      });
    });

    // Calls
    data.calls.forEach(c => {
      addNode(c.from, c.from, "phone");
      addNode(c.to, c.to, "phone");
      links.push({ source: c.from, target: c.to, label: "call" });
    });

    // Merge contact names onto phone nodes
    data.contacts.forEach(c => {
      if (nodesMap.has(c.phone)) {
        nodesMap.get(c.phone)!.label = c.name || c.phone;
        nodesMap.get(c.phone)!.type = "person";
      }
    });

    // Deduplicate links
    const linkSet = new Set<string>();
    const dedupedLinks = links.filter(l => {
      const key = `${l.source}-${l.target}-${l.label}`;
      const rev = `${l.target}-${l.source}-${l.label}`;
      if (linkSet.has(key) || linkSet.has(rev)) return false;
      linkSet.add(key);
      return true;
    });

    return { nodes: Array.from(nodesMap.values()), links: dedupedLinks };
  }, [data]);

  const nodeColor = useCallback((node: any) => {
    switch (node.type) {
      case "person": return "hsl(185, 80%, 50%)";
      case "wallet": return "hsl(160, 70%, 45%)";
      default: return "hsl(215, 15%, 50%)";
    }
  }, []);

  const linkColor = useCallback((link: any) => {
    return link.label === "wallet" ? "hsl(160, 70%, 45%)" : "hsl(220, 20%, 25%)";
  }, []);

  if (!data) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-primary cyber-text-glow flex items-center gap-2">
            <Network className="h-5 w-5" /> Link Analysis
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {graphData.nodes.length} entities · {graphData.links.length} connections
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            <span className="h-2 w-2 rounded-full bg-primary inline-block mr-1" /> Person
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px]">
            <span className="h-2 w-2 rounded-full bg-accent inline-block mr-1" /> Wallet
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px]">
            <span className="h-2 w-2 rounded-full bg-muted-foreground inline-block mr-1" /> Phone
          </Badge>
        </div>
      </div>

      <div className="flex-1 bg-background">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeColor={nodeColor}
          nodeLabel={(node: any) => `${node.label} (${node.type})`}
          nodeRelSize={6}
          nodeVal={(node: any) => Math.max(node.val, 2)}
          linkColor={linkColor}
          linkWidth={1.5}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          backgroundColor="hsl(220, 25%, 6%)"
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.label || node.id;
            const fontSize = Math.max(10 / globalScale, 2);
            ctx.font = `${fontSize}px JetBrains Mono, monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "hsl(200, 20%, 75%)";
            ctx.fillText(label.length > 14 ? label.slice(0, 14) + ".." : label, node.x!, node.y! + 8);
          }}
        />
      </div>
    </div>
  );
}
