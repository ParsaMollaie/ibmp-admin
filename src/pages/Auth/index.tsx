import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import React, { useEffect } from 'react';
import styles from './index.less';

const { Title, Text } = Typography;

interface LoginValues {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();

  // Access the user model for login functionality and loading state
  const { login, loading } = useModel('user');

  // Access initialState to check if user is already logged in, and refresh function
  // to update the global state after successful login
  const { initialState, refresh } = useModel('@@initialState');

  // Redirect to home if user is already logged in
  // This prevents logged-in users from seeing the login page
  useEffect(() => {
    if (initialState?.currentUser) {
      history.push('/');
    }
  }, [initialState?.currentUser]);

  const handleSubmit = async (values: LoginValues) => {
    try {
      await login(values);

      // Refresh initialState to update currentUser across the entire app
      // This ensures the layout, UserAvatar, and other components get the new user data
      await refresh();

      message.success('ورود با موفقیت انجام شد');
    } catch (err: any) {
      // Display the error message from the API if available, otherwise show a generic message
      const errorMessage =
        err?.response?.data?.message ||
        'ورود ناموفق. لطفاً اطلاعات را بررسی کنید';
      message.error(errorMessage);
      console.error('Login failed:', err);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <Title level={3} className={styles.logoText}>
            Ibmp
          </Title>
          <Text type="secondary" className={styles.subText}>
            پنل ادمین Ibmp
          </Text>
        </div>
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          className={styles.loginForm}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'لطفاً نام کاربری را وارد کنید!' },
            ]}
          >
            <Input
              prefix={<UserOutlined className={styles.inputIcon} />}
              placeholder="نام کاربری"
              size="large"
              // Disable input while login is in progress
              disabled={loading}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'لطفاً رمز عبور را وارد کنید!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="رمز عبور"
              size="large"
              // Disable input while login is in progress
              disabled={loading}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              className={styles.loginButton}
              // Show loading spinner on button while login is in progress
              loading={loading}
            >
              ورود
            </Button>
          </Form.Item>
        </Form>
        <div className={styles.footer}>
          <Text type="secondary">نسخه 1404</Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
