import {
  sendBookingConfirmationEmail,
  sendEmail,
  sendInvoiceCreatedEmail,
  sendPaymentSuccessfulEmail,
  sendTaskAssignedEmail,
  sendTrialStartedEmail,
  sendWelcomeEmail,
} from "@/src/lib/email";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.EMAIL_TEST_SECRET;

  if (!configuredSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-email-test-secret");
  const urlSecret = new URL(request.url).searchParams.get("secret");

  return headerSecret === configuredSecret || urlSecret === configuredSecret;
}

async function sendTestType(type: string, to: string) {
  const dashboardLink = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://comvexa.net"}/dashboard`;

  if (type === "welcome") {
    return sendWelcomeEmail({ to, customerName: "Comvexa Team", companyName: "Comvexa", dashboardLink });
  }

  if (type === "trial_started") {
    return sendTrialStartedEmail({
      to,
      customerName: "Comvexa Team",
      companyName: "Comvexa",
      plan: "Ultra",
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      dashboardLink,
    });
  }

  if (type === "payment_successful") {
    return sendPaymentSuccessfulEmail({
      to,
      customerName: "Comvexa Team",
      companyName: "Comvexa",
      plan: "Ultra",
      amount: 149,
      currency: "USD",
      dashboardLink,
    });
  }

  if (type === "invoice_created") {
    return sendInvoiceCreatedEmail({
      to,
      customerName: "Comvexa Team",
      companyName: "Comvexa",
      invoiceNumber: "INV-TEST",
      amount: 149,
      currency: "USD",
    });
  }

  if (type === "booking_confirmation") {
    return sendBookingConfirmationEmail({
      to,
      customerName: "Comvexa Team",
      companyName: "Comvexa",
      bookingDateTime: "Tomorrow at 10:00 AM",
    });
  }

  if (type === "task_assigned") {
    return sendTaskAssignedEmail({
      to,
      customerName: "Comvexa Team",
      companyName: "Comvexa",
      taskTitle: "Review Comvexa email setup",
    });
  }

  return sendEmail({
    to,
    type: "test",
    subject: "Comvexa Email Test",
    html: "<p>Hello from Comvexa. Resend email sending is working correctly.</p>",
    text: "Hello from Comvexa. Resend email sending is working correctly.",
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      { success: false, error: "Unauthorized email test request." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const type = typeof body.type === "string" ? body.type : "test";
    const to = typeof body.to === "string" ? body.to : "comvexa1@gmail.com";
    const data = await sendTestType(type, to);

    return Response.json({
      success: true,
      type,
      id: data?.id ?? null,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Email sending failed.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
