import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Space, Button, Spin, Empty } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../../api/config';
import '../../../styles/global.scss';

import type { IntelEvent, IntelEventType } from './constants';
import { INTEL_TYPE_CONFIG } from './constants';
import CalendarCell from './CalendarCell';
import RightPanel from './RightPanel';
import IntelDetailDrawer from './IntelDetailDrawer';

// ============================================================
// 类型定义（与 H5 端保持一致）
// ============================================================
export type UnifiedEventType =
  | 'convention'
  | 'book_signing'
  | 'pre_order'
  | 'product_launch'
  | 'offline_activity'
  | 'online_activity'
  | 'other';

export interface UnifiedEvent {
  id: string;
  date: string;
  end_date?: string;
  time?: string;
  type: UnifiedEventType;
  icon: string;
  name: string;
  venue?: string;
  city?: string;
  badge: string;
  cover?: string;
  price?: number | string;
  purchase_url?: string;
  participants?: string[];
  related_ips?: string[];
  tags?: string[];
  source_post_url?: string;
  description?: string;
}

// ============================================================
// 月份导航常量
// ============================================================
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'];
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

// ============================================================
// API 请求函数（与 H5 端保持一致）
// ============================================================
async function fetchCalendarEvents(params: {
  mode?: 'calendar' | 'list';
  start_date?: string;
  end_date?: string;
  category?: string;
  skip?: number;
  limit?: number;
} = {}): Promise<{ items: UnifiedEvent[]; total: number }> {
  try {
    // manager_web apiClient 拦截器返回完整 Axios 响应对象，需取 .data
    const response: any = await apiClient.get('/h5/intel/events', { params });
    return {
      items: response?.data?.items || response?.items || [],
      total: response?.data?.total || response?.total || 0,
    };
  } catch (error) {
    console.error('获取活动日历失败:', error);
    return { items: [], total: 0 };
  }
}

