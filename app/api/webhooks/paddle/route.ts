import { handlePaddleWebhook, verifyPaddleWebhookSignature } from "@/src/lib/paddle/webhook";

const handledEventTypes = new Set([
  "transaction.completed",
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "subscription.past_due",
]);

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
    const event = JSON.parse(rawBody) as { event_type?: string; event_id?: string };

    console.log("Received Paddle webhook event", {
      eventId: event.event_id,
      eventType: event.event_type,
    });

    if (event.event_type && handledEventTypes.has(event.event_type)) {
      await handlePaddleWebhook(rawBody);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Unable to process Paddle webhook", error);

    return Response.json({ error: "Unable to process Paddle webhook." }, { status: 500 });
  }
}
