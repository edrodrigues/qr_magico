import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { WizardProvider } from "./contexts/WizardContext";
import { ToastProvider } from "./components/Toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { SplashScreen } from "./pages/SplashScreen";
import { HomePage } from "./pages/HomePage";
import { WizardOcasiaoNome } from "./pages/WizardOcasiaoNome";
import { WizardDataRelacao } from "./pages/WizardDataRelacao";
import { WizardRelacaoSentimento } from "./pages/WizardRelacaoSentimento";
import { WizardEstiloMusical } from "./pages/WizardEstiloMusical";
import { WizardUploadFotos } from "./pages/WizardUploadFotos";
import { WizardRevisaoFinal } from "./pages/WizardRevisaoFinal";
import { WizardPagamento } from "./pages/WizardPagamento";
import { Dashboard } from "./pages/Dashboard";
import { Creditos } from "./pages/Creditos";
import { Admin } from "./pages/Admin";
import { RetrospectivaDesktop } from "./pages/RetrospectivaDesktop";
import { RetrospectivaPage } from "./pages/RetrospectivaPage";
import { AuthPage } from "./pages/AuthPage";

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/wizard" element={<ProtectedRoute><WizardProvider><Outlet /></WizardProvider></ProtectedRoute>}>
              <Route path="ocasiao-nome" element={<WizardOcasiaoNome />} />
              <Route path="data-relacao" element={<WizardDataRelacao />} />
              <Route path="relacao-sentimento" element={<WizardRelacaoSentimento />} />
              <Route path="estilo-musical" element={<WizardEstiloMusical />} />
              <Route path="upload-fotos" element={<WizardUploadFotos />} />
              <Route path="revisao-final" element={<WizardRevisaoFinal />} />
              <Route path="pagamento" element={<WizardPagamento />} />
            </Route>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/creditos" element={<ProtectedRoute><Creditos /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
            <Route path="/retrospectiva" element={<RetrospectivaDesktop />} />
            <Route path="/p/:slug" element={<RetrospectivaPage />} />
            <Route path="*" element={<Navigate to={window.location.pathname.toLowerCase()} replace />} />
          </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
