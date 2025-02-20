import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const clearDatabase = async () => {
  try {
    // Deletar na ordem correta (de dependentes para principais)
    await prisma.notification.deleteMany();
    await prisma.timelineEvent.deleteMany();
    await prisma.document.deleteMany();
    await prisma.process.deleteMany();
    await prisma.address.deleteMany();
    await prisma.client.deleteMany();
    await prisma.operator.deleteMany();
    
    console.log("Banco de dados limpo com sucesso");
  } catch (error) {
    console.error("Erro ao limpar banco de dados:", error);
    throw error;
  }
};

const seedOperadores = async () => {
  const hashedPassword = await bcrypt.hash("1234", 10);

  try {
    // Criar admin
    await prisma.operator.create({
      data: {
        name: "Admin",
        email: "admin@step.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    // Criar operadores comuns
    const operadores = [
      { name: "João Silva", email: "joao.silva@step.com" },
      { name: "Maria Santos", email: "maria.santos@step.com" },
      { name: "Pedro Oliveira", email: "pedro.oliveira@step.com" },
    ];

    for (const operador of operadores) {
      await prisma.operator.create({
        data: {
          ...operador,
          password: hashedPassword,
          role: "OPERATOR",
        },
      });
    }

    console.log("Operadores criados com sucesso");
  } catch (error) {
    console.error("Erro ao criar operadores:", error);
    throw error;
  }
};

const seedClients = async () => {
  try {
    const clients = [
      {
        name: "Ana Paula Souza",
        email: "ana.souza@gmail.com",
        cpf: "12345678901",
        phone: "11999887766",
        birthDate: new Date("1985-03-15"),
      },
      {
        name: "Carlos Eduardo Lima",
        email: "carlos.lima@gmail.com",
        cpf: "23456789012",
        phone: "11988776655",
        birthDate: new Date("1990-07-22"),
      },
      {
        name: "Mariana Costa",
        email: "mariana.costa@gmail.com",
        cpf: "34567890123",
        phone: "11977665544",
        birthDate: new Date("1988-11-30"),
      },
      {
        name: "Roberto Almeida",
        email: "roberto.almeida@gmail.com",
        cpf: "45678901234",
        phone: "11966554433",
        birthDate: new Date("1982-05-10"),
      },
      {
        name: "Fernanda Santos",
        email: "fernanda.santos@gmail.com",
        cpf: "56789012345",
        phone: "11955443322",
        birthDate: new Date("1995-09-25"),
      },
    ];

    for (const client of clients) {
      await prisma.client.create({
        data: {
          ...client,
          address: {
            create: {
              street: "Rua das Flores",
              number: String(Math.floor(Math.random() * 1000)),
              district: "Centro",
              city: "São Paulo",
              state: "SP",
              cep: "01234567",
            },
          },
        },
      });
    }

    console.log("Clientes criados com sucesso");
  } catch (error) {
    console.error("Erro ao criar clientes:", error);
    throw error;
  }
};

const seedProcesses = async () => {
  try {
    const clients = await prisma.client.findMany();

    // Criar exatamente um processo para cada cliente
    for (const client of clients) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // Últimos 30 dias

      await prisma.process.create({
        data: {
          clientId: client.id,
          type: "ABERTURA_MEI",
          priority: "MEDIUM",
          status: "CREATED",
          progress: 0,
          isActive: true,
          createdAt,
          updatedAt: new Date(),
          timeline: {
            create: {
              title: "Processo Criado",
              description: "Processo iniciado automaticamente",
              type: "INFO",
              category: "STATUS",
              source: "SYSTEM",
            },
          },
        },
      });
    }

    console.log("Processos criados com sucesso");
  } catch (error) {
    console.error("Erro ao criar processos:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await clearDatabase();
    await seedOperadores();
    await seedClients();
    await seedProcesses();
    console.log("Seed concluído com sucesso!");
  } catch (error) {
    console.error("Erro durante o seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
