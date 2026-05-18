import { apiClient } from './config';

export interface IntelEventDetail {
  id: string;
  uuid: string;
  date: string;
  end_date?: string;
  time?: string;
  type: string;
  icon: string;
  name: string;
  description?: string;
  venue?: string;
  city?: string;
  badge: string;
  cover?: string;
  price?: string;
  purchase_url?: string;
  participants: string[];
  related_ips: string[];
  tags: string[];
  source_post_url?: string;
  author_nickname?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export type IntelCategory = 'convention' | 'book_signing' | 'pre_order' | 'product_launch' | 'offline_activity' | 'online_activity' | 'other';

export const INTEL_CATEGORIES: { value: IntelCategory; label: string }[] = [
  { value: 'convention',      label: '漫展' },
  { value: 'book_signing',    label: '签售' },
  { value: 'pre_order',       label: '预售' },
  { value: 'product_launch',  label: '新谷开团' },
  { value: 'offline_activity', label: '线下活动' },
  { value: 'online_activity', label: '线上活动' },
  { value: 'other',          label: '其他' },
];

/**
 * 获取情报详情（供 manager_web 运营后台情报详情抽屉使用）
 * 接口: GET /api/v1/h5/intel/events/{intelId}
 */
export async function fetchIntelEventDetail(intelId: string): Promise<IntelEventDetail | null> {
  try {
    const response = await apiClient.get<IntelEventDetail>(`/h5/intel/events/${intelId}`);
    return response.data;
  } catch (error) {
    console.error('获取情报详情失败:', error);
    return null;
  }
}

/**
 * 更新情报类别（重新标记）
 * 接口: PUT /api/v1/weibo-intel/{intelId}
 */
export async function updateIntelCategory(
  intelId: string,
  category: IntelCategory
): Promise<void> {
  // 去掉 intel_ 前缀（前端 id 格式为 intel_xxx）
  const rawId = intelId.replace(/^intel_/, '');
  await apiClient.put(`/weibo-intel/${rawId}`, { category });
}
