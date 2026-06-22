import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";
import "./i18n";
import { apiBaseUrl } from "./lib/api-base";
import { useAuthStore } from "./store/use-auth-store";

setBaseUrl(apiBaseUrl || null);
setAuthTokenGetter(() => useAuthStore.getState().session?.token ?? null);

createRoot(document.getElementById("root")!).render(<App />);
