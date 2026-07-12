"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

declare global {
  interface Window {
    fbq?: {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[][];
      loaded?: boolean;
      version?: string;
    };
    __comvexaMetaLastPageView?: string;
    __comvexaMetaStartTrials?: Set<string>;
  }
}

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const startTrialStoragePrefix = "comvexa-meta-start-trial:";

export function trackMetaStartTrial(trialStartedAt: string) {
  if (!pixelId || !window.fbq) return;

  const storageKey = `${startTrialStoragePrefix}${trialStartedAt}`;
  window.__comvexaMetaStartTrials ??= new Set<string>();

  if (window.__comvexaMetaStartTrials.has(storageKey)) return;

  try {
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, "true");
  } catch {
    // Tracking should still work when storage is unavailable.
  }

  window.__comvexaMetaStartTrials.add(storageKey);
  window.fbq("track", "StartTrial");
}

function MetaPageViews({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    if (!ready || !window.fbq) return;

    if (window.__comvexaMetaLastPageView === page) return;

    window.__comvexaMetaLastPageView = page;
    window.fbq("track", "PageView");
  }, [page, ready]);

  return null;
}

export function MetaPixel() {
  const [ready, setReady] = useState(false);

  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive" onReady={() => setReady(true)}>
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
window.__comvexaMetaLastPageView=window.location.pathname+window.location.search;`}
      </Script>
      <Suspense fallback={null}>
        <MetaPageViews ready={ready} />
      </Suspense>
    </>
  );
}
