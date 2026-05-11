import React, { useState, useMemo } from 'react';
import { Tag, Space, Empty } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { IntelEvent, IntelEventType } from './constants';
import { INTEL_TYPE_CONFIG } from './constants';

interface RightPanelProps {
  selectedDate: string;
  isDaySelected: boolean;
  weekRange: string;
  scheduleItems: any[]; // kept for API compatibility, always empty
  intelEvents: IntelEvent[];
  onCreate: (date: string) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onStatusChange: (item: any, chId: string) => void;
  onTogglePinned: (item: any) => void;
  onIntelClick: (evt: IntelEvent) => void;
  onIntelPublishTimeChange: (eventId: string, time: 'morning' | 'afternoon' | 'evening') => void;
}

const RightPanel = React.memo<RightPanelProps>(({
  selectedDate, isDaySelected, weekRange, intelEvents,
  onIntelClick,
}: RightPanelProps) => {
  const isToday = selectedDate === dayjs().format('YYYY-MM-DD');
  const [activeType, setActiveType] = useState<string>('__all__');

  const displayTitle = isDaySelected
    ? dayjs(selectedDate).format('MM月DD日')
    : weekRange;

  // 按情报类型统计
  const intelByType = useMemo(() => {
    const map: Record<string, IntelEvent[]> = {};
    intelEvents.forEach(e => {
      if (!map[e.type]) map[e.type] = [];
      map[e.type].push(e);
    });
    return map;
  }, [intelEvents]);

  const countAll = intelEvents.length;
  const countByType = useMemo(() => {
    const m: Record<string, number> = {};
    Object.entries(intelByType).forEach(([ct, evts]) => { m[ct] = evts.length; });
    return m;
  }, [intelByType]);

  const filteredIntelEvents = useMemo(() => {
    if (activeType === '__all__') return intelEvents;
    return intelByType[activeType] ?? [];
  }, [intelEvents, intelByType, activeType]);

  const TYPE_COLORS: Record<string, { dot: string; color: string }> = {
    convention:      { dot: '#7F77DD', color: '#534AB7' },
    book_signing:    { dot: '#ED93B1', color: '#D4537E' },
    pre_order:       { dot: '#FF9800', color: '#E65100' },
    product_launch:  { dot: '#66BB6A', color: '#2E7D32' },
    offline_activity:{ dot: '#42A5F5', color: '#1565C0' },
    online_activity: { dot: '#AB47BC', color: '#6A1B9A' },
    other:           { dot: '#9E9E9E', color: '#616161' },
  };

  return (
    <div style={{
      flex: 6,
      flexShrink: 1,
      background: 'rgba(17, 24, 39, 0.9)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 160px)',
      overflow: 'hidden',
    }}>
      {/* 面板头部 */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 15 }}>
              {displayTitle}
            </span>
            {isDaySelected && isToday && <Tag color="cyan" style={{ margin: 0 }}>今天</Tag>}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {intelEvents.length > 0 && <span>{intelEvents.length}条情报</span>}
            {intelEvents.length === 0 && <span>暂无情报</span>}
          </div>
        </div>
      </div>

      {/* 类别过滤栏 */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <Tag
          style={{
            cursor: 'pointer', margin: 0,
            background: activeType === '__all__' ? 'rgba(255,255,255,0.12)' : 'transparent',
            color: activeType === '__all__' ? '#e5e7eb' : '#6b7280',
            border: `1px solid ${activeType === '__all__' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
            fontSize: 12,
          }}
          onClick={() => setActiveType('__all__')}
        >
          全部 {countAll}
        </Tag>
        {Object.entries(INTEL_TYPE_CONFIG).map(([ct, cfg]) => {
          const count = countByType[ct] ?? 0;
          const isActive = activeType === ct;
          return (
            <Tag
              key={ct}
              style={{
                cursor: 'pointer', margin: 0,
                background: isActive ? `${cfg.color}28` : 'transparent',
                color: isActive ? cfg.color : count > 0 ? '#9ca3af' : '#4b5563',
                border: `1px solid ${isActive ? cfg.color + '60' : 'rgba(255,255,255,0.08)'}`,
                fontSize: 12,
              }}
              onClick={() => setActiveType(ct)}
            >
              {cfg.label} {count}
            </Tag>
          );
        })}
      </div>

      {/* 面板内容（可滚动） */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {filteredIntelEvents.length > 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <Space>
                <BellOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
                <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>情报事件</span>
                <Tag style={{ fontSize: 10, margin: 0, background: '#1890ff22', color: '#1890ff', border: 'none' }}>
                  {filteredIntelEvents.length}
                </Tag>
              </Space>
            </div>
            {filteredIntelEvents.map(evt => {
              const tcfg = INTEL_TYPE_CONFIG[evt.type] ?? INTEL_TYPE_CONFIG['other'];
              const colors = TYPE_COLORS[evt.type] ?? TYPE_COLORS['other'];
              return (
                <div
                  key={evt.id}
                  onClick={() => onIntelClick(evt)}
                  style={{
                    background: `${tcfg.color}12`,
                    border: `1px solid ${tcfg.color}28`,
                    borderLeft: `3px solid ${tcfg.color}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${tcfg.color}20`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `${tcfg.color}12`)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{evt.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
                        {evt.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                        {evt.time && <span style={{ fontSize: 11, color: '#9ca3af' }}>{evt.time}</span>}
                        {evt.time && evt.venue && <span style={{ fontSize: 11, color: '#9ca3af' }}>·</span>}
                        {evt.venue && <span style={{ fontSize: 11, color: '#9ca3af' }}>{evt.venue}</span>}
                        <Tag
                          style={{
                            fontSize: 10, padding: '0 4px', margin: 0,
                            background: `${tcfg.color}25`,
                            color: tcfg.color, border: 'none',
                          }}
                        >
                          {tcfg.label}
                        </Tag>
                      </div>
                      {evt.price !== undefined && (
                        <div style={{ color: '#52c41a', fontSize: 12 }}>
                          {typeof evt.price === 'number' ? `¥${evt.price}` : evt.price}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#6b7280', fontSize: 12 }}>暂无情报内容</span>}
            style={{ margin: '20px 0' }}
          />
        )}

      </div>
    </div>
  );
});

export default RightPanel;
