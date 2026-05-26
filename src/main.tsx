import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AgentsDataProvider } from "./contexts/AgentsDataContext";
import { initSentry } from "./monitoring/sentry";
import "./index.css";

void initSentry();

createRoot(document.getElementById("root")!).render(
  <AgentsDataProvider>
    <App />
  </AgentsDataProvider>
);
