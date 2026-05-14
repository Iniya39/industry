import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/dashboard/app-shell";
import { PredictionProvider } from "@/context/prediction-context";
import OverviewPage from "@/pages/overview";
import MachinesPage from "@/pages/machines";
import AlertsPage from "@/pages/alerts";
import AnalyticsPage from "@/pages/analytics";
import MaintenancePage from "@/pages/maintenance";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import SensorsPage from "@/pages/sensors";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={OverviewPage} />
        <Route path="/overview" component={OverviewPage} />
        <Route path="/machines" component={MachinesPage} />
        <Route path="/sensors" component={SensorsPage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/maintenance" component={MaintenancePage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <PredictionProvider>
            <Router />
          </PredictionProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
