import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

export async function saveFile(file: File, processId: string, documentType: string): Promise<string> {
  try {
    // Garantir que a pasta uploads existe
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Criar nome único para o arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const extension = file.name.substring(file.name.lastIndexOf('.'))
    const fileName = `${processId}-${documentType}-${Date.now()}${extension}`
    const filePath = join(UPLOAD_DIR, fileName)
    
    // Salvar arquivo
    await writeFile(filePath, buffer)
    
    // Retornar o caminho relativo para acesso via URL
    return `/uploads/${fileName}`
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error)
    throw new Error('Falha ao salvar o arquivo')
  }
} 