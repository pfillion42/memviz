export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="memviz logo"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Cercle externe - orbite */}
      <circle cx="24" cy="24" r="21" stroke="url(#logo-gradient)" strokeWidth="1.5" opacity="0.3" />

      {/* Liens entre noeuds */}
      <line x1="24" y1="12" x2="12" y2="30" stroke="url(#logo-gradient)" strokeWidth="1.5" opacity="0.5" />
      <line x1="24" y1="12" x2="36" y2="30" stroke="url(#logo-gradient)" strokeWidth="1.5" opacity="0.5" />
      <line x1="12" y1="30" x2="36" y2="30" stroke="url(#logo-gradient)" strokeWidth="1.5" opacity="0.5" />
      <line x1="24" y1="12" x2="24" y2="38" stroke="url(#logo-gradient)" strokeWidth="1.5" opacity="0.4" />
      <line x1="12" y1="30" x2="24" y2="38" stroke="url(#logo-gradient)" strokeWidth="1.5" opacity="0.4" />
      <line x1="36" y1="30" x2="24" y2="38" stroke="url(#logo-gradient)" strokeWidth="1.5" opacity="0.4" />

      {/* Noeuds principaux */}
      <circle cx="24" cy="12" r="4" fill="url(#logo-gradient)" filter="url(#glow)" />
      <circle cx="12" cy="30" r="3.5" fill="url(#logo-gradient)" filter="url(#glow)" />
      <circle cx="36" cy="30" r="3.5" fill="url(#logo-gradient)" filter="url(#glow)" />
      <circle cx="24" cy="38" r="3" fill="#a78bfa" filter="url(#glow)" />

      {/* Noeud central lumineux */}
      <circle cx="24" cy="24" r="5" fill="url(#logo-gradient)" filter="url(#glow)" />
      <circle cx="24" cy="24" r="2.5" fill="white" opacity="0.9" />

      {/* Liens vers le centre */}
      <line x1="24" y1="24" x2="24" y2="12" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
      <line x1="24" y1="24" x2="12" y2="30" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
      <line x1="24" y1="24" x2="36" y2="30" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
      <line x1="24" y1="24" x2="24" y2="38" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
