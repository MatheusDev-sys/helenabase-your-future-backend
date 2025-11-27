import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import DatabasePage from "./pages/database/DatabasePage";
import TableEditor from "./pages/database/TableEditor";
import SQLEditor from "./pages/database/SQLEditor";
import StoragePage from "./pages/storage/StoragePage";
import RealtimePage from "./pages/realtime/RealtimePage";
import FunctionsPage from "./pages/functions/FunctionsPage";
import AuthPage from "./pages/auth/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/database" element={<DatabasePage />} />
          <Route path="/database/tables/:tableName" element={<TableEditor />} />
          <Route path="/database/sql" element={<SQLEditor />} />
          <Route path="/storage" element={<StoragePage />} />
          <Route path="/realtime" element={<RealtimePage />} />
          <Route path="/functions" element={<FunctionsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
