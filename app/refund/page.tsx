import type { Metadata } from "next";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Refund Policy | Comvexa",
  description: "Comvexa subscription, trial, cancellation, and refund policy.",
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="June 30, 2026"
      intro="This Refund Policy explains how Comvexa handles subscriptions, trials, cancellations, and refund requests."
      sections={[
        {
          title: "Subscription Billing",
          body: [
            "Comvexa subscriptions are billed according to the plan selected during signup or account management. Plan access begins after registration and required payment setup.",
            "Customers are responsible for reviewing the selected plan, billing cycle, price, and included modules before completing payment.",
          ],
        },
        {
          title: "Free Trials",
          body: [
            "The Pro plan includes a 3-day free trial and the Ultra plan includes a 7-day free trial unless Comvexa states otherwise in writing. Basic does not include a free trial by default.",
            "At the end of a trial, continued access may require payment. Trial availability may be limited by account, company, payment method, or prior usage.",
          ],
        },
        {
          title: "Cancellations",
          body: [
            "You may cancel a subscription according to the cancellation tools or support process available in your account. Cancellation prevents future renewal charges but does not automatically refund past charges.",
            "After cancellation, access may continue until the end of the paid billing period unless the account is terminated for policy, security, legal, or payment reasons.",
          ],
        },
        {
          title: "Refund Requests",
          body: [
            "Refund requests are reviewed case by case. We may consider refunds for duplicate charges, verified billing errors, or service issues that prevent reasonable access to the paid service.",
            "Refunds are generally not provided for unused time, failure to cancel before renewal, change of mind, lack of use, or issues caused by customer data, devices, networks, or third-party services outside Comvexa control.",
          ],
        },
        {
          title: "Processing",
          body: [
            "Approved refunds are returned to the original payment method where possible. Processing times depend on payment providers and banks.",
            "Comvexa may request account details, invoice information, screenshots, or other evidence needed to review a refund request.",
          ],
        },
      ]}
    />
  );
}
