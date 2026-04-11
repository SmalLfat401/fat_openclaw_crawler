/**
 * OpenClaw H5 应用主组件
 */
import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { initRem } from '@/utils/rem';
import TabBar from '@/components/TabBar';
import CalendarPage from '@/pages/calendar';
import ProductsPage from '@/pages/products';
import ProductDetailPage from '@/pages/products/ProductDetail';
import GlossaryPage from '@/pages/glossary';

// 路由配置
const routes = [
  { path: '/calendar', component: CalendarPage },
  { path: '/products', component: ProductsPage },
  { path: '/product/:id', component: ProductDetailPage },
  { path: '/glossary', component: GlossaryPage },
];

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // 底部 TabBar 白名单
  const tabBarRoutes = ['/calendar', '/products', '/glossary'];
  const showTabBar = tabBarRoutes.includes(location.pathname);

  // 默认首页跳转到 /products
  React.useEffect(() => {
    if (location.pathname === '/') {
      navigate('/products', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="app">
      {/* 页面内容区 */}
      <div className="page-container">
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.component />}
            />
          ))}
        </Routes>
      </div>

      {/* 固定底部 TabBar */}
      {showTabBar && (
        <div className="tabbar-fixed">
          <TabBar
            currentPath={location.pathname}
            onChange={(path) => navigate(path)}
          />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
