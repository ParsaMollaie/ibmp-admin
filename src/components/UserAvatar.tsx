import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { Avatar, Dropdown, Modal } from 'antd';
import React from 'react';

const UserAvatar: React.FC = () => {
  const { logout } = useModel('user');

  const handleLogout = async () => {
    try {
      Modal.confirm({
        title: 'خروج از سیستم',
        content: 'آیا مطمئن هستید می‌خواهید خارج شوید؟',
        okText: 'بله',
        cancelText: 'خیر',
        onOk: () => logout(),
      });
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const items = [
    {
      key: 'logout',
      label: 'خروج',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Avatar
        style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
        icon={<UserOutlined />}
      >
        {/* {username?.[0] ?? ''} */}
      </Avatar>
    </Dropdown>
  );
};

export default UserAvatar;
