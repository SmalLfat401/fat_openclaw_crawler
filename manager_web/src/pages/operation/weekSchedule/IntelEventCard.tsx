import React, { useState } from 'react';
import { Tag, Space } from 'antd';
import type { IntelEvent } from './constants';
import { INTEL_TYPE_CONFIG, PUBLISH_TIME_CONFIG } from './constants';

interface IntelEventCardProps {
  evt: IntelEvent;
  onPublishTimeChange: (eventId: string, time: 'morning' | 'afternoon' | 'evening') => void;
}

const IntelEventCard = React.memo<IntelEventCardProps>(({ evt, onPublishTimeChange }) => {
  const tcfg = INTEL_TYPE_CONFIG[evt.type] ?? INTEL_TYPE_CONFIG['other'];
  const [selectedTime, setSelectedTime] = useState<'morning' | 'afternoon' | 'evening' | undefined>(
    evt.publish_time,
  );

  const handleSetTime = (time: 'morning' | 'afternoon' | 'evening') => {
    setSelectedTime(time);
    onPublishTimeChange(evt.id, time);
  };

  return (
    <div style={{
      background: `${tcfg.color}12`,
      border: `1px solid ${tcfg.color}28`,
      borderLeft: `3px solid ${tcfg.color}`,
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{evt.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
            {evt.name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', marginBottom: 6 }}>
            {evt.time && <span style={{ fontSize: 11, color: '#9ca3af' }}>{evt.time}</span>}
            {evt.venue && <span style={{ fontSize: 11, color: '#9ca3af' }}>· {evt.venue}</span>}
            <Tag style={{ fontSize: 10, padding: '0 4px', margin: 0, background: `${tcfg.color}25`, color: tcfg.color, border: 'none' }}>
              {tcfg.label}
            </Tag>
          </div>
          {evt.price !== undefined && (
            <div style={{ color: '#52c41a', fontSize: 12, marginBottom: 4 }}>
              {typeof evt.price === 'number' ? `¥${evt.price}` : evt.price}
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>发布时段</div>
            <Space size={4}>
              {(['morning', 'afternoon', 'evening'] as const).map(t => {
                const cfg = PUBLISH_TIME_CONFIG[t];
                const active = selectedTime === t;
                return (
                  <Tag
                    key={t}
                    style={{
                      cursor: 'pointer',
                      margin: 0,
                      background: active ? cfg.bg : 'rgba(255,255,255,0.04)',
                      color: active ? cfg.color : '#6b7280',
                      border: `1px solid ${active ? cfg.color + '60' : 'rgba(255,255,255,0.08)'}`,
                      fontSize: 11,
                      padding: '0 6px',
                    }}
                    onClick={() => handleSetTime(t)}
                  >
                    {cfg.label}
                  </Tag>
                );
              })}
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
});

export default IntelEventCard;
