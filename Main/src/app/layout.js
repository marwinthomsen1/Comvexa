import {MotionBudget} from "@/components/ui/motion-budget";
import { site } from "@/config/site";
import "./globals.css";
import "./creative.css";

export const metadata = {
  title: "Comvexa — Create once. Use everywhere.",
  description: site.description,
  icons: { icon: "/icon.svg" },
  robots: { index: false, follow: false },
};

// Runs before paint to avoid a theme flash. No secrets or remote requests.
const themeScript = `(function(){var t;try{t=localStorage.getItem('comvexa-theme')}catch(e){}var q=matchMedia('(prefers-color-scheme: dark)');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:q.matches?'dark':'light';q.addEventListener('change',function(e){var s;try{s=localStorage.getItem('comvexa-theme')}catch(e){}if(s!=='light'&&s!=='dark')document.documentElement.dataset.theme=e.matches?'dark':'light'})})()`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <MotionBudget />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
