export function initRenderer(gl, canvas, state, field){


hueBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, hueBuf);
gl.bufferData(gl.ARRAY_BUFFER, N*4, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1,1,gl.FLOAT,false,0,0);
}


const posArray = new Float32Array(N*2);
const hueArray = new Float32Array(N);


let last=performance.now();
function frame(t){
const dt = Math.min(0.033, (t-last)/1000);
last = t;
if (!state.prefersReduced) step(dt);


if (gl){
for(let i=0;i<N;i++){
const p=particles[i];
posArray[i*2]=p.x; posArray[i*2+1]=p.y;
hueArray[i]=p.life; // orbit hue over life
}
gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, posArray);
gl.bindBuffer(gl.ARRAY_BUFFER, hueBuf);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, hueArray);


gl.clearColor(0,0,0,0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.bindVertexArray(vao);
gl.useProgram(program);
gl.drawArrays(gl.POINTS, 0, N);
} else {
// Canvas2D fallback (very light)
const ctx = canvas.getContext('2d');
const w=canvas.width, h=canvas.height;
ctx.clearRect(0,0,w,h);
ctx.globalCompositeOperation='lighter';
for(const p of particles){
const x=(p.x*0.5+0.5)*w, y=(1-(p.y*0.5+0.5))*h;
const hue = Math.floor(p.life*360);
ctx.fillStyle = `hsla(${hue},90%,55%,.7)`;
ctx.beginPath(); ctx.arc(x,y,1.2,0,Math.PI*2); ctx.fill();
}
}
requestAnimationFrame(frame);
}
requestAnimationFrame(frame);


function makeProgram(gl,vsSrc,fsSrc){
const vs=gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs,vsSrc); gl.compileShader(vs);
const fs=gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs,fsSrc); gl.compileShader(fs);
const p=gl.createProgram(); gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p);
if(!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
return p;
}


// Public API for UI
function focusBand(idx){ /* visual response to band focus, optional */ }
function setParticles(n){ /* optional runtime adjust */ }


return { focusBand, setParticles };
}