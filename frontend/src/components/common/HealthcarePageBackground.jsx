import React from 'react';

/**
 * 🏥 HealthcarePageBackground
 * Reusable SevaHealth Ambient Background System.
 * Renders extremely subtle healthcare line-art SVGs, soft radial mint/teal mesh glows,
 * and page-specific medical motifs while keeping text readability 100% crystal clear.
 */
const HealthcarePageBackground = ({ variant = 'default', children, className = '' }) => {

  // Color theme per variant
  const getGlowColors = () => {
    switch (variant) {
      case 'emergency':
        return {
          blob1: 'from-rose-500/10 via-red-500/5 to-transparent',
          blob2: 'from-rose-600/10 via-orange-500/5 to-transparent',
          gridOpacity: 'opacity-[0.03]',
        };
      case 'records':
        return {
          blob1: 'from-teal-500/15 via-emerald-400/10 to-transparent',
          blob2: 'from-cyan-500/10 via-sky-400/5 to-transparent',
          gridOpacity: 'opacity-[0.04]',
        };
      case 'dailycare':
        return {
          blob1: 'from-emerald-500/15 via-teal-400/10 to-transparent',
          blob2: 'from-amber-500/10 via-teal-500/5 to-transparent',
          gridOpacity: 'opacity-[0.04]',
        };
      case 'ai':
        return {
          blob1: 'from-cyan-500/15 via-teal-400/10 to-transparent',
          blob2: 'from-sky-600/10 via-indigo-500/5 to-transparent',
          gridOpacity: 'opacity-[0.04]',
        };
      case 'dashboard':
      default:
        return {
          blob1: 'from-teal-500/15 via-emerald-400/10 to-transparent',
          blob2: 'from-cyan-500/12 via-teal-500/5 to-transparent',
          gridOpacity: 'opacity-[0.04]',
        };
    }
  };

  const colors = getGlowColors();

  return (
    <div className={`relative min-h-full w-full overflow-hidden ${className}`}>
      
      {/* 🌟 AMBIENT LAYER 1: Soft Blurred Gradient Blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        {/* Top-Right Soft Mesh Blob */}
        <div
          className={`absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-gradient-to-br ${colors.blob1} blur-3xl transform animate-ambient-pulse pointer-events-none`}
        />
        
        {/* Bottom-Left Soft Mesh Blob */}
        <div
          className={`absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr ${colors.blob2} blur-3xl transform animate-ambient-pulse [animation-delay:4s] pointer-events-none`}
        />

        {/* Center Subdued Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-teal-500/5 via-cyan-400/5 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* 🌟 AMBIENT LAYER 2: Ultra-Subtle Medical Line-Art Overlay (Low Opacity) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.035] dark:opacity-[0.05] text-teal-900 dark:text-teal-200 select-none">
        
        {/* Medical Cross Motif - Top Left */}
        <svg className="absolute top-12 left-10 w-24 h-24 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15M9 12h6m-3-3v6" />
        </svg>

        {/* Prescription Document / Rx Motif - Top Right */}
        <svg className="absolute top-20 right-16 w-32 h-32 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="0.9">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
        </svg>

        {/* Stethoscope Motif - Mid Left */}
        <svg className="absolute top-1/2 left-6 w-36 h-36 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="0.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 100-12 6 6 0 000 12zM12 6V3m-4 3V3m8 3V3m-4 15v3m0 0a3 3 0 01-3 3h-3m6-3a3 3 0 003 3h3" />
        </svg>

        {/* Pill / Capsule Motif - Mid Right */}
        <svg className="absolute top-2/5 right-8 w-28 h-28 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="0.85">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5L21 3m-3 0h3v3" />
        </svg>

        {/* ECG Heartbeat Wave Motif - Bottom Right */}
        <svg className="absolute bottom-16 right-20 w-44 h-24 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="0.9">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h3.75l1.5-4.5 3 9 2.25-6 1.5 3h6" />
        </svg>

        {/* Botanical Wellness Leaf Motif - Bottom Left */}
        <svg className="absolute bottom-12 left-14 w-28 h-28 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="0.9">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9s-9 4.03-9 9a9 9 0 0 0 9 9zm0 0v-9" />
        </svg>
      </div>

      {/* 🌟 AMBIENT LAYER 3: Micro Grid Pattern */}
      <div className={`pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px] ${colors.gridOpacity} select-none`} />

      {/* 🌟 MAIN CONTENT CONTAINER */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default HealthcarePageBackground;
