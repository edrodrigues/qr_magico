import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  showNav?: boolean;
  showCreateBtn?: boolean;
  showClose?: boolean;
  rightContent?: React.ReactNode;
}

export function Header({ showNav, showCreateBtn, showClose, rightContent }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const initials = user?.email?.charAt(0).toUpperCase() || "?";

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
        <Link to="/" className="font-headline-md text-headline-md font-bold text-primary" aria-label="Momento Mágico - Página inicial">
          Momento Mágico
        </Link>

        {user ? (
          <>
            <div className="hidden md:flex items-center gap-gutter-desktop">
              <Link
                to="/dashboard"
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Meus Momentos Mágicos
              </Link>
              <Link
                to="/dashboard?tab=drafts"
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Rascunhos
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/wizard/ocasiao-nome"
                className="hidden md:flex bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md hover:brightness-110 transition-all scale-95 active:scale-90"
              >
                Criar Novo Momento Mágico
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 rounded-full bg-primary-fixed border-2 border-white shadow-sm flex items-center justify-center text-primary font-bold hover:opacity-80 transition-all cursor-pointer"
                  aria-label="Menu do usuário"
                >
                  {initials}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-surface rounded-xl shadow-lg border border-outline-variant/30 py-2 z-50">
                    <div className="px-4 py-2 border-b border-outline-variant/30">
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-warm-gray/50 transition-colors"
                    >
                      Meus Momentos Mágicos
                    </Link>
                    <Link
                      to="/dashboard?tab=drafts"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-warm-gray/50 transition-colors"
                    >
                      Rascunhos
                    </Link>
                    <Link
                      to="/wizard/ocasiao-nome"
                      onClick={() => setMenuOpen(false)}
                      className="block md:hidden px-4 py-2 font-label-md text-label-md text-primary hover:bg-warm-gray/50 transition-colors"
                    >
                      Criar Novo Momento Mágico
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 font-label-md text-label-md text-error hover:bg-warm-gray/50 transition-colors border-t border-outline-variant/30 mt-1 pt-2"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden material-symbols-outlined text-primary p-2 hover:bg-warm-gray/50 rounded-full transition-all cursor-pointer"
                aria-label="Abrir menu"
              >
                {mobileMenuOpen ? "close" : "menu"}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="absolute top-full left-0 w-full bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 shadow-lg md:hidden">
                <div className="flex flex-col px-margin-mobile py-4 gap-4">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors py-2"
                  >
                    Meus Momentos Mágicos
                  </Link>
                  <Link
                    to="/dashboard?tab=drafts"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors py-2"
                  >
                    Rascunhos
                  </Link>
                  <Link
                    to="/wizard/ocasiao-nome"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-primary text-on-primary px-6 py-3 rounded-full font-label-md text-label-md text-center hover:brightness-110 transition-all"
                  >
                    Criar Novo Momento Mágico
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
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
          </>
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
          <span className="font-headline-md-mobile text-headline-md-mobile text-primary">Momento Mágico</span>
          <p className="font-body-md text-body-md text-on-surface-variant opacity-80">© 2026 Momento Mágico. Tecnologia com Alma.</p>
          <p className="font-body-md text-body-md text-on-surface-variant opacity-60">
            <a href="https://futurereadylabs.com.br/" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Um produto da Future Ready Labs</a>
            &nbsp;— CNPJ: 60.094.706/0001-91
          </p>
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
