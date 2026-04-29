import React, { useState, useMemo } from 'react';
import {
  Modal, Tag, Checkbox, Button, Space, Spin, message,
  Empty, Typography,
} from 'antd';
import {
  LoadingOutlined, RocketOutlined, BulbOutlined,
  CopyOutlined, CheckOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ScheduleItem, IntelEvent, IntelEventType } from './constants';
import { INTEL_TYPE_CONFIG, CONTENT_TYPE_CONFIG } from './constants';

const { TextArea } = Typography;

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
  weekItems: ScheduleItem[];
  weekIntelEvents: IntelEvent[];
  viewMonday: string;
  viewSunday: string;
  onClose: () => void;
}

// ============================================================
// AI 生成请求
// ============================================================
async function callAIWriteBroadcast(
  selectedIntel: Array<{ name: string; date: string; type: string; venue?: string; icon?: string }>,
  contentType: string,
): Promise<string> {
  await new Promise(r => setTimeout(r, 1500));
  if (selectedIntel.length === 0) {
    return '请先在左侧勾选要播报的情报事件';
  }
  const typeLabel = CONTENT_TYPE_CONFIG[contentType]?.label ?? contentType;
  const lines: string[] = [
    `📣 本周${typeLabel}播报（${dayjs().format('YYYY年M月D日')}）`,
    '',
    '【本周情报速览】',
    ...selectedIntel.map(e => {
      const tcfg = INTEL_TYPE_CONFIG[e.type as IntelEventType] ?? INTEL_TYPE_CONFIG['other'];
      return `· ${e.date} | ${tcfg.label} | ${e.name}${e.venue ? ` @ ${e.venue}` : ''}`;
    }),
    '',
    '以上内容由 AI 整理生成，供运营参考发布。',
  ];
  return lines.join('\n');
}

// ============================================================
// 主组件
// ============================================================
const WeeklyBroadcastModal: React.FC<WeeklyBroadcastModalProps> = ({
  open, weekItems, weekIntelEvents, viewMonday, viewSunday, onClose,
}) => {
  // ---- 内容状态 ----
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [selectedIntel, setSelectedIntel] = useState<Set<string>>(new Set());
  const [contentType, setContentType] = useState<string>('activity');

  // ---- AI 状态 ----
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

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

  // ---- AI 生成 ----
  const handleGenerate = async () => {
    if (selectedIntel.size === 0) {
      message.warning('请先在左侧勾选情报事件');
      return;
    }
    setGenerating(true);
    setGeneratedText('');
    try {
      const intel = weekIntelEvents.filter(e => selectedIntel.has(e.id));
      const text = await callAIWriteBroadcast(
        intel.map(e => ({ name: e.name, date: e.date, type: e.type, venue: e.venue, icon: e.icon })),
        contentType,
      );
      setGeneratedText(text);
    } catch {
      message.error('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ---- 关闭时重置 ----
  const handleClose = () => {
    setSelectedIntel(new Set());
    setGeneratedText('');
    setCopied(false);
    setGenerating(false);
    setQuickFilter('all');
    setContentType('activity');
    onClose();
  };

  const weekLabel = `${dayjs(viewMonday).format('M月D日')} - ${dayjs(viewSunday).format('M月D日')}`;
  const selectedIntelList = weekIntelEvents.filter(e => selectedIntel.has(e.id));
  const selectedTypeCfg = CONTENT_TYPE_CONFIG[contentType] ?? CONTENT_TYPE_CONFIG['activity'];

  return (
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
              onClick={handleGenerate}
              loading={generating}
              style={{
                background: selectedTypeCfg.color,
                borderColor: selectedTypeCfg.color,
                fontWeight: 600,
              }}
            >
              {generating ? 'AI 整理中…' : '生成播报文案'}
            </Button>
          </div>

          {/* AI 结果 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
            {generating && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280', fontSize: 12 }}>
                <Spin indicator={<LoadingOutlined spin style={{ color: '#1890ff', fontSize: 20 }} />} />
                <div style={{ marginTop: 8 }}>AI 正在整理内容…</div>
              </div>
            )}

            {generatedText && !generating && (
              <div style={{
                background: 'rgba(24,144,255,0.08)',
                border: '1px solid rgba(24,144,255,0.2)',
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#1890ff', fontWeight: 600 }}>✨ AI 播报文案</span>
                  <Button
                    size="small"
                    type="text"
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={handleCopy}
                    style={{ fontSize: 11, color: copied ? '#52c41a' : '#9ca3af', padding: '0 4px' }}
                  >
                    {copied ? '已复制' : '复制'}
                  </Button>
                </div>
                <pre style={{
                  margin: 0, fontSize: 12, color: '#e5e7eb', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  fontFamily: 'inherit',
                }}>
                  {generatedText}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WeeklyBroadcastModal;
