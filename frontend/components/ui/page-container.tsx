import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function PageContainer({
  children,
  title,
  description,
  className,
}: PageContainerProps) {
  return (
    <div className={cn('p-6', className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          )}
          {description && (
            <p className="text-gray-600 mt-2">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
