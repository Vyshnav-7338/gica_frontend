const eventData = {
  summit: {
    id: "GICA-EVT-2026-001",
    title: "GICA Creator Economy Summit 2026",
    short: "CREATOR\nECONOMY\nSUMMIT",
    date: "Sunday, 18 October 2026",
    dateShort: "18 OCT 2026",
    time: "09:00–18:00 GST",
    location: "Dubai, United Arab Emirates",
    price: "Free for eligible members",
    capacity: "Limited to 500 attendees",
  },
  "media-kit": {
    id: "GICA-EVT-2026-002",
    title: "Build a Brand-Ready Media Kit",
    short: "MEDIA\nKIT\nLAB",
    date: "Thursday, 5 November 2026",
    dateShort: "05 NOV 2026",
    time: "14:00–17:00 IST",
    location: "Mumbai, India",
    price: "₹499 per creator",
    capacity: "Limited workshop seating",
  },
  finance: {
    id: "GICA-EVT-2026-003",
    title: "Creator Finance Essentials",
    short: "FINANCE\nESSENTIALS",
    date: "Sunday, 22 November 2026",
    dateShort: "22 NOV 2026",
    time: "18:30–20:00 IST",
    location: "Global online event",
    price: "Free registration",
    capacity: "Online seats available",
  },
  connect: {
    id: "GICA-EVT-2026-004",
    title: "GICA Creator Connect — Kochi",
    short: "CREATOR\nCONNECT",
    date: "Saturday, 12 December 2026",
    dateShort: "12 DEC 2026",
    time: "16:00–19:00 IST",
    location: "Kochi, India",
    price: "GICA members only",
    capacity: "Limited community seating",
  },
};
const params = new URLSearchParams(location.search);
const selectedKey = params.get("event") || "summit";
let selectedEvent = eventData[selectedKey] || eventData.summit;
const selectedImages = {
  summit: "images/event-creator-summit.webp",
  "media-kit": "images/event-media-kit.webp",
  finance: "images/event-finance.webp",
  connect: "images/event-creator-connect.webp",
};

