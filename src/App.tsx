
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAPrompt } from "@/components/PWAPrompt";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ValidatePassword from "./pages/ValidatePassword";
import ValidarCertificado from "./pages/ValidarCertificado";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <AuthProvider>
      <PermissionsProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <div className="relative">
            <OfflineIndicator className="fixed top-4 right-4 z-50" />
            <PWAPrompt />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/validate-password" element={<ValidatePassword />} />
              <Route path="/validar-certificado/:codigo" element={<ValidarCertificado />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </PermissionsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
