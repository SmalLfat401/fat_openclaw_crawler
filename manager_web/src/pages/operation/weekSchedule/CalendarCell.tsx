import React from 'react';
import { Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ScheduleItem, IntelEventType } from './constants';
import {
  INTEL_TYPE_CONFIG, CONTENT_TYPE_CONFIG, globalStatus, PUBLISH_STATUS_LABELS,
} from './constants';

interface CalendarCellProps {
  dateStr: string;
  dayLabel: number;
  isToday: boolean;
  isSelected: boolean;
  scheduleItems: ScheduleItem[];
  intelTypes: IntelEventType[];
  onSelectDate: (date: string) => void;
  onCreate: (date: string) => void;
}

const CalendarCell = React.memo<CalendarCellProps>(({
  dateStr, dayLabel, isToday, isSelected,
  scheduleItems, intelTypes, onSelectDate, onCreate,
}) => {
  const hasSchedule = scheduleItems.length > 0;
  const hasIntel = intelTypes.length > 0;
  const hasContent = hasSchedule || hasIntel;

  return (
    <div
      onClick={() => onSelectDate(dateStr)}
      style={{
        minHeight: 100,
        borderRight: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '6px 8px',
        cursor: 'pointer',
        background: isSelected
          ? 'rgba(212, 83, 126, 0.15)'
          : isToday
          ? 'rgba(0, 240, 255, 0.05)'
          : 'transparent',
        opacity: 1,
        transition: 'background 0.15s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <div style={{
        fontSize: 14,
        fontWeight: isToday ? 700 : 400,
        color: isToday ? '#00f0ff' : isSelected ? '#D4537E' : '#e5e7eb',
        lineHeight: 1,
        marginBottom: 2,
      }}>
        {dayLabel}
      </div>

      {intelTypes.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {intelTypes.map(t => (
            <Tooltip key={t} title={`情报：${INTEL_TYPE_CONFIG[t].label}`}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: INTEL_TYPE_CONFIG[t].dot,
                display: 'inline-block',
              }} />
            </Tooltip>
          ))}
        </div>
      )}

      {scheduleItems.map(item => {
        const cfg = CONTENT_TYPE_CONFIG[item.content_type] ?? CONTENT_TYPE_CONFIG['activity'];
        const gs = globalStatus(item);
        return (
          <Tooltip key={item.id} title={`${cfg.icon} ${item.title || '(无标题)'} · ${PUBLISH_STATUS_LABELS[gs]}`}>
            <div style={{
              background: `${cfg.color}22`,
              border: `1px solid ${cfg.color}44`,
              borderLeft: `2px solid ${cfg.color}`,
              borderRadius: 4,
              padding: '1px 5px',
              fontSize: 11,
              color: '#e5e7eb',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
              <span style={{ fontSize: 9 }}>{cfg.icon}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.title || '(无标题)'}
              </span>
              {item.is_pinned && <span style={{ color: '#00f0ff', fontSize: 9 }}>📌</span>}
            </div>
          </Tooltip>
        );
      })}

      {!hasContent && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
          <Button type="text" size="small" icon={<PlusOutlined />}
            style={{ color: '#374151', fontSize: 12, padding: 0, height: 20 }}
            onClick={(e) => { e.stopPropagation(); onCreate(dateStr); }} />
        </div>
      )}
    </div>
  );
});

export default CalendarCell;
