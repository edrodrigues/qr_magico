import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          <Route path="/wizard/ocasiao-nome" element={<ProtectedRoute><WizardProvider><WizardOcasiaoNome /></WizardProvider></ProtectedRoute>} />
          <Route path="/wizard/data-relacao" element={<ProtectedRoute><WizardProvider><WizardDataRelacao /></WizardProvider></ProtectedRoute>} />
          <Route path="/wizard/relacao-sentimento" element={<ProtectedRoute><WizardProvider><WizardRelacaoSentimento /></WizardProvider></ProtectedRoute>} />
          <Route path="/wizard/estilo-musical" element={<ProtectedRoute><WizardProvider><WizardEstiloMusical /></WizardProvider></ProtectedRoute>} />
          <Route path="/wizard/upload-fotos" element={<ProtectedRoute><WizardProvider><WizardUploadFotos /></WizardProvider></ProtectedRoute>} />
          <Route path="/wizard/revisao-final" element={<ProtectedRoute><WizardProvider><WizardRevisaoFinal /></WizardProvider></ProtectedRoute>} />
          <Route path="/wizard/pagamento" element={<ProtectedRoute><WizardProvider><WizardPagamento /></WizardProvider></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/retrospectiva" element={<RetrospectivaDesktop />} />
          <Route path="/retrospectiva/mobile" element={<RetrospectivaMobile />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
