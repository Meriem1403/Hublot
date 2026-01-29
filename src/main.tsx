import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AgentsDataProvider } from "./contexts/AgentsDataContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AgentsDataProvider>
    <App />
  </AgentsDataProvider>
);
