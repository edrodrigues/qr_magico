import { Header, Footer } from "../components/Header";

export function Suporte() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-margin-mobile md:px-margin-desktop py-32 max-w-container-max mx-auto">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-8">Central de Suporte</h1>
        <div className="space-y-6 text-on-surface-variant font-body-md leading-relaxed">
          <p>Estamos aqui para ajudar! Confira abaixo nossas perguntas frequentes ou entre em contato conosco.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">Perguntas Frequentes</h2>

          <h3 className="font-label-lg text-label-lg text-on-surface mt-6 mb-2">Como criar uma retrospectiva?</h3>
          <p>Acesse o site, clique em "Criar Presente" e siga o passo a passo: escolha a ocasiao, envie as fotos, selecione o estilo musical e finalize o pagamento. Em poucos minutos sua retrospectiva estara pronta.</p>

          <h3 className="font-label-lg text-label-lg text-on-surface mt-6 mb-2">Como recebo minha retrospectiva?</h3>
          <p>Ao finalizar a criacao, voce recebera um QR Code e um link unico para compartilhar com quem voce ama.</p>

          <h3 className="font-label-lg text-label-lg text-on-surface mt-6 mb-2">Posso refazer ou editar minha retrospectiva?</h3>
          <p>Sim! Entre em contato conosco que podemos te ajudar a refazer ou ajustar sua retrospectiva.</p>

          <h3 className="font-label-lg text-label-lg text-on-surface mt-6 mb-2">Quanto tempo leva para ficar pronto?</h3>
          <p>O processo e quase instantaneo. Apos o pagamento, sua retrospectiva e gerada em segundos.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-10 mb-4">Contato</h2>
          <p>Nao encontrou o que procura? Envie um e-mail para <a href="mailto:momentomagico@proton.me" className="text-secondary hover:underline">momentomagico@proton.me</a> e responderemos em ate 24 horas uteis.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
