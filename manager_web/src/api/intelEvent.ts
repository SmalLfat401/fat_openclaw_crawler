import { apiClient } from './config';

/** H5 情报详情（与 h5/src/types/index.ts 中 IntelEventDetail 保持一致） */
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
