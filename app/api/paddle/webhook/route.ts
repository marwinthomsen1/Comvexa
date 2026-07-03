import { handlePaddleWebhook, verifyPaddleWebhookSignature } from "@/src/lib/paddle/webhook";

export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature");
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (!signature || !secret) {
    return Response.json({ error: "Paddle webhook is not configured." }, { status: 400 });
  }

  if (!verifyPaddleWebhookSignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid Paddle signature." }, { status: 401 });
  }

  try {
    await handlePaddleWebhook(rawBody);

    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Unable to process Paddle webhook." }, { status: 500 });
  }
}
