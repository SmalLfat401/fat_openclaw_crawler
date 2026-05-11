import React, { useState, useEffect } from 'react';
import { Drawer, Tag, Space, Divider, Image, Button, Spin } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import type { IntelEvent } from './constants';
import { INTEL_TYPE_CONFIG } from './constants';
import { fetchIntelEventDetail, type IntelEventDetail } from '../../../api/intelEvent';

interface IntelDetailDrawerProps {
  /** 情报事件（来自列表数据） */
  evt: (IntelEvent | null);
  /** 完整事件数据（来自 H5 API 统一格式） */
  open: boolean;
  onClose: () => void;
  onPublishTimeChange: (eventId: string, time: 'morning' | 'afternoon' | 'evening') => void;
}

// 保留颜色配置（情报详情页专用）
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  convention:      { bg: '#EEEDFE', text: '#534AB7' },
  book_signing:    { bg: '#FBEAF0', text: '#D4537E' },
  pre_order:       { bg: '#FFF3E0', text: '#E65100' },
  product_launch:  { bg: '#E8F5E9', text: '#2E7D32' },
  offline_activity:{ bg: '#E3F2FD', text: '#1565C0' },
  online_activity: { bg: '#F3E5F5', text: '#6A1B9A' },
  other:           { bg: '#F5F5F5', text: '#616161' },
};

const IntelDetailDrawer: React.FC<IntelDetailDrawerProps> = ({
  evt, open, onClose, onPublishTimeChange,
}) => {
  const [detail, setDetail] = useState<IntelEventDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // 重置抽屉状态
  useEffect(() => {
    if (!open || !evt) {
      setDetail(null);
      setLoading(false);
      return;
    }
    const intelId = (evt as any).id?.replace(/^intel_/, '') ?? (evt as any).id ?? '';
    if (!intelId) return;
    setLoading(true);
    fetchIntelEventDetail(intelId)
      .then(data => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, (evt as any)?.id]);

  // 从详情 API 数据中取字段，evt 做兜底
  const displayData: any = detail ?? evt;
  const tcfg = INTEL_TYPE_CONFIG[(displayData?.type ?? 'other') as keyof typeof INTEL_TYPE_CONFIG]
    ?? INTEL_TYPE_CONFIG['other'];
  const colors = TYPE_COLORS[displayData?.type ?? 'other'] ?? TYPE_COLORS['other'];

  const dateLabel = displayData?.date
    ? (displayData.end_date && displayData.end_date !== displayData.date
        ? `${displayData.date} ~ ${displayData.end_date}`
        : displayData.date)
    : (evt?.date ?? '');

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{displayData?.icon ?? evt?.icon ?? '📌'}</span>
          <span style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 600 }}>{displayData?.name ?? evt?.name}</span>
        </div>
      }
      placement="right"
      width={440}
      onClose={onClose}
      open={open}
      styles={{
        header: { background: 'rgba(17, 24, 39, 0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
        body: { background: '#111827', padding: '16px 20px' },
      }}
    >
      <Spin spinning={loading} tip="加载情报详情...">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 标签 + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Tag style={{
              background: `${tcfg.color}20`,
              color: tcfg.color,
              border: `1px solid ${tcfg.color}50`,
              fontSize: 12,
            }}>
              {tcfg.label}
            </Tag>
            {displayData?.badge && (
              <Tag style={{
                background: colors.bg,
                color: colors.text,
                border: 'none',
                fontSize: 12,
              }}>
                {displayData.icon} {displayData.badge}
              </Tag>
            )}
          </div>

          {/* 封面图 */}
          {(displayData?.cover || evt?.cover) && (
            <Image
              src={displayData?.cover || evt?.cover}
              alt={displayData?.name ?? evt?.name}
              style={{ borderRadius: 10, width: '100%', maxHeight: 200, objectFit: 'cover' }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
          )}

          {/* 核心信息卡片 */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            {dateLabel && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>📅 日期</span>
                <span style={{ fontSize: 12, color: '#e5e7eb', fontWeight: 500 }}>{dateLabel}</span>
              </div>
            )}
            {displayData?.time && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>⏰ 时间</span>
                <span style={{ fontSize: 12, color: '#e5e7eb' }}>{displayData.time}</span>
              </div>
            )}
            {displayData?.venue && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>📍 地点</span>
                <span style={{ fontSize: 12, color: '#e5e7eb', maxWidth: 220, textAlign: 'right' }}>
                  {displayData.city ? `${displayData.city} · ${displayData.venue}` : displayData.venue}
                </span>
              </div>
            )}
            {(displayData?.price || evt?.price) && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
              }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>💰 价格</span>
                <span style={{ fontSize: 13, color: '#52c41a', fontWeight: 600 }}>
                  ¥{typeof (displayData?.price ?? evt?.price) === 'number'
                    ? displayData?.price
                    : displayData?.price ?? evt?.price}
                </span>
              </div>
            )}
          </div>

          {/* 活动介绍 */}
          {displayData?.description && (
            <div>
              <div style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 600, marginBottom: 8 }}>活动介绍</div>
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13,
                color: '#9ca3af',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}>
                {displayData.description}
              </div>
            </div>
          )}

          {/* 嘉宾阵容 */}
          {displayData?.participants && displayData.participants.length > 0 && (
            <div>
              <div style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 600, marginBottom: 8 }}>嘉宾阵容</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {displayData.participants.map((p: string, i: number) => (
                  <Tag key={i} style={{ background: '#FBEAF0', color: '#D4537E', border: 'none', fontSize: 12 }}>
                    {p}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* 相关IP */}
          {displayData?.related_ips && displayData.related_ips.length > 0 && (
            <div>
              <div style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 600, marginBottom: 8 }}>相关IP</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {displayData.related_ips.map((ip: string, i: number) => (
                  <Tag key={i} style={{ background: '#EEEDFE', color: '#534AB7', border: 'none', fontSize: 12 }}>
                    {ip}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* 标签 */}
          {displayData?.tags && displayData.tags.length > 0 && (
            <div>
              <div style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 600, marginBottom: 8 }}>标签</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {displayData.tags.map((tag: string, i: number) => (
                  <Tag key={i} style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}>
                    #{tag}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* 情报来源 */}
          {detail && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12,
              color: '#6b7280',
            }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: '#9ca3af' }}>情报来源</span>
                {detail.author_nickname && (
                  <span style={{ color: '#818cf8', marginLeft: 6 }}>@{detail.author_nickname}</span>
                )}
              </div>
              {detail.created_at && (
                <div>{formatDate(detail.created_at)}</div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          {(displayData?.purchase_url || displayData?.source_post_url) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {displayData?.purchase_url && (
                <Button
                  type="primary"
                  block
                  icon={<LinkOutlined />}
                  href={displayData.purchase_url}
                  target="_blank"
                  style={{ borderRadius: 8, height: 38, fontWeight: 600 }}
                >
                  前往购买 / 预约
                </Button>
              )}
              {displayData?.source_post_url && (
                <Button
                  block
                  icon={<LinkOutlined />}
                  href={displayData.source_post_url}
                  target="_blank"
                  style={{
                    borderRadius: 8,
                    height: 38,
                    borderColor: '#818cf8',
                    color: '#818cf8',
                    fontWeight: 600,
                  }}
                >
                  查看原文微博
                </Button>
              )}
            </div>
          )}

        </div>
      </Spin>
    </Drawer>
  );
};

export default IntelDetailDrawer;
