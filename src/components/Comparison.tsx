import { useMemo, useState } from 'react';
import type { CropVariant, GuideKey, ImageAsset } from '../model';
import { GuideOverlay } from './GuideOverlay';

interface ComparisonProps {
  image: ImageAsset;
  current: CropVariant;
  variants: CropVariant[];
  guides: Record<GuideKey, boolean>;
}

interface CompareItem {
  key: string;
  label: string;
  ratio: string;
  x: number;
  y: number;
  width: number;
  height: number;
  saved: boolean;
}

const MAX_SELECTED = 2;

const guideLabels: Array<[GuideKey, string]> = [
  ['thirds', '三分网格'],
  ['center', '中心线'],
  ['diagonal', '对角线'],
  ['golden', '黄金区域'],
];

const ratioLabel = (ratio: string): string => (ratio === 'free' ? '自由裁切' : ratio);

// 把某个裁切窗口精确地铺满容器：容器比例 = 裁切区域比例，
// 图片按裁切区域的位移与缩放做绝对定位，辅助线因此能对齐到同一组参考线。
function cropStyle(item: CompareItem, image: ImageAsset): { aspectRatio: string; img: React.CSSProperties } {
  const { x, y, width, height } = item;
  return {
    aspectRatio: `${width * image.width} / ${height * image.height}`,
    img: {
      position: 'absolute',
      width: `${(1 / width) * 100}%`,
      height: `${(1 / height) * 100}%`,
      left: `${(-x / width) * 100}%`,
      top: `${(-y / height) * 100}%`,
    },
  };
}

export function Comparison({ image, current, variants, guides }: ComparisonProps) {
  const items = useMemo<CompareItem[]>(() => {
    const draft: CompareItem = {
      key: 'draft',
      label: '当前编辑中',
      ratio: current.ratio,
      x: current.x,
      y: current.y,
      width: current.width,
      height: current.height,
      saved: false,
    };
    const saved: CompareItem[] = variants.map((variant, index) => ({
      key: variant.id,
      label: `方案 ${String(index + 1).padStart(2, '0')}`,
      ratio: variant.ratio,
      x: variant.x,
      y: variant.y,
      width: variant.width,
      height: variant.height,
      saved: true,
    }));
    return [draft, ...saved];
  }, [current, variants]);

  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState(false);
  // 对比里的辅助线只是预览：初始跟随工作台当前这一组，但在对比内的开关
  // 不会持久化，返回工作台时辅助层与离开前完全一致。
  const [previewGuides, setPreviewGuides] = useState<Record<GuideKey, boolean>>(() => ({ ...guides }));
  const [showGuides, setShowGuides] = useState(() => Object.values(guides).some(Boolean));

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((item) => item !== key);
      return [...prev, key].slice(-MAX_SELECTED);
    });
  };

  const openDetail = (keys: string[]) => {
    const next = keys.slice(0, MAX_SELECTED);
    if (next.length === 0) return;
    setSelected(next);
    setDetail(true);
  };

  const selectedItems = selected
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is CompareItem => Boolean(item));

  if (detail) {
    const single = selectedItems.length === 1;
    return (
      <div className="comparison comparison-detail">
        <div className="compare-intro">
          <p className="eyebrow">SIDE BY SIDE / {selectedItems.length} FRAME{single ? '' : 'S'}</p>
          <h2>{single ? '单张预览' : '并排细看'}</h2>
          <p>同一组参考线叠加在不同裁切上，确认构图取舍是否成立。</p>
        </div>

        <div className="compare-detail-bar">
          <button className="quiet-button" onClick={() => setDetail(false)}>← 返回总览</button>
          <div className="compare-guide-control">
            <button className={`guide-eye ${showGuides ? 'active' : ''}`} onClick={() => setShowGuides((value) => !value)} aria-pressed={showGuides}>
              辅助线预览 {showGuides ? '开' : '关'}
            </button>
            {showGuides && (
              <div className="guide-row">
                {guideLabels.map(([key, label]) => (
                  <button
                    key={key}
                    className={previewGuides[key] ? 'active' : ''}
                    onClick={() => setPreviewGuides((prev) => ({ ...prev, [key]: !prev[key] }))}
                    aria-pressed={previewGuides[key]}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <span className="compare-guide-hint">仅在对比中预览，不会改动工作台</span>
          </div>
        </div>

        <div className={`compare-panels ${single ? 'is-single' : 'is-double'}`}>
          {selectedItems.map((item) => {
            const geometry = cropStyle(item, image);
            return (
              <article key={item.key} className="compare-panel">
                <div className="compare-panel-stage" style={{ aspectRatio: geometry.aspectRatio }}>
                  <img src={image.src} alt={item.label} style={geometry.img} draggable={false} />
                  {showGuides && <GuideOverlay guides={previewGuides} />}
                  <span className="compare-panel-label">{item.label}</span>
                  {!item.saved && <em className="draft-badge">未保存草稿</em>}
                </div>
                <div className="compare-panel-meta">
                  <strong>{item.label}{!item.saved && <em className="draft-tag">草稿</em>}</strong>
                  <small>{ratioLabel(item.ratio)} · {Math.round(item.width * 100)}% × {Math.round(item.height * 100)}%</small>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="comparison">
      <div className="compare-intro">
        <p className="eyebrow">SIDE BY SIDE / {items.length} FRAMES</p>
        <h2>把取舍放在一起看</h2>
        <p>当前编辑中的草稿也在这里，和保存的方案并排比较，无需先存一次。</p>
      </div>

      <div className="compare-select-bar">
        <span className="compare-select-count">已选 {selected.length}/{MAX_SELECTED}</span>
        <button className="quiet-button" disabled={selected.length === 0} onClick={() => openDetail(selected.slice(0, 1))}>预览单张</button>
        <button className="primary-button" disabled={selected.length !== MAX_SELECTED} onClick={() => openDetail(selected)}>并排细看</button>
      </div>

      <div className="comparison-grid">
        {items.map((item) => {
          const isSelected = selected.includes(item.key);
          return (
            <article key={item.key} className={isSelected ? 'selected' : ''} onClick={() => toggleSelect(item.key)}>
              <div className="compare-image">
                <img src={image.src} alt={item.label} style={{ objectPosition: `${item.x * 100}% ${item.y * 100}%` }} />
                <span>{item.label}</span>
                {!item.saved && <em className="draft-badge">未保存草稿</em>}
                <input
                  type="checkbox"
                  className="compare-check"
                  checked={isSelected}
                  readOnly
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => toggleSelect(item.key)}
                />
                <button
                  type="button"
                  className="compare-zoom"
                  onClick={(event) => { event.stopPropagation(); openDetail([item.key]); }}
                >
                  预览
                </button>
              </div>
              <div>
                <strong>{ratioLabel(item.ratio)}</strong>
                <small>{Math.round(item.width * 100)}% × {Math.round(item.height * 100)}%</small>
              </div>
            </article>
          );
        })}
      </div>

      {variants.length === 0 && (
        <div className="compare-empty">
          <span>◇</span>
          <p>还没有保存的方案</p>
          <small>点一下「当前编辑中」草稿或卡片上的「预览」即可放大查看；保存方案后，还能任选两张并排细看。</small>
        </div>
      )}
    </div>
  );
}
