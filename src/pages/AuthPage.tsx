import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/wizard/ocasiao-nome";

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setSubmitting(false);
        return;
      }
      navigate(from, { replace: true });
    } else {
      const { error, needsEmailConfirmation } = await signUp(email, password);
      if (error) {
        setError(error);
        setSubmitting(false);
        return;
      }
      if (needsEmailConfirmation) {
        setSuccessMessage("Confirme seu email antes de fazer login.");
      } else {
        setSuccessMessage("Conta criada! Você já pode fazer login.");
      }
      setSubmitting(false);
      setIsLogin(true);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    await signInWithGoogle();
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-margin-mobile md:px-margin-desktop pt-32 pb-16">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-[2.5rem] p-8 md:p-10 border border-gold-glimmer/50">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
              <h1 className="font-headline-md text-headline-md-mobile md:text-headline-md text-on-surface mb-2">
                {isLogin ? "Entrar" : "Criar Conta"}
              </h1>
              <p className="font-body-md text-on-surface-variant">
                {isLogin
                  ? "Bem-vindo de volta! Entre para continuar."
                  : "Crie sua conta e comece a magia."}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm text-center">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm text-center">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="font-label-sm text-label-sm text-on-surface-variant block mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright text-on-surface font-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="font-label-sm text-label-sm text-on-surface-variant block mb-1.5">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright text-on-surface font-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-on-primary py-3.5 rounded-full font-label-md text-label-md hover:bg-coral-deep transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="animate-spin w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full" />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                )}
                {isLogin ? "Entrar" : "Criar Conta"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-4 text-xs text-on-surface-variant">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full border-2 border-outline-variant text-on-surface py-3.5 rounded-full font-label-md text-label-md hover:bg-warm-gray/50 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </button>

            <p className="text-center mt-6 text-sm text-on-surface-variant">
              {isLogin ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }}
                className="text-primary font-label-sm hover:underline"
              >
                {isLogin ? "Criar Conta" : "Entrar"}
              </button>
            </p>
          </div>

          <p className="text-center mt-6 text-xs text-on-surface-variant">
            Ao continuar, você concorda com nossos{" "}
            <a href="#" className="underline hover:text-primary">Termos de Uso</a>{" "}
            e{" "}
            <a href="#" className="underline hover:text-primary">Política de Privacidade</a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
