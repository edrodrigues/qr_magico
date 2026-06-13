import { BrowserRouter, Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/wizard/ocasiao-nome" element={<WizardOcasiaoNome />} />
        <Route path="/wizard/relacao-sentimento" element={<WizardRelacaoSentimento />} />
        <Route path="/wizard/estilo-musical" element={<WizardEstiloMusical />} />
        <Route path="/wizard/upload-fotos" element={<WizardUploadFotos />} />
        <Route path="/wizard/revisao-final" element={<WizardRevisaoFinal />} />
        <Route path="/wizard/pagamento" element={<WizardPagamento />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/retrospectiva" element={<RetrospectivaDesktop />} />
        <Route path="/retrospectiva/mobile" element={<RetrospectivaMobile />} />
      </Routes>
    </BrowserRouter>
  );
}
