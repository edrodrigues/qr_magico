import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WizardProvider } from "./contexts/WizardContext";
import { ToastProvider } from "./components/Toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import { RetrospectivaDesktop } from "./pages/RetrospectivaDesktop";
import { RetrospectivaMobile } from "./pages/RetrospectivaMobile";
import { RetrospectivaPage } from "./pages/RetrospectivaPage";
import { AuthPage } from "./pages/AuthPage";

export default function App() {
  return (
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
          <Route path="/retrospectiva" element={<RetrospectivaDesktop />} />
          <Route path="/retrospectiva/mobile" element={<RetrospectivaMobile />} />
          <Route path="/p/:slug" element={<RetrospectivaPage />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
