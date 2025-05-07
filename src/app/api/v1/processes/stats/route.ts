/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from "@/lib/prisma"
import { translateDocumentStatus, translatePriority, translateProcessType } from "@/lib/utils"
import { NextResponse } from "next/server"
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic' // Força a rota a ser dinâmica

export async function GET(request: Request) {
  try {
    // Pegar o ID do operador da URL
    const operatorId = request.url.split('/').pop()
    if (!operatorId) {
      return NextResponse.json({ error: 'ID do operador não fornecido' }, { status: 400 })
    }

    // Verificar se o operador existe e seu papel
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: { role: true }
    })

    if (!operator) {
      return NextResponse.json({ error: 'Operador não encontrado' }, { status: 404 })
    }

    // Definir condição base de filtro
    const baseWhere = operator.role === 'ADMIN' 
      ? {} 
      : { operatorId }

    // Buscar dados mensais dos últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    // Buscar todos os processos
    const allProcesses = await prisma.process.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        isActive: true,
        updatedAt: true
      }
    })

    // Gerar dados mensais com acumulação
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      

      return {
        month: new Date().toLocaleString('pt-BR', { month: 'long' }),
        total: allProcesses.length,
        completed: allProcesses.filter(p => p.status === 'COMPLETED').length,
        inProgress: allProcesses.filter(p => 
          p.isActive && 
          !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(p.status)
        ).length
      }
    })


    // Calcular estatísticas gerais
    const totalProcesses = allProcesses.length
    const completedProcesses = allProcesses.filter(p => p.status === 'APPROVED'  ).length
    const activeProcesses = allProcesses.filter(p => p.isActive).length
    const inProgressProcesses = allProcesses.filter(p => 
      p.isActive && !['COMPLETED', 'APPROVED', 'CANCELLED', 'REJECTED'].includes(p.status)
    ).length


console.log(`////////////////////////////PROCESSOS COMPLETOS ${completedProcesses} ////////////////////////////`)
    // Agrupar por status para o gráfico de pizza
    const processesByStatus = await prisma.process.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: {
        status: true
      }
    })

    const formattedProcessesByStatus = processesByStatus.map(status => ({
      status: status.status,
      count: status._count.status,
      label: status.status // Você pode mapear para labels mais amigáveis se necessário
    }))


    // Dados por tipo de processo
    const processesByType = await prisma.process.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: {
        type: true
      }
    })

    // Dados por prioridade
    const processesByPriority = await prisma.process.groupBy({
      by: ['priority'],
      where: baseWhere,
      _count: {
        priority: true
      }
    })

    // Status dos documentos
    const documentsByStatus = await prisma.document.groupBy({
      by: ['status'],
      where: {
        process: baseWhere
      },
      _count: {
        status: true
      }
    })

    // Preparar dados para os gráficos
    const processTypeData = {
      labels: processesByType.map(p => translateProcessType(p.type)),
      datasets: [{
        data: processesByType.map(p => p._count.type),
        backgroundColor: ['#3B82F6', '#34D399', '#F59E0B']
      }]
    }

    const priorityData = {
      labels: processesByPriority.map(p => translatePriority(p.priority)),
      datasets: [{
        data: processesByPriority.map(p => p._count.priority),
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981']
      }]
    }

    const documentStatusData = {
      labels: documentsByStatus.map(d => translateDocumentStatus(d.status)),
      datasets: [{
        data: documentsByStatus.map(d => d._count.status),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
      }]
    }

    return NextResponse.json({
      totalProcesses,
      activeProcesses,
      completedProcesses,
      inProgressProcesses,
      processesByStatus: formattedProcessesByStatus,
      monthlyData, // Dados mensais atualizados
      performanceRate: totalProcesses ? Math.round((completedProcesses / totalProcesses) * 100) : 0,
      processTypeData,
      priorityData,
      documentStatusData
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar estatísticas' },
      { status: 500 }
    )
  }
} 