const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    toggle.classList.toggle('active');
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('active');
    nav.classList.remove('open');
  }));
}

document.querySelectorAll('details').forEach(item => item.addEventListener('toggle', () => {
  if (item.open) document.querySelectorAll('details').forEach(other => {
    if (other !== item) other.open = false;
  });
}));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const typeButtons = document.querySelectorAll('.enquiry-type');
const typeSelect = document.querySelector('#enquiry-select');
const typeInput = document.querySelector('#enquiry-type');
function selectEnquiry(type) {
  if (!typeSelect || !typeInput) return;
  if (![...typeSelect.options].some(option => option.value === type)) return;
  typeSelect.value = type;
  typeInput.value = type;
  typeButtons.forEach(button => button.classList.toggle('active', button.dataset.type === type));
}
typeButtons.forEach(button => button.addEventListener('click', () => {
  selectEnquiry(button.dataset.type);
  document.querySelector('.contact-form-section')?.scrollIntoView({ behavior: 'smooth' });
}));
document.querySelectorAll('.enquiry-link').forEach(link => link.addEventListener('click', () => selectEnquiry(link.dataset.type)));
typeSelect?.addEventListener('change', () => selectEnquiry(typeSelect.value));
const requestedType = new URLSearchParams(location.search).get('type');
if (requestedType) selectEnquiry(requestedType);

const contactForm = document.querySelector('#contact-form');
contactForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.querySelector('#form-status');
  const button = contactForm.querySelector('button[type="submit"]');
  if (status) status.textContent = '';
  status?.classList.remove('error');
  if (button) button.disabled = true;
  try {
    await GicaApi.request('/api/inquiries', {
      method: 'POST',
      body: Object.fromEntries(new FormData(contactForm).entries()),
    });
    if (status) status.textContent = 'Thank you. Your enquiry has been sent.';
    contactForm.reset();
    selectEnquiry('membership');
  } catch (error) {
    if (status) status.textContent = error.message || 'Unable to send your enquiry. Please try again.';
    status?.classList.add('error');
  } finally {
    if (button) button.disabled = false;
  }
});
