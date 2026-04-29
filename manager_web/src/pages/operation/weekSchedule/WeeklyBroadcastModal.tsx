import React, { useState, useMemo } from 'react';
import {
  Modal, Tag, Checkbox, Button, Empty,
} from 'antd';
import {
  RocketOutlined, BulbOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { IntelEvent, IntelEventType } from './constants';
import { INTEL_TYPE_CONFIG, CONTENT_TYPE_CONFIG } from './constants';
import BroadcastGenerateModal from './BroadcastGenerateModal';

// ============================================================
// 快速筛选配置
// ============================================================
const QUICK_FILTERS: Array<{ key: IntelEventType | 'all'; label: string; icon: React.ReactNode; color: string }> = [
  { key: 'all',            label: '全部',      icon: <RocketOutlined />,  color: '#9ca3af' },
  { key: 'convention',      label: '漫展',      icon: <BulbOutlined />,   color: '#534AB7' },
  { key: 'book_signing',    label: '签售',      icon: <BulbOutlined />,   color: '#D4537E' },
  { key: 'pre_order',       label: '预售',      icon: <BulbOutlined />,   color: '#E65100' },
  { key: 'product_launch',  label: '新谷开团',  icon: <BulbOutlined />,   color: '#2E7D32' },
  { key: 'offline_activity',label: '线下活动',  icon: <BulbOutlined />,   color: '#1565C0' },
  { key: 'online_activity', label: '线上活动',  icon: <BulbOutlined />,   color: '#6A1B9A' },
  { key: 'other',           label: '其他',      icon: <BulbOutlined />,   color: '#616161' },
];

// ============================================================
// 接口类型
// ============================================================
interface WeeklyBroadcastModalProps {
  open: boolean;
  weekIntelEvents: IntelEvent[];
  viewMonday: string;
  viewSunday: string;
  onClose: () => void;
}

// ============================================================
// 主组件
// ============================================================
const WeeklyBroadcastModal: React.FC<WeeklyBroadcastModalProps> = ({
  open, weekIntelEvents, viewMonday, viewSunday, onClose,
}) => {
  // ---- 内容状态 ----
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [selectedIntel, setSelectedIntel] = useState<Set<string>>(new Set());
  const [contentType, setContentType] = useState<string>('activity');

  // ---- 生成弹窗 ----
  const [generateOpen, setGenerateOpen] = useState(false);

  // ---- 按日期分组 intel ----
  const intelByDate = useMemo(() => {
    const map: Record<string, IntelEvent[]> = {};
    weekIntelEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [weekIntelEvents]);

  const allDates = useMemo(() => Array.from(Object.keys(intelByDate)).sort(), [intelByDate]);

  // ---- 过滤后的 intel ----
  const filteredIntel = useMemo(() => {
    if (quickFilter === 'all') return weekIntelEvents;
    return weekIntelEvents.filter(e => e.type === quickFilter);
  }, [weekIntelEvents, quickFilter]);

  const filteredIntelIds = useMemo(
    () => filteredIntel.map(e => e.id),
    [filteredIntel],
  );

  // ---- 勾选操作 ----
  const handleQuickSelect = () => {
    setSelectedIntel(new Set(filteredIntelIds));
  };

  const handleQuickDeselect = () => {
    setSelectedIntel(new Set());
  };

  const toggleIntel = (id: string) => {
    setSelectedIntel(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ---- 打开生成弹窗 ----
  const openGenerate = () => {
    if (selectedIntel.size === 0) {
      return; // 按钮本身就是 disabled，兜底
    }
    setGenerateOpen(true);
  };

  // ---- 关闭时重置 ----
  const handleClose = () => {
    setSelectedIntel(new Set());
    setQuickFilter('all');
    setContentType('activity');
    setGenerateOpen(false);
    onClose();
  };

  const weekLabel = `${dayjs(viewMonday).format('M月D日')} - ${dayjs(viewSunday).format('M月D日')}`;
  const selectedIntelList = weekIntelEvents.filter(e => selectedIntel.has(e.id));
  const selectedTypeCfg = CONTENT_TYPE_CONFIG[contentType] ?? CONTENT_TYPE_CONFIG['activity'];

  return (
    <>
      <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📣</span>
          <span style={{ fontWeight: 600 }}>一周活动播报</span>
          <Tag style={{ margin: 0, background: '#1890ff22', color: '#1890ff', border: 'none', fontSize: 11 }}>
            {weekLabel}
          </Tag>
          <Tag style={{ margin: 0, background: '#722ed122', color: '#9254de', border: 'none', fontSize: 11 }}>
            {weekIntelEvents.length} 条情报
          </Tag>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
      destroyOnClose
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ display: 'flex', minHeight: 480 }}>
        {/* ================================================ */}
        {/* 左侧：原始情报事件列表                       */}
        {/* ================================================ */}
        <div style={{
          flex: 1,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* 工具栏 */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {QUICK_FILTERS.map(f => (
                <Tag
                  key={f.key}
                  style={{
                    cursor: 'pointer', margin: 0,
                    background: quickFilter === f.key ? `${f.color}22` : 'transparent',
                    color: quickFilter === f.key ? f.color : '#6b7280',
                    border: `1px solid ${quickFilter === f.key ? f.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    fontSize: 12, padding: '2px 8px',
                  }}
                  onClick={() => setQuickFilter(f.key)}
                >
                  {f.icon} {f.label}
                </Tag>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button size="small" type="text" onClick={handleQuickSelect} style={{ fontSize: 11, padding: '0 4px' }}>
                全选当前
              </Button>
              <Button size="small" type="text" danger onClick={handleQuickDeselect} style={{ fontSize: 11, padding: '0 4px' }}>
                取消全选
              </Button>
            </div>
          </div>

          {/* 情报列表 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {allDates.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: '#6b7280', fontSize: 12 }}>本周暂无情报事件</span>}
                style={{ padding: '32px 0' }}
              />
            ) : (
              allDates.map(date => {
                const dayIntel = (intelByDate[date] ?? []).filter(e => {
                  if (quickFilter === 'all') return true;
                  return e.type === quickFilter;
                });
                if (dayIntel.length === 0) return null;

                const dayLabel = dayjs(date).format('MM/DD');
                const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayjs(date).day()];

                return (
                  <div key={date} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 12 }}>{dayLabel}</span>
                      <span style={{ color: '#6b7280', fontSize: 11 }}>{dayOfWeek}</span>
                      <span style={{ fontSize: 10, color: '#4b5563' }}>({dayIntel.length})</span>
                    </div>
                    {dayIntel.map(evt => {
                      const isSelected = selectedIntel.has(evt.id);
                      const tcfg = INTEL_TYPE_CONFIG[evt.type] ?? INTEL_TYPE_CONFIG['other'];
                      return (
                        <div
                          key={evt.id}
                          onClick={() => toggleIntel(evt.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 10px', marginBottom: 3,
                            borderRadius: 8, cursor: 'pointer',
                            background: isSelected ? `${tcfg.color}18` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isSelected ? tcfg.color + '50' : 'rgba(255,255,255,0.06)'}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          <Checkbox checked={isSelected} onChange={() => toggleIntel(evt.id)} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{evt.icon || '📌'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {evt.name}
                              </span>
                              <Tag style={{ margin: 0, fontSize: 10, padding: '0 4px', background: `${tcfg.color}22`, color: tcfg.color, border: 'none', flexShrink: 0 }}>
                                {tcfg.label}
                              </Tag>
                            </div>
                            {evt.venue && (
                              <div style={{ color: '#6b7280', fontSize: 11, marginTop: 1 }}>
                                📍 {evt.venue}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================ */}
        {/* 右侧：内容类型选择 + 生成区                 */}
        {/* ================================================ */}
        <div style={{
          width: 280,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* 内容类型选择 */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.01)',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
              选择内容类型
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(CONTENT_TYPE_CONFIG).map(([key, cfg]) => {
                const isActive = contentType === key;
                return (
                  <div
                    key={key}
                    onClick={() => setContentType(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8, cursor: 'pointer',
                      background: isActive ? `${cfg.color}20` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? cfg.color + '60' : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500 }}>{cfg.label}</div>
                      <div style={{ color: '#6b7280', fontSize: 10 }}>{cfg.pushTimeZh}</div>
                    </div>
                    {isActive && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: cfg.color, flexShrink: 0,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 已选情报摘要 */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            minHeight: 80,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>已选情报</span>
              <Tag style={{ margin: 0, fontSize: 10, background: '#1890ff22', color: '#1890ff', border: 'none', padding: '0 4px' }}>
                {selectedIntel.size} 条
              </Tag>
            </div>
            {selectedIntelList.length === 0 ? (
              <div style={{ color: '#4b5563', fontSize: 11 }}>
                点击左侧情报事件进行勾选
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                {selectedIntelList.map(evt => {
                  const tcfg = INTEL_TYPE_CONFIG[evt.type] ?? INTEL_TYPE_CONFIG['other'];
                  return (
                    <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12 }}>{evt.icon || '📌'}</span>
                      <span style={{ color: '#9ca3af', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {evt.name}
                      </span>
                      <Tag style={{ margin: 0, fontSize: 10, padding: '0 3px', background: `${tcfg.color}22`, color: tcfg.color, border: 'none' }}>
                        {tcfg.label}
                      </Tag>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 生成按钮 */}
          <div style={{ padding: '12px 16px', flexShrink: 0 }}>
            <Button
              type="primary"
              block
              icon={<BulbOutlined />}
              onClick={openGenerate}
              disabled={selectedIntel.size === 0}
              style={{
                background: selectedTypeCfg.color,
                borderColor: selectedTypeCfg.color,
                fontWeight: 600,
              }}
            >
              生成播报文案
            </Button>
            {selectedIntel.size === 0 && (
              <div style={{ textAlign: 'center', color: '#4b5563', fontSize: 11, marginTop: 6 }}>
                请先在左侧勾选情报事件
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>

      <BroadcastGenerateModal
        open={generateOpen}
        selectedIntel={weekIntelEvents.filter(e => selectedIntel.has(e.id))}
        contentType={contentType}
        onClose={() => setGenerateOpen(false)}
        onSave={(cards, ct) => {
          console.log('saved cards', cards, ct);
          setGenerateOpen(false);
        }}
      />
    </>
  );
};

export default WeeklyBroadcastModal;
