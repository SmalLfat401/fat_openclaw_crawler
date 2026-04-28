import { useState, useEffect } from 'react';
import {
  Modal, Form, Input, Select, Space, Tag, Button,
  Card, message,
} from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import type { ScheduleItem, LinkedSlang } from './constants';
import {
  CHANNELS, CONTENT_TYPE_CONFIG,
  getWeekYear, genId, nowIso,
  SLANG_OPTIONS, SLANG_CATEGORY_LABELS, MOCK_SLANGS,
} from './constants';

// ============================================================
// BaseEditModal — 活动速递 & 新品情报共用
// ============================================================

interface BaseEditModalProps {
  open: boolean;
  item: ScheduleItem | null;
  date: string;
  contentType: string;
  onClose: () => void;
  onSave: (item: ScheduleItem) => void;
}

export const BaseEditModal: React.FC<BaseEditModalProps> = ({
  open, item, date, contentType, onClose, onSave,
}) => {
  const [title, setTitle] = useState(item?.title ?? '');
  const [body, setBody] = useState(item?.body ?? '');
  const [images, setImages] = useState<string[]>(item?.images ?? []);

  useEffect(() => {
    if (!open) return;
    if (item) { setTitle(item.title); setBody(item.body); setImages(item.images); }
    else { setTitle(''); setBody(''); setImages([]); }
  }, [open, item]);

  const cfg = CONTENT_TYPE_CONFIG[contentType] ?? CONTENT_TYPE_CONFIG['activity'];

  const handleSave = () => {
    const payload: ScheduleItem = {
      id: item?.id ?? genId(),
      week_year: getWeekYear(date),
      date,
      content_type: contentType,
      title, body, images,
      linked_slags: item?.linked_slags ?? [],
      is_pinned: item?.is_pinned ?? false,
      platforms: item?.platforms ?? {
        ch1: { status: 'pending', published_at: null, confirmed_at: null, note: '' },
        ch2: { status: 'pending', published_at: null, confirmed_at: null, note: '' },
      },
      created_at: item?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    onSave(payload);
    onClose();
  };

  return (
    <Modal
      title={<Space><span style={{ fontSize: 18 }}>{cfg.icon}</span><span>{cfg.label}</span><span style={{ color: '#9ca3af', fontSize: 13 }}>— {item ? '编辑' : '创建于 ' + date}</span></Space>}
      open={open} onOk={handleSave} onCancel={onClose}
      okText="保存" cancelText="取消" width={640} destroyOnClose
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="内容标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="输入标题…" maxLength={200} showCount />
        </Form.Item>
        <Form.Item label="正文内容">
          <Input.TextArea value={body} onChange={e => setBody(e.target.value)} placeholder="输入正文…" rows={5} maxLength={5000} showCount />
        </Form.Item>
        <Form.Item label="图片">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                <Button size="small" danger type="text"
                  style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, padding: 0 }}
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}>×</Button>
              </div>
            ))}
          </div>
          <Button size="small" onClick={() => {
            const url = prompt('输入图片URL：');
            if (url && url.startsWith('http')) setImages(prev => [...prev, url]);
          }}>+ 添加图片URL</Button>
        </Form.Item>
        <Form.Item label="发布平台">
          <Space wrap>
            {CHANNELS.map(ch => <Tag key={ch.id}>{ch.icon} {ch.name}</Tag>)}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ============================================================
// SlangEditModal — 黑话科普
// ============================================================

