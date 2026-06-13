import { useState, useRef } from 'react';
import { API_BASE_URL } from '../../lib/apiBaseUrl';

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

type HealthStatus = 'idle' | 'checking' | 'online' | 'offline';

const HEALTH_TIMEOUT_MS = 8_000;

export function ServerStatusBadge({ 
  showLabel = true,
  align = 'center'
}: { 
  showLabel?: boolean;
  align?: 'center' | 'left' | 'right';
}) {
  const [status, setStatus] = useState<HealthStatus>('idle');
  const lastCheckedAt = useRef<number | null>(null);

  const checkHealth = async () => {
    if (status === 'checking') return;

    setStatus('checking');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    try {
      const baseUrl = API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/actuator/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      const data = await response.json();
      const isUp = response.ok && data?.status === 'UP';
      setStatus(isUp ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    } finally {
      clearTimeout(timeoutId);
      lastCheckedAt.current = Date.now();
    }
  };

  const statusConfig = {
    idle:     { dot: 'bg-muted-foreground/40',            label: 'Status do Servidor',  info: null },
    checking: { dot: 'bg-yellow-400 animate-pulse',       label: 'Verificando...',       info: null },
    online:   { dot: 'bg-emerald-400',                    label: 'Servidor Online',      info: null },
    offline:  { dot: 'bg-red-400',                        label: 'Servidor Offline',     info: 'Tente novamente em 3 a 5 minutos.' },
  };

  const cfg = statusConfig[status];

  const alignmentClasses = {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-0',
    right: 'right-0'
  }[align];

  const arrowAlignmentClasses = {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-6 translate-x-0',
    right: 'right-6 translate-x-0'
  }[align];

  return (
    <div className="relative group inline-flex items-center justify-center">
      <button
        type="button"
        onClick={checkHealth}
        title="Clique para verificar o status do servidor"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors focus:outline-none"
      >
        <span className="relative flex h-3 w-3 shrink-0">
          {status === 'online' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 transition-colors duration-500 ${cfg.dot}`} />
        </span>
        {showLabel && <span className="whitespace-nowrap transition-all duration-300">{cfg.label}</span>}
      </button>

      <div className={`
        absolute bottom-full mb-3 z-50
        w-[calc(100vw-3rem)] sm:w-[350px] 
        p-6 bg-card border border-border rounded-2xl shadow-2xl 
        opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible
        transition-all duration-300 
        ${alignmentClasses}
      `}>
        <h4 className="font-bold text-foreground mb-3 text-base text-center">Sobre nossas ferramentas</h4>
        
        {cfg.info && (
          <p className="text-sm font-semibold text-red-400 mb-3 text-center animate-pulse">{cfg.info}</p>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed mb-4 text-center">
          Utilizamos ferramentas gratuitas para manter o projeto no ar, o que pode causar algumas instabilidades.
          Em caso de lentidão ou falha no primeiro acesso, aguarde de 3 a 5 minutos.
          Agradecemos a compreensão e aceitamos feedbacks!
        </p>

        <p className="text-xs text-muted-foreground/60 mb-6 text-center italic">
          Clique em "Status do Servidor" para verificar a conexão em tempo real.
          {lastCheckedAt.current && ` Última verificação: ${Math.floor((Date.now() - lastCheckedAt.current) / 1000)}s atrás.`}
        </p>
        
        <div className="flex items-center justify-center gap-8 pt-4 border-t border-border">
          <a
            href="https://www.linkedin.com/in/joaokrv/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-[#0077b5] transition-all hover:scale-125"
            title="LinkedIn"
          >
            <LinkedinIcon className="w-6 h-6" />
          </a>
          <a
            href="https://www.instagram.com/joaokrv/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-[#E1306C] transition-all hover:scale-125"
            title="Instagram"
          >
            <InstagramIcon className="w-6 h-6" />
          </a>
          <a
            href="mailto:joaovictooroc@gmail.com"
            className="text-muted-foreground hover:text-primary transition-all hover:scale-125"
            title="E-mail"
          >
            <MailIcon className="w-6 h-6" />
          </a>
        </div>
        
        <div className={`absolute -bottom-1.5 w-3 h-3 bg-card border-b border-r border-border rotate-45 ${arrowAlignmentClasses}`} />
      </div>
    </div>
  );
}
