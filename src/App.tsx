import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SplashScreen } from "./pages/SplashScreen";
import { HomePage } from "./pages/HomePage";
import { WizardOcasiaoNome } from "./pages/WizardOcasiaoNome";
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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/splash" element={<SplashScreen />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/wizard/ocasiao-nome" element={<ProtectedRoute><WizardOcasiaoNome /></ProtectedRoute>} />
          <Route path="/wizard/relacao-sentimento" element={<ProtectedRoute><WizardRelacaoSentimento /></ProtectedRoute>} />
          <Route path="/wizard/estilo-musical" element={<ProtectedRoute><WizardEstiloMusical /></ProtectedRoute>} />
          <Route path="/wizard/upload-fotos" element={<ProtectedRoute><WizardUploadFotos /></ProtectedRoute>} />
          <Route path="/wizard/revisao-final" element={<ProtectedRoute><WizardRevisaoFinal /></ProtectedRoute>} />
          <Route path="/wizard/pagamento" element={<ProtectedRoute><WizardPagamento /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/retrospectiva" element={<RetrospectivaDesktop />} />
          <Route path="/retrospectiva/mobile" element={<RetrospectivaMobile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
