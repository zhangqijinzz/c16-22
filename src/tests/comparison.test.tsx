import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Comparison } from '../components/Comparison';
import type { CropVariant, ImageAsset } from '../model';

const image: ImageAsset = { src: 'data:image/svg+xml,demo', width: 1200, height: 800, name: 'demo.svg' };
const guides = { thirds: true, center: false, diagonal: false, golden: false };
const current: CropVariant = { id: 'current', x: 0.1, y: 0.1, width: 0.6, height: 0.6, ratio: 'free' };
const saved: CropVariant[] = [
  { id: 'v1', x: 0, y: 0, width: 0.5, height: 0.5, ratio: '1:1' },
  { id: 'v2', x: 0.2, y: 0.1, width: 0.4, height: 0.4, ratio: '16:9' },
];

describe('Comparison view', () => {
  it('lists the marked current draft before the saved variants', () => {
    const html = renderToStaticMarkup(<Comparison image={image} current={current} variants={saved} guides={guides} subject={null} />);
    expect(html).toContain('当前稿');
    expect(html).toContain('编辑中');
    expect(html.indexOf('当前稿')).toBeLessThan(html.indexOf('方案 01'));
    expect(html.indexOf('方案 01')).toBeLessThan(html.indexOf('方案 02'));
    expect(html).toContain('1:1');
    expect(html).toContain('16:9');
  });

  it('lands on the current draft preview when no variants are saved', () => {
    const html = renderToStaticMarkup(<Comparison image={image} current={current} variants={[]} guides={guides} subject={{ x: 0.4, y: 0.4 }} />);
    expect(html).toContain('当前稿');
    expect(html).toContain('还没有保存的方案');
    expect(html).toContain('已选 1 张');
    expect(html).toContain('subject-pin');
  });

  it('keeps guide overlay and subject out of the detail when disabled or outside', () => {
    const html = renderToStaticMarkup(<Comparison image={image} current={current} variants={saved} guides={{ thirds: false, center: false, diagonal: false, golden: false }} subject={{ x: 0.95, y: 0.95 }} />);
    expect(html).not.toContain('thirds-guide');
    expect(html).not.toContain('subject-pin');
  });
});
