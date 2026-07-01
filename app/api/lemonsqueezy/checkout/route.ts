const monthlyVariantIds: Record<string, string | undefined> = {
  Basic: process.env.LEMONSQUEEZY_BASIC_MONTHLY_VARIANT_ID,
  Pro: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID,
  Ultra: process.env.LEMONSQUEEZY_ULTRA_MONTHLY_VARIANT_ID,
};

const yearlyVariantIds: Record<string, string | undefined> = {
  Basic: process.env.LEMONSQUEEZY_BASIC_YEARLY_VARIANT_ID,
  Pro: process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID,
  Ultra: process.env.LEMONSQUEEZY_ULTRA_YEARLY_VARIANT_ID,
};

type CheckoutRequest = {
  plan?: string;
  billingCycle?: string;
  email?: string;
  userId?: string;
};

function getVariantId(plan: string, billingCycle: string) {
  return billingCycle === "yearly" ? yearlyVariantIds[plan] : monthlyVariantIds[plan];
}

export async function POST(request: Request) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    return Response.json(
      { error: "Lemon Squeezy API key or store ID is missing." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as CheckoutRequest;
  const plan = body.plan === "Basic" || body.plan === "Ultra" ? body.plan : "Pro";
  const billingCycle = body.billingCycle === "yearly" ? "yearly" : "monthly";
  const variantId = getVariantId(plan, billingCycle);

  if (!variantId) {
    return Response.json(
      { error: `${plan} ${billingCycle} checkout is not configured yet.` },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const checkoutResponse = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            redirect_url: `${origin}/dashboard?payment=success`,
            receipt_button_text: "Open Comvexa dashboard",
            receipt_link_url: `${origin}/dashboard`,
            enabled_variants: [Number(variantId)],
          },
          checkout_options: {
            button_color: "#059669",
          },
          checkout_data: {
            email: body.email ?? "",
            custom: {
              plan,
              billing_cycle: billingCycle,
              user_id: body.userId ?? "",
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    }),
  });

  const checkout = await checkoutResponse.json();

  if (!checkoutResponse.ok) {
    return Response.json(
      { error: checkout?.errors?.[0]?.detail ?? "Unable to create Lemon Squeezy checkout." },
      { status: checkoutResponse.status },
    );
  }

  const url = checkout?.data?.attributes?.url;

  if (!url) {
    return Response.json(
      { error: "Lemon Squeezy did not return a checkout URL." },
      { status: 502 },
    );
  }

  return Response.json({ url });
}
