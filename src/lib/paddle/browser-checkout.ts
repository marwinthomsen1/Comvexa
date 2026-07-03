"use client";

type PaddleInstance = {
  Environment?: {
    set: (environment: "sandbox") => void;
  };
  Initialize: (options: {
    token: string;
    eventCallback?: (event: { name?: string }) => void;
  }) => void;
  Checkout: {
    open: (options: {
      transactionId: string;
      settings?: {
        displayMode?: "overlay";
        theme?: "light" | "dark";
        locale?: string;
      };
    }) => void;
  };
};

type PaddleCheckoutEvent = {
  name?: string;
};

declare global {
  interface Window {
    Paddle?: PaddleInstance;
  }
}

let paddleScriptPromise: Promise<PaddleInstance> | null = null;
let paddleInitialized = false;
let activeEventCallback: ((event: PaddleCheckoutEvent) => void) | undefined;

function loadPaddleScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paddle checkout can only open in the browser."));
  }

  if (window.Paddle) {
    return Promise.resolve(window.Paddle);
  }

  if (!paddleScriptPromise) {
    paddleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => {
        if (window.Paddle) {
          resolve(window.Paddle);
          return;
        }

        reject(new Error("Paddle.js loaded without exposing Paddle."));
      };
      script.onerror = () => reject(new Error("Unable to load Paddle checkout."));
      document.head.appendChild(script);
    });
  }

  return paddleScriptPromise;
}

function getConfiguredAppOrigin() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return null;
  }

  try {
    return new URL(appUrl).origin;
  } catch {
    return null;
  }
}

export async function openPaddleCheckout(
  transactionId: string,
  checkoutUrl?: string,
  onEvent?: (event: PaddleCheckoutEvent) => void,
) {
  const appOrigin = getConfiguredAppOrigin();

  if (checkoutUrl && appOrigin && window.location.origin !== appOrigin) {
    window.location.assign(checkoutUrl);
    return;
  }

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  if (!token) {
    throw new Error("Paddle client token is missing.");
  }

  const paddle = await loadPaddleScript();
  activeEventCallback = onEvent;

  if (!paddleInitialized) {
    if (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox") {
      paddle.Environment?.set("sandbox");
    }

    paddle.Initialize({
      token,
      eventCallback: (event) => {
        activeEventCallback?.(event);

        if (event.name?.includes("error")) {
          console.error("Paddle checkout event", event);
        }
      },
    });
    paddleInitialized = true;
  }

  paddle.Checkout.open({
    transactionId,
    settings: {
      displayMode: "overlay",
      theme: "light",
      locale: "en",
    },
  });
}
