'use client';

import { usePathname } from 'next/navigation';

export function ConditionalSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return <>{children}</>;
}

export function ConditionalNavbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return <>{children}</>;
}

export function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') {
    return <main className="min-h-screen">{children}</main>;
  }
  return (
    <div className="lg:pl-72 rtl:lg:pr-72 rtl:lg:pl-0">
      {children}
    </div>
  );
}