// ============================================================
// 主组件
// ============================================================
const WeekScheduleOverview: React.FC = () => {
  // ---- 视图模式 ----
  const [curMode, setCurMode] = useState<'cal' | 'list'>('cal');

  // ---- 月历状态 ----
  const [curYear, setCurYear]   = useState(dayjs().year());
  const [curMonth, setCurMonth] = useState(dayjs().month()); // 0-indexed

  // 三年范围限制：去年 ~ 明年
  const minYear = dayjs().year() - 1;
  const maxYear = dayjs().year() + 1;

  // ---- 列表分页状态 ----
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allEvents, setAllEvents] = useState<UnifiedEvent[]>([]);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const eventsLengthRef = useRef(0);

  // ---- 选中日 ----
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  // ---- 分类过滤 ----
  const [curFilter, setCurFilter] = useState<UnifiedEventType | 'all'>('all');

  // ---- 情报详情抽屉 ----
  const [selectedIntel, setSelectedIntel] = useState<UnifiedEvent | null>(null);
  const [intelDetailOpen, setIntelDetailOpen] = useState(false);

  // ---- 加载数据 ----
  const loadData = useCallback(async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setAllEvents([]);
        eventsLengthRef.current = 0;
      } else {
        setLoadingMore(true);
      }

      const today = dayjs().format('YYYY-MM-DD');
      const params: Parameters<typeof fetchCalendarEvents>[0] = {};

      if (curMode === 'cal') {
        // 计算日历可见范围：从月初所在周的周日开始，到月末所在周的周六结束，各扩6天
        const firstOfMonth = dayjs(`${curYear}-${String(curMonth + 1).padStart(2, '0')}-01`);
        const lastDayOfMonth = firstOfMonth.endOf('month');
        // 月初所在周的周日（weekday 0 = 周日）
        const calStart = firstOfMonth.startOf('week').subtract(6, 'day');
        // 月末所在周的周六（weekday 6 = 周六）
        const calEnd = lastDayOfMonth.endOf('week').add(6, 'day');
        params.mode = 'calendar';
        params.start_date = calStart.format('YYYY-MM-DD');
        params.end_date = calEnd.format('YYYY-MM-DD');
      } else {
        params.mode = 'list';
        params.start_date = today;
        params.skip = reset ? 0 : eventsLengthRef.current;
        params.limit = pageSize;
      }

      if (curFilter !== 'all') {
        params.category = curFilter;
      }

      const data = await fetchCalendarEvents(params);
      if (reset) {
        setAllEvents(data.items);
        eventsLengthRef.current = data.items.length;
      } else {
        setAllEvents(prev => {
          eventsLengthRef.current = prev.length + data.items.length;
          return [...prev, ...data.items];
        });
      }
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [curMode, curYear, curMonth, curFilter]);

  // 首次加载 + 模式/筛选切换时重新加载
  useEffect(() => {
    if (curMode === 'list') {
      loadData(true);
    } else {
      loadData();
    }
  }, [curMode, curYear, curMonth, curFilter]);

  // ---- 月份切换 ----
  const changeMonth = (delta: number) => {
    let m = curMonth + delta;
    let y = curYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    if (y < minYear || y > maxYear) return;
    setCurMonth(m);
    setCurYear(y);
  };

  // ---- 过滤 ----
  const filteredEvents = useMemo(() => {
    if (curFilter === 'all') return allEvents;
    return allEvents.filter((e) => e.type === curFilter);
  }, [allEvents, curFilter]);

  // ---- 日历数据计算 ----
  const calData = useMemo(() => {
    const firstDay = new Date(curYear, curMonth, 1).getDay(); // 0=周日
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(curYear, curMonth, 0).getDate();

    const today = dayjs().format('YYYY-MM-DD');

    const days: Array<{
      label: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      types: UnifiedEventType[];
    }> = [];

    // 上月
    for (let i = 0; i < firstDay; i++) {
      const d = daysInPrevMonth - firstDay + 1 + i;
      const dateStr = dayjs().date(d).month(curMonth === 0 ? 11 : curMonth - 1).year(curMonth === 0 ? curYear - 1 : curYear).format('YYYY-MM-DD');
      const dayEvents = filteredEvents.filter((e) => e.date === dateStr);
      const types = [...new Set(dayEvents.map((e) => e.type))];
      days.push({ label: d, dateStr, isCurrentMonth: false, isToday: false, isSelected: false, types });
    }

    // 当月
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter((e) => e.date === dateStr);
      const types = [...new Set(dayEvents.map((e) => e.type))];
      days.push({
        label: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isSelected: dateStr === selectedDate,
        types,
      });
    }

    // 下月（补齐 6 行 = 42 格）
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateStr = dayjs().date(d).month(curMonth === 11 ? 0 : curMonth + 1).year(curMonth === 11 ? curYear + 1 : curYear).format('YYYY-MM-DD');
      const dayEvents = filteredEvents.filter((e) => e.date === dateStr);
      const types = [...new Set(dayEvents.map((e) => e.type))];
      days.push({ label: d, dateStr, isCurrentMonth: false, isToday: false, isSelected: false, types });
    }

    return days;
  }, [curYear, curMonth, selectedDate, filteredEvents]);

  // ---- 选中日期事件 ----
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.date === selectedDate);
  }, [filteredEvents, selectedDate]);

  // ---- 列表数据（按日期分组） ----
  const listData = useMemo(() => {
    const grouped: Record<string, UnifiedEvent[]> = {};
    filteredEvents.forEach((e) => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return Object.keys(grouped)
      .sort()
      .map((date) => ({ date, events: grouped[date] }));
  }, [filteredEvents]);

  // ---- 无限滚动 ----
  const hasMore = allEvents.length < total;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loadingMore && !loading) {
      loadData(false);
    }
  }, [hasMore, loadingMore, loading, loadData]);

  // ---- 交互 ----
  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (curMode !== 'cal') setCurMode('cal');
  };

  const today = dayjs().format('YYYY-MM-DD');

  const handleCardClick = (e: UnifiedEvent) => {
    setSelectedIntel(e);
    setIntelDetailOpen(true);
  };

  // ---- 过滤标签配置 ----
  const FILTER_CONFIG: { key: UnifiedEventType | 'all'; label: string }[] = [
    { key: 'all',              label: '全部' },
    { key: 'convention',       label: '漫展' },
    { key: 'book_signing',     label: '签售' },
    { key: 'pre_order',        label: '预售' },
    { key: 'product_launch',   label: '新谷开团' },
    { key: 'offline_activity', label: '线下活动' },
    { key: 'online_activity',  label: '线上活动' },
    { key: 'other',            label: '其他' },
  ];

  // ---- 颜色配置 ----
  const TYPE_COLORS: Record<UnifiedEventType, { bg: string; text: string; dot: string }> = {
    convention:      { bg: '#EEEDFE', text: '#534AB7', dot: '#7F77DD' },
    book_signing:    { bg: '#FBEAF0', text: '#D4537E', dot: '#ED93B1' },
    pre_order:       { bg: '#FFF3E0', text: '#E65100', dot: '#FF9800' },
    product_launch:  { bg: '#E8F5E9', text: '#2E7D32', dot: '#66BB6A' },
    offline_activity:{ bg: '#E3F2FD', text: '#1565C0', dot: '#42A5F5' },
    online_activity: { bg: '#F3E5F5', text: '#6A1B9A', dot: '#AB47BC' },
    other:           { bg: '#F5F5F5', text: '#616161', dot: '#9E9E9E' },
  };

  // ============================================================
  // 渲染事件卡片
  // ============================================================
  const renderEventCard = (e: UnifiedEvent) => {
    const colors = TYPE_COLORS[e.type] ?? TYPE_COLORS['other'];
    return (
      <div
        key={e.id}
        onClick={() => handleCardClick(e)}
        style={{
          display: 'flex',
          gap: 12,
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(17, 24, 39, 0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(17, 24, 39, 0.9)')}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}>
          {e.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#e5e7eb', fontWeight: 500, fontSize: 14, marginBottom: 3, lineHeight: 1.3 }}>
            {e.name}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {e.time && <span>{e.time}</span>}
            {e.time && e.venue && <span>·</span>}
            {e.venue && <span>{e.venue}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {e.price !== undefined && (
            <span style={{ fontSize: 13, color: '#52c41a', fontWeight: 600 }}>
              ¥{e.price}
            </span>
          )}
          <span style={{
            background: colors.bg,
            color: colors.text,
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 8,
          }}>
            {e.badge}
          </span>
        </div>
      </div>
    );
  };

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 页头 */}
      <div className="page-header" style={{ padding: '20px 24px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="page-title">内容日历</h3>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>
              会展 · 谷子预告 · 情报汇总
            </p>
          </div>
          {/* 视图切换 */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 20,
            padding: 3,
            gap: 2,
          }}>
            <button
              onClick={() => setCurMode('cal')}
              style={{
                padding: '6px 18px',
                borderRadius: 16,
                border: 'none',
                background: curMode === 'cal' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: curMode === 'cal' ? '#e5e7eb' : '#6b7280',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              日历
            </button>
            <button
              onClick={() => setCurMode('list')}
              style={{
                padding: '6px 18px',
                borderRadius: 16,
                border: 'none',
                background: curMode === 'list' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: curMode === 'list' ? '#e5e7eb' : '#6b7280',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              列表
            </button>
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div style={{ padding: '0 24px 8px', display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        {Object.entries(TYPE_COLORS).map(([key, cfg]) => (
          <Space key={key} style={{ fontSize: 12, color: '#9ca3af' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
            <span>{INTEL_TYPE_CONFIG[key as UnifiedEventType]?.label ?? key}</span>
          </Space>
        ))}
      </div>

      {/* ========== 日历视图 ========== */}
      {curMode === 'cal' && (
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 16, flex: 1, alignItems: 'flex-start' }}>
          <Spin spinning={loading} style={{ flex: 3 }}>
            <div style={{
              background: 'rgba(17, 24, 39, 0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              overflow: 'hidden',
              minWidth: 560,
            }}>
              {/* 月份导航 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <Button
                  icon={<LeftOutlined />}
                  onClick={() => changeMonth(-1)}
                  disabled={curYear <= minYear && curMonth === 0}
                  type="text" size="small"
                />
                <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 15 }}>
                  {curYear}年 {MONTH_NAMES[curMonth]}
                </span>
                <Button
                  icon={<RightOutlined />}
                  onClick={() => changeMonth(1)}
                  disabled={curYear >= maxYear && curMonth === 11}
                  type="text" size="small"
                />
              </div>

              {/* 星期头 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {WEEKDAY_NAMES.map(d => (
                  <div key={d} style={{
                    padding: '8px 0', textAlign: 'center',
                    fontSize: 12, color: '#6b7280', fontWeight: 500,
                    borderRight: '1px solid rgba(255,255,255,0.04)',
                  }}>周{d}</div>
                ))}
              </div>

              {/* 日历格子 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
              }}>
                {calData.map((day, idx) => {
                  const isSunday = idx % 7 === 0;
                  const isSaturday = idx % 7 === 6;
                  const isWeekEnd = idx % 7 === 6; // 周六右侧加粗分隔
                  const isWeekStart = idx % 7 === 0; // 周日左侧分隔
                  return (
                    <div
                      key={idx}
                      onClick={() => selectDate(day.dateStr)}
                      style={{
                        minHeight: 90,
                        borderRight: isWeekEnd ? '2px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                        borderBottom: isWeekEnd ? '2px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                        borderLeft: isWeekStart && idx > 0 ? 'none' : 'none',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        background: !day.isCurrentMonth
                          ? day.types.length > 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.15)'
                          : day.isSelected
                          ? 'rgba(212, 83, 126, 0.15)'
                          : day.isToday
                          ? 'rgba(0, 240, 255, 0.05)'
                          : 'transparent',
                        opacity: !day.isCurrentMonth ? 0.85 : 1,
                        transition: 'background 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      <div style={{
                        fontSize: 14,
                        fontWeight: day.isToday ? 700 : 400,
                        color: !day.isCurrentMonth
                          ? '#374151'
                          : day.isToday
                          ? '#00f0ff'
                          : day.isSelected
                          ? '#D4537E'
                          : '#e5e7eb',
                        lineHeight: 1,
                        marginBottom: 2,
                      }}>
                        {day.label}
                      </div>
                      {day.types.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                          {day.types.map(t => (
                            <span key={t} style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: TYPE_COLORS[t]?.dot ?? '#9e9e9e',
                              display: 'inline-block',
                            }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Spin>

          {/* 右侧详情面板 */}
          <RightPanel
            selectedDate={selectedDate}
            isDaySelected={true}
            weekRange=""
            scheduleItems={[]}
            intelEvents={selectedDayEvents.map(e => ({
              id: e.id,
              date: e.date,
              time: e.time,
              type: e.type as IntelEventType,
              icon: e.icon,
              name: e.name,
              venue: e.venue,
              city: e.city,
              badge: e.badge,
              cover: e.cover,
              price: e.price,
            }))}
            onCreate={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onStatusChange={() => {}}
            onTogglePinned={() => {}}
            onIntelClick={handleCardClick}
            onIntelPublishTimeChange={() => {}}
          />
        </div>
      )}

      {/* ========== 列表视图 ========== */}
      {curMode === 'list' && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 24px 24px',
          }}
          onScroll={handleScroll}
        >
          {/* 分类过滤 */}
          <div style={{
            display: 'flex',
            gap: 8,
            padding: '8px 0 16px',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}>
            {FILTER_CONFIG.map(f => (
              <button
                key={f.key}
                onClick={() => setCurFilter(f.key as UnifiedEventType | 'all')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  border: `1px solid ${curFilter === f.key ? (f.key === 'all' ? 'rgba(255,255,255,0.2)' : (TYPE_COLORS[f.key as UnifiedEventType]?.dot ?? '#9e9e9e')) : 'rgba(255,255,255,0.08)'}`,
                  background: curFilter === f.key
                    ? (f.key === 'all' ? 'rgba(255,255,255,0.12)' : `${TYPE_COLORS[f.key as UnifiedEventType]?.dot ?? '#9e9e9e'}22`)
                    : 'transparent',
                  color: curFilter === f.key
                    ? (f.key === 'all' ? '#e5e7eb' : (TYPE_COLORS[f.key as UnifiedEventType]?.text ?? '#9e9e9e'))
                    : '#6b7280',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>加载中...</div>
          ) : listData.length === 0 ? (
            <Empty description={<span style={{ color: '#6b7280', fontSize: 13 }}>暂无相关活动</span>} style={{ margin: '40px 0' }} />
          ) : (
            <>
              {listData.map(({ date, events: dayEvents }) => {
                const isToday = date === today;
                const dateObj = dayjs(date);
                const isCurrentYear = dateObj.year() === dayjs().year();
                const dateStr = isCurrentYear
                  ? `${dateObj.month() + 1}月${+dateObj.format('DD')}日`
                  : `${dateObj.year()}年${dateObj.month() + 1}月${+dateObj.format('DD')}日`;

                return (
                  <div key={date} style={{ marginBottom: 24 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}>
                      {dateStr} 周{WEEKDAY_NAMES[dateObj.day()]}
                      {isToday && (
                        <span style={{
                          background: '#00f0ff',
                          color: '#111',
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 6,
                          fontWeight: 700,
                        }}>今天</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {dayEvents.map(renderEventCard)}
                    </div>
                  </div>
                );
              })}
              {loadingMore && (
                <div style={{ textAlign: 'center', padding: 20, color: '#6b7280', fontSize: 13 }}>加载更多...</div>
              )}
              {!hasMore && listData.length > 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#4b5563', fontSize: 12 }}>
                  — 已加载全部 {total} 条 —
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 情报详情抽屉 */}
      <IntelDetailDrawer
        evt={selectedIntel}
        open={intelDetailOpen}
        onClose={() => setIntelDetailOpen(false)}
        onPublishTimeChange={() => {}}
      />
    </div>
  );
};

export default WeekScheduleOverview;
