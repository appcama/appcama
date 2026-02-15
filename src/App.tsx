
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { PWAPrompt } from "@/components/PWAPrompt";
import { PWAUpdateBanner } from "@/components/PWAUpdateBanner";
import { googleMapsLoader } from "@/lib/google-maps-loader";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ValidatePassword from "./pages/ValidatePassword";
import ValidarCertificado from "./pages/ValidarCertificado";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Pré-carregar Google Maps assim que app inicia
  useEffect(() => {
    googleMapsLoader.load().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <PermissionsProvider>
            <Toaster />
            <Sonner />
            <div className="relative">
              <PWAPrompt />
              <PWAUpdateBanner />
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
          </PermissionsProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
