import React from 'react';
import type { IntelEventType } from './constants';
import { INTEL_TYPE_CONFIG } from './constants';

interface CalendarCellProps {
  dateStr: string;
  dayLabel: number;
  isToday: boolean;
  isSelected: boolean;
  scheduleItems: any[]; // kept for API compatibility, always empty now
  intelTypes: IntelEventType[];
  onSelectDate: (date: string) => void;
  onCreate: (date: string) => void;
}

const CalendarCell = React.memo<CalendarCellProps>(({
  dateStr, dayLabel, isToday, isSelected,
  intelTypes, onSelectDate,
}) => {
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
            <span key={t} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: INTEL_TYPE_CONFIG[t].dot,
              display: 'inline-block',
            }} />
          ))}
        </div>
      )}
    </div>
  );
});

export default CalendarCell;
