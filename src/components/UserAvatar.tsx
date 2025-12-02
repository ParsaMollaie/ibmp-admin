import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { Avatar, Dropdown, Modal, Space, Spin } from 'antd';
import React from 'react';

const UserAvatar: React.FC = () => {
  // Access the current user from initialState (set by getInitialState in app.tsx)
  const { initialState, loading } = useModel('@@initialState');
  // Access the logout function from your user model
  const { logout } = useModel('user');

  const handleLogout = () => {
    Modal.confirm({
      title: 'خروج از سیستم',
      content: 'آیا مطمئن هستید می‌خواهید خارج شوید؟',
      okText: 'بله',
      cancelText: 'خیر',
      onOk: () => logout(),
    });
  };

  const items = [
    {
      key: 'logout',
      label: 'خروج',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  // Show a loading spinner while initialState is being fetched
  if (loading) {
    return <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />;
  }

  const currentUser = initialState?.currentUser;

  // Generate initials from the user's name for the avatar fallback
  const getInitials = () => {
    if (!currentUser) return '';
    const firstInitial = currentUser.first_name?.[0] || '';
    const lastInitial = currentUser.last_name?.[0] || '';
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Space style={{ cursor: 'pointer' }}>
        <Avatar
          style={{ backgroundColor: '#1890ff' }}
          icon={
            !currentUser?.avatar && !getInitials() ? (
              <UserOutlined />
            ) : undefined
          }
          src={currentUser?.avatar}
        >
          {/* Show initials if no avatar image is available */}
          {!currentUser?.avatar && getInitials()}
        </Avatar>
        {/* Display the user's full name next to the avatar */}
        {currentUser && (
          <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            {currentUser.first_name} {currentUser.last_name}
          </span>
        )}
      </Space>
    </Dropdown>
  );
};

export default UserAvatar;
