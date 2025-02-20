import React from 'react'

interface LogoProps {
  width?: number
  height?: number
  variant?: 'default' | 'white'
}

const Logo: React.FC<LogoProps> = ({ width = 130, height = 40, variant = 'default' }) => {
  const textColor = variant === 'white' ? '#FFFFFF' : 'currentColor'
  const accentColor = '#059669'
   
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 150 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="documentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Ícone de Documento com Checkmark */}
      <g transform="translate(2, 4)">
        {/* Documento Base */}
        <path
          d="M4 2C4 1.44772 4.44772 1 5 1H19C19.5523 1 20 1.44772 20 2V30C20 30.5523 19.5523 31 19 31H5C4.44772 31 4 30.5523 4 30V2Z"
          fill="url(#documentGradient)"
          filter="url(#glow)"
        />

        {/* Linhas do Documento */}
        <path
          d="M8 8H16M8 14H16M8 20H12"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Círculo de Progresso */}
        <circle
          cx="16"
          cy="20"
          r="4"
          fill="#10B981"
          opacity="0.9"
        />

        {/* Checkmark */}
        <path
          d="M14 20L15.5 21.5L18 19"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Texto */}
      <g>
        <text
          x="32"
          y="22"
          fontFamily="Arial, sans-serif"
          fontSize="18"
          fontWeight="bold"
          fill={textColor}
          letterSpacing="-0.5"
        >
          STEP.

          <tspan fill={accentColor} letterSpacing="-0.5">MEI</tspan>
        </text>
        
        <text
          x="32"
          y="35"
          fontFamily="Arial, sans-serif"
          fontSize="10"
          fill={textColor}
          opacity="0.7"
          letterSpacing="0.5"
        >
          Abertura Inteligente
        </text>
      </g>
    </svg>
  )
}

export default Logo