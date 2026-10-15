const menu = document.querySelector('.panel-menu');
const sidebar = document.querySelector('.panel-sidebar');
const links = [...document.querySelectorAll('[data-panel]')];
const views = [...document.querySelectorAll('.panel-view')];
const title = document.querySelector('#panel-title');
const eyebrow = document.querySelector('#panel-eyebrow');

menu?.addEventListener('click', () => sidebar?.classList.toggle('open'));

function openPanel(name, updateHash = true) {
  const view = document.querySelector(`#panel-${name}`);
  if (!view) return;
  views.forEach((item) => item.classList.toggle('active', item === view));
  links.forEach((link) => link.classList.toggle('active', link.dataset.panel === name));
  if (title) title.textContent = view.dataset.title || name;
  if (eyebrow) eyebrow.textContent = view.dataset.eyebrow || 'CREATOR PANEL';
  sidebar?.classList.remove('open');
  if (updateHash) history.replaceState(null, '', `#${name}`);
  document.querySelector('.panel-main')?.scrollTo({ top: 0, behavior: 'smooth' });
}

links.forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  openPanel(link.dataset.panel);
}));

document.querySelectorAll('[data-open-panel]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openPanel(link.dataset.openPanel);
  });
});

if (views.length) openPanel(location.hash.slice(1) || 'dashboard', false);

document.querySelectorAll('.filter-pills button').forEach((button) => {
  button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
  });
});
