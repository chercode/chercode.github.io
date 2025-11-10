(function(){
const sessionId = Math.random().toString(36).slice(2);
const log = (type, detail)=>{
if (location.hostname.endsWith('github.io')) {
console.debug('[analytics]', type, detail);
}
};
window.addEventListener('load', ()=> log('pageview', { path: location.pathname, sessionId }));
document.addEventListener('click', (e)=>{
const a = e.target.closest('a,button');
if (!a) return; log('ui', { tag:a.tagName, text:(a.textContent||'').trim().slice(0,32) });
});
})();