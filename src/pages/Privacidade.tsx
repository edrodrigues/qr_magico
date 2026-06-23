import { Header, Footer } from "../components/Header";

export function Privacidade() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-margin-mobile md:px-margin-desktop py-32 max-w-container-max mx-auto">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-8">Politica de Privacidade</h1>
        <div className="space-y-6 text-on-surface-variant font-body-md leading-relaxed">
          <p>O Momento Magico leva a privacidade dos usuarios a serio. Esta politica descreve como coletamos, usamos e protegemos suas informacoes pessoais.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">1. Dados Coletados</h2>
          <p>Coletamos apenas os dados necessarios para a prestacao do servico: nome, e-mail, fotos enviadas para criacao da retrospectiva e informacoes de pagamento processadas por terceiros.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">2. Uso dos Dados</h2>
          <p>Seus dados sao utilizados exclusivamente para criar e entregar sua retrospectiva personalizada, processar pagamentos e melhorar nossos servicos. Nao compartilhamos suas informacoes com terceiros sem seu consentimento.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">3. Armazenamento e Seguranca</h2>
          <p>Suas fotos e dados sao armazenados de forma segura em servidores criptografados. Adotamos praticas recomendadas de seguranca da informacao para proteger seus dados contra acesso nao autorizado.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">4. Retencao e Exclusao</h2>
          <p>Mantemos seus dados enquanto sua conta estiver ativa. Voce pode solicitar a exclusao completa dos seus dados a qualquer momento entrando em contato conosco.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">5. Cookies</h2>
          <p>Utilizamos cookies essenciais para o funcionamento da plataforma. Nao utilizamos cookies de rastreamento para fins publicitarios.</p>

          <p className="mt-8 text-sm opacity-60">Ultima atualizacao: Junho de 2026.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
