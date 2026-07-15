import { createPaddleCheckout, type PaddleCheckoutRequest } from "@/src/lib/paddle/checkout";
import { requireUser } from "@/src/lib/auth/api";

export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);

    if (auth.error) {
      return auth.error;
    }

    const body = (await request.json()) as PaddleCheckoutRequest;
    const origin = new URL(request.url).origin;
    const checkout = await createPaddleCheckout(
      { ...body, email: auth.user.email ?? "", userId: auth.user.id },
      origin,
    );

    return Response.json(checkout);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create Paddle checkout." },
      { status: 500 },
    );
  }
}
