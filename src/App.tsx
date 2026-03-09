import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InvestigationProvider } from "@/contexts/InvestigationContext";
import Layout from "@/components/Layout";
import UploadPage from "@/pages/UploadPage";
import DashboardPage from "@/pages/DashboardPage";
import AIChatPage from "@/pages/AIChatPage";
import NetworkGraphPage from "@/pages/NetworkGraphPage";
import ReportPage from "@/pages/ReportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InvestigationProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat" element={<AIChatPage />} />
              <Route path="/graph" element={<NetworkGraphPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </InvestigationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
