// 吹き出しラベルの重なり自動回避ロジック（DOM 非依存の純粋関数）
//
// 各スポットの「実際の場所を示す丸（dot）」のピクセル座標と、希望する
// 吹き出し位置（labelOffset）をもとに、吹き出し同士が重ならないよう
// オフセットを再計算する。ズーム/パンのたびに呼び出される想定。

export interface LabelBox {
  /** ドット相対のサイズ・希望位置の計算に使う一意キー */
  id: string;
  /** ドット（実際の場所）のコンテナピクセル座標 */
  dot: { x: number; y: number };
  /** 希望する吹き出し中心のオフセット [dx, dy]（ドット基準） */
  preferred: [number, number];
  /** 吹き出しの幅・高さ（px） */
  box: { w: number; h: number };
}

export interface ResolveOptions {
  /** 反復回数（多いほど収束するが重い） */
  iterations?: number;
  /** 吹き出し同士の最小すき間（px） */
  gap?: number;
  /** 希望位置へ戻すバネの強さ（0〜1） */
  spring?: number;
}

const DEFAULTS: Required<ResolveOptions> = {
  iterations: 60,
  gap: 4,
  spring: 0.08,
};

// 吹き出し幅は文字数から算出（SpotMarker の描画と一致させること）
export const BUBBLE_HEIGHT = 28;
export function bubbleWidth(rubyLength: number): number {
  return Math.max(50, rubyLength * 13 + 20);
}

interface Node {
  id: string;
  cx: number; // 現在の吹き出し中心（コンテナ座標）
  cy: number;
  px: number; // 希望中心（コンテナ座標）
  py: number;
  hw: number; // 半幅
  hh: number; // 半高
}

/**
 * 吹き出しが重ならないよう各ラベルのオフセット [dx, dy] を再計算する。
 * 孤立したラベルは希望位置（preferred）をほぼ維持する。
 */
export function resolveLabelOffsets(
  items: LabelBox[],
  options: ResolveOptions = {}
): Map<string, [number, number]> {
  const { iterations, gap, spring } = { ...DEFAULTS, ...options };

  const nodes: Node[] = items.map((it) => {
    const px = it.dot.x + it.preferred[0];
    const py = it.dot.y + it.preferred[1];
    return {
      id: it.id,
      cx: px,
      cy: py,
      px,
      py,
      hw: it.box.w / 2 + gap / 2,
      hh: it.box.h / 2 + gap / 2,
    };
  });

  // AABB の重なりを分離軸方向に押し離す（1パス）。重なりが解消したら true。
  const separate = (): boolean => {
    let clean = true;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const overlapX = a.hw + b.hw - Math.abs(dx);
        const overlapY = a.hh + b.hh - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          clean = false;
          // 重なりが小さい軸方向に押し離す（はみ出しを最小化）
          if (overlapX < overlapY) {
            const push = overlapX / 2;
            const dir = dx === 0 ? 1 : Math.sign(dx);
            a.cx -= push * dir;
            b.cx += push * dir;
          } else {
            const push = overlapY / 2;
            const dir = dy === 0 ? 1 : Math.sign(dy);
            a.cy -= push * dir;
            b.cy += push * dir;
          }
        }
      }
    }
    return clean;
  };

  // フェーズ1: 希望位置へ戻すバネ + 分離（見た目を希望位置に寄せる）
  for (let iter = 0; iter < iterations; iter++) {
    for (const n of nodes) {
      n.cx += (n.px - n.cx) * spring;
      n.cy += (n.py - n.cy) * spring;
    }
    separate();
  }

  // フェーズ2: 分離のみを反復し、重なりの完全解消を保証する
  for (let iter = 0; iter < iterations * 4; iter++) {
    if (separate()) break;
  }

  const result = new Map<string, [number, number]>();
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    result.set(n.id, [n.cx - items[i].dot.x, n.cy - items[i].dot.y]);
  }
  return result;
}
