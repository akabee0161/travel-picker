import { describe, it, expect } from 'vitest';
import { resolveLabelOffsets, type LabelBox } from './labelLayout';

// 2つの box が重なっているか（gap は無視した実寸で判定）
function overlaps(
  a: { cx: number; cy: number; w: number; h: number },
  b: { cx: number; cy: number; w: number; h: number }
): boolean {
  return (
    Math.abs(a.cx - b.cx) < (a.w + b.w) / 2 &&
    Math.abs(a.cy - b.cy) < (a.h + b.h) / 2
  );
}

describe('resolveLabelOffsets', () => {
  it('孤立したラベルは希望位置をほぼ維持する', () => {
    const items: LabelBox[] = [
      { id: 'a', dot: { x: 100, y: 100 }, preferred: [0, -40], box: { w: 80, h: 28 } },
      { id: 'b', dot: { x: 400, y: 400 }, preferred: [0, -40], box: { w: 80, h: 28 } },
    ];
    const res = resolveLabelOffsets(items);
    expect(res.get('a')![0]).toBeCloseTo(0, 0);
    expect(res.get('a')![1]).toBeCloseTo(-40, 0);
    expect(res.get('b')![0]).toBeCloseTo(0, 0);
    expect(res.get('b')![1]).toBeCloseTo(-40, 0);
  });

  it('重なる複数ラベルが回避後は重ならない', () => {
    // すべて同じ希望位置に集中させて強制的に重ねる
    const items: LabelBox[] = Array.from({ length: 6 }, (_, i) => ({
      id: `s${i}`,
      dot: { x: 200 + i, y: 300 },
      preferred: [0, -40] as [number, number],
      box: { w: 120, h: 28 },
    }));

    const res = resolveLabelOffsets(items);

    const boxes = items.map((it) => {
      const [dx, dy] = res.get(it.id)!;
      return { id: it.id, cx: it.dot.x + dx, cy: it.dot.y + dy, w: it.box.w, h: it.box.h };
    });

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlaps(boxes[i], boxes[j])).toBe(false);
      }
    }
  });

  it('結果は全 id を含む', () => {
    const items: LabelBox[] = [
      { id: 'x', dot: { x: 0, y: 0 }, preferred: [10, 10], box: { w: 50, h: 28 } },
    ];
    const res = resolveLabelOffsets(items);
    expect(res.has('x')).toBe(true);
    expect(res.size).toBe(1);
  });
});
