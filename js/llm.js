// Client-only "Ask Me" with mock JSON + pluggable adapter for serverless LLM
export function initAskMe(){
const form = document.getElementById('askme-form');
const input = document.getElementById('askme-input');
const out = document.getElementById('askme-response');
if (!form) return;


form.addEventListener('submit', async (e)=>{
e.preventDefault();
const q = input.value.trim(); if(!q) return;
out.textContent = '…thinking locally (mock)…';


// Default mock: small curated answers
const mockDb = [
{ k: 'spectral reconstruction', a: 'Spectral reconstruction estimates dense wavelength reflectance from sparse inputs (e.g., RGB+NIR). I use transformer models with spectral priors and color-fidelity constraints.' },
{ k: 'curl noise', a: 'Curl-noise is the curl of a vector field derived from noise, yielding divergence-free flow that looks fluid-like.' },
{ k: 'truthful spectral reconstruction', a: 'TSR enforces spectral and color fidelity simultaneously so reconstructions remain physically plausible and color-accurate.' }
];
const hit = mockDb.find(e=> q.toLowerCase().includes(e.k));
if (hit) { out.textContent = hit.a; return; }


// Optional: call serverless adapter (set window.ASKME_ENDPOINT)
try{
const ans = await adapterLLM(q);
out.textContent = ans || 'No answer';
}catch(err){ out.textContent = 'Offline mock only. Configure ASKME_ENDPOINT to use a serverless LLM.' }
});
}


async function adapterLLM(q){
const url = (window.ASKME_ENDPOINT || '').trim();
if (!url) throw new Error('Endpoint not set');
const res = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ q }) });
if (!res.ok) throw new Error('Bad response');
const json = await res.json();
return json.answer;
}