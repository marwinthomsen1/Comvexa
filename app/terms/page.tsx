import type { Metadata } from "next";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | Comvexa",
  description: "Terms that govern access to and use of the Comvexa platform.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="June 30, 2026"
      intro="These Terms of Service govern access to and use of Comvexa. By creating an account or using the platform, you agree to these terms."
      sections={[
        {
          title: "Use of the Service",
          body: [
            "Comvexa provides company management software for operational workflows such as customers, employees, bookings, tasks, invoices, payments, expenses, documents, inventory, branches, permissions, and reports.",
            "You must provide accurate account information, keep login credentials secure, and use the service only for lawful business purposes.",
          ],
        },
        {
          title: "Accounts and Workspaces",
          body: [
            "The person or organization that creates a company workspace is responsible for activity in that workspace, including staff access, uploaded documents, business records, and subscription management.",
            "You are responsible for ensuring that data entered into Comvexa is accurate and that you have the right to upload, store, and process that data.",
          ],
        },
        {
          title: "Subscriptions and Plans",
          body: [
            "Comvexa offers plan-based access. Available modules, limits, support, trial availability, and pricing may differ between Basic, Pro, Ultra, or any future plans.",
            "Only the plan selected by the customer unlocks the related features. Comvexa may update plan features, prices, or availability with notice where required.",
          ],
        },
        {
          title: "Acceptable Use",
          body: [
            "You may not misuse the service, attempt unauthorized access, disrupt platform operations, upload malicious content, infringe third-party rights, or use Comvexa for illegal activity.",
            "Comvexa may suspend or terminate access where account activity creates security, legal, payment, or operational risk.",
          ],
        },
        {
          title: "Service Availability",
          body: [
            "We work to keep Comvexa reliable, but the service may be unavailable from time to time due to maintenance, updates, third-party providers, network issues, or events beyond our control.",
            "Comvexa is provided as business software and is not a substitute for professional legal, tax, accounting, or financial advice.",
          ],
        },
        {
          title: "Limitation of Liability",
          body: [
            "To the maximum extent permitted by law, Comvexa is not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, revenue, or business opportunities.",
          ],
        },
      ]}
    />
  );
}
