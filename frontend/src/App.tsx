// MODIFIED FILE -- your existing frontend/src/App.tsx with one addition:
// the AuthProvider import and wrapper (both marked "NEW" below). Every
// other provider and the QueryClient config are unchanged.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AuthProvider } from "@/hooks/useAuth"; // NEW
import { AppRouter } from "@/router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
