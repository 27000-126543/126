import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'orange';
  delay?: number;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
};

export default function StatCard({ title, value, icon, trend, color = 'blue', delay = 0 }: StatCardProps) {
  return (
    <div
      className="card p-6 animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2 font-display">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{Math.abs(trend)}% 较上期</span>
            </div>
          )}
        </div>
        <div className={`p-3 border-2 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
