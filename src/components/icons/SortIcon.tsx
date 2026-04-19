import { ArrowUp, ArrowDown } from 'lucide-react';

interface SortIconProps {
  currentField: string;
  field: string;
  direction: 'asc' | 'desc';
}

export const SortIcon = ({ currentField, field, direction }: SortIconProps) => {
  if (currentField !== field) return null;
  return direction === 'asc'
    ? <ArrowUp size={12} className="text-primary" />
    : <ArrowDown size={12} className="text-primary" />;
};
