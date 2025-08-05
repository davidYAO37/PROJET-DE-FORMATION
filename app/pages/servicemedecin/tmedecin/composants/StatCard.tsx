'use client';
import React from 'react';

type Props = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
};

export default function StatCard({ title, value, icon, color }: Props) {
  return (
    <div className="text-center border rounded p-3" style={{ borderColor: color, width: '250px' }}>
      <div className="fs-2">{icon}</div>
      <h6>{title}</h6>
      <h2>{value}</h2>
    </div>
  );
}
