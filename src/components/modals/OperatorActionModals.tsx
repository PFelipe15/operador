"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MessageSquare, FileText, AlertCircle } from "lucide-react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  isLoading?: boolean;
}

// Modal para Lembrete
export function ReminderModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: BaseModalProps) {
  const [reminderDate, setReminderDate] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");

  const handleSubmit = () => {
    onConfirm({
      reminderDate,
      reminderMessage,
    });
    setReminderDate("");
    setReminderMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Adicionar Lembrete
          </DialogTitle>
          <DialogDescription>
            Configure um lembrete para este processo
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Data e Hora</Label>
            <Input
              id="date"
              type="datetime-local"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Mensagem do Lembrete</Label>
            <Textarea
              id="message"
              placeholder="Descreva o que você gostaria de lembrar..."
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar Lembrete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal para Anotação
export function NoteModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: BaseModalProps) {
  const [noteContent, setNoteContent] = useState("");

  const handleSubmit = () => {
    if (!noteContent.trim()) return;
    onConfirm({ noteContent });
    setNoteContent("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            Adicionar Anotação
          </DialogTitle>
          <DialogDescription>
            Adicione uma anotação interna sobre este processo
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note">Anotação</Label>
            <Textarea
              id="note"
              placeholder="Digite sua anotação aqui..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !noteContent.trim()}
          >
            {isLoading ? "Salvando..." : "Salvar Anotação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal para Contato
export function ContactModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: BaseModalProps) {
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [contactMessage, setContactMessage] = useState("");

  const handleSubmit = () => {
    onConfirm({
      contactMethod,
      contactMessage,
    });
    setContactMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            Entrar em Contato
          </DialogTitle>
          <DialogDescription>
            Configure o meio de contato e a mensagem
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="method">Meio de Contato</Label>
            <Select value={contactMethod} onValueChange={setContactMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite a mensagem que será enviada..."
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Enviando..." : "Iniciar Contato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal para Reportar Problema
export function IssueModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: BaseModalProps) {
  const [issueType, setIssueType] = useState("technical");
  const [issueDescription, setIssueDescription] = useState("");

  const handleSubmit = () => {
    if (!issueDescription.trim()) return;
    onConfirm({
      issueType,
      issueDescription,
    });
    setIssueDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Reportar Problema
          </DialogTitle>
          <DialogDescription>
            Descreva o problema encontrado neste processo
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo do Problema</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Problema Técnico</SelectItem>
                <SelectItem value="process">Problema no Processo</SelectItem>
                <SelectItem value="document">Problema no Documento</SelectItem>
                <SelectItem value="client">Problema com Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição do Problema</Label>
            <Textarea
              id="description"
              placeholder="Descreva detalhadamente o problema encontrado..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !issueDescription.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Reportando..." : "Reportar Problema"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
