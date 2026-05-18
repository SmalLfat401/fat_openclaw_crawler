import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, message, ConfigProvider, theme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import md5 from 'js-md5';
import { useAuth } from '../../context/AuthContext';
import zhCN from 'antd/locale/zh_CN';
import './LoginPage.scss';

interface LoginFormValues {
  username: string;
  password: string;
}

/**
 * 密码混淆算法：
 * 1. 密码每 4 个字符一组，分别做 MD5
 * 2. 第1、2 组交换位置后拼接
 * 例: "caomingyu1018" -> ["caom", "ingy", "u101", "8   "] -> ["ingy", "caom", "u101", "8   "]
 */
function obfuscatePassword(password: string): string {
  const padded = password.padEnd(Math.ceil(password.length / 4) * 4, ' ');
  const groups: string[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    groups.push(padded.slice(i, i + 4));
  }
  if (groups.length >= 2) {
    [groups[0], groups[1]] = [groups[1], groups[0]];
  }
  return groups.map((g) => md5(g)).join('');
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const obfuscated = obfuscatePassword(values.password);
      await login(values.username, obfuscated);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (err: any) {
      message.error(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00f0ff',
          borderRadius: 8,
          colorBgContainer: '#111827',
          colorBgElevated: '#1a2234',
          colorBorder: 'rgba(0, 240, 255, 0.2)',
          colorText: '#e5e7eb',
          colorTextSecondary: '#9ca3af',
        },
      }}
    >
      <div className="login-page">
        <div className="bg-animation">
          <div className="grid-pattern" />
        </div>
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">
                <span className="logo-icon">&#x1F575;</span>
              </div>
              <h1 className="login-title">OpenClaw 管理平台</h1>
              <p className="login-subtitle">请输入管理员账号登录</p>
            </div>

            <Form
              name="login"
              className="login-form"
              onFinish={handleFinish}
              autoComplete="off"
              layout="vertical"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder="用户名"
                  size="large"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="密码"
                  size="large"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="login-btn"
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default LoginPage;
