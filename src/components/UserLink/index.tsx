import { Link } from '@umijs/max';
import React from 'react';

interface UserLinkProps {
  username?: string | null;
  children: React.ReactNode;
}

const UserLink: React.FC<UserLinkProps> = ({ username, children }) => {
  if (!username) return <>{children}</>;
  return (
    <Link
      to={`/user?username=${encodeURIComponent(username)}`}
      style={{ display: 'block' }}
    >
      {children}
    </Link>
  );
};

export default UserLink;
