import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, theme, Spin, Button, Popover, Avatar } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { UserOutlined, DashboardOutlined, SettingOutlined, TagOutlined, DatabaseOutlined, BulbOutlined, ShoppingOutlined, BookOutlined, FireOutlined, CalendarOutlined, HeartOutlined, KeyOutlined, ThunderboltOutlined, RobotOutlined, AlertOutlined, GiftOutlined, AppstoreOutlined, ScheduleOutlined, TeamOutlined, LogoutOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useFeatures } from './context/FeaturesContext';
import { useAuth } from './context/AuthContext';
import './styles/global.scss';

const { Header, Content, Sider } = Layout;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { features, loading } = useFeatures();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  React.useEffect(() => {
    if (!loading && location.pathname === '/') {
      const flags = features || { WEIBO_USERS_ENABLED: true };
      const target = flags.WEIBO_USERS_ENABLED ? '/weibo-users' : '/weibo-intel';
      navigate(target, { replace: true });
    }
  }, [loading, location.pathname, features, navigate]);

  if (loading) {
    return (
      <ConfigProvider locale={zhCN}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0f1a' }}>
          <Spin size="large" />
        </div>
      </ConfigProvider>
    );
  }

  const flags = features || { WEIBO_USERS_ENABLED: true, WEIBO_INTEL_ENABLED: true, LLM_ENABLED: true };

  const menuItems = [
    {
      key: 'weibo-intel',
      icon: <RobotOutlined />,
      label: '微博情报',
      children: [
        { key: '/weibo-intel', icon: <RobotOutlined />, label: '情报提取' },
        { key: '/weibo-intel/management', icon: <AlertOutlined />, label: '情报管理' },
        { key: '/weibo-intel/keywords', icon: <KeyOutlined />, label: '关键词库' },
      ],
    },
    ...(flags.WEIBO_USERS_ENABLED ? [
      { key: '/weibo-users', icon: <UserOutlined />, label: '微博用户管理' },
    ] : []),
    {
      key: 'slang',
      icon: <BookOutlined />,
      label: '黑话术语库',
      children: [
        { key: '/guzi-terms', icon: <BulbOutlined />, label: '谷子黑话' },
        { key: '/coser-terms', icon: <HeartOutlined />, label: 'Coser圈' },
        { key: '/convention-terms', icon: <CalendarOutlined />, label: '漫展圈' },
        { key: '/game-terms', icon: <FireOutlined />, label: '游戏圈/二游' },
      ],
    },
    { key: '/guzi-products', icon: <ShoppingOutlined />, label: '谷子商品' },
    { key: '/want-guzi', icon: <GiftOutlined />, label: '求谷管理' },
    {
      key: 'schedule',
      icon: <ScheduleOutlined />,
      label: '内容排期',
      children: [
        { key: '/schedule', icon: <TeamOutlined />, label: '周排期总览' },
        { key: '/schedule/channels', icon: <ScheduleOutlined />, label: '发布渠道配置' },
      ],
    },
    { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: [
        { key: '/settings/categories', icon: <TagOutlined />, label: '标签管理' },
        { key: '/settings/guzi-tags', icon: <ThunderboltOutlined />, label: '谷子标签管理' },
        { key: '/settings/guzi-categories', icon: <AppstoreOutlined />, label: '谷子分类管理' },
        { key: '/settings/commission-account', icon: <KeyOutlined />, label: '返佣账号管理' },
        { key: '/settings/database', icon: <DatabaseOutlined />, label: '数据库管理' },
      ],
    },
  ];

  const userMenuContent = (
    <div style={{ minWidth: 160 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,240,255,0.1)', marginBottom: 8 }}>
        <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 13 }}>{user?.username}</div>
        <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>管理员</div>
      </div>
      <Button
        type="text"
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        style={{ color: '#ff4d4f', width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
        danger
      >
        退出登录
      </Button>
    </div>
  );

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
      <Layout className="app-layout">
        <div className="bg-animation">
          <div className="grid-pattern" />
        </div>
        <Header className="app-header">
          <div className="header-title">
            OpenClaw 爬虫管理平台
          </div>
          <div className="header-right">
            <Popover
              content={userMenuContent}
              trigger="click"
              placement="bottomRight"
              arrow={false}
            >
              <div className="header-user">
                <Avatar size={28} icon={<UserSwitchOutlined />} style={{ background: 'rgba(0,240,255,0.2)', border: '1px solid rgba(0,240,255,0.3)' }} />
                <span className="header-username">{user?.username}</span>
              </div>
            </Popover>
          </div>
        </Header>
        <Layout>
          <Sider width={200} className="app-sider">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={(e) => navigate(e.key)}
            />
          </Sider>
          <Content className="app-content">
            <div className="content-card">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
