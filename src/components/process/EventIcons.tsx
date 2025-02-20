import { Activity, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export function EventIcon({ category }: { category: string }) {
  switch (category) {
    case 'SUCCESS':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'WARNING':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'ERROR':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'INFO':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
} 