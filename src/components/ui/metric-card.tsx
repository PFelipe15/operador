import { LucideIcon } from "lucide-react"
import { Card } from "./card"

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: "blue" | "green" | "yellow" | "emerald" | "purple" | "indigo" | "pink" | "orange"
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
  }
}

export function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  const colors = colorVariants[color]
  
  return (
    <Card className="border shadow-sm hover:shadow-md transition-all">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {value}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
} 