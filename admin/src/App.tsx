import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { AppRouter } from "@/router";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <AppRouter />
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}
