import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Layout } from '@/components/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: false },
    queries:   { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <Layout />
      </TooltipProvider>

      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize:   '13px',
            borderRadius: '10px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
