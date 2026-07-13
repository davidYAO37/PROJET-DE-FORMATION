import React from 'react';
import Verifconnecion from '@/components/verifconnecion';
import SidebarComptabilite from '@/components/SidebarComptabilite';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Facturation Assurances',
  description: 'Gestion des factures assurances',
};

export default function FactureAssuranceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
      <div className="d-flex flex-column flex-md-row min-vh-100">
        <SidebarComptabilite />
        <main className="flex-grow-1 p-3">
          {children}
        </main>
      </div>
    </Verifconnecion>
  );
}
