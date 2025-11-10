export function initFlowField(opts={}){
const size = opts.size || 128; // grid size (size x size)
const scale = opts.scale || 0.015; // world scale
const seed = opts.seed || 1337;


const noise = makeNoise(seed);
const field = new Float32Array(size*size*2);


// Curl of 2D noise: ∂N_y/∂x - ∂N_x/∂y
const d = 0.001;
for(let y=0;y<size;y++){
for(let x=0;x<size;x++){
const nx = x*scale, ny=y*scale;
const n1 = noise(nx, ny+d);
const n2 = noise(nx, ny-d);
const n3 = noise(nx+d, ny);
const n4 = noise(nx-d, ny);
const dx = (n1 - n2)/(2*d);
const dy = (n3 - n4)/(2*d);
const curlx = dy; // (∂Ny/∂x)
const curly = -dx; // -(∂Nx/∂y)
const len = Math.hypot(curlx, curly) + 1e-6;
const i = (y*size + x)*2;
field[i+0] = curlx/len;
field[i+1] = curly/len;
}
}


function sample(u,v){
// u,v in [0,1]
const fx = u*(size-1), fy=v*(size-1);
const x0=Math.floor(fx), y0=Math.floor(fy);
const x1=Math.min(x0+1,size-1), y1=Math.min(y0+1,size-1);
const tx=fx-x0, ty=fy-y0;
const i00=((y0*size+x0)<<1), i10=((y0*size+x1)<<1), i01=((y1*size+x0)<<1), i11=((y1*size+x1)<<1);
const vx = lerp(lerp(field[i00], field[i10], tx), lerp(field[i01], field[i11], tx), ty);
const vy = lerp(lerp(field[i00+1], field[i10+1], tx), lerp(field[i01+1], field[i11+1], tx), ty);
return [vx,vy];
}


return { size, field, sample };
}


function lerp(a,b,t){ return a + (b-a)*t; }


// Simple value noise with hashing
function makeNoise(seed){
let s = seed >>> 0;
const rand = () => (s = (s*1664525 + 1013904223)>>>0) / 0xffffffff;
const g = new Float32Array(512);
for(let i=0;i<512;i++) g[i]=rand()*2-1;
return function noise(x,y){
const xi=Math.floor(x), yi=Math.floor(y);
const tx=x-xi, ty=y-yi;
function smooth(t){ return t*t*(3-2*t); }