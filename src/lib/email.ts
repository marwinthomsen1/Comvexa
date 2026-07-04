import "server-only";

import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

type EmailMetadata = Record<string, string | number | boolean | null | undefined>;

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  type?: string;
  metadata?: EmailMetadata;
};

type BaseEmailInput = {
  to: string;
  customerName?: string;
  companyName?: string;
  dashboardLink?: string;
};

type TrialEmailInput = BaseEmailInput & {
  plan: string;
  trialEndDate: string;
};

type PaymentEmailInput = BaseEmailInput & {
  amount?: string | number;
  currency?: string;
  plan?: string;
};

type InvoiceEmailInput = BaseEmailInput & {
  invoiceNumber: string;
  amount?: string | number;
  currency?: string;
  invoiceLink?: string;
};

type BookingEmailInput = BaseEmailInput & {
  bookingDateTime: string;
  bookingLink?: string;
};

type TaskEmailInput = BaseEmailInput & {
  taskTitle: string;
  taskLink?: string;
};

type InviteEmailInput = BaseEmailInput & {
  inviteLink: string;
};

const defaultEmailFrom = "Comvexa <no-reply@comvexa.net>";
const defaultAppUrl = "https://comvexa.net";

function getAppUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || defaultAppUrl;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function button(label: string, href: string) {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:12px;">
      ${escapeHtml(label)}
    </a>
  `;
}

function emailLayout({
  title,
  preview,
  body,
  cta,
}: {
  title: string;
  preview: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return `
    <div style="margin:0;background:#f3f7fb;padding:32px;font-family:Arial,Helvetica,sans-serif;color:#10233f;">
      <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe7f3;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:#10233f;padding:24px 28px;color:#ffffff;">
            <div style="font-size:18px;font-weight:800;letter-spacing:.02em;">Comvexa</div>
            <div style="font-size:13px;color:#b8d4ee;margin-top:4px;">Global operations suite</div>
          </td>
        </tr>
        <tr>
          <td style="padding:30px 28px;">
            <h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:#071123;">${escapeHtml(title)}</h1>
            <div style="font-size:15px;line-height:1.7;color:#42526b;">${body}</div>
            ${cta ? `<div style="margin-top:24px;">${button(cta.label, cta.href)}</div>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;background:#f8fbfd;color:#64748b;font-size:12px;line-height:1.6;">
            Sent by Comvexa. Visit <a href="${getAppUrl()}" style="color:#059669;">${getAppUrl()}</a>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function greeting(name?: string) {
  return name ? `Hi ${escapeHtml(name)},` : "Hi,";
}

function money(amount?: string | number, currency = "USD") {
  if (amount === undefined || amount === null || amount === "") {
    return "";
  }

  return `${currency} ${amount}`;
}

async function logEmail(input: {
  recipient: string;
  emailType: string;
  subject: string;
  status: "sent" | "failed";
  resendId?: string | null;
  errorMessage?: string | null;
  metadata?: EmailMetadata;
}) {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("email_logs").insert({
      recipient: input.recipient,
      email_type: input.emailType,
      subject: input.subject,
      status: input.status,
      resend_id: input.resendId ?? null,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error("Could not write email log.", error);
  }
}

export async function sendEmail({ to, subject, html, text, type = "general", metadata }: SendEmailInput) {
  const recipients = Array.isArray(to) ? to : [to];

  try {
    const resend = getResendClient();
    const from = process.env.EMAIL_FROM || defaultEmailFrom;
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(error.message || "Resend failed to send the email.");
    }

    await Promise.all(recipients.map((recipient) =>
      logEmail({
        recipient,
        emailType: type,
        subject,
        status: "sent",
        resendId: data?.id ?? null,
        metadata,
      }),
    ));

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email sending failed.";
    await Promise.all(recipients.map((recipient) =>
      logEmail({
        recipient,
        emailType: type,
        subject,
        status: "failed",
        errorMessage: message,
        metadata,
      }),
    ));
    throw new Error(message);
  }
}

export function sendWelcomeEmail(input: BaseEmailInput) {
  const dashboardLink = input.dashboardLink ?? `${getAppUrl()}/dashboard`;
  return sendEmail({
    to: input.to,
    type: "welcome",
    subject: "Welcome to Comvexa",
    html: emailLayout({
      title: "Welcome to Comvexa",
      preview: "Your Comvexa workspace is ready.",
      body: `<p>${greeting(input.customerName)}</p><p>Your ${escapeHtml(input.companyName || "company")} workspace has been created. You can now set up plans, customers, invoices, bookings, tasks, and daily operations.</p>`,
      cta: { label: "Open Dashboard", href: dashboardLink },
    }),
    text: `${greeting(input.customerName)}\n\nYour Comvexa workspace is ready.\n\nOpen Dashboard: ${dashboardLink}`,
    metadata: { companyName: input.companyName },
  });
}

export function sendTrialStartedEmail(input: TrialEmailInput) {
  const dashboardLink = input.dashboardLink ?? `${getAppUrl()}/dashboard`;
  return sendEmail({
    to: input.to,
    type: "trial_started",
    subject: `${input.plan} trial started`,
    html: emailLayout({
      title: `${input.plan} trial started`,
      preview: `Your trial ends on ${input.trialEndDate}.`,
      body: `<p>${greeting(input.customerName)}</p><p>Your ${escapeHtml(input.plan)} trial is active for ${escapeHtml(input.companyName || "your company")}.</p><p><strong>Trial end date:</strong> ${escapeHtml(input.trialEndDate)}</p>`,
      cta: { label: "Open Dashboard", href: dashboardLink },
    }),
    text: `${input.plan} trial started. Trial end date: ${input.trialEndDate}. Open Dashboard: ${dashboardLink}`,
    metadata: { plan: input.plan, trialEndDate: input.trialEndDate, companyName: input.companyName },
  });
}

export function sendTrialEndingSoonEmail(input: TrialEmailInput) {
  const dashboardLink = input.dashboardLink ?? `${getAppUrl()}/dashboard/subscription`;
  return sendEmail({
    to: input.to,
    type: "trial_ending_soon",
    subject: `${input.plan} trial ends soon`,
    html: emailLayout({
      title: "Your trial ends soon",
      preview: `Your ${input.plan} trial ends on ${input.trialEndDate}.`,
      body: `<p>${greeting(input.customerName)}</p><p>Your ${escapeHtml(input.plan)} trial ends on <strong>${escapeHtml(input.trialEndDate)}</strong>. Add payment details to keep using Comvexa without interruption.</p>`,
      cta: { label: "Manage Subscription", href: dashboardLink },
    }),
    text: `Your ${input.plan} trial ends on ${input.trialEndDate}. Manage Subscription: ${dashboardLink}`,
    metadata: { plan: input.plan, trialEndDate: input.trialEndDate, companyName: input.companyName },
  });
}

export function sendTrialExpiredEmail(input: TrialEmailInput) {
  const dashboardLink = input.dashboardLink ?? `${getAppUrl()}/dashboard/subscription/payment`;
  return sendEmail({
    to: input.to,
    type: "trial_expired",
    subject: `${input.plan} trial expired`,
    html: emailLayout({
      title: "Your Comvexa trial expired",
      preview: "Add payment details to continue using Comvexa.",
      body: `<p>${greeting(input.customerName)}</p><p>Your ${escapeHtml(input.plan)} trial has ended. Continue to payment to reopen your Comvexa workspace.</p>`,
      cta: { label: "Manage Subscription", href: dashboardLink },
    }),
    text: `Your ${input.plan} trial has ended. Manage Subscription: ${dashboardLink}`,
    metadata: { plan: input.plan, companyName: input.companyName },
  });
}

export function sendPaymentSuccessfulEmail(input: PaymentEmailInput) {
  const dashboardLink = input.dashboardLink ?? `${getAppUrl()}/dashboard`;
  return sendEmail({
    to: input.to,
    type: "payment_successful",
    subject: "Comvexa payment successful",
    html: emailLayout({
      title: "Payment successful",
      preview: "Your Comvexa payment was successful.",
      body: `<p>${greeting(input.customerName)}</p><p>We received your Comvexa payment${input.amount ? ` for <strong>${escapeHtml(money(input.amount, input.currency))}</strong>` : ""}. Your ${escapeHtml(input.plan || "subscription")} access is active.</p>`,
      cta: { label: "Open Dashboard", href: dashboardLink },
    }),
    text: `Payment successful${input.amount ? `: ${money(input.amount, input.currency)}` : ""}. Open Dashboard: ${dashboardLink}`,
    metadata: { amount: String(input.amount ?? ""), currency: input.currency, plan: input.plan, companyName: input.companyName },
  });
}

export function sendPaymentFailedEmail(input: PaymentEmailInput) {
  const dashboardLink = input.dashboardLink ?? `${getAppUrl()}/dashboard/subscription/payment`;
  return sendEmail({
    to: input.to,
    type: "payment_failed",
    subject: "Comvexa payment failed",
    html: emailLayout({
      title: "Payment failed",
      preview: "Please update payment details to keep Comvexa active.",
      body: `<p>${greeting(input.customerName)}</p><p>We could not complete your Comvexa payment. Please update your billing details to avoid interruption.</p>`,
      cta: { label: "Manage Subscription", href: dashboardLink },
    }),
    text: `Payment failed. Manage Subscription: ${dashboardLink}`,
    metadata: { amount: String(input.amount ?? ""), currency: input.currency, plan: input.plan, companyName: input.companyName },
  });
}

export function sendSubscriptionActivatedEmail(input: PaymentEmailInput) {
  const dashboardLink = input.dashboardLink ?? `${getAppUrl()}/dashboard`;
  return sendEmail({
    to: input.to,
    type: "subscription_activated",
    subject: `${input.plan || "Comvexa"} subscription activated`,
    html: emailLayout({
      title: "Subscription activated",
      preview: "Your Comvexa subscription is active.",
      body: `<p>${greeting(input.customerName)}</p><p>Your ${escapeHtml(input.plan || "Comvexa")} subscription is now active for ${escapeHtml(input.companyName || "your company")}.</p>`,
      cta: { label: "Open Dashboard", href: dashboardLink },
    }),
    text: `Subscription activated. Open Dashboard: ${dashboardLink}`,
    metadata: { plan: input.plan, companyName: input.companyName },
  });
}

export function sendSubscriptionCancelledEmail(input: PaymentEmailInput) {
  const dashboardLink = input.dashboardLink ?? `${getAppUrl()}/dashboard/subscription`;
  return sendEmail({
    to: input.to,
    type: "subscription_cancelled",
    subject: "Comvexa subscription cancelled",
    html: emailLayout({
      title: "Subscription cancelled",
      preview: "Your Comvexa subscription was cancelled.",
      body: `<p>${greeting(input.customerName)}</p><p>Your ${escapeHtml(input.plan || "Comvexa")} subscription was cancelled. You can manage access from your subscription page.</p>`,
      cta: { label: "Manage Subscription", href: dashboardLink },
    }),
    text: `Subscription cancelled. Manage Subscription: ${dashboardLink}`,
    metadata: { plan: input.plan, companyName: input.companyName },
  });
}

export function sendInvoiceCreatedEmail(input: InvoiceEmailInput) {
  const invoiceLink = input.invoiceLink ?? `${getAppUrl()}/dashboard/invoices`;
  return sendEmail({
    to: input.to,
    type: "invoice_created",
    subject: `Invoice ${input.invoiceNumber} from Comvexa`,
    html: emailLayout({
      title: `Invoice ${input.invoiceNumber}`,
      preview: "A new invoice was created in Comvexa.",
      body: `<p>${greeting(input.customerName)}</p><p>A new invoice was created${input.amount ? ` for <strong>${escapeHtml(money(input.amount, input.currency))}</strong>` : ""}.</p>`,
      cta: { label: "View Invoice", href: invoiceLink },
    }),
    text: `Invoice ${input.invoiceNumber} created. View Invoice: ${invoiceLink}`,
    metadata: { invoiceNumber: input.invoiceNumber, amount: String(input.amount ?? ""), currency: input.currency, companyName: input.companyName },
  });
}

export function sendBookingConfirmationEmail(input: BookingEmailInput) {
  const bookingLink = input.bookingLink ?? `${getAppUrl()}/dashboard/bookings`;
  return sendEmail({
    to: input.to,
    type: "booking_confirmation",
    subject: "Booking confirmed",
    html: emailLayout({
      title: "Booking confirmed",
      preview: `Booking date/time: ${input.bookingDateTime}.`,
      body: `<p>${greeting(input.customerName)}</p><p>Your booking is confirmed for <strong>${escapeHtml(input.bookingDateTime)}</strong>.</p>`,
      cta: { label: "Open Dashboard", href: bookingLink },
    }),
    text: `Booking confirmed for ${input.bookingDateTime}. Open Dashboard: ${bookingLink}`,
    metadata: { bookingDateTime: input.bookingDateTime, companyName: input.companyName },
  });
}

export function sendTaskAssignedEmail(input: TaskEmailInput) {
  const taskLink = input.taskLink ?? `${getAppUrl()}/dashboard/tasks`;
  return sendEmail({
    to: input.to,
    type: "task_assigned",
    subject: `Task assigned: ${input.taskTitle}`,
    html: emailLayout({
      title: "New task assigned",
      preview: input.taskTitle,
      body: `<p>${greeting(input.customerName)}</p><p>You have a new task in Comvexa: <strong>${escapeHtml(input.taskTitle)}</strong>.</p>`,
      cta: { label: "Open Dashboard", href: taskLink },
    }),
    text: `New task assigned: ${input.taskTitle}. Open Dashboard: ${taskLink}`,
    metadata: { taskTitle: input.taskTitle, companyName: input.companyName },
  });
}

export function sendEmployeeInviteEmail(input: InviteEmailInput) {
  return sendEmail({
    to: input.to,
    type: "employee_invite",
    subject: "You are invited to Comvexa",
    html: emailLayout({
      title: "You are invited to Comvexa",
      preview: "Accept your invitation to join the workspace.",
      body: `<p>${greeting(input.customerName)}</p><p>${escapeHtml(input.companyName || "A company")} invited you to join their Comvexa workspace.</p>`,
      cta: { label: "Accept Invite", href: input.inviteLink },
    }),
    text: `You are invited to Comvexa. Accept Invite: ${input.inviteLink}`,
    metadata: { companyName: input.companyName },
  });
}

export function sendCustomerAddedEmail(input: BaseEmailInput) {
  const dashboardLink = input.dashboardLink ?? `${getAppUrl()}/dashboard/customers`;
  return sendEmail({
    to: input.to,
    type: "customer_added",
    subject: "Customer added to Comvexa",
    html: emailLayout({
      title: "Customer added",
      preview: "A customer profile was added in Comvexa.",
      body: `<p>${greeting(input.customerName)}</p><p>Your customer profile was added to ${escapeHtml(input.companyName || "Comvexa")}.</p>`,
      cta: { label: "Open Dashboard", href: dashboardLink },
    }),
    text: `Customer added to Comvexa. Open Dashboard: ${dashboardLink}`,
    metadata: { companyName: input.companyName },
  });
}
