"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { useAuth } from "@/hooks/useAuth"

interface DocumentUploadModalProps {
  processId: string
  onUploadSuccess: () => void
  operatorProcessId: string | null
} 

const DOCUMENT_TYPES = [
  { value: "RG", label: "RG" },
  { value: "CPF", label: "CPF" },
  { value: "COMP_RESIDENCIA", label: "Comprovante de Residência" },
  { value: "CONTRATO_SOCIAL", label: "Contrato Social" },
  { value: "CNPJ", label: "Cartão CNPJ" },
  // Adicione mais tipos conforme necessário
]

export function DocumentUploadModal({ processId, onUploadSuccess, operatorProcessId }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const {operator} = useAuth()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }


  const handleUpload = async () => {

    if(!operatorProcessId){
      toast.error('Processo negado!', {
        description: 'Não foi possível enviar o documento. O processo não tem operador responsável.',
      })
      return
    }

   
    if (!file || !documentType ) {
      toast.error('Erro no upload', {
        description: 'Selecione um arquivo e um tipo de documento.',
      })
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    formData.append('operatorId', operator?.id || '')
    formData.append('source', 'MANUAL')
     try {
      const response = await fetch(`/api/v1/processes/${processId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Erro ao fazer upload do documento')

      toast.success('Documento enviado', {
        description: 'O documento foi enviado com sucesso.',
      })
      
      setOpen(false)
      setFile(null)
      setDocumentType("")
      onUploadSuccess()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro no upload', {
        description: 'Não foi possível enviar o documento.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Anexar Documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anexar Novo Documento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo do Documento</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo do documento" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Arquivo</Label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PDF, JPG, JPEG, PNG
            </p>
          </div>

          <Button 
            className="w-full" 
            onClick={handleUpload}
            disabled={loading || !file || !documentType}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Documento'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 