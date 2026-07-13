'use client';
import SidebarFacturation from '@/components/SidebarFacturation';

export default function FacturationShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="d-flex flex-column flex-md-row min-vh-100">
      <SidebarFacturation />
      <main className="flex-grow-1 p-3">
        {children}
      </main>
    </div>
  );
}
