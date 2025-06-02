import React from "react";

interface LogoProps {
  width?: number;
  height?: number;
  variant?: "default" | "white";
}

const Logo: React.FC<LogoProps> = ({
  width = 130,
  height = 40,
  variant = "default",
}) => {
  const textColor = variant === "white" ? "#FFFFFF" : "currentColor";
  const accentColor = "#059669";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 150 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{
        imageRendering: "crisp-edges",
        shapeRendering: "geometricPrecision",
        textRendering: "geometricPrecision",
      }}
    >
      <defs>
        <linearGradient
          id="documentGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="sharpenFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" />
        </filter>
        <filter id="crisp">
          <feFlood floodColor="#000000" floodOpacity="0" />
          <feComposite in="SourceGraphic" />
        </filter>
      </defs>

      {/* Ícone de Documento com Checkmark */}
      <g transform="translate(2, 4)">
        {/* Documento Base */}
        <path
          d="M4 2C4 1.44772 4.44772 1 5 1H19C19.5523 1 20 1.44772 20 2V30C20 30.5523 19.5523 31 19 31H5C4.44772 31 4 30.5523 4 30V2Z"
          fill="url(#documentGradient)"
          filter="url(#crisp)"
          strokeWidth="0.5"
          stroke="rgba(5, 150, 105, 0.2)"
        />

        {/* Linhas do Documento */}
        <path
          d="M8 8H16M8 14H16M8 20H12"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Círculo de Progresso */}
        <circle
          cx="16"
          cy="20"
          r="4"
          fill="#10B981"
          opacity="1"
          strokeWidth="0.5"
          stroke="rgba(255, 255, 255, 0.3)"
        />

        {/* Checkmark */}
        <path
          d="M14 20L15.5 21.5L18 19"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          fill="none"
        />
      </g>

      {/* Texto Principal */}
      <g
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <text
          x="32"
          y="22"
          fontSize="18"
          fontWeight="800"
          fill={textColor}
          letterSpacing="-0.8px"
          style={{
            fontFamily:
              'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            textRendering: "geometricPrecision",
            dominantBaseline: "central",
          }}
        >
          STEP.
          <tspan
            fill={accentColor}
            letterSpacing="-0.8px"
            style={{ fontWeight: "800" }}
          >
            MEI
          </tspan>
        </text>

        {/* Tagline */}
        <text
          x="32"
          y="35"
          fontSize="10"
          fontWeight="500"
          fill={textColor}
          opacity="0.75"
          letterSpacing="0.3px"
          style={{
            fontFamily:
              'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            textRendering: "geometricPrecision",
            dominantBaseline: "central",
          }}
        >
          Abertura Inteligente
        </text>
      </g>
    </svg>
  );
};

export default Logo;
