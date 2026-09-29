import { describe, expect, it } from 'vitest';
import { buildCompareFrames, cropForRatio, moveCrop, resizeCrop, subjectInCrop } from '../domain';
import { DEFAULT_CROP, type CropVariant } from '../model';

describe('crop domain rules', () => {
  it('fits a 1:1 crop inside a wide image and centers it', () => {
    const crop = cropForRatio('1:1', 1.5, DEFAULT_CROP);
    expect(crop.width).toBeCloseTo(2 / 3);
    expect(crop.height).toBe(1);
    expect(crop.x).toBeCloseTo(1 / 6);
  });

  it('clamps movement to the image boundary', () => {
    const crop = moveCrop({ ...DEFAULT_CROP, width: 0.5, height: 0.5 }, 0.9, -0.9);
    expect(crop.x).toBe(0.5);
    expect(crop.y).toBe(0);
  });

  it('keeps a selected ratio while resizing', () => {
    const crop = resizeCrop({ ...DEFAULT_CROP, ratio: '16:9', width: 0.5, height: 0.28125 }, 0.8, 0.8);
    expect(crop.width).toBe(0.8);
    expect(crop.height).toBeCloseTo(0.45);
  });
});

describe('compare frames', () => {
  const saved: CropVariant[] = [
    { id: 'v1', x: 0, y: 0, width: 0.5, height: 0.5, ratio: '1:1' },
    { id: 'v2', x: 0.2, y: 0.1, width: 0.4, height: 0.4, ratio: '16:9' },
  ];

  it('puts the current draft first and keeps saved variants in order', () => {
    const frames = buildCompareFrames({ ...DEFAULT_CROP, width: 0.8 }, saved);
    expect(frames.map((frame) => frame.id)).toEqual(['current', 'v1', 'v2']);
    expect(frames[0].isCurrent).toBe(true);
    expect(frames[0].label).toBe('当前稿');
    expect(frames[0].crop.width).toBe(0.8);
    expect(frames.slice(1).map((frame) => frame.label)).toEqual(['方案 01', '方案 02']);
    expect(frames.slice(1).every((frame) => !frame.isCurrent)).toBe(true);
  });

  it('always includes the current draft even without saved variants', () => {
    const frames = buildCompareFrames(DEFAULT_CROP, []);
    expect(frames).toHaveLength(1);
    expect(frames[0].isCurrent).toBe(true);
  });

  it('projects the subject into crop space and drops it when outside', () => {
    const crop: CropVariant = { id: 'c', x: 0.2, y: 0.2, width: 0.4, height: 0.4, ratio: 'free' };
    const inside = subjectInCrop(crop, { x: 0.4, y: 0.6 });
    expect(inside?.x).toBeCloseTo(0.5);
    expect(inside?.y).toBeCloseTo(1);
    expect(subjectInCrop(crop, { x: 0.1, y: 0.5 })).toBeNull();
    expect(subjectInCrop(crop, null)).toBeNull();
  });
});
