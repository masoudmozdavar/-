import React from 'react';
import * as Icons from 'lucide-react';

interface IconRendererProps {
  name?: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ 
  name = 'CreditCard', 
  className = 'w-5 h-5', 
  size = 20 
}) => {
  // @ts-ignore
  const IconComponent = (Icons as any)[name] || Icons.CircleDollarSign;
  return <IconComponent className={className} size={size} />;
};
