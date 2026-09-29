import { useMemo, useState, type CSSProperties } from 'react';
import { buildCompareFrames, subjectInCrop, type CompareFrame } from '../domain';
import type { CropVariant, GuideKey, ImageAsset } from '../model';

interface ComparisonProps {
  image: ImageAsset;
  current: CropVariant;
  variants: CropVariant[];
  guides: Record<GuideKey, boolean>;
  subject: { x: number; y: number } | null;
}

const previewGuideLabels: Array<[GuideKey, string]> = [
  ['thirds', '三分'],
  ['center', '中心'],
  ['diagonal', '对角'],
  ['golden', '黄金'],
];

export function Comparison({ image, current, variants, guides, subject }: ComparisonProps) {
  const frames = useMemo(() => buildCompareFrames(current, variants), [current, variants]);
  // 选择状态与辅助线预览都只活在这个组件里，卸载即还原，不会写回工作台。
  const [selectedIds, setSelectedIds] = useState<string[]>(() => frames.slice(0, 2).map((frame) => frame.id));
  const [previewGuides, setPreviewGuides] = useState<Record<GuideKey, boolean>>({ ...guides });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(-2)));
  };

  const togglePreviewGuide = (guide: GuideKey) => {
    setPreviewGuides((prev) => ({ ...prev, [guide]: !prev[guide] }));
  };

  const selectedFrames = selectedIds
    .map((id) => frames.find((frame) => frame.id === id))
    .filter((frame): frame is CompareFrame => Boolean(frame));

  return (
    <div className="comparison">
      <div className="compare-intro">
        <p className="eyebrow">SIDE BY SIDE / {frames.length} FRAMES</p>
        <h2>把取舍放在一起看</h2>
        <p>当前编辑稿已加入对比，点选任意两张卡片并排细看；这里的辅助线开关只作用于预览，不会改动工作台。</p>
      </div>

      <div className="compare-guides-bar">
        <span className="compare-guides-label">辅助线预览</span>
        {previewGuideLabels.map(([key, label]) => (
          <button key={key} type="button" className={`guide-chip ${previewGuides[key] ? 'active' : ''}`} aria-pressed={previewGuides[key]} onClick={() => togglePreviewGuide(key)}>{label}</button>
        ))}
        <button type="button" className="guide-chip reset" onClick={() => setPreviewGuides({ ...guides })}>↺ 同步工作台</button>
        <span className="compare-guides-note">仅作用于对比视图</span>
      </div>

      <div className="comparison-grid">
        {frames.map((frame) => {
          const order = selectedIds.indexOf(frame.id);
          return (
            <article key={frame.id} className={`frame-card ${frame.isCurrent ? 'current' : ''} ${order >= 0 ? 'picked' : ''}`}>
              <button type="button" className="compare-image" aria-pressed={order >= 0} aria-label={`${frame.label}，${order >= 0 ? '移出对比' : '加入对比'}`} onClick={() => toggleSelect(frame.id)}>
                <img src={image.src} alt="" style={{ objectPosition: `${frame.crop.x * 100}% ${frame.crop.y * 100}%` }} />
                <span>{frame.label}</span>
                {frame.isCurrent && <em className="current-badge">编辑中</em>}
                {order >= 0 && <b className="pick-badge">{order === 0 ? '左' : '右'}</b>}
              </button>
              <div className="frame-card-meta">
                <strong>{frame.crop.ratio === 'free' ? '自由裁切' : frame.crop.ratio}</strong>
                <small>{Math.round(frame.crop.width * 100)}% × {Math.round(frame.crop.height * 100)}%</small>
              </div>
            </article>
          );
        })}
        {variants.length === 0 && (
          <div className="compare-slot-empty">
            <span>◇</span>
            <p>还没有保存的方案</p>
            <small>在右侧点「保存当前」，方案会按顺序排在这里，随时可与当前稿对比。</small>
          </div>
        )}
      </div>

      <div className="compare-detail">
        <div className="compare-detail-head">
          <p className="eyebrow">DETAIL / 并排细看</p>
          <small>再点卡片可移出 · 点第三张会替换最早选的一张</small>
        </div>
        {selectedFrames.length === 0 ? (
          <div className="compare-detail-empty">从上方点选画面，任意两张即可并排细看。</div>
        ) : (
          <div className={`compare-detail-grid ${selectedFrames.length === 1 ? 'solo' : ''}`}>
            {selectedFrames.map((frame) => <CompareFrameView key={frame.id} frame={frame} image={image} guides={previewGuides} subject={subject} />)}
            {selectedFrames.length === 1 && (
              <div className="compare-detail-hint">
                <p>已选 1 张</p>
                <small>再点选一张卡片即可并排对比；{variants.length === 0 ? '也可以先在右侧「保存当前」留一个方案。' : '已保存的方案都在上方。'}</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompareFrameView({ frame, image, guides, subject }: { frame: CompareFrame; image: ImageAsset; guides: Record<GuideKey, boolean>; subject: { x: number; y: number } | null }) {
  const { crop } = frame;
  const aspect = (crop.width * image.width) / (crop.height * image.height);
  const localSubject = subjectInCrop(crop, subject);
  return (
    <figure className="compare-frame-view">
      <div className="crop-preview" style={{ aspectRatio: `${aspect}`, '--aspect': aspect } as CSSProperties}>
        <img src={image.src} alt={frame.label} draggable={false} style={{ width: `${100 / crop.width}%`, height: `${100 / crop.height}%`, left: `${(-crop.x / crop.width) * 100}%`, top: `${(-crop.y / crop.height) * 100}%` }} />
        <GuideOverlay guides={guides} aspect={aspect} />
        {localSubject && <div className="subject-pin" style={{ left: `${localSubject.x * 100}%`, top: `${localSubject.y * 100}%` }}><span>主体</span></div>}
      </div>
      <figcaption>
        <strong>{frame.label}{frame.isCurrent && <em>编辑中</em>}</strong>
        <small>{crop.ratio === 'free' ? '自由裁切' : crop.ratio} · {Math.round(crop.width * 100)}% × {Math.round(crop.height * 100)}%</small>
      </figcaption>
    </figure>
  );
}

function GuideOverlay({ guides, aspect }: { guides: Record<GuideKey, boolean>; aspect: number }) {
  // 对角线按当前裁切的真实长宽比计算角度与长度，保证确实穿过对角。
  const diagonalAngle = (Math.atan2(1, aspect) * 180) / Math.PI;
  const diagonalLength = 100 * Math.sqrt(1 + 1 / (aspect * aspect));
  const diagonalOffset = -(diagonalLength - 100) / 2;
  return (
    <>
      {guides.thirds && <div className="guide thirds-guide"><i /><i /><b /><b /></div>}
      {guides.center && <div className="guide center-guide"><i /><i /></div>}
      {guides.diagonal && (
        <div className="guide diagonal-guide">
          <i style={{ width: `${diagonalLength}%`, left: `${diagonalOffset}%`, transform: `rotate(${diagonalAngle}deg)` }} />
          <i style={{ width: `${diagonalLength}%`, left: `${diagonalOffset}%`, transform: `rotate(${-diagonalAngle}deg)` }} />
        </div>
      )}
      {guides.golden && <div className="guide golden-guide"><i /><i /></div>}
    </>
  );
}
