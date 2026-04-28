import dayjs from 'dayjs';

// ============================================================
// 情报事件类型（与 H5 保持一致）
// ============================================================

export type IntelEventType =
  | 'convention' | 'book_signing' | 'pre_order'
  | 'product_launch' | 'offline_activity' | 'online_activity' | 'other';

export interface IntelEvent {
  id: string;
  date: string;
  time?: string;
  type: IntelEventType;
  icon: string;
  name: string;
  venue?: string;
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

export const CONTENT_TYPE_CONFIG: Record<string, {
  label: string; icon: string; color: string;
  pushTimeZh: string; recommendedDay: string;
}> = {
  activity: {
    label: '活动速递', icon: '📣', color: '#1890ff',
    pushTimeZh: '抖音 10:00 / 小红书 10:00', recommendedDay: '周一',
  },
  new_product: {
    label: '新品情报', icon: '🆕', color: '#52c41a',
    pushTimeZh: '抖音 11:00 / 小红书 11:00', recommendedDay: '周三',
  },
  slang_science: {
    label: '黑话科普', icon: '📖', color: '#722ed1',
    pushTimeZh: '抖音 16:00 / 小红书 18:00', recommendedDay: '周五',
  },
  meme_interaction: {
    label: '比价/互动/梗图', icon: '🎨', color: '#fa8c16',
    pushTimeZh: '抖音 17:00 / 小红书 19:00', recommendedDay: '周日',
  },
};

export const PUBLISH_STATUS_LABELS: Record<string, string> = {
  pending: '待审核', confirmed: '已确认', published: '已发布',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'default', confirmed: 'warning', published: 'success',
};

export const CHANNELS = [
  { id: 'ch1', name: '抖音', icon: '🎵' },
  { id: 'ch2', name: '小红书', icon: '📕' },
];

export const SLANG_OPTIONS = [
  { label: '谷子', value: 'guzi' },
  { label: 'Coser', value: 'coser' },
  { label: '漫展', value: 'convention' },
  { label: '游戏', value: 'game' },
];

export const SLANG_CATEGORY_LABELS: Record<string, string> = {
  guzi: '谷子', coser: 'Coser', convention: '漫展', game: '游戏',
};

export const MOCK_SLANGS: Record<string, { slang_id: string; slang_name: string; meaning: string }[]> = {
  guzi: [
    { slang_id: 'g1', slang_name: '吧唧', meaning: '徽章周边，日文 badge 音译' },
    { slang_id: 'g2', slang_name: '立牌', meaning: '亚克力立式看板' },
    { slang_id: 'g3', slang_name: '棉花娃娃', meaning: '软绵绵的 Q 版人形娃娃' },
    { slang_id: 'g4', slang_name: '流麻', meaning: '流沙麻将牌，扁平方形，内有流沙' },
  ],
  coser: [
    { slang_id: 'c1', slang_name: 'cos', meaning: '角色扮演（costume play）' },
    { slang_id: 'c2', slang_name: '返图', meaning: '活动结束后摄影/官方发布现场照片' },
  ],
  convention: [
    { slang_id: 'cv1', slang_name: '逛展', meaning: '参观漫展' },
    { slang_id: 'cv2', slang_name: '摊位', meaning: '展会现场的售卖/展示位' },
  ],
  game: [
    { slang_id: 'gm1', slang_name: '二游', meaning: '二次元游戏的简称' },
    { slang_id: 'gm2', slang_name: '官谷', meaning: '官方周边商品' },
  ],
};

export const PUBLISH_TIME_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  morning:   { label: '上午',  color: '#faad14', bg: '#faad1420' },
  afternoon: { label: '下午',  color: '#1890ff', bg: '#1890ff20' },
  evening:   { label: '晚间',  color: '#722ed1', bg: '#722ed120' },
};

// ============================================================
// 类型
// ============================================================

export interface LinkedSlang {
  slang_id: string; slang_type: string; slang_name: string;
}

export interface PlatformStatus {
  status: string; published_at: string | null; confirmed_at: string | null; note: string;
}

export interface ScheduleItem {
  id: string; week_year: string; date: string; content_type: string;
  title: string; body: string; images: string[];
  slang_category?: string; linked_slags: LinkedSlang[];
  is_pinned: boolean; platforms: Record<string, PlatformStatus>;
  created_at: string; updated_at: string;
}

// ============================================================
// 工具函数
// ============================================================

export function genId(): string {
  return 'local_' + Math.random().toString(36).slice(2, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function getWeekYear(date: string): string {
  const d = dayjs(date + 'T00:00:00');
  const year = d.year();
  const jan1 = dayjs(`${year}-01-01T00:00:00`);
  const dayOfJan1 = jan1.day();
  const daysToFirstMonday = dayOfJan1 <= 1 ? 1 - dayOfJan1 : 8 - dayOfJan1;
  const firstMonday = jan1.add(daysToFirstMonday, 'day');
  let week: number;
  if (d.isSame(firstMonday) || d.isBefore(firstMonday)) {
    const prevYear = year - 1;
    const prevJan1 = dayjs(`${prevYear}-01-01T00:00:00`);
    const prevDay = prevJan1.day();
    const prevDays = prevDay <= 1 ? 1 - prevDay : 8 - prevDay;
    const prevMonday = prevJan1.add(prevDays, 'day');
    week = Math.floor(d.diff(prevMonday, 'day') / 7) + 1;
    return `${prevYear}-W${String(week).padStart(2, '0')}`;
  }
  week = Math.floor(d.diff(firstMonday, 'day') / 7) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function globalStatus(item: ScheduleItem): string {
  const statuses = Object.values(item.platforms).map(p => p.status);
  if (statuses.includes('published')) return 'published';
  if (statuses.includes('confirmed')) return 'confirmed';
  return 'pending';
}

export function nextStatusFn(current: string): string | null {
  if (current === 'pending') return 'confirmed';
  if (current === 'confirmed') return 'published';
  return null;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  return dayjs(iso).format('MM/DD HH:mm');
}
