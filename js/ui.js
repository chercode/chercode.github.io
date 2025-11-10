export function initUI(renderer, state){
const bands = Array.from(document.querySelectorAll('.band'));
const sections = ['#skills','#papers','#code','#talks'];


bands.forEach((btn,i)=>{
btn.addEventListener('click', ()=> scrollToSection(btn.dataset.target));
btn.addEventListener('mouseenter', ()=> renderer.focusBand?.(i));
});


// Top nav buttons
document.querySelectorAll('.nav-link[data-target]').forEach(btn=>{
btn.addEventListener('click', ()=> scrollToSection(btn.dataset.target));
})


// Keyboard: 1-4 jumps
window.addEventListener('keydown', e=>{
const k=e.key;
if (k>='1' && k<='4'){ const idx=(k.charCodeAt(0)-49); scrollToSection(sections[idx]); }
});


function scrollToSection(sel){
const el = document.querySelector(sel);
if (!el) return;
el.scrollIntoView({ behavior: 'smooth', block: 'start' });
el.setAttribute('tabindex','-1');
el.focus({ preventScroll:true });
}


// Ask Me toggle
const toggle = document.querySelector('.askme-toggle');
const panel = document.getElementById('askme-panel');
toggle.addEventListener('click', ()=>{
const open = panel.hasAttribute('hidden') ? false : true;
if (open){ panel.setAttribute('hidden',''); toggle.setAttribute('aria-expanded','false'); }
else { panel.removeAttribute('hidden'); toggle.setAttribute('aria-expanded','true'); }
});
}