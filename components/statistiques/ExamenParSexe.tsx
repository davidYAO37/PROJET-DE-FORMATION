'use client';

import { Card } from 'react-bootstrap';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ExamenSexeStat } from '@/types/statistiques';

const COLORS = ['#ec4899', '#3b82f6', '#64748b'];

export default function ExamenParSexe({ data }: { data: ExamenSexeStat[] }) {
  return (
    <Card className="stat-chart-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="chart-title">Examens biologiques par sexe</div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="sexe" cx="50%" cy="50%" innerRadius={55} outerRadius={105} label>
              {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
