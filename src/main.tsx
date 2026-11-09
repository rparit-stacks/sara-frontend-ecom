import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyDomainTheme } from "./lib/domainTheme.ts";
import { ThemeProvider } from "./themes/ThemeProvider.tsx";
import "./index.css";

applyDomainTheme();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