const filters = [...document.querySelectorAll("[data-event-filter]")];
let cards = [...document.querySelectorAll("[data-event-type]")];
const search = document.querySelector("#event-search");
let activeFilter = "all";
function filterEvents() {
  const query = (search?.value || "").trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const typeMatch =
      activeFilter === "all" || card.dataset.eventType === activeFilter;
    const searchMatch =
      !query ||
      (card.dataset.search || card.textContent).toLowerCase().includes(query);
    const show = typeMatch && searchMatch;
    card.hidden = !show;
    if (show) visible++;
  });
  const empty = document.querySelector(".events-empty");
  if (empty) empty.hidden = visible !== 0;
}
filters.forEach((button) =>
  button.addEventListener("click", () => {
    filters.forEach((x) => x.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.eventFilter;
    filterEvents();
  }),
);
search?.addEventListener("input", filterEvents);

function hydrateDetail() {
  const title = document.querySelector(".booking-copy h1");
  if (!title) return;
  document.title = `${selectedEvent.title} | GICA Events`;
  title.textContent = selectedEvent.title;
  const date = document.querySelector(".booking-date");
  if (date)
    date.textContent = `${selectedEvent.date} · ${selectedEvent.time.split("–")[0]}`;
  const location = document.querySelector(".booking-location");
  if (location) location.textContent = selectedEvent.location;
  const poster = document.querySelector(".booking-poster b");
  if (poster) poster.innerHTML = eventHtml(selectedEvent.short).replaceAll("\n", "<br>");
  const posterDate = document.querySelector(".booking-poster i");
  if (posterDate) posterDate.textContent = selectedEvent.dateShort;
  const cta = document.querySelector(".booking-cta strong");
  if (cta) cta.textContent = selectedEvent.price;
  const cap = document.querySelector(".booking-cta span");
  if (cap) cap.textContent = selectedEvent.capacity;
  const summary = [...document.querySelectorAll(".booking-summary b")];
  if (summary[0])
    summary[0].textContent = selectedEvent.date.replace(/^[^,]+, /, "");
  if (summary[1]) summary[1].textContent = selectedEvent.time;
  const ticket = document.querySelector(".ticket-preview b");
  if (ticket) ticket.innerHTML = eventHtml(selectedEvent.short).replaceAll("\n", "<br>");
  const ticketDate = document.querySelector(".ticket-preview span");
  if (ticketDate)
    ticketDate.textContent = `${selectedEvent.dateShort} · ${selectedEvent.location}`;
}
hydrateDetail();
const bookingHeroImage = document.querySelector("#booking-hero-image");
if (bookingHeroImage) {
  bookingHeroImage.src = selectedImages[selectedKey] || selectedImages.summit;
  bookingHeroImage.alt = selectedEvent.title;
}

function eventHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

async function loadEvents() {
  try {
    if (document.querySelector('.booking-copy h1')) {
      const { event } = await GicaApi.request(`/api/events/${encodeURIComponent(selectedKey)}`);
      selectedEvent = event;
      hydrateDetail();
      if (bookingHeroImage && event.image) bookingHeroImage.src = event.image;
      document.body.classList.add('event-ready');
      return;
    }
    const { events } = await GicaApi.request('/api/events');
    const posters = document.querySelector('.poster-grid');
    const compact = document.querySelector('.compact-events');
    const banner = document.querySelector('.ticket-banner');
    const summit = events.find(item => item.slug === 'summit');
    if (banner) {
      banner.hidden = !summit;
      if (summit) {
        banner.querySelector('h1').textContent = summit.title;
        banner.querySelector('.ticket-banner-image').src = summit.image;
        banner.querySelector('.banner-poster small').textContent = summit.dateShort;
        banner.querySelector('.banner-poster b').innerHTML = eventHtml(summit.short || summit.title).replaceAll('\n', '<br>');
        banner.querySelector('.banner-poster span').textContent = summit.location;
      }
    }
    if (posters) posters.innerHTML = events.map(item => {
      const href = `event-details.html?event=${encodeURIComponent(item.slug)}`;
      return `<article class="poster-event" data-event-type="${eventHtml(item.eventType || 'conference')}" data-search="${eventHtml(`${item.title} ${item.location}`.toLowerCase())}"><a class="event-poster-link" href="${href}"><div class="poster-art poster-red"><img src="${eventHtml(item.image)}" alt="${eventHtml(item.title)}"><small>GICA PRESENTS</small><b>${eventHtml(item.short || item.title).replaceAll('\n', '<br>')}</b><i>${eventHtml(item.location)}</i></div></a><div class="poster-info"><h3>${eventHtml(item.title)}</h3><p>${eventHtml(item.location)}</p><small>${eventHtml(item.date)} · ${eventHtml(item.time)}</small><div><a href="${href}">View</a><a class="register-pill" href="${href}#event-register">Register</a></div></div></article>`;
    }).join('');
    if (compact) compact.innerHTML = events.map(item => {
      const href = `event-details.html?event=${encodeURIComponent(item.slug)}`;
      return `<a href="${href}" data-event-type="${eventHtml(item.eventType || 'conference')}" data-search="${eventHtml(`${item.title} ${item.location}`.toLowerCase())}"><span class="compact-date">${eventHtml(item.dateShort)}</span><div><h3>${eventHtml(item.title)}</h3><p>${eventHtml(item.location)} · ${eventHtml(item.time)}</p></div><i>${eventHtml(item.price)}</i><strong>View & register →</strong></a>`;
    }).join('');
    cards = [...document.querySelectorAll('[data-event-type]')];
    filterEvents();
    document.body.classList.add('events-ready');
  } catch (error) {
    if (document.querySelector('.booking-copy h1')) {
      document.querySelector('.booking-copy h1').textContent = error.message;
      form?.setAttribute('hidden', '');
      document.body.classList.add('event-ready');
    } else {
      const posters = document.querySelector('.poster-grid');
      const compact = document.querySelector('.compact-events');
      if (posters) posters.innerHTML = '';
      if (compact) compact.innerHTML = '';
      const empty = document.querySelector('.events-empty');
      if (empty) { empty.hidden = false; empty.textContent = error.message; }
      document.querySelector('.ticket-banner')?.setAttribute('hidden', '');
      document.body.classList.add('events-ready');
    }
  }
}
loadEvents();

const form = document.querySelector("#event-registration-form");
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const status = document.querySelector(".event-form-status");
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  try {
    const result = await GicaApi.request(`/api/events/${encodeURIComponent(selectedEvent.eventId || selectedEvent.id)}/registrations`, {
      method: "POST", body: data,
    });
    status.classList.remove("error");
    status.textContent = `Registration confirmed. Reference: ${result.registration.reference}. View it in Creator Panel → Events.`;
    form.reset();
  } catch (error) {
    status.classList.add("error");
    status.textContent = error.message;
  } finally {
    if (button) button.disabled = false;
  }
});
document.querySelector("#share-event")?.addEventListener("click", async () => {
  const data = {
    title: selectedEvent.title,
    text: selectedEvent.title,
    url: location.href,
  };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(location.href);
      const button = document.querySelector("#share-event");
      button.textContent = "Link copied ✓";
      setTimeout(() => (button.textContent = "Share"), 1800);
    }
  } catch {}
});
