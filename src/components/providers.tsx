'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { NotificationProvider } from '@/components/notifications/notification-system';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <NotificationProvider>
        {children}
        <Toaster />
      </NotificationProvider>
    </ThemeProvider>
  );
}
