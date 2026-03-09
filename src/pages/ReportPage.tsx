import { useState } from "react";
import { useInvestigation } from "@/contexts/InvestigationContext";
import { Navigate } from "react-router-dom";
import { FileText, Download, Loader2, AlertTriangle, Globe, Wallet, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import jsPDF from "jspdf";

export default function ReportPage() {
  const { data, suspiciousItems, foreignNumbers, cryptoWallets } = useInvestigation();
  const [summary, setSummary] = useState("");
  const [generating, setGenerating] = useState(false);

  if (!data) return <Navigate to="/" replace />;

  const exportJSON = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary,
      statistics: {
        totalChats: data.chats.length,
        totalCalls: data.calls.length,
        totalContacts: data.contacts.length,
        totalImages: data.images.length,
        suspiciousItems: suspiciousItems.length,
        foreignNumbers: foreignNumbers.length,
        cryptoWallets: cryptoWallets.length,
      },
      suspiciousMessages: suspiciousItems.map(item => ({
        ...item.record,
        reason: item.reason,
        severity: item.severity,
      })),
      foreignNumbers,
      cryptoWallets,
    };

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2)));
    element.setAttribute("download", `forensix_report_${Date.now()}.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("JSON report exported");
  };

  const exportCSV = () => {
    const csvContent = [
      ["Type", "From", "To", "Message/Details", "Timestamp", "Severity"],
      ...suspiciousItems.map(item => {
        const record = item.record as any;
        return [
          record.type,
          record.from || "-",
          record.to || "-",
          record.message || record.name || "-",
          record.timestamp || "-",
          item.severity,
        ];
      }),
    ]
      .map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
    element.setAttribute("download", `forensix_report_${Date.now()}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("CSV report exported");
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let y = 20;
      const lineHeight = 7;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;

      const addLine = (text: string, fontSize = 10, isBold = false) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, pageWidth);
        doc.text(lines, margin, y);
        y += lines.length * lineHeight;
      };

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("FORENSIX — Investigation Report", margin, y);
      y += 12;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toISOString()}`, margin, y);
      y += 15;

      // Summary
      addLine("INVESTIGATION SUMMARY", 14, true);
      y += 3;
      addLine(summary || "No summary provided by investigator.", 10);
      y += 10;

      // Stats
      addLine("DATA OVERVIEW", 14, true);
      y += 3;
      addLine(`Total Records: ${data.rawRecords.length}`);
      addLine(`Chats: ${data.chats.length} | Calls: ${data.calls.length} | Contacts: ${data.contacts.length} | Images: ${data.images.length}`);
      addLine(`Suspicious Items: ${suspiciousItems.length}`);
      addLine(`Foreign Numbers: ${foreignNumbers.length}`);
      addLine(`Crypto Wallets: ${cryptoWallets.length}`);
      y += 10;

      // Suspicious chats
      if (suspiciousItems.length > 0) {
        addLine("FLAGGED MESSAGES", 14, true);
        y += 3;
        suspiciousItems.slice(0, 15).forEach((item, i) => {
          const c = item.record as any;
          addLine(`${i + 1}. [${item.severity.toUpperCase()}] ${c.from} → ${c.to}`, 10, true);
          addLine(`   "${c.message}"`);
          addLine(`   Reason: ${item.reason}`);
          y += 3;
        });
        y += 7;
      }

      // Foreign numbers
      if (foreignNumbers.length > 0) {
        addLine("FOREIGN NUMBERS", 14, true);
        y += 3;
        foreignNumbers.forEach(num => addLine(`  • ${num}`));
        y += 7;
      }

      // Crypto wallets
      if (cryptoWallets.length > 0) {
        addLine("CRYPTO WALLET ADDRESSES", 14, true);
        y += 3;
        cryptoWallets.forEach(w => addLine(`  • ${w}`));
        y += 7;
      }

      // Key contacts
      addLine("KEY CONTACTS", 14, true);
      y += 3;
      data.contacts.forEach(c => {
        addLine(`  • ${c.name} — ${c.phone}${c.organization ? ` (${c.organization})` : ""}`);
      });

      doc.save("forensix-investigation-report.pdf");
      toast.success("Report downloaded successfully");
    } catch (e) {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-primary cyber-text-glow flex items-center gap-2">
          <FileText className="h-6 w-6" /> Generate Report
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Create a downloadable PDF investigation report</p>
      </div>

      {/* Report Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-lg cyber-border p-5 space-y-3">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Report Contents</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> {data.chats.length} chat messages</div>
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> {suspiciousItems.length} flagged items</div>
            <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-warning" /> {foreignNumbers.length} foreign numbers</div>
            <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-accent" /> {cryptoWallets.length} crypto wallets</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-lg cyber-border p-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">Investigation Summary</h3>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Enter your investigation summary and key findings..."
            className="bg-secondary border-border min-h-[120px] font-mono text-sm"
          />
        </motion.div>
      </div>

      <Button onClick={generatePDF} disabled={generating} className="w-full font-mono gap-2" size="lg">
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {generating ? "Generating Report..." : "Download PDF Report"}
      </Button>

      {/* Export Options */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={() => exportJSON()} 
          variant="outline" 
          className="font-mono gap-2"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
        <Button 
          onClick={() => exportCSV()} 
          variant="outline" 
          className="font-mono gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Preview of flagged items */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-lg cyber-border p-5">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Report Preview — Flagged Messages</h3>
        <div className="space-y-2 max-h-64 overflow-auto">
          {suspiciousItems.slice(0, 8).map((item, i) => {
            const c = item.record as any;
            return (
              <div key={i} className="bg-secondary rounded p-3 text-sm border-l-2 border-destructive/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{c.from} → {c.to}</span>
                  <Badge variant="destructive" className="text-[10px] h-4">{item.severity}</Badge>
                </div>
                <p className="text-foreground/80">{c.message}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
