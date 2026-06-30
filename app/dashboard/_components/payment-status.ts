export function isPaymentSetupComplete() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem("comvexa-payment-complete") === "true";
}
