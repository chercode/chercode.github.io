// Precompute a curl-noise vector field on a grid for fast lookups
// Used by the Spectral Flow Field hero.

export function initFlowField(opts = {}) {
  const size = opts.size || 128;       // grid resolution
  const scale = opts.scale || 0.015;   // noise scale
  const seed = opts.seed || 1337;

  const noise = makeNoise(seed);
  const field = new Float32Array(size * size * 2);

  // Approximate curl of scalar noise via finite differences
  const d = 0.001;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x * scale;
      const ny = y * scale;

      const n1 = noise(nx, ny + d);
      const n2 = noise(nx, ny - d);
      const n3 = noise(nx + d, ny);
      const n4 = noise(nx - d, ny);

      const dx = (n1 - n2) / (2 * d);
      const dy = (n3 - n4) / (2 * d);

      // Divergence-free 2D curl field
      const curlx = dy;
      const curly = -dx;

      const len = Math.hypot(curlx, curly) + 1e-6;
      const i = (y * size + x) * 2;
      field[i] = curlx / len;
      field[i + 1] = curly / len;
    }
  }

  // Bilinear sample in [0,1]x[0,1]
  function sample(u, v) {
    const fx = u * (size - 1);
    const fy = v * (size - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, size - 1);
    const y1 = Math.min(y0 + 1, size - 1);
    const tx = fx - x0;
    const ty = fy - y0;

    const i00 = ((y0 * size + x0) << 1);
    const i10 = ((y0 * size + x1) << 1);
    const i01 = ((y1 * size + x0) << 1);
    const i11 = ((y1 * size + x1) << 1);

    const vx =
      (field[i00] * (1 - tx) + field[i10] * tx) * (1 - ty) +
      (field[i01] * (1 - tx) + field[i11] * tx) * ty;
    const vy =
      (field[i00 + 1] * (1 - tx) + field[i10 + 1] * tx) * (1 - ty) +
      (field[i01 + 1] * (1 - tx) + field[i11 + 1] * tx) * ty;

    return [vx, vy];
  }

  return { size, field, sample };
}

// Simple value-noise with hashing
function makeNoise(seed) {
  let s = seed >>> 0;

  function rand() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  }

  const g = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    g[i] = rand() * 2 - 1;
  }

  return function noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const tx = x - xi;
    const ty = y - yi;

    function h(i, j) {
      return g[((xi + i) & 255) ^ ((yi + j) & 255)];
    }

    const n00 = h(0, 0);
    const n10 = h(1, 0);
    const n01 = h(0, 1);
    const n11 = h(1, 1);

    const sx = smooth(tx);
    const sy = smooth(ty);

    const nx0 = n00 + sx * (n10 - n00);
    const nx1 = n01 + sx * (n11 - n01);

    return nx0 + sy * (nx1 - nx0);
  };
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}
