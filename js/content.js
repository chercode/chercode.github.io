export async function loadContent(){
const res = await fetch('/data/content.json');
const data = await res.json();


// Footer links
document.getElementById('copyright').textContent = `\u00A9 ${new Date().getFullYear()} ${data.profile.name}`;
document.getElementById('cv-link').href = data.links.cv;
document.getElementById('gh-link').href = data.links.github;
document.getElementById('li-link').href = data.links.linkedin;
document.getElementById('gs-link').href = data.links.scholar;


// Skills
mountCards('skills', data.skills.map(s=>({ title:s.name, body:s.items.join(', ') })));


// Papers
mountCards('papers', data.papers.map(p=>({ title:p.title, body:p.venue, link:p.url })));


// Code
mountCards('code', data.projects.map(p=>({ title:p.name, body:p.description, link:p.url })));


// Talks
mountCards('talks', data.talks.map(t=>({ title:t.title, body:t.where, link:t.url })));
}


function mountCards(key, items){
const grid = document.querySelector(`[data-grid="${key}"]`);
grid.innerHTML = '';
for(const it of items){
const card = document.createElement('article');
card.className='card';
const h = document.createElement('h3'); h.textContent = it.title; card.appendChild(h);
const p = document.createElement('p'); p.textContent = it.body || ''; card.appendChild(p);
if (it.link){ const a=document.createElement('a'); a.href=it.link; a.textContent='Open'; a.rel='noopener'; a.target='_blank'; card.appendChild(a); }
grid.appendChild(card);
}
}