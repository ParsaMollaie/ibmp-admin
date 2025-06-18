import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import React from 'react';
import styles from './index.less';

const { Title, Text } = Typography;

interface LoginValues {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const { login } = useModel('user');

  const handleSubmit = async (values: LoginValues) => {
    try {
      await login(values);
      message.success('ورود با موفقیت انجام شد');
    } catch (err) {
      message.error('ورود ناموفق. لطفاً اطلاعات را بررسی کنید');
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
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'لطفاً رمز عبور را وارد کنید!' },
            ]}
          >
            <Input
              prefix={<LockOutlined className={styles.inputIcon} />}
              type="password"
              placeholder="رمز عبور"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              className={styles.loginButton}
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
