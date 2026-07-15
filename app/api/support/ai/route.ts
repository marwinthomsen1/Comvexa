import { requireUser } from "@/src/lib/auth/api";

type SupportMessage = {
  role: "user" | "assistant";
  content: string;
};

type SupportRequest = {
  messages?: SupportMessage[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const instructions = `
You are Comvexa AI Support, a concise support assistant for the Comvexa company management dashboard.
Help users with account setup, plans, Paddle checkout, Pro trials, Supabase-backed trial status, modules, settings, invoices, payments, expenses, documents, inventory, branches, and permissions.
Do not claim that a payment or trial is active unless the app confirms it. If billing, trial, or checkout state is unclear, tell the user to check the Subscription page or contact support.
Keep answers short, practical, and friendly. Do not ask for secret keys, passwords, card numbers, CVC codes, or full access tokens.
`;

const requestWindows = new Map<string, { count: number; resetsAt: number }>();

function isRateLimited(userId: string) {
  const now = Date.now();
  const current = requestWindows.get(userId);

  if (!current || current.resetsAt <= now) {
    requestWindows.set(userId, { count: 1, resetsAt: now + 60_000 });
    return false;
  }

  current.count += 1;
  return current.count > 15;
}

function sanitizeMessages(messages: SupportMessage[] | undefined) {
  return (messages ?? [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: String(message.content).slice(0, 1200),
    }));
}

function extractText(response: OpenAIResponse) {
  if (response.output_text) {
    return response.output_text;
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  const auth = await requireUser(request);

  if (auth.error) {
    return auth.error;
  }

  if (isRateLimited(auth.user.id)) {
    return Response.json({ reply: "Too many support requests. Please wait a minute and try again." }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        reply:
          "AI support is not configured yet. Add OPENAI_API_KEY on the server to enable it.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as SupportRequest;
    const messages = sanitizeMessages(body.messages);
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage?.content.trim()) {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SUPPORT_MODEL ?? "gpt-5.5",
        instructions,
        input: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_output_tokens: 500,
      }),
    });
    const response = (await openaiResponse.json()) as OpenAIResponse;

    if (!openaiResponse.ok) {
      return Response.json(
        { reply: response.error?.message ?? "AI support could not respond right now." },
        { status: openaiResponse.status },
      );
    }

    return Response.json({
      reply: extractText(response) || "AI support could not respond right now.",
    });
  } catch {
    return Response.json(
      { reply: "AI support could not respond right now." },
      { status: 500 },
    );
  }
}
