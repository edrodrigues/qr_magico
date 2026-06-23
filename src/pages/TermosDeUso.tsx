import { Header, Footer } from "../components/Header";

export function TermosDeUso() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-margin-mobile md:px-margin-desktop py-32 max-w-container-max mx-auto">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-8">Termos de Uso</h1>
        <div className="space-y-6 text-on-surface-variant font-body-md leading-relaxed">
          <p>Ao utilizar o Momento Mágico, voce concorda com os termos e condicoes descritos abaixo. Se nao concordar com algum destes termos, recomendamos que nao utilize nossos servicos.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">1. Servico</h2>
          <p>O Momento Mágico e uma plataforma que permite a criacao de retrospectivas animadas personalizadas com trilhas sonoras geradas por inteligencia artificial, entregues via QR Code ou link unico.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">2. Uso Permitido</h2>
          <p>O usuario se compromete a utilizar a plataforma apenas para fins legais e eticos. E proibido o envio de conteudo ilegal, ofensivo, difamatorio ou que viole direitos de terceiros.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">3. Propriedade Intelectual</h2>
          <p>Ao criar uma retrospectiva, o usuario mantem os direitos sobre as fotos enviadas. A musica gerada pela IA e licenciada para uso pessoal e nao comercial. O Momento Magico detem os direitos sobre o software, a plataforma e a tecnologia utilizada.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">4. Pagamentos e Reembolsos</h2>
          <p>Os pagamentos sao processados de forma segura por terceiros. Apos a confirmacao do pagamento, o servico e entregue imediatamente. Reembolsos serao avaliados caso a caso em ate 7 dias uteis.</p>

          <h2 className="font-title-lg text-title-lg text-on-surface mt-8 mb-4">5. Disposicoes Gerais</h2>
          <p>Estes termos podem ser atualizados a qualquer momento. Recomendamos a revisao periodica. O uso continuado apos alteracoes constitui aceitacao dos novos termos.</p>

          <p className="mt-8 text-sm opacity-60">Ultima atualizacao: Junho de 2026.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