export const SlangEditModal: React.FC<Omit<BaseEditModalProps, 'contentType'>> = ({
  open, item, date, onClose, onSave,
}) => {
  const [title, setTitle] = useState(item?.title ?? '');
  const [body, setBody] = useState(item?.body ?? '');
  const [images, setImages] = useState<string[]>(item?.images ?? []);
  const [slangCategory, setSlangCategory] = useState<string>(item?.slang_category ?? '');
  const [linkedSlags, setLinkedSlags] = useState<LinkedSlang[]>(item?.linked_slags ?? []);
  const [slangSearch, setSlangSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    if (item) {
      setTitle(item.title); setBody(item.body); setImages(item.images);
      setSlangCategory(item.slang_category ?? ''); setLinkedSlags(item.linked_slags);
    } else {
      setTitle(''); setBody(''); setImages([]); setSlangCategory(''); setLinkedSlags([]);
    }
    setSlangSearch('');
  }, [open, item]);

  const slangResults = slangCategory && slangSearch
    ? (MOCK_SLANGS[slangCategory] ?? []).filter(
        s => s.slang_name.includes(slangSearch) || s.meaning.includes(slangSearch),
      )
    : [];

  const handleSave = () => {
    const payload: ScheduleItem = {
      id: item?.id ?? genId(),
      week_year: getWeekYear(date),
      date,
      content_type: 'slang_science',
      title, body, images,
      slang_category: slangCategory || undefined,
      linked_slags: linkedSlags,
      is_pinned: item?.is_pinned ?? false,
      platforms: item?.platforms ?? {
        ch1: { status: 'pending', published_at: null, confirmed_at: null, note: '' },
        ch2: { status: 'pending', published_at: null, confirmed_at: null, note: '' },
      },
      created_at: item?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    onSave(payload);
    onClose();
  };

  return (
    <Modal
      title={<Space><span style={{ fontSize: 18 }}>📖</span><span>黑话科普</span><span style={{ color: '#9ca3af', fontSize: 13 }}>— {item ? '编辑' : '创建于 ' + date}</span></Space>}
      open={open} onOk={handleSave} onCancel={onClose}
      okText="保存" cancelText="取消" width={640} destroyOnClose
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="内容标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="输入标题…" maxLength={200} showCount />
        </Form.Item>
        <Form.Item label="正文内容">
          <Input.TextArea value={body} onChange={e => setBody(e.target.value)} placeholder="输入正文…" rows={5} maxLength={5000} showCount />
        </Form.Item>
        <Form.Item label="术语分类">
          <Select placeholder="选择分类" value={slangCategory || undefined}
            onChange={v => { setSlangCategory(v); setSlangSearch(''); }}
            options={SLANG_OPTIONS} style={{ width: '100%' }} />
        </Form.Item>
        {slangCategory && (
          <Form.Item label="关联术语">
            {linkedSlags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {linkedSlags.map(s => (
                  <Tag key={s.slang_id} color="purple" closable
                    onClose={() => setLinkedSlags(prev => prev.filter(l => l.slang_id !== s.slang_id))}>
                    [{SLANG_CATEGORY_LABELS[s.slang_type] ?? s.slang_type}] {s.slang_name}
                  </Tag>
                ))}
              </div>
            )}
            <Input placeholder="搜索术语…" value={slangSearch} onChange={e => setSlangSearch(e.target.value)} />
            {slangResults.length > 0 && (
              <div style={{
                marginTop: 4, maxHeight: 160, overflowY: 'auto',
                background: '#1a2234', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: 4,
              }}>
                {slangResults.map(s => (
                  <div key={s.slang_id} style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => {
                      if (!linkedSlags.find(l => l.slang_id === s.slang_id)) {
                        setLinkedSlags(prev => [...prev, {
                          slang_id: s.slang_id,
                          slang_type: slangCategory,
                          slang_name: s.slang_name,
                        }]);
                      }
                      setSlangSearch('');
                    }}>
                    <div style={{ color: '#e5e7eb', fontSize: 13 }}>{s.slang_name}</div>
                    <div style={{ color: '#6b7280', fontSize: 11 }}>{s.meaning}</div>
                  </div>
                ))}
              </div>
            )}
          </Form.Item>
        )}
        <Form.Item label="图片">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                <Button size="small" danger type="text"
                  style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, padding: 0 }}
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}>×</Button>
              </div>
            ))}
          </div>
          <Button size="small" onClick={() => {
            const url = prompt('输入图片URL：');
            if (url && url.startsWith('http')) setImages(prev => [...prev, url]);
          }}>+ 添加图片URL</Button>
        </Form.Item>
        <Form.Item label="发布平台">
          <Space wrap>
            {CHANNELS.map(ch => <Tag key={ch.id}>{ch.icon} {ch.name}</Tag>)}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ============================================================
