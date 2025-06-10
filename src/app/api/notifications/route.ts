import { NextRequest, NextResponse } from "next/server";

const BOT_WEBHOOK_URL =
  process.env.BOT_WEBHOOK_URL ||
  "http://localhost:3002/webhook/operator-notification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📤 Enviando notificação para o bot:", body);

    // Enviar para o webhook do bot
    const response = await fetch(BOT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro na resposta do bot:", errorText);
      return NextResponse.json(
        { success: false, error: "Erro ao notificar bot", details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log("✅ Bot notificado com sucesso:", result);

    return NextResponse.json({
      success: true,
      message: "Notificação enviada com sucesso",
      botResponse: result,
    });
  } catch (error) {
    console.error("❌ Erro ao enviar notificação:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para testar notificação de pendências
export async function GET() {
  const testNotification = {
    processId: "test-process-id",
    type: "PENDING_ITEMS_ADDED",
    clientPhone: "5545999999999", // Número de teste
    additionalInfo: {
      pendingItems: ["PENDING_DOCS", "PENDING_DATA"],
      operatorId: "test-operator",
      operatorAction: "marked_pending",
    },
  };

  try {
    const response = await fetch(BOT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testNotification),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Teste de notificação enviado",
      testData: testNotification,
      botResponse: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
