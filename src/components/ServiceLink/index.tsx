import { Link } from '@umijs/max';
import React from 'react';

interface ServiceLinkProps {
  type?: string | null;
  title: string;
  children: React.ReactNode;
}

const ServiceLink: React.FC<ServiceLinkProps> = ({ type, title, children }) => {
  if (!type) return <>{children}</>;
  return (
    <Link
      to={`/services?type=${encodeURIComponent(
        type,
      )}&search=${encodeURIComponent(title)}`}
      style={{ display: 'block' }}
    >
      {children}
    </Link>
  );
};

export default ServiceLink;