// MemeEditModal — 比价/互动/梗图
// ============================================================

export const MemeEditModal: React.FC<Omit<BaseEditModalProps, 'contentType'>> = ({
  open, item, date, onClose, onSave,
}) => {
  const [title, setTitle] = useState(item?.title ?? '');
  const [body, setBody] = useState(item?.body ?? '');
  const [images, setImages] = useState<string[]>(item?.images ?? []);

  useEffect(() => {
    if (!open) return;
    if (item) { setTitle(item.title); setBody(item.body); setImages(item.images); }
    else { setTitle(''); setBody(''); setImages([]); }
  }, [open, item]);

  const handleSave = () => {
    const payload: ScheduleItem = {
      id: item?.id ?? genId(),
      week_year: getWeekYear(date),
      date,
      content_type: 'meme_interaction',
      title, body, images,
      linked_slags: item?.linked_slags ?? [],
      is_pinned: item?.is_pinned ?? false,
      platforms: item?.platforms ?? {
        ch1: { status: 'pending', published_at: null, confirmed_at: null, note: '' },
        ch2: { status: 'pending', published_at: null, confirmed_at: null, note: '' },
      },
      created_at: item?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    onSave(payload);
    onClose();
  };

  return (
    <Modal
      title={<Space><span style={{ fontSize: 18 }}>🎨</span><span>比价/互动/梗图</span><span style={{ color: '#9ca3af', fontSize: 13 }}>— {item ? '编辑' : '创建于 ' + date}</span></Space>}
      open={open} onOk={handleSave} onCancel={onClose}
      okText="保存" cancelText="取消" width={640} destroyOnClose
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="内容标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="输入标题…" maxLength={200} showCount />
        </Form.Item>
        <Form.Item label="正文内容">
          <Input.TextArea value={body} onChange={e => setBody(e.target.value)} placeholder="输入正文或比价信息…" rows={5} maxLength={5000} showCount />
        </Form.Item>
        <Form.Item label="图片/素材">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                <Button size="small" danger type="text"
                  style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, padding: 0 }}
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}>×</Button>
              </div>
            ))}
          </div>
          <Button size="small" onClick={() => {
            const url = prompt('输入图片URL：');
            if (url && url.startsWith('http')) setImages(prev => [...prev, url]);
          }}>+ 添加图片URL</Button>
        </Form.Item>
        <Form.Item label="发布平台">
          <Space wrap>
            {CHANNELS.map(ch => <Tag key={ch.id}>{ch.icon} {ch.name}</Tag>)}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ============================================================
// CreateItemModal — 新建内容类型选择
// ============================================================

interface CreateItemModalProps {
  open: boolean;
  selectedDate: string;
  onClose: () => void;
  onCreate: (contentType: string) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  open, selectedDate, onClose, onCreate,
}) => {
  const [selectedType, setSelectedType] = useState('');

  const handleOk = () => {
    if (!selectedType) { message.warning('请选择内容类型'); return; }
    onCreate(selectedType);
    onClose();
    setSelectedType('');
  };

  return (
    <Modal
      title={<Space><CalendarOutlined /><span>选择内容类型</span><span style={{ color: '#9ca3af', fontSize: 13 }}>— {selectedDate}</span></Space>}
      open={open} onOk={handleOk} onCancel={onClose}
      okText="下一步" cancelText="取消" width={520}
      okButtonProps={{ disabled: !selectedType }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        {Object.entries(CONTENT_TYPE_CONFIG).map(([key, cfg]) => (
          <Card
            key={key} hoverable
            onClick={() => setSelectedType(key)}
            style={{
              border: selectedType === key ? `2px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.1)',
              background: selectedType === key ? `${cfg.color}22` : 'rgba(17,24,39,0.8)',
              borderRadius: 10, cursor: 'pointer',
            }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{cfg.icon}</span>
              <span style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{cfg.label}</span>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>推荐：{cfg.recommendedDay}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{cfg.pushTimeZh}</div>
          </Card>
        ))}
      </div>
    </Modal>
  );
};
