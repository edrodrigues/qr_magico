import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Header";

function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function useParallax<T extends HTMLElement>(factor = 0.05) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          const rect = el!.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            const offset = scrolled * factor;
            el!.style.transform = `rotate(${2 - scrolled * 0.008}deg) translateY(${offset}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [factor]);

  return ref;
}

function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let startTime: number | null = null;
          const duration = 1500;

          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(step);
          };

          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const testimonials = [
  {
    quote: "O QR Mágico transformou o aniversário da minha mãe em algo eterno. Ela não para de ouvir a música.",
    name: "Mariana Silva",
    city: "São Paulo, SP",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCERXDWfSqXWnIQz96_wj3JX0kT7yfi8Wg4dbHwN2rjXsmhn9CHh-RToIl6cTWgCoyt8NSBFj9RoH9SBaAaezTc88BlFP7HfrM11Uh0vNEHk7XJP-pZNMLUZwPSRKuNw8d83XrsoyzwnOPJ8lBfQCAEDbxKyH6gmMqb3BtAO8Rr-HtuT4vDnoaI_4fM7ZjtyRDwBLP5mF86c1Eyc9uboBtS2XVoDyE-2DE7peWSfqnrKxwXaVmM9-kARjd-Fsg6-uX5nmS5ZHLeulo",
    stars: 5,
  },
  {
    quote: "Presenteei meu marido com uma retrospectiva do nosso casamento. A música que a IA criou é a trilha sonora da nossa história.",
    name: "Ana Beatriz",
    city: "Rio de Janeiro, RJ",
    img: "",
    stars: 5,
  },
  {
    quote: "Incrível! Criei em 5 minutos e o resultado parecia ter sido feito por um estúdio profissional. Meu filho amou!",
    name: "Carlos Eduardo",
    city: "Belo Horizonte, MG",
    img: "",
    stars: 5,
  },
];

export function HomePage() {
  const heroReveal = useReveal<HTMLDivElement>();
  const stepsReveal = useReveal<HTMLDivElement>();
  const bentoReveal = useReveal<HTMLDivElement>();
  const trustReveal = useReveal<HTMLDivElement>(0.2);
  const phoneRef = useParallax<HTMLDivElement>(0.05);

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden">
      <Header showNav showCreateBtn />

      <main className="pt-24">
        <section className="relative px-margin-mobile md:px-margin-desktop py-16 md:py-32 max-w-container-max mx-auto overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-glimmer/20 via-transparent to-coral-light/10 animate-gradient pointer-events-none" />

          <div ref={heroReveal.ref} className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${heroReveal.visible ? "animate-reveal" : ""}`}>
            <div className="z-10 text-center md:text-left">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-6 leading-tight">
                Presentes que tocam o coração
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-lg mx-auto md:mx-0">
                Transformamos suas memórias em uma experiência sensorial única. Crie retrospectivas animadas com trilhas sonoras geradas por IA e entregue através de um QR Code elegante.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  to="/wizard/ocasiao-nome"
                  className="bg-primary text-on-primary px-8 py-4 rounded-full font-label-md text-label-md hover:bg-coral-deep transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  aria-label="Criar um presente personalizado"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Criar presente
                </Link>
                <Link
                  to="/splash"
                  className="border-2 border-primary text-primary px-8 py-4 rounded-full font-label-md text-label-md hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                  aria-label="Ver uma demonstração do produto"
                >
                  Ver demonstração
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center items-center">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-gold-glimmer/30 rounded-full blur-3xl animate-floating" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-coral-light/20 rounded-full blur-3xl animate-floating" style={{ animationDelay: "2s", animationDuration: "5s" }} />
              <div
                ref={phoneRef as React.RefObject<HTMLDivElement>}
                className="relative w-full max-w-[320px] aspect-[9/19] glass-card rounded-[3rem] p-4 shadow-2xl border-4 border-surface-container-highest rotate-2 hover:rotate-0 transition-transform duration-700"
              >
                <div className="w-full h-full bg-soft-cream rounded-[2.2rem] overflow-hidden flex flex-col">
                  <div className="h-48 relative overflow-hidden">
                    <img
                      alt="Casal sorrindo durante um pôr do sol dourado - momento emocional"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwFQGmjDCQrtUpMCyfKGksuaRKVPTj-lUr5Fw5vZjaIn2paHuoaS7PK9Dic-rbedMPByuqqsbS8YT4k4gBTewAUPHm6AQhNmhvpsEhsprWDiLIMstDmiM6m7y01107tZMqr7qgtr6TpIpC3A6auDKp6B23frCQ0BaMuyLvfTPDs6N5zZ9Pq-WIleawUlKD4fJNGW3r0K-Au7CRrAe_Jm4GZZRe9xZCKrUqpC22L-05l7gooDtrKEK6GKiYsvkMxxxya0CO-uVZt7M"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="font-headline-md-mobile text-sm opacity-90">Nossa Jornada</p>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-outline-variant/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary">IA Music Generator</p>
                          <p className="text-[10px] text-on-surface-variant">Sinfonia da Saudade</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-1 h-4 px-1">
                        <div className="flex-1 bg-primary/20 rounded-full h-1 overflow-hidden relative">
                          <div className="absolute left-0 top-0 h-full w-1/3 bg-primary" />
                        </div>
                        <div className="flex gap-0.5 items-end h-full">
                          <div className="w-1 bg-primary waveform-bar h-2" />
                          <div className="w-1 bg-primary waveform-bar h-4" style={{ animationDelay: "0.2s" }} />
                          <div className="w-1 bg-primary waveform-bar h-3" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="aspect-square bg-warm-gray rounded-lg overflow-hidden">
                        <img alt="Duas pessoas de mãos dadas sobre uma mesa rústica" className="w-full h-full object-cover" loading="lazy" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvE7hZfjwFZVUjjSjQPM6oxjcDSwsQWuuAzSG0RpUWlBZdrgCa0n2jXYj5iP67eG8oP64Bqxc_fDIYFHv2i--UFUdmBuIHt3RvqHuexxg4pGVkmHsNIm2dVSD2b1mf-jUxuqQ1CRjIa5B-Yei4LSa9RvFNig7VD54zCDdKHdKGOUeDADwVf2gfx7ofSBFYRiGUEw0iXOXLznVCYJRIWl1a7WCKfIPNNCkVMRT5rXXaTPo8qtpffKwdUYhyyqf_NbmoxBQAGBIvV-A" />
                      </div>
                      <div className="aspect-square bg-warm-gray rounded-lg overflow-hidden">
                        <img alt="Família correndo na praia durante o pôr do sol" className="w-full h-full object-cover" loading="lazy" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuIKdzFfqohTUdOWaIzmCLsH3wpgvF0kvzXzQT3h-DLAIL_aAClNHwl5_pls51oIPc6Nx0ljpm0wC9EkkfK6wWkUCwY37f88RZxuNMUSk95CFct7AQrO58KVny1jzGKE2vqO0DF0FDh3QyHssD4ytppXfnHOXvXLWhqcXsLL53uIk4QwdCiSbDU1xhZmiqAYBZReaRPJ05vSTtVKOKCjC1GqeMkWt_BeIpiq7n6z-co822xVyZgJCNknyF_0730JwWm-_ntfsciSA" />
                      </div>
                      <div className="aspect-square bg-warm-gray rounded-lg overflow-hidden">
                        <img alt="Amigos sorrindo ao redor de um bolo de aniversário" className="w-full h-full object-cover" loading="lazy" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvN3pkIZlTUWegbXyKOwxodeTyBMTddRu5ThtutDg2YjbFnFUPvnZLfG6hymUq-XZWUFJEQsW5hJKOa9p5vDeunMo2SSF0BZYoxvRWPq-BzgxN_q4DYdApG8RHpFczX_3XUpilIvImskO27256f7k6uRpbIuo8G_DL4kAN3kkCvtctE_9CWgcM0hFNskpFyiL07P6b9JeAadFhh9aOv3-j2iYnhUqeyEXQMb95oPCTVae5zflpRTRfWyLjzgvYsy7CDsc_1_bbse8" />
                      </div>
                    </div>
                    <div className="mt-auto bg-gold-glimmer/20 p-3 rounded-xl border border-secondary/10">
                      <p className="text-[10px] text-center italic text-secondary">&ldquo;O melhor presente é aquele que nos faz sentir.&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-24 bg-surface-container-low py-20 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-container-max mx-auto">
            <div ref={stepsReveal.ref} className={`${stepsReveal.visible ? "animate-reveal" : ""}`}>
              <div className="text-center mb-16">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-4">A Magia em 3 Passos</h2>
                <p className="font-body-md text-on-surface-variant">Simples, rápido e inesquecível.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link to="/wizard/ocasiao-nome" className="glass-card p-8 rounded-3xl text-center group hover:scale-105 transition-all duration-300 block">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-3xl">calendar_month</span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-primary mb-3">1. Escolha a ocasião</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Seja um aniversário, casamento ou apenas um "te amo", nós adaptamos a experiência para cada momento.
                  </p>
                </Link>
                <Link to="/wizard/upload-fotos" className="glass-card p-8 rounded-3xl text-center group hover:scale-105 transition-all duration-300 block">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-3xl">photo_library</span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-primary mb-3">2. Envie suas fotos</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Suba seus momentos favoritos. Nossa IA organiza as imagens em uma narrativa visual fluida e encantadora.
                  </p>
                </Link>
                <Link to="/wizard/estilo-musical" className="glass-card p-8 rounded-3xl text-center group hover:scale-105 transition-all duration-300 block">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-3xl">auto_videocam</span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-primary mb-3">3. IA cria sua trilha</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Nossa tecnologia exclusiva gera uma música inédita que combina perfeitamente com a emoção das suas fotos.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section ref={bentoReveal.ref} className={`py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto ${bentoReveal.visible ? "animate-reveal" : ""}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-auto md:auto-rows-[180px] gap-4">
            <div className="md:col-span-2 md:row-span-2 bg-primary p-8 rounded-[2.5rem] text-on-primary flex flex-col justify-end relative overflow-hidden group hover:shadow-2xl transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="font-display-lg-mobile text-3xl mb-4">Impacto Emocional Real</h3>
                <p className="font-body-lg opacity-90">Não é apenas um link, é uma cápsula do tempo. Nossos usuários relatam lágrimas de alegria em 95% das entregas.</p>
              </div>
            </div>
            <div className="md:col-span-2 bg-gold-glimmer p-8 rounded-[2.5rem] text-on-secondary-container flex items-center gap-6 hover:scale-[1.02] transition-transform duration-300">
              <div className="flex-1">
                <h3 className="font-title-lg mb-2">Entrega Única</h3>
                <p className="font-body-md opacity-80">Imprima em cartões, quadros ou joias. O QR Code é seu portal para a magia.</p>
              </div>
              <span className="material-symbols-outlined text-5xl">qr_code_2</span>
            </div>
            <div className="md:col-span-1 bg-surface-container-high p-8 rounded-[2.5rem] flex flex-col justify-center text-center hover:bg-surface-container-highest transition-colors duration-300">
              <span className="material-symbols-outlined text-primary text-4xl mb-3">speed</span>
              <h3 className="font-label-md">Pronto em 5 min</h3>
              <p className="text-xs text-on-surface-variant mt-2">Criação rápida com resultados profissionais.</p>
            </div>
            <div className="md:col-span-1 bg-warm-gray p-8 rounded-[2.5rem] flex flex-col justify-center text-center hover:bg-warm-gray/80 transition-colors duration-300">
              <span className="material-symbols-outlined text-primary text-4xl mb-3">lock</span>
              <h3 className="font-label-md">100% Privado</h3>
              <p className="text-xs text-on-surface-variant mt-2">Seus dados e fotos estão seguros conosco.</p>
            </div>
          </div>
        </section>

        <section ref={trustReveal.ref} id="galeria" className={`scroll-mt-24 py-20 border-t border-outline-variant/20 content-visibility-auto ${trustReveal.visible ? "animate-reveal" : ""}`}>
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">verified_user</span>
                <span className="font-label-md uppercase tracking-wider">Pagamento Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">favorite</span>
                <span className="font-label-md uppercase tracking-wider">
                  +<AnimatedCounter end={10} />k Clientes Felizes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">high_quality</span>
                <span className="font-label-md uppercase tracking-wider">Qualidade Premium</span>
              </div>
            </div>

            <div className="mt-16">
              <div className="carousel-snap flex gap-6 pb-4 md:grid md:grid-cols-3">
                {testimonials.map((t, i) => (
                  <div key={i} className="min-w-[85vw] md:min-w-0 text-center max-w-2xl mx-auto bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10" role="article" aria-label={`Depoimento de ${t.name}`}>
                    <div className="flex justify-center gap-1 mb-4" aria-label={`${t.stars} estrelas`}>
                      {Array.from({ length: t.stars }).map((_, s) => (
                        <span key={s} className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                    <h2 className="font-headline-md text-on-surface-variant italic mb-8">&ldquo;{t.quote}&rdquo;</h2>
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary bg-warm-gray flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
                      </div>
                      <div className="text-left">
                        <p className="font-label-md text-on-surface">{t.name}</p>
                        <p className="text-xs text-on-surface-variant">{t.city}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-4 md:hidden" role="tablist" aria-label="Indicador de depoimentos">
                {testimonials.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-primary" : "bg-outline-variant"}`} role="tab" aria-label={`Depoimento ${i + 1}`} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
