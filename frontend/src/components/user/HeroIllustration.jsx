import React from 'react';

/**
 * Modern vector illustration of college stationery essentials:
 * - Spiral notebook with "Good Ideas Start Here..."
 * - Stack of study books: "Plan", "Study", "Progress", "Succeed"
 * - Pen holder with pens, pencils, ruler
 * - Potted succulent plant
 * - Sticky notes and paperclips
 */
const HeroIllustration = () => {
  return (
    <div className="hero-banner__visual" aria-hidden="true">
      <svg
        viewBox="0 0 540 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hero-banner__illustration"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="book1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDA4AF" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>
          <linearGradient id="book2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>
          <linearGradient id="book3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
          <linearGradient id="book4" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DDD6FE" />
            <stop offset="100%" stopColor="#C4B5FD" />
          </linearGradient>
          <linearGradient id="plantGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="mugGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="notebookCover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="125%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#4F46E5" floodOpacity="0.12" />
          </filter>
          <filter id="itemShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Soft Background Table / Mat */}
        <rect x="20" y="40" width="500" height="320" rx="28" fill="#F8FAFC" fillOpacity="0.75" />
        <line x1="20" y1="330" x2="520" y2="330" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6 6" />

        {/* Sticky Note Top Right */}
        <g filter="url(#itemShadow)" transform="rotate(6, 450, 70)">
          <rect x="400" y="30" width="105" height="95" rx="6" fill="#FEF9C3" />
          <path d="M495 30 L505 40 L495 40 Z" fill="#FDE047" />
          <text x="415" y="55" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="700" fill="#854D0E">Small</text>
          <text x="415" y="70" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="700" fill="#854D0E">Stationery,</text>
          <text x="415" y="85" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="700" fill="#CA8A04">Big Dreams ♡</text>
        </g>

        {/* Spiral Notebook Left/Center */}
        <g filter="url(#softShadow)">
          {/* Main Notebook Body */}
          <rect x="60" y="80" width="180" height="250" rx="14" fill="url(#notebookCover)" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Spiral binding rings on left */}
          {Array.from({ length: 11 }).map((_, i) => (
            <g key={i} transform={`translate(52, ${100 + i * 20})`}>
              <ellipse cx="8" cy="4" rx="4.5" ry="3" fill="#64748B" />
              <rect x="7" y="2.5" width="8" height="3" rx="1.5" fill="#94A3B8" />
            </g>
          ))}
          {/* Ruled lines inside notebook */}
          {Array.from({ length: 7 }).map((_, i) => (
            <line
              key={i}
              x1="80"
              y1={170 + i * 18}
              x2="220"
              y2={170 + i * 18}
              stroke="#F1F5F9"
              strokeWidth="1.5"
            />
          ))}
          {/* Handwritten Quote on Notebook */}
          <text x="145" y="125" fontFamily="'Caveat', cursive, Inter, sans-serif" fontSize="16" fontWeight="700" fill="#334155" textAnchor="middle">
            Good Ideas
          </text>
          <text x="145" y="145" fontFamily="'Caveat', cursive, Inter, sans-serif" fontSize="17" fontWeight="800" fill="#4F46E5" textAnchor="middle">
            Start Here...
          </text>
          <circle cx="145" cy="158" r="4" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
          <path d="M143 158 Q145 160 147 158" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
          {/* Mini tags inside notebook */}
          <rect x="85" y="285" width="55" height="18" rx="9" fill="#EEF2FF" />
          <text x="112" y="297" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="700" fill="#4F46E5" textAnchor="middle">Study</text>
          <rect x="148" y="285" width="60" height="18" rx="9" fill="#FEF3C7" />
          <text x="178" y="297" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="700" fill="#D97706" textAnchor="middle">Create</text>
        </g>

        {/* Center: Ceramic Pen Holder with Pens & Ruler */}
        <g filter="url(#itemShadow)">
          {/* Ruler */}
          <g transform="rotate(18, 280, 190)">
            <rect x="270" y="120" width="16" height="130" rx="3" fill="#FEF08A" stroke="#EAB308" strokeWidth="1" />
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1="270" y1={130 + i * 9} x2={i % 2 === 0 ? "278" : "274"} y2={130 + i * 9} stroke="#A16207" strokeWidth="1" />
            ))}
          </g>

          {/* Blue Ball Pen */}
          <g transform="rotate(-12, 260, 200)">
            <rect x="256" y="125" width="8" height="120" rx="4" fill="#2563EB" />
            <polygon points="256,125 264,125 260,110" fill="#93C5FD" />
            <circle cx="260" cy="110" r="1.5" fill="#1E3A8A" />
            <rect x="257" y="135" width="2" height="40" rx="1" fill="#60A5FA" />
          </g>

          {/* Yellow Pencil */}
          <g transform="rotate(5, 275, 200)">
            <rect x="272" y="115" width="7" height="130" rx="2" fill="#F59E0B" />
            <polygon points="272,115 279,115 275.5,100" fill="#FDE68A" />
            <polygon points="274,103 277,103 275.5,100" fill="#1F2937" />
            <rect x="272" y="240" width="7" height="10" rx="2" fill="#FDA4AF" />
          </g>

          {/* Pen Cup Pot */}
          <rect x="245" y="210" width="55" height="75" rx="12" fill="url(#mugGrad)" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="252" y="222" width="41" height="50" rx="6" fill="#F1F5F9" fillOpacity="0.6" />
          {/* Wire grid texture on holder */}
          <line x1="245" y1="235" x2="300" y2="235" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="245" y1="255" x2="300" y2="255" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="262" y1="210" x2="262" y2="285" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="282" y1="210" x2="282" y2="285" stroke="#CBD5E1" strokeWidth="1" />
        </g>

        {/* Stack of 4 Books Right Side */}
        <g filter="url(#softShadow)">
          {/* Book 4: Bottom - Violet (Succeed) */}
          <rect x="330" y="280" width="165" height="30" rx="6" fill="url(#book4)" stroke="#A78BFA" strokeWidth="1" />
          <rect x="345" y="286" width="135" height="18" rx="3" fill="#EDE9FE" />
          <text x="412" y="299" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="800" fill="#5B21B6" textAnchor="middle" letterSpacing="0.06em">
            SUCCEED
          </text>

          {/* Book 3: Blue (Progress) */}
          <rect x="335" y="252" width="155" height="28" rx="6" fill="url(#book3)" stroke="#38BDF8" strokeWidth="1" />
          <rect x="348" y="257" width="128" height="18" rx="3" fill="#F0F9FF" />
          <text x="412" y="270" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="800" fill="#0369A1" textAnchor="middle" letterSpacing="0.06em">
            PROGRESS
          </text>

          {/* Book 2: Yellow (Study) */}
          <rect x="340" y="226" width="145" height="26" rx="5" fill="url(#book2)" stroke="#FACC15" strokeWidth="1" />
          <rect x="352" y="231" width="120" height="16" rx="3" fill="#FEFCE8" />
          <text x="412" y="243" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="800" fill="#854D0E" textAnchor="middle" letterSpacing="0.06em">
            STUDY
          </text>

          {/* Book 1: Top - Rose (Plan) */}
          <rect x="345" y="202" width="135" height="24" rx="5" fill="url(#book1)" stroke="#FB7185" strokeWidth="1" />
          <rect x="355" y="206" width="112" height="15" rx="3" fill="#FFF1F2" />
          <text x="411" y="218" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="800" fill="#9F1239" textAnchor="middle" letterSpacing="0.06em">
            PLAN
          </text>
        </g>

        {/* Small Succulent Potted Plant Right Top */}
        <g filter="url(#itemShadow)">
          {/* Pot */}
          <path d="M430 155 L455 155 L450 185 L435 185 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <ellipse cx="442.5" cy="155" rx="12.5" ry="3.5" fill="#E2E8F0" />
          <ellipse cx="442.5" cy="155" rx="11" ry="2.5" fill="#78350F" />
          {/* Plant Leaves */}
          <path d="M442.5 154 C435 140, 428 135, 436 125 C442 135, 442.5 150, 442.5 154 Z" fill="url(#plantGrad)" />
          <path d="M442.5 154 C450 140, 458 135, 450 125 C444 135, 442.5 150, 442.5 154 Z" fill="url(#plantGrad)" />
          <path d="M442.5 154 C440 135, 442.5 125, 442.5 120 C445 125, 446 135, 442.5 154 Z" fill="#10B981" />
        </g>

        {/* Cute Floating Stationery Accents (Paperclips & Hearts) */}
        <g opacity="0.85">
          {/* Heart above sticky note */}
          <path d="M495 24 C495 20, 490 18, 488 22 C486 18, 481 20, 481 24 C481 30, 488 34, 488 34 C488 34, 495 30, 495 24 Z" fill="#F43F5E" />
          {/* Golden Paper Clip */}
          <path d="M185 70 C185 64, 192 64, 192 70 L192 88 C192 95, 180 95, 180 88 L180 72 C180 67, 188 67, 188 72 L188 85" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          {/* Blue Paper Clip */}
          <path d="M315 285 C315 280, 321 280, 321 285 L321 300 C321 306, 311 306, 311 300 L311 287" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

export default HeroIllustration;
