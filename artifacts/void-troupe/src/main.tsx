import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";
import "./i18n";
import { apiBaseUrl } from "./lib/api-base";

setBaseUrl(apiBaseUrl || null);

createRoot(document.getElementById("root")!).render(<App />);
