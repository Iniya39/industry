export function MachineIllustration() {
  return (
    <div className="relative h-[280px] w-full overflow-hidden">
      <div className="absolute inset-x-6 bottom-5 h-8 rounded-[50%] bg-slate-900/10 blur-xl" />
      <svg viewBox="0 0 620 330" className="absolute inset-0 h-full w-full" role="img" aria-label="Industrial motor and pump">
        <defs>
          <linearGradient id="motorBody" x1="0" x2="1">
            <stop offset="0" stopColor="#d9e3ee" />
            <stop offset="0.45" stopColor="#75879b" />
            <stop offset="1" stopColor="#f4f7fb" />
          </linearGradient>
          <linearGradient id="darkSteel" x1="0" x2="1">
            <stop offset="0" stopColor="#34495f" />
            <stop offset="1" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="blueSteel" x1="0" x2="1">
            <stop offset="0" stopColor="#eff6ff" />
            <stop offset="0.48" stopColor="#7d91a6" />
            <stop offset="1" stopColor="#dce8f5" />
          </linearGradient>
          <radialGradient id="shine" cx="42%" cy="40%" r="70%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="1" stopColor="#7e91a5" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="307" cy="283" rx="210" ry="22" fill="#CBD5E1" opacity="0.45" />
        <path d="M98 252h370l44 29H63z" fill="#8EA0B4" />
        <path d="M88 235h396v23H88z" fill="#CFD8E3" />
        <path d="M99 258h383v8H99z" fill="#617184" opacity="0.58" />

        <g transform="translate(77 101)">
          <rect x="53" y="16" width="194" height="122" rx="26" fill="url(#motorBody)" stroke="#657589" strokeWidth="2" />
          <rect x="84" y="1" width="104" height="31" rx="6" fill="#A9B7C6" stroke="#66768A" strokeWidth="2" />
          <rect x="95" y="-12" width="82" height="17" rx="4" fill="#D8E1EA" stroke="#75869A" strokeWidth="2" />
          <ellipse cx="58" cy="77" rx="42" ry="67" fill="url(#darkSteel)" />
          <ellipse cx="58" cy="77" rx="29" ry="52" fill="#E2E8F0" />
          <ellipse cx="58" cy="77" rx="20" ry="39" fill="#111827" />
          {Array.from({ length: 8 }).map((_, index) => (
            <rect key={index} x={118 + index * 14} y="26" width="7" height="101" rx="3" fill="#334155" opacity="0.62" />
          ))}
          <rect x="203" y="55" width="79" height="44" rx="13" fill="#A7B7C8" stroke="#64748B" strokeWidth="2" />
          <rect x="243" y="63" width="67" height="28" rx="7" fill="#526578" />
          <path d="M114 145h104l17 43H95z" fill="#B8C4D2" stroke="#657589" strokeWidth="2" />
        </g>

        <g transform="translate(348 88)">
          <path d="M40 63c6-40 42-64 84-55 52 11 75 71 49 115-20 34-64 48-101 31-31-14-48-48-40-80" fill="url(#blueSteel)" stroke="#64748B" strokeWidth="3" />
          <circle cx="112" cy="80" r="62" fill="url(#shine)" />
          <circle cx="112" cy="80" r="38" fill="#CED8E4" stroke="#64748B" strokeWidth="3" />
          <circle cx="112" cy="80" r="15" fill="#436AA4" stroke="#DCE9F7" strokeWidth="6" />
          <rect x="161" y="47" width="44" height="68" rx="16" fill="#B2C0D0" stroke="#64748B" strokeWidth="2" />
          <path d="M185 21h33v37h-33z" fill="#D4DEEA" stroke="#64748B" strokeWidth="2" />
          <path d="M176 15h51" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
          <path d="M42 152h106l21 43H28z" fill="#B8C4D2" stroke="#657589" strokeWidth="2" />
        </g>

        <path d="M79 236C139 162 228 125 345 132c92 6 150 43 197 111" fill="none" stroke="#CBD5E1" strokeDasharray="5 7" opacity="0.9" />
        <path d="M184 94C274 43 370 47 471 111" fill="none" stroke="#E2E8F0" strokeDasharray="6 9" opacity="0.8" />
      </svg>
    </div>
  );
}
