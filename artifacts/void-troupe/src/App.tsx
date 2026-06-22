import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/use-auth-store";

// Pages
import Home from "@/pages/home";
import Analyze from "@/pages/analyze";
import Results from "@/pages/results";
import History from "@/pages/history";
import MbtiIntro from "@/pages/mbti-intro";
import MbtiTest from "@/pages/mbti-test";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsubHydrate = useAuthStore.persist.onHydrate(() => setHydrated(false));
    const unsubFinish = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinish();
    };
  }, [setHydrated]);

  return hydrated;
}

function ProtectedPage({ component: Component }: { component: () => JSX.Element }) {
  const [, setLocation] = useLocation();
  const session = useAuthStore((state) => state.session);
  const isReady = useAuthHydrated();

  useEffect(() => {
    if (isReady && !session) {
      setLocation("/login");
    }
  }, [isReady, session, setLocation]);

  if (!isReady) {
    return null;
  }

  if (!session) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col w-full relative selection:bg-primary/30">
      <Navbar />
      <main className="flex-grow w-full flex flex-col">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/analyze" component={Analyze} />
          <Route path="/mbti" component={MbtiIntro} />
          <Route path="/mbti/test/:depth" component={MbtiTest} />
          <Route path="/results" component={Results} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/profile">
            {() => <ProtectedPage component={Profile} />}
          </Route>
          <Route path="/history">
            {() => <ProtectedPage component={History} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function LanguageDirectionSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const html = document.documentElement;
    const isArabic = i18n.language === "ar";
    html.setAttribute("lang", i18n.language);
    html.setAttribute("dir", isArabic ? "rtl" : "ltr");
  }, [i18n.language]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageDirectionSync />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
