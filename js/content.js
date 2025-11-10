export async function loadContent() {
  const url = 'data/content.json'; // relative to site root
  let data;

  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('Failed to load content.json:', err);
    showError('Failed to load content. Check data/content.json path & syntax.');
    return;
  }

  if (!data) return;

  // Footer
  if (data.profile && data.profile.name) {
    document.getElementById('copyright').textContent =
      `\u00A9 ${new Date().getFullYear()} ${data.profile.name}`;
  }
  if (data.links) {
    if (data.links.cv) document.getElementById('cv-link').href = data.links.cv;
    if (data.links.github) document.getElementById('gh-link').href = data.links.github;
    if (data.links.linkedin) document.getElementById('li-link').href = data.links.linkedin;
    if (data.links.scholar) document.getElementById('gs-link').href = data.links.scholar;
  }

  mountCards('skills', (data.skills || []).map(s => ({
    title: s.name,
    body: (s.items || []).join(', ')
  })));

  mountCards('papers', (data.papers || []).map(p => ({
    title: p.title,
    body: p.venue,
    link: p.url
  })));

  mountCards('code', (data.projects || []).map(p => ({
    title: p.name,
    body: p.description,
    link: p.url
  })));

  mountCards('talks', (data.talks || []).map(t => ({
    title: t.title,
    body: t.where,
    link: t.url
  })));
}

function mountCards(key, items) {
  const grid = document.querySelector(`[data-grid="${key}"]`);
  if (!grid) return;
  grid.innerHTML = '';
  for (const it of items) {
    const card = document.createElement('article');
    card.className = 'card';

    const h = document.createElement('h3');
    h.textContent = it.title || '';
    card.appendChild(h);

    if (it.body) {
      const p = document.createElement('p');
      p.textContent = it.body;
      card.appendChild(p);
    }

    if (it.link) {
      const a = document.createElement('a');
      a.href = it.link;
      a.textContent = 'Open';
      a.rel = 'noopener';
      a.target = '_blank';
      card.appendChild(a);
    }

    grid.appendChild(card);
  }
}

function showError(msg) {
  const firstSection = document.querySelector('.section');
  if (!firstSection) return;
  const note = document.createElement('p');
  note.style.color = '#ff8a8a';
  note.textContent = msg;
  firstSection.prepend(note);
}
