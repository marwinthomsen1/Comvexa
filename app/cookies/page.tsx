import type { Metadata } from "next";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy | Comvexa",
  description: "How Comvexa may use cookies and similar technologies.",
};

export default function CookiePage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="June 30, 2026"
      intro="This Cookie Policy explains how Comvexa may use cookies and similar technologies on our website and platform."
      sections={[
        {
          title: "What Cookies Are",
          body: [
            "Cookies are small files stored on a device to help websites remember information, keep users signed in, improve security, and understand how a service is used.",
          ],
        },
        {
          title: "How We Use Cookies",
          body: [
            "Comvexa may use essential cookies for authentication, session management, security, fraud prevention, account preferences, and platform functionality.",
            "We may use analytics or performance technologies to understand page visits, product usage, errors, and feature performance so we can improve the service.",
          ],
        },
        {
          title: "Third-Party Technologies",
          body: [
            "Some cookies or similar technologies may be provided by trusted service providers that support hosting, authentication, payments, analytics, customer support, or communications.",
          ],
        },
        {
          title: "Managing Cookies",
          body: [
            "Most browsers allow users to block, delete, or limit cookies. Blocking essential cookies may prevent login, dashboard access, payment setup, or other core platform features from working correctly.",
          ],
        },
        {
          title: "Updates",
          body: [
            "We may update this Cookie Policy as our website, platform, providers, or legal requirements change.",
          ],
        },
      ]}
    />
  );
}
