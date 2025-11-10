// Particle renderer for the Spectral Flow Field hero.
// Uses WebGL2 when available; falls back to Canvas2D otherwise.

export function initRenderer(gl, canvas, state, field) {
  const useGL = !!gl;
  const N = state.particleCount | 0;

  // ---------- Resize handling ----------
  function resize() {
    const dpr = state.dpi || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      if (useGL) {
        gl.viewport(0, 0, width, height);
      }
    }
  }

  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener("resize", resize);
  }
  resize();

  // ---------- Pointer / gravity well ----------
  const mouse = { x: 0, y: 0, down: false };

  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    mouse.x = nx * 2 - 1;      // NDC
    mouse.y = -(ny * 2 - 1);   // NDC
  });

  ["pointerdown", "pointerup", "pointercancel", "pointerleave"].forEach((t) => {
    canvas.addEventListener(t, (e) => {
      if (t === "pointerdown") mouse.down = true;
      else mouse.down = false;
    });
  });

  // ---------- Particles (CPU integration) ----------
  const particles = [];
  for (let i = 0; i < N; i++) {
    particles.push({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      vx: 0,
      vy: 0,
      life: Math.random()
    });
  }

  function step(dt) {
    const drag = 0.95;
    const base = 0.36;
    const mouseForce = mouse.down ? 2.0 : 0.7;

    for (let i = 0; i < N; i++) {
      const p = particles[i];

      // Flow sample: map NDC [-1,1] to [0,1]
      const u = p.x * 0.5 + 0.5;
      const v = p.y * 0.5 + 0.5;
      const fv = field.sample(u, v);
      p.vx += fv[0] * base * dt;
      p.vy += fv[1] * base * dt;

      // Mouse gravity well
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const r2 = dx * dx + dy * dy + 0.0025;
      const g = mouseForce / r2;
      p.vx += dx * g * dt;
      p.vy += dy * g * dt;

      // Integrate + damping
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Wrap
      if (p.x < -1) p.x = 1;
      if (p.x > 1) p.x = -1;
      if (p.y < -1) p.y = 1;
      if (p.y > 1) p.y = -1;

      // Animate life for color
      p.life += dt * 0.15;
      if (p.life > 1) p.life -= 1;
    }
  }

  // ---------- WebGL setup ----------
  let program, vao, posBuf, lifeBuf;
  let posArray, lifeArray;

  if (useGL) {
    const vsSrc = `#version 300 es
      layout(location=0) in vec2 a_pos;
      layout(location=1) in float a_life;
      out float v_life;
      void main() {
        v_life = a_life;
        gl_Position = vec4(a_pos, 0.0, 1.0);
        gl_PointSize = 2.2;
      }`;

    const fsSrc = `#version 300 es
      precision mediump float;
      in float v_life;
      out vec4 o;
      vec3 hsl2rgb(float h, float s, float l) {
        float a = s * min(l, 1.0 - l);
        float f(float n) {
          float k = mod(n + h * 12.0, 12.0);
          return l - a * max(-1.0, min(min(k - 3.0, 9.0 - k), 1.0));
        }
        return vec3(f(0.0), f(8.0), f(4.0));
      }
      void main() {
        vec2 c = gl_PointCoord * 2.0 - 1.0;
        float d = dot(c, c);
        if (d > 1.0) discard;
        float h = v_life;                 // 0..1
        vec3 col = hsl2rgb(h, 0.9, 0.55); // spectral sweep
        float a = smoothstep(1.0, 0.5, d);
        o = vec4(col, a);
      }`;

    program = makeProgram(gl, vsSrc, fsSrc);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    posBuf = gl.createBuffer();
    lifeBuf = gl.createBuffer();

    posArray = new Float32Array(N * 2);
    lifeArray = new Float32Array(N);

    // Positions
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, posArray.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Life / hue
    gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, lifeArray.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
  }

  // ---------- Canvas fallback ----------
  const ctx2d = !useGL ? canvas.getContext("2d") : null;

  // ---------- Animation loop ----------
  let last = performance.now();

  function frame(t) {
    const dt = Math.min(0.033, (t - last) / 1000);
    last = t;

    if (!state.prefersReduced) {
      step(dt);
    }

    if (useGL) {
      // Upload particle data
      for (let i = 0; i < N; i++) {
        const p = particles[i];
        const idx = i * 2;
        posArray[idx] = p.x;
        posArray[idx + 1] = p.y;
        lifeArray[i] = p.life;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, posArray);
      gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, lifeArray);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.POINTS, 0, N);
    } else if (ctx2d) {
      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);
      ctx2d.globalCompositeOperation = "lighter";

      for (let i = 0; i < N; i++) {
        const p = particles[i];
        const x = (p.x * 0.5 + 0.5) * w;
        const y = (1 - (p.y * 0.5 + 0.5)) * h;
        const hue = (p.life * 360) | 0;
        ctx2d.fillStyle = `hsla(${hue}, 90%, 60%, 0.7)`;
        ctx2d.beginPath();
        ctx2d.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx2d.fill();
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  // ---------- Helpers ----------
  function makeProgram(gl, vsSrc, fsSrc) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSrc);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSrc);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fs));
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
    }
    return prog;
  }

  // Public hooks for UI (currently minimal)
  function focusBand(index) {
    // You can add subtle visual tweaks per band here if desired.
  }

  function setParticles(count) {
    // Placeholder if you later want to dynamically rescale N.
    console.warn("setParticles not implemented; configure via state.particleCount before init.");
  }

  return { focusBand, setParticles };
}
