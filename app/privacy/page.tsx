import type { Metadata } from "next";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Comvexa",
  description: "How Comvexa collects, uses, protects, and shares personal and company information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="June 30, 2026"
      intro="This Privacy Policy explains how Comvexa collects, uses, stores, and protects information when people visit our website, create an account, or use our company management platform."
      sections={[
        {
          title: "Information We Collect",
          body: [
            "We may collect account details such as name, email address, company name, login information, subscription selections, and billing-related records.",
            "When you use the platform, you may add business data such as customers, employees, invoices, payments, expenses, documents, tasks, bookings, inventory, branches, reports, and workspace settings.",
            "We may also collect technical information such as device type, browser, IP address, pages visited, authentication events, and product usage data needed to operate and secure the service.",
          ],
        },
        {
          title: "How We Use Information",
          body: [
            "We use information to provide the Comvexa service, authenticate users, manage company workspaces, process subscriptions, provide support, improve product features, and protect accounts from misuse.",
            "We may use contact information to send service updates, security notices, billing messages, and product communications. Users can opt out of non-essential marketing messages where applicable.",
          ],
        },
        {
          title: "Data Storage and Security",
          body: [
            "Comvexa is designed around company workspaces so business records can be separated by company. We use technical and organizational safeguards to help protect stored information.",
            "No online service can guarantee absolute security. Users are responsible for keeping login credentials confidential and for managing staff access inside their workspace.",
          ],
        },
        {
          title: "Sharing Information",
          body: [
            "We do not sell personal information. We may share information with service providers that help us operate hosting, authentication, storage, analytics, payments, support, and communications.",
            "We may disclose information if required by law, legal process, security investigation, or to protect the rights, property, and safety of Comvexa, our users, or others.",
          ],
        },
        {
          title: "User Choices and Rights",
          body: [
            "Users may update account and company information from the platform where available. Requests to access, correct, export, or delete personal information can be sent to Comvexa support.",
            "Some business records may need to be retained where required for security, billing, compliance, dispute handling, backups, or legitimate business purposes.",
          ],
        },
        {
          title: "Contact",
          body: [
            "For privacy questions or data requests, contact Comvexa support through the contact channel provided in your account or on the Comvexa website.",
          ],
        },
      ]}
    />
  );
}
