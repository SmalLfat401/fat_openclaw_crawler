// ============================================================
// 情报事件类型（与 H5 保持一致）
// ============================================================

export type IntelEventType =
  | 'convention' | 'book_signing' | 'pre_order'
  | 'product_launch' | 'offline_activity' | 'online_activity' | 'other';

export interface IntelEvent {
  id: string;
  date: string;
  end_date?: string;
  time?: string;
  type: IntelEventType;
  icon: string;
  name: string;
  venue?: string;
  city?: string;
  badge: string;
  cover?: string;
  price?: string | number;
  publish_time?: 'morning' | 'afternoon' | 'evening';
}

export const INTEL_TYPE_CONFIG: Record<IntelEventType, { label: string; color: string; dot: string }> = {
  convention:       { label: '漫展',      color: '#534AB7', dot: '#7F77DD' },
  book_signing:     { label: '签售',      color: '#D4537E', dot: '#ED93B1' },
  pre_order:        { label: '预售',      color: '#E65100', dot: '#FF9800' },
  product_launch:   { label: '新谷开团',  color: '#2E7D32', dot: '#66BB6A' },
  offline_activity:  { label: '线下活动',  color: '#1565C0', dot: '#42A5F5' },
  online_activity:  { label: '线上活动',  color: '#6A1B9A', dot: '#AB47BC' },
  other:            { label: '其他',      color: '#616161', dot: '#9E9E9E' },
};

export const PUBLISH_TIME_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  morning:   { label: '上午',  color: '#faad14', bg: '#faad1420' },
  afternoon: { label: '下午',  color: '#1890ff', bg: '#1890ff20' },
  evening:   { label: '晚间',  color: '#722ed1', bg: '#722ed120' },
};
