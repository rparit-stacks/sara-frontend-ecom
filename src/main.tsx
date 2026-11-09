import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyDomainTheme } from "./lib/domainTheme.ts";
import { ThemeProvider } from "./themes/ThemeProvider.tsx";
import { OpenLink } from "./open/OpenLink.tsx";
import "./index.css";

// open.studiosara.in only hands a link to the app or the website; it never runs the shop itself.
if (window.location.hostname.toLowerCase().startsWith("open.")) {
  createRoot(document.getElementById("root")!).render(<OpenLink />);
} else {
  applyDomainTheme();
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
