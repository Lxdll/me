// components/SafeLink.tsx
import { startTransition } from 'react';
import { useNavigate } from 'react-router-dom';

interface SafeLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export function SafeLink({ to, children, className }: SafeLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    startTransition(() => {
      navigate(to);
    });
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
