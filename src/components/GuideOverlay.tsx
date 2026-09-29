import type { GuideKey } from '../model';

interface GuideOverlayProps {
  guides: Record<GuideKey, boolean>;
}

// 构图辅助线覆盖层：工作台与对比预览共用同一套渲染，
// 保证“同一组参考线”在不同裁切下看起来完全一致。
export function GuideOverlay({ guides }: GuideOverlayProps) {
  return (
    <>
      {guides.thirds && <div className="guide thirds-guide"><i /><i /><b /><b /></div>}
      {guides.center && <div className="guide center-guide"><i /><i /></div>}
      {guides.diagonal && <div className="guide diagonal-guide"><i /><i /></div>}
      {guides.golden && <div className="guide golden-guide"><i /><i /></div>}
    </>
  );
}
