const search = document.querySelector('#member-search');
const category = document.querySelector('#member-category');
const grid = document.querySelector('#member-grid');
const empty = document.querySelector('#directory-empty');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

let timer;
let requestId = 0;
async function loadMembers() {
  const current = ++requestId;
  const params = new URLSearchParams({ limit: '100' });
  if (search?.value.trim()) params.set('search', search.value.trim());
  if (category?.value && category.value !== 'all') params.set('category', category.value);
  try {
    const data = await GicaApi.request(`/api/creators?${params}`);
    if (current !== requestId) return;
    grid.innerHTML = data.creators.map(creator => {
      const initials = (creator.name || '').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      return `<article class="member-card"><div class="member-avatar av-red">${escapeHtml(initials)}</div><span class="verified">GICA MEMBER</span><h2>${escapeHtml(creator.name)}</h2><p>${escapeHtml(creator.headline || creator.creatorType)}</p><small>${escapeHtml([creator.city, creator.country].filter(Boolean).join(', '))}</small><div class="member-meta"><span>${escapeHtml(creator.category)}</span></div><a href="member-profile.html?creator=${encodeURIComponent(creator.username)}">View public profile <b>↗</b></a></article>`;
    }).join('');
    empty.textContent = 'No matching public profiles found.';
    empty.hidden = data.creators.length > 0;
  } catch (error) {
    if (current !== requestId) return;
    grid.innerHTML = '';
    empty.textContent = error.message;
    empty.hidden = false;
  }
}

search?.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadMembers, 250); });
category?.addEventListener('change', loadMembers);
loadMembers();
