const username = new URLSearchParams(location.search).get('creator');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

async function loadProfile() {
  const title = document.querySelector('.public-profile-hero h1');
  if (!username) { location.replace('members.html'); return; }
  try {
    const { creator } = await GicaApi.request(`/api/creators/${encodeURIComponent(username)}`);
    document.title = `${creator.name} | GICA Creator Profile`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `Public creator profile for ${creator.name}.`);
    title.textContent = creator.name;
    document.querySelector('.public-avatar').textContent = creator.name.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
    document.querySelector('.public-profile-hero .verified').textContent = 'GICA MEMBER';
    document.querySelector('.public-profile-hero p').textContent = [creator.headline || creator.creatorType, creator.city, creator.country].filter(Boolean).join(' · ');
    document.querySelector('.profile-id').textContent = `${creator.creatorId || ''} · @${creator.username}`;
    document.querySelector('.profile-main article h2').textContent = creator.headline || creator.creatorType;
    document.querySelector('.profile-main article p').textContent = creator.bio || 'This creator has not added a biography yet.';
    document.querySelector('.profile-side strong').textContent = creator.category || '';
    document.querySelectorAll('.profile-side > div').forEach((section, index) => { if (index > 0) section.hidden = true; });
    document.querySelector('.profile-inquiry h2').textContent = `Work with ${creator.name}.`;
    const portfolio = document.querySelector('.portfolio-grid');
    portfolio.innerHTML = (creator.portfolio || []).map((item, index) =>
      `<div><b>${String(index + 1).padStart(2, '0')}</b><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.meta)}</p></div>`).join('');
    const services = document.querySelector('.service-list');
    services.innerHTML = (creator.services || []).map(item => `<span>${escapeHtml(item.title)}</span>`).join('');
    if (!creator.acceptInquiries) {
      document.querySelector('.profile-inquiry').hidden = true;
      document.querySelector('.public-profile-hero a[href="#inquiry"]').hidden = true;
    }
    document.body.classList.add('profile-ready');
  } catch (error) {
    title.textContent = error.message;
    document.querySelector('.profile-content').hidden = true;
    document.querySelector('.profile-inquiry').hidden = true;
    document.body.classList.add('profile-ready');
  }
}

document.querySelector('[data-profile-form]')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  const fields = Object.fromEntries(new FormData(form));
  button.disabled = true;
  try {
    await GicaApi.request('/api/inquiries', {
      method: 'POST',
      body: { name: fields.name, email: fields.email, organization: fields.company,
        category: 'brand', message: fields.message, creatorUsername: username },
    });
    status.textContent = 'Your inquiry has been sent.';
    status.classList.remove('error');
    form.reset();
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('error');
  } finally { button.disabled = false; }
});

loadProfile();
