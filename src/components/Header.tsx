interface HeaderProps {
  showNav?: boolean;
  showCreateBtn?: boolean;
  showClose?: boolean;
  rightContent?: React.ReactNode;
}

export function Header({ showNav, showCreateBtn, showClose, rightContent }: HeaderProps) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <span className="font-headline-md text-headline-md font-bold text-primary">QR Mágico</span>
        {showNav && (
          <div className="hidden md:flex gap-gutter-desktop items-center">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Como Funciona</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Galeria</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Suporte</a>
          </div>
        )}
        {rightContent}
        {showCreateBtn && (
          <button className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md scale-95 active:scale-90 transition-transform">
            Create Gift
          </button>
        )}
        {showClose && (
          <button className="material-symbols-outlined text-primary p-2 hover:bg-warm-gray/50 rounded-full transition-all">close</button>
        )}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="w-full py-12 bg-surface-container-low">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-headline-md-mobile text-headline-md-mobile text-primary">QR Mágico</span>
          <p className="font-body-md text-body-md text-on-surface-variant opacity-80">© 2024 QR Mágico. Tecnologia com Alma.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Termos de Uso</a>
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Privacidade</a>
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Suporte</a>
        </div>
      </div>
    </footer>
  );
}
