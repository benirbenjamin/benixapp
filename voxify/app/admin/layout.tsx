import React from 'react';
import { ChoirHeader } from '@/components/dashboard/ChoirHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <ChoirHeader />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
