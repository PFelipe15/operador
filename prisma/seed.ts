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

const main = async () => {
  try {
    await clearDatabase();
    await seedOperadores();

    console.log("Seed concluído com sucesso!");
  } catch (error) {
    console.error("Erro durante o seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
