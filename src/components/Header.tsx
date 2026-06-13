import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface HeaderProps {
  showNav?: boolean;
  showCreateBtn?: boolean;
  showClose?: boolean;
  rightContent?: React.ReactNode;
}

export function Header({ showNav, showCreateBtn, showClose, rightContent }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 shadow-sm"
          : "bg-transparent"
      }`}
      aria-label="Navegação principal"
    >
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <Link to="/" className="font-headline-md text-headline-md font-bold text-primary" aria-label="QR Mágico - Página inicial">
          QR Mágico
        </Link>
        {showNav && (
          <div className="hidden md:flex gap-gutter-desktop items-center">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#como-funciona">Como Funciona</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#galeria">Galeria</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#suporte">Suporte</a>
          </div>
        )}
        {rightContent}
        {showCreateBtn && (
          <Link
            to="/auth"
            className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md scale-95 active:scale-90 transition-transform hover:brightness-110"
            aria-label="Criar um presente personalizado"
          >
            Criar Presente
          </Link>
        )}
        {showClose && (
          <button className="material-symbols-outlined text-primary p-2 hover:bg-warm-gray/50 rounded-full transition-all" aria-label="Fechar">close</button>
        )}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="w-full py-12 bg-surface-container-low" role="contentinfo">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-headline-md-mobile text-headline-md-mobile text-primary">QR Mágico</span>
          <p className="font-body-md text-body-md text-on-surface-variant opacity-80">© 2026 QR Mágico. Tecnologia com Alma.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors" href="#" aria-label="Termos de Uso">Termos de Uso</a>
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors" href="#" aria-label="Política de Privacidade">Privacidade</a>
          <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors" href="#" aria-label="Central de Suporte">Suporte</a>
        </div>
      </div>
    </footer>
  );
}
