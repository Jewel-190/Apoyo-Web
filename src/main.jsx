import "./shared/lib/webApi";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { WebContentProvider } from "./shared/content/WebContentContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WebContentProvider>
      <App />
    </WebContentProvider>
  </StrictMode>
);
