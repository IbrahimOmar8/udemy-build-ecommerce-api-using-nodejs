import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

export default function RootLayout() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup && segments.length > 0) {
      // public routes are allowed; only force redirect when explicitly needed
    }
    if (user && inAuthGroup) {
      router.replace('/tabs');
    }
  }, [user, hydrated, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="tabs" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="courses/[id]" options={{ headerShown: true, title: 'Course' }} />
          <Stack.Screen name="learn/[id]" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
