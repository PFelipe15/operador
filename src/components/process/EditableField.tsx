import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EditableFieldProps {
  label: string
  value: string
  onSave: (newValue: string) => Promise<void>
  type?: string
  className?: string
  mask?: (value: string) => string
}

export function EditableField({ 
  label, 
  value, 
  onSave, 
  type = 'text',
  className,
  mask 
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(mask ? mask(e.target.value) : e.target.value)}
            className="h-9"
            disabled={isLoading}
            autoFocus
          />
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleSave}
            disabled={isLoading}
          >
            <Check className="h-4 w-4 text-emerald-600" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              setEditValue(value)
              setIsEditing(false)
            }}
            disabled={isLoading}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1 group">
      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
        {label}
      </p>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-base font-medium dark:text-gray-200", className)}>
          {value || "Não informado"}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
} 