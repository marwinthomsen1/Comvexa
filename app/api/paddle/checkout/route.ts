import { createPaddleCheckout, type PaddleCheckoutRequest } from "@/src/lib/paddle/checkout";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PaddleCheckoutRequest;
    const origin = new URL(request.url).origin;
    const checkout = await createPaddleCheckout(body, origin);

    return Response.json(checkout);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create Paddle checkout." },
      { status: 500 },
    );
  }
}
