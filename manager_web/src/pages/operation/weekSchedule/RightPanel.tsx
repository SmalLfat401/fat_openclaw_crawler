import React, { useMemo } from 'react';
import { Tag, Space, Button, Popconfirm, Empty } from 'antd';
import {
  EditOutlined, DeleteOutlined, PushpinFilled, PushpinOutlined,
  BellOutlined, PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ScheduleItem, IntelEvent } from './constants';
import {
  CONTENT_TYPE_CONFIG, CHANNELS, globalStatus, nextStatusFn,
  formatDate, PUBLISH_STATUS_LABELS, STATUS_COLORS,
} from './constants';
import IntelEventCard from './IntelEventCard';

interface RightPanelProps {
  selectedDate: string;
  isDaySelected: boolean;
  weekRange: string;
  scheduleItems: ScheduleItem[];
  intelEvents: IntelEvent[];
  onCreate: (date: string) => void;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (item: ScheduleItem, chId: string) => void;
  onTogglePinned: (item: ScheduleItem) => void;
  onIntelPublishTimeChange: (eventId: string, time: 'morning' | 'afternoon' | 'evening') => void;
}

const RightPanel = React.memo<RightPanelProps>(({
  selectedDate, isDaySelected, weekRange, scheduleItems, intelEvents,
  onCreate, onEdit, onDelete, onStatusChange, onTogglePinned,
  onIntelPublishTimeChange,
}: RightPanelProps) => {
  const isToday = selectedDate === dayjs().format('YYYY-MM-DD');

  const displayTitle = isDaySelected
    ? dayjs(selectedDate).format('MM月DD日')
    : `本周 + 下周 · ${weekRange}`;

  const itemsByType = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    scheduleItems.forEach(i => {
      if (!map[i.content_type]) map[i.content_type] = [];
      map[i.content_type].push(i);
    });
    return map;
  }, [scheduleItems]);

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
            {!isDaySelected && <Tag style={{ margin: 0, background: '#6366f122', color: '#818cf8', border: 'none', fontSize: 11 }}>周视图</Tag>}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {scheduleItems.length > 0 && <span>{scheduleItems.length}条排期</span>}
            {scheduleItems.length > 0 && intelEvents.length > 0 && <span> · </span>}
            {intelEvents.length > 0 && <span>{intelEvents.length}条情报</span>}
            {scheduleItems.length === 0 && intelEvents.length === 0 && <span>暂无内容</span>}
          </div>
        </div>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => onCreate(selectedDate)}>
          新建
        </Button>
      </div>

      {/* 面板内容（可滚动） */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {intelEvents.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <Space>
                <BellOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
                <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>情报事件</span>
                <Tag style={{ fontSize: 10, margin: 0, background: '#1890ff22', color: '#1890ff', border: 'none' }}>
                  {intelEvents.length}
                </Tag>
              </Space>
            </div>
            {intelEvents.map(evt => (
              <IntelEventCard key={evt.id} evt={evt} onPublishTimeChange={onIntelPublishTimeChange} />
            ))}
          </div>
        )}

        {scheduleItems.length > 0 ? (
          <div>
            {Object.entries(itemsByType).map(([ct, ctItems]) => {
              const cfg = CONTENT_TYPE_CONFIG[ct] ?? CONTENT_TYPE_CONFIG['activity'];
              return (
                <div key={ct} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                    <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{cfg.label}</span>
                    <Tag style={{ fontSize: 10, margin: 0, background: `${cfg.color}22`, color: cfg.color, border: 'none' }}>
                      {ctItems.length}
                    </Tag>
                  </div>
                  {ctItems.map(item => {
                    const gs = globalStatus(item);
                    return (
                      <div key={item.id} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        marginBottom: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#e5e7eb', fontWeight: 500, fontSize: 13, flex: 1, minWidth: 0 }}>
                            {item.title || '(无标题)'}
                          </span>
                          <Tag color={STATUS_COLORS[gs]} style={{ marginRight: 0, fontSize: 11, flexShrink: 0 }}>
                            {PUBLISH_STATUS_LABELS[gs]}
                          </Tag>
                        </div>

                        {item.body && (
                          <div style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.5, marginBottom: 6, maxHeight: 40, overflow: 'hidden' }}>
                            {item.body.length > 60 ? item.body.slice(0, 60) + '…' : item.body}
                          </div>
                        )}

                        {item.linked_slags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                            {item.linked_slags.map(s => (
                              <Tag key={s.slang_id} color="purple" style={{ fontSize: 11, margin: 0 }}>
                                {s.slang_name}
                              </Tag>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                          {CHANNELS.map(ch => {
                            const ps = item.platforms[ch.id];
                            if (!ps) return null;
                            const ns = nextStatusFn(ps.status);
                            return (
                              <div key={ch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Space>
                                  <span style={{ fontSize: 12 }}>{ch.icon}</span>
                                  <span style={{ color: '#9ca3af', fontSize: 12 }}>{ch.name}</span>
                                  <Tag color={STATUS_COLORS[ps.status]} style={{ marginRight: 0, fontSize: 10, padding: '0 4px' }}>
                                    {PUBLISH_STATUS_LABELS[ps.status]}
                                  </Tag>
                                </Space>
                                {ns ? (
                                  <Button
                                    size="small"
                                    type={ns === 'published' ? 'primary' : 'default'}
                                    style={{ fontSize: 11, padding: '0 8px', height: 22 }}
                                    onClick={() => onStatusChange(item, ch.id)}
                                  >
                                    {ns === 'confirmed' ? '确认' : '发布'}
                                  </Button>
                                ) : (
                                  ps.published_at && (
                                    <span style={{ fontSize: 11, color: '#6b7280' }}>{formatDate(ps.published_at)}</span>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', gap: 6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                          <Button size="small" icon={<EditOutlined />} style={{ fontSize: 12 }} onClick={() => onEdit(item)}>编辑</Button>
                          <Button
                            size="small"
                            icon={item.is_pinned ? <PushpinFilled /> : <PushpinOutlined />}
                            style={{ fontSize: 12, color: item.is_pinned ? '#00f0ff' : undefined }}
                            onClick={() => onTogglePinned(item)}
                          >
                            {item.is_pinned ? '取消锚定' : '锚定'}
                          </Button>
                          <Popconfirm title="确定删除？" onConfirm={() => onDelete(item.id)}>
                            <Button size="small" danger icon={<DeleteOutlined />} style={{ fontSize: 12 }}>删除</Button>
                          </Popconfirm>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#6b7280', fontSize: 12 }}>该日期暂无排期内容</span>}
            style={{ margin: '20px 0' }}
          />
        )}
      </div>
    </div>
  );
});

export default RightPanel;
