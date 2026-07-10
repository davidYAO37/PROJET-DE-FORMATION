'use client';
import SidebarComptabilite from '@/components/SidebarComptabilite';

export default function ComptabiliteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="d-flex flex-column flex-md-row min-vh-100">
      <SidebarComptabilite />
      <main className="flex-grow-1 p-3">
        {children}
      </main>
    </div>
  );
}
