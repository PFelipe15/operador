export function getEventColor(type: string) {
  switch (type) {
    case 'SUCCESS':
      return 'text-emerald-600 bg-emerald-100';
    case 'WARNING':
      return 'text-amber-600 bg-amber-100';
    case 'ERROR':
      return 'text-red-600 bg-red-100';
    case 'INFO':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
} 