import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Space, Button, Spin } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../../api/config';
import { scheduleApi } from '../../../api/scheduleItem';
import '../../../styles/global.scss';

import type { IntelEvent, IntelEventType, ScheduleItem } from './constants';
import {
  INTEL_TYPE_CONFIG, CONTENT_TYPE_CONFIG,
  nextStatusFn, nowIso,
} from './constants';
import CalendarCell from './CalendarCell';
import RightPanel from './RightPanel';
import { CreateItemModal, BaseEditModal, SlangEditModal, MemeEditModal } from './modals';
import IntelDetailDrawer from './IntelDetailDrawer';
import WeeklyBroadcastModal from './WeeklyBroadcastModal';

const WeekScheduleOverview: React.FC = () => {
  // ---- 稳定时间基准 ----
  const baseToday = useRef(dayjs()).current;
  const startOfWeek = baseToday.startOf('week');

  // ---- 视图状态 ----
  const [viewOffset, setViewOffset] = useState(0);
  const viewOffsetRef = useRef(0);
  const [selectedDate, setSelectedDate] = useState(baseToday.format('YYYY-MM-DD'));

  // ---- 数据状态 ----
  const [intelEvents, setIntelEvents] = useState<IntelEvent[]>([]);
  const [intelLoading, setIntelLoading] = useState(false);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [intelPublishTimes, setIntelPublishTimes] = useState<Record<string, 'morning' | 'afternoon' | 'evening'>>({});

  const intelPublishTimesRef = useRef(intelPublishTimes);
  intelPublishTimesRef.current = intelPublishTimes;

  // ---- 弹窗状态 ----
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creatingType, setCreatingType] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  const [editDate, setEditDate] = useState('');
  const [selectedIntel, setSelectedIntel] = useState<IntelEvent | null>(null);
  const [intelDetailOpen, setIntelDetailOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);

  const handleIntelClick = useCallback((evt: IntelEvent) => {
    setSelectedIntel(evt);
    setIntelDetailOpen(true);
  }, []);
  const _loadIntelEvents = useCallback(async () => {
    setIntelLoading(true);
    try {
      const baseMonday = startOfWeek.add(viewOffsetRef.current * 7, 'day');
      const endOfNextWeek = baseMonday.endOf('week').add(7, 'day');
      const res: any = await apiClient.get('/h5/intel/events', {
        params: {
          start_date: baseMonday.format('YYYY-MM-DD'),
          end_date: endOfNextWeek.format('YYYY-MM-DD'),
          mode: 'calendar',
        },
      });
      const data: any = res?.data ?? res ?? {};
      const rawItems: any[] = Array.isArray(data?.items) ? data.items : [];
      setIntelEvents(rawItems.map((e: any) => {
        const existing = intelPublishTimesRef.current[e.id || e._id];
        return {
          id: e.id || e._id || String(Math.random()),
          date: e.date || e.start_date || '',
          time: e.time,
          type: (e.type as IntelEventType) || 'other',
          icon: e.icon || '📌',
          name: e.name || e.title || '',
          venue: e.venue,
          badge: e.badge || '',
          cover: e.cover,
          price: e.price,
          publish_time: existing,
        };
      }));
    } catch {
      setIntelEvents([]);
    } finally {
      setIntelLoading(false);
    }
  }, []);

  // ---- 加载排期（内部实现，依赖 ref） ----
  const _loadScheduleItems = useCallback(async () => {
    try {
      const baseMonday = startOfWeek.add(viewOffsetRef.current * 7, 'day');
      const endOfNextWeek = baseMonday.endOf('week').add(7, 'day');
      const startDate = baseMonday.format('YYYY-MM-DD');
      const endDate = endOfNextWeek.format('YYYY-MM-DD');
      const response = await scheduleApi.listItems({ skip: 0, limit: 200 });
      const allItems: ScheduleItem[] = response?.items || [];
      setItems(allItems.filter(i => i.date >= startDate && i.date <= endDate));
    } catch {
      setItems([]);
    }
  }, []);

  // ---- 切换周（同步触发加载，跳过 effect 延迟） ----
  const switchWeek = (newOffset: number) => {
    viewOffsetRef.current = newOffset;
    setViewOffset(newOffset);
    setSelectedDate('');
    setIntelLoading(true);
    setIntelEvents([]);
    _loadIntelEvents();
    _loadScheduleItems();
  };

  // ---- 选中日数据 ----
  const isDaySelected = selectedDate !== '';

  // ---- 初次挂载加载 ----
  useEffect(() => {
    setIntelLoading(true);
    _loadIntelEvents();
    _loadScheduleItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayItems = useMemo(
    () => isDaySelected ? items.filter(i => i.date === selectedDate) : items,
    [items, selectedDate, isDaySelected],
  );
  const displayIntelEvents = useMemo(
    () => isDaySelected ? intelEvents.filter(e => e.date === selectedDate) : intelEvents,
    [intelEvents, selectedDate, isDaySelected],
  );

  // ---- 数据操作 ----
  const handleSave = async (saved: ScheduleItem) => {
    try {
      if (saved.id.startsWith('local_')) {
        const created = await scheduleApi.createItem({
          week_year: saved.week_year,
          date: saved.date,
          content_type: saved.content_type,
          title: saved.title,
          body: saved.body,
          images: saved.images,
          slang_category: saved.slang_category ?? undefined,
          linked_slags: saved.linked_slags,
          is_pinned: saved.is_pinned,
        });
        setItems(prev => {
          const idx = prev.findIndex(i => i.id === saved.id);
          return idx >= 0 ? prev.map(i => i.id === saved.id ? created : i) : [...prev, created];
        });
      } else {
        const updated = await scheduleApi.updateItem(saved.id, {
          title: saved.title,
          body: saved.body,
          images: saved.images,
          slang_category: saved.slang_category ?? undefined,
          linked_slags: saved.linked_slags,
          is_pinned: saved.is_pinned,
        });
        setItems(prev => prev.map(i => i.id === saved.id ? updated : i));
      }
    } catch {
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === saved.id);
        return idx >= 0 ? prev.map(i => i.id === saved.id ? saved : i) : [...prev, saved];
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!id.startsWith('local_')) await scheduleApi.deleteItem(id);
    } catch { /* ignore */ }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleStatusChange = async (item: ScheduleItem, chId: string) => {
    const ps = item.platforms[chId];
    const ns = nextStatusFn(ps?.status ?? 'pending');
    if (!ns) return;
    try {
      if (!item.id.startsWith('local_')) {
        const updated = await scheduleApi.updateStatus(item.id, { platform_id: chId, status: ns });
        setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      } else {
        setItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          platforms: {
            ...i.platforms,
            [chId]: {
              ...(i.platforms[chId] ?? { status: 'pending', published_at: null, confirmed_at: null, note: '' }),
              status: ns,
              published_at: ns === 'published' ? nowIso() : i.platforms[chId]?.published_at ?? null,
            },
          },
          updated_at: nowIso(),
        } : i));
      }
    } catch { /* ignore */ }
  };

  const handleTogglePinned = async (item: ScheduleItem) => {
    try {
      if (!item.id.startsWith('local_')) {
        const updated = await scheduleApi.togglePinned(item.id);
        setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      } else {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_pinned: !i.is_pinned, updated_at: nowIso() } : i));
      }
    } catch { /* ignore */ }
  };

  const handleIntelPublishTimeChange = (eventId: string, time: 'morning' | 'afternoon' | 'evening') => {
    setIntelPublishTimes(prev => ({ ...prev, [eventId]: time }));
    setIntelEvents(prev => prev.map(e => e.id === eventId ? { ...e, publish_time: time } : e));
  };

  // ---- 弹窗控制 ----
  const openEdit = (item: ScheduleItem) => {
    setSelectedDate(item.date);
    setEditItem(item);
    setEditDate(item.date);
    setEditModalOpen(true);
  };

  const handleCreate = (contentType: string) => {
    setCreatingType(contentType);
    setEditItem(null);
    setEditModalOpen(true);
  };

  const renderEditModal = () => {
    const ct = editItem?.content_type ?? creatingType;
    const commonProps = {
      open: editModalOpen,
      item: editItem,
      date: editDate,
      onClose: () => setEditModalOpen(false),
      onSave: handleSave,
    };
    if (ct === 'slang_science') return <SlangEditModal {...commonProps} />;
    if (ct === 'meme_interaction') return <MemeEditModal {...commonProps} />;
    return <BaseEditModal {...commonProps} contentType={ct} />;
  };

  // ---- 视图计算 ----
  const viewMonday = startOfWeek.add(viewOffset * 7, 'day');
  const viewSunday = viewMonday.endOf('week');
  const nextMonday = viewMonday.add(7, 'day');
  const nextSunday = nextMonday.endOf('week');

  const weekLabel = (monday: dayjs.Dayjs, sunday: dayjs.Dayjs) =>
    `${monday.format('M/D')} - ${sunday.format('M/D')}`;

  // ---- 视图切换（重置选中日） ----
  // viewOffset 负数=过去，正数=未来；点击左箭头应展示更早的周
  const prevWeek = () => switchWeek(viewOffset - 1);
  const nextWeek = () => switchWeek(viewOffset + 1);
  const goToThisWeek = () => switchWeek(0);

  // ---- 按日期分组 ----
  const intelByDate = useMemo(() => {
    const map: Record<string, IntelEventType[]> = {};
    intelEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      if (!map[e.date].includes(e.type)) map[e.date].push(e.type);
    });
    return map;
  }, [intelEvents]);

  const scheduleByDate = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    items.forEach(i => {
      if (!map[i.date]) map[i.date] = [];
      map[i.date].push(i);
    });
    return map;
  }, [items]);

  // ---- 构建格子数据 ----
  const calendarDays = useMemo(() => {
    const todayStr = baseToday.format('YYYY-MM-DD');
    const result: Array<{
      label: number; dateStr: string;
      isToday: boolean; isSelected: boolean;
      intelTypes: IntelEventType[]; scheduleItems: ScheduleItem[];
    }> = [];

    const addDays = (monday: dayjs.Dayjs) => {
      for (let i = 0; i < 7; i++) {
        const d = monday.add(i, 'day');
        const dateStr = d.format('YYYY-MM-DD');
        result.push({
          label: d.date(),
          dateStr,
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDate,
          intelTypes: intelByDate[dateStr] ?? [],
          scheduleItems: scheduleByDate[dateStr] ?? [],
        });
      }
    };

    addDays(viewMonday);
    addDays(nextMonday);

    return result;
  }, [viewOffset, selectedDate, intelByDate, scheduleByDate, baseToday]);

  // ---- 渲染 ----
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 页头 */}
      <div className="page-header" style={{ padding: '20px 24px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="page-title">内容日历</h3>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>
              本周 + 下周排期视图 · 点击日期查看详情
            </p>
          </div>
          <Space>
            <Button icon={<LeftOutlined />} onClick={prevWeek} />
            <span style={{ color: '#e5e7eb', fontWeight: 600, minWidth: 200, textAlign: 'center', fontSize: 15 }}>
              本周 {weekLabel(viewMonday, viewSunday)}
            </span>
            <Button icon={<RightOutlined />} onClick={nextWeek} />
            <Button type={viewOffset === 0 ? 'primary' : 'default'} onClick={goToThisWeek}>回到本周</Button>
            <Button
              type="default"
              onClick={() => setBroadcastModalOpen(true)}
              style={{ borderColor: '#1890ff', color: '#1890ff' }}
            >
              📣 活动播报
            </Button>
          </Space>
        </div>
      </div>

      {/* 图例 */}
      <div style={{ padding: '0 24px 12px', display: 'flex', gap: 16, flexWrap: 'wrap', flexShrink: 0 }}>
        {Object.entries(CONTENT_TYPE_CONFIG).map(([key, cfg]) => (
          <Space key={key} style={{ fontSize: 12, color: '#9ca3af' }}>
            <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.icon}</span>
            <span>{cfg.label}</span>
          </Space>
        ))}
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        {Object.entries(INTEL_TYPE_CONFIG).map(([key, cfg]) => (
          <Space key={key} style={{ fontSize: 12, color: '#9ca3af' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
            <span>{cfg.label}</span>
          </Space>
        ))}
      </div>

      {/* 日历 + 右侧面板 */}
      <div style={{ padding: '0 24px 24px', display: 'flex', gap: 16, flex: 1, alignItems: 'flex-start' }}>
        <Spin spinning={intelLoading}>
          <div style={{
            flex: 4,
            background: 'rgba(17, 24, 39, 0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            overflow: 'hidden',
            minWidth: 600,
          }}>
            {/* 星期头 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} style={{
                  padding: '8px 0', textAlign: 'center',
                  fontSize: 12, color: '#6b7280', fontWeight: 500,
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                }}>周{d}</div>
              ))}
            </div>

            {/* 第一周 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {calendarDays.slice(0, 7).map((day, idx) => (
                <CalendarCell
                  key={`w1-${idx}`}
                  dateStr={day.dateStr}
                  dayLabel={day.label}
                  isToday={day.isToday}
                  isSelected={day.isSelected}
                  scheduleItems={day.scheduleItems}
                  intelTypes={day.intelTypes}
                  onSelectDate={setSelectedDate}
                  onCreate={(date) => { setSelectedDate(date); setCreateModalOpen(true); }}
                />
              ))}
            </div>

            {/* 周间分割线 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', background: 'rgba(255,255,255,0.02)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>下周</span>
              <span style={{ fontSize: 11, color: '#4b5563' }}>{weekLabel(nextMonday, nextSunday)}</span>
            </div>

            {/* 第二周 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {calendarDays.slice(7, 14).map((day, idx) => (
                <CalendarCell
                  key={`w2-${idx}`}
                  dateStr={day.dateStr}
                  dayLabel={day.label}
                  isToday={day.isToday}
                  isSelected={day.isSelected}
                  scheduleItems={day.scheduleItems}
                  intelTypes={day.intelTypes}
                  onSelectDate={setSelectedDate}
                  onCreate={(date) => { setSelectedDate(date); setCreateModalOpen(true); }}
                />
              ))}
            </div>
          </div>
        </Spin>

        <RightPanel
          selectedDate={selectedDate}
          isDaySelected={isDaySelected}
          weekRange={`${viewMonday.format('M/D')} - ${nextSunday.format('M/D')}`}
          scheduleItems={displayItems}
          intelEvents={displayIntelEvents}
          onCreate={(date) => { setSelectedDate(date); setCreateModalOpen(true); }}
          onEdit={openEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onTogglePinned={handleTogglePinned}
          onIntelClick={handleIntelClick}
          onIntelPublishTimeChange={handleIntelPublishTimeChange}
        />
      </div>

      <IntelDetailDrawer
        evt={selectedIntel}
        open={intelDetailOpen}
        onClose={() => setIntelDetailOpen(false)}
        onPublishTimeChange={handleIntelPublishTimeChange}
      />

      <CreateItemModal
        open={createModalOpen}
        selectedDate={selectedDate}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />

      <WeeklyBroadcastModal
        open={broadcastModalOpen}
        weekIntelEvents={intelEvents}
        viewMonday={viewMonday.format('YYYY-MM-DD')}
        viewSunday={viewSunday.format('YYYY-MM-DD')}
        onClose={() => setBroadcastModalOpen(false)}
      />

      {renderEditModal()}
    </div>
  );
};

export default WeekScheduleOverview;
