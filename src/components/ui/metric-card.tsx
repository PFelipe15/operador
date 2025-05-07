import { Card } from "./card"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color?: "blue" | "green" | "red" | "yellow" | "emerald" | "purple" | "indigo" | "pink" | "orange"
  description?: string
  trend?: number
  trendLabel?: string
  className?: string
}

const colorVariants = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100"
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100"
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-100"
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100"
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100"
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100"
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-100"
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100"
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100"
  }
}

export function MetricCard({
  title,
  value,
  icon,
  color = "blue",
  description,
  trend,
  trendLabel,
  className
}: MetricCardProps) {
  const colors = colorVariants[color] || colorVariants.blue;
  
  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-all dark:bg-gray-900", className)}>
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-2 mt-3">
            <span className={cn(
              "text-sm font-medium",
              trend > 0 ? "text-green-600" : "text-red-600"
            )}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
            <span className="text-sm text-gray-500">
              {trendLabel}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
} 