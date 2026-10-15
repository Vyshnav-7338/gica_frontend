const adminSession = (() => {
  try {
    return JSON.parse(localStorage.getItem("gicaAdminSession") || "null");
  } catch {
    return null;
  }
})();
const adminBody = document.querySelector(".panel-body");
const adminNav = document.querySelector(".panel-sidebar nav");
const adminEscape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
const itemsForAdmin = [
  "dashboard",
  "creators",
  "membership",
  "inquiries",
  "collaborations",
  "opportunities",
  "applications",
  "events",
  "registrations",
  "finance",
  "network",
  "analytics",
  "moderation",
  "settings",
];

if (!adminSession?.token) {
  location.replace("admin-login.html");
} else {
  adminBody.textContent = "Loading admin data…";
  document.body.classList.add("admin-ready");
  const items = [
    ["Dashboard", "dashboard"],
    ["Creators", "creators"],
    ["Membership", "membership"],
    ["Inquiries", "inquiries"],
    ["Collaborations", "collaborations"],
    ["Opportunities", "opportunities"],
    ["Applications", "applications"],
    ["Events", "events"],
    ["Registrations", "registrations"],
    ["Finance", "finance"],
    ["Network", "network"],
    ["Analytics", "analytics"],
    ["Moderation", "moderation"],
    ["Settings", "settings"],
  ];
  adminNav.innerHTML = items
    .map(
      ([label, id]) =>
        `<a href="#${id}" data-admin="${id}">${adminEscape(label)}</a>`,
    )
    .join("");
  document
    .querySelector(".panel-logout")
    ?.addEventListener("click", () =>
      localStorage.removeItem("gicaAdminSession"),
    );
  document.querySelector(".panel-user b").textContent =
    adminSession.user?.name || "Admin";
  adminNav.querySelectorAll("[data-admin]").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showAdmin(link.dataset.admin);
    }),
  );
  showAdmin(location.hash.slice(1) || "dashboard");
}

async function api(path, options = {}) {
  return GicaApi.request(path, { ...options, token: adminSession.token });
}

function setActive(name) {
  adminNav
    .querySelectorAll("[data-admin]")
    .forEach((link) =>
      link.classList.toggle("active", link.dataset.admin === name),
    );
  document.querySelector(".panel-top h1").textContent =
    {
      dashboard: "GICA Admin Dashboard",
      creators: "Creators",
      inquiries: "Inquiries",
      events: "Events",
      registrations: "Event registrations",
      membership: "Membership",
      collaborations: "Collaborations",
      opportunities: "Opportunities",
      applications: "Opportunity applications",
      finance: "Finance",
      network: "Network",
      analytics: "Analytics",
      moderation: "Moderation",
      settings: "Settings",
    }[name] || "GICA Admin Dashboard";
  history.replaceState(null, "", `#${name}`);
}

async function showAdmin(name) {
  if (!itemsForAdmin.includes(name)) name = "dashboard";
  setActive(name);
  adminBody.textContent = "Loading…";
  try {
    if (name === "dashboard")
      return renderOverview((await api("/api/admin/overview")).overview);
    if (name === "creators")
      return renderCreators((await api("/api/admin/creators")).creators);
    if (name === "membership" || name === "moderation")
      return renderCreators((await api("/api/admin/creators")).creators);
    if (name === "inquiries")
      return renderInquiries((await api("/api/inquiries?limit=100")).inquiries);
    if (name === "events")
      return renderEvents((await api("/api/admin/events")).events);
    if (name === "registrations")
      return renderRegistrations(
        (await api("/api/admin/registrations")).registrations,
      );
    if (name === "opportunities")
      return renderOpportunities(
        (await api("/api/admin/opportunities")).opportunities,
      );
    if (name === "applications")
      return renderApplications(
        (await api("/api/admin/opportunity-applications")).applications,
      );
    if (["collaborations", "finance", "network"].includes(name))
      return renderWorkspaces(
        (await api("/api/admin/workspaces")).workspaces,
        name,
      );
    if (name === "analytics")
      return renderOverview((await api("/api/admin/overview")).overview);
    if (name === "settings") {
      adminBody.textContent = `Signed in as ${adminSession.user?.email || "administrator"}.`;
      return;
    }
  } catch (error) {
    adminBody.textContent = error.message;
  }
}

function renderOverview(data) {
  adminBody.innerHTML = `<div class="kpi-grid admin-kpis">
    <article><span>TOTAL CREATORS</span><strong>${data.creators}</strong></article>
    <article><span>PENDING EMAIL VERIFICATION</span><strong>${data.pendingVerification}</strong></article>
    <article><span>PUBLIC INQUIRIES</span><strong>${data.inquiries}</strong></article>
    <article><span>EVENT REGISTRATIONS</span><strong>${data.registrations}</strong></article>
    </div><section class="panel-box"><div class="box-head"><h2>Recent creators</h2></div><div class="admin-table"><div class="table-row table-head"><span>CREATOR</span><span>CATEGORY</span><span>STATUS</span><span>VERIFIED</span></div>${data.recentCreators.map((user) => `<div class="table-row"><span><b>${adminEscape(user.name)}</b><small>${adminEscape(user.creatorId)}</small></span><span>${adminEscape(user.category)}</span><span>${adminEscape(user.status)}</span><span>${user.isEmailVerified ? "YES" : "NO"}</span></div>`).join("")}</div></section>`;
}

function renderCreators(creators) {
  adminBody.innerHTML = `<section class="panel-box"><h2>Creator accounts</h2><p>Update account status and email verification.</p><div class="admin-table"><div class="table-row table-head"><span>CREATOR</span><span>CATEGORY</span><span>STATUS</span><span>ACTION</span></div>${creators.map((user) => `<div class="table-row" data-creator-id="${adminEscape(user._id)}"><span><b>${adminEscape(user.name)}</b><small>${adminEscape(user.email)}</small></span><span>${adminEscape(user.category)}</span><span><select class="creator-status">${["active", "inactive", "suspended"].map((value) => `<option value="${value}" ${user.status === value ? "selected" : ""}>${value}</option>`).join("")}</select><label><input type="checkbox" class="creator-verified" ${user.isEmailVerified ? "checked" : ""}> Email verified</label></span><button class="save-creator">Save</button></div>`).join("")}</div><p class="form-status" role="status"></p></section>`;
  adminBody.querySelectorAll(".save-creator").forEach((button) =>
    button.addEventListener("click", async () => {
      const row = button.closest("[data-creator-id]");
      const status = adminBody.querySelector(".form-status");
      button.disabled = true;
      try {
        await api(`/api/admin/creators/${row.dataset.creatorId}`, {
          method: "PATCH",
          body: {
            status: row.querySelector(".creator-status").value,
            isEmailVerified: row.querySelector(".creator-verified").checked,
          },
        });
        status.textContent = "Creator updated.";
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    }),
  );
}

function renderInquiries(inquiries) {
  adminBody.innerHTML = `<section class="panel-box"><h2>Public enquiries</h2><div class="admin-table"><div class="table-row table-head"><span>CONTACT</span><span>CATEGORY</span><span>STATUS</span><span>ACTION</span></div>${inquiries.map((item) => `<div class="table-row" data-inquiry-id="${adminEscape(item._id)}"><span><b>${adminEscape(item.name)}</b><small>${adminEscape(item.email)}</small><small>${adminEscape(item.message)}</small></span><span>${adminEscape(item.category)}</span><span><select class="inquiry-status">${["new", "in_progress", "resolved"].map((value) => `<option value="${value}" ${item.status === value ? "selected" : ""}>${value}</option>`).join("")}</select></span><button class="save-inquiry">Save</button></div>`).join("")}</div><p class="form-status" role="status"></p></section>`;
  adminBody.querySelectorAll(".save-inquiry").forEach((button) =>
    button.addEventListener("click", async () => {
      const row = button.closest("[data-inquiry-id]");
      const status = adminBody.querySelector(".form-status");
      button.disabled = true;
      try {
        await api(`/api/inquiries/${row.dataset.inquiryId}`, {
          method: "PATCH",
          body: { status: row.querySelector("select").value },
        });
        status.textContent = "Enquiry updated.";
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    }),
  );
}

function renderEvents(events) {
  adminBody.innerHTML = `<section class="panel-box"><h2>Events</h2><div class="admin-table"><div class="table-row table-head"><span>EVENT</span><span>DATE</span><span>STATUS</span><span>ACTION</span></div>${events.map((item) => `<div class="table-row" data-event-slug="${adminEscape(item.slug)}"><span><b>${adminEscape(item.title)}</b><small>${adminEscape(item.eventId)}</small></span><span>${adminEscape(item.date)}</span><span><label><input type="checkbox" ${item.active ? "checked" : ""}> Active</label></span><button class="save-event">Save</button></div>`).join("")}</div><p class="form-status" role="status"></p></section><section class="panel-box"><h2>Add event</h2><form id="admin-event-form" class="auth-form">${["eventId", "slug", "title", "date", "time", "location", "price", "capacity", "short", "dateShort", "image"].map((key) => `<label>${key}<input name="${key}" ${["price", "capacity", "short", "dateShort", "image"].includes(key) ? "" : "required"}></label>`).join("")}<label>Type<select name="eventType">${["conference", "workshop", "online", "networking"].map((type) => `<option>${type}</option>`).join("")}</select></label><button class="panel-primary" type="submit">Add event</button><p class="form-status" role="status"></p></form></section>`;
  adminBody.querySelectorAll(".save-event").forEach((button) =>
    button.addEventListener("click", async () => {
      const row = button.closest("[data-event-slug]");
      try {
        await api(`/api/events/${encodeURIComponent(row.dataset.eventSlug)}`, {
          method: "PATCH",
          body: { active: row.querySelector("input").checked },
        });
        adminBody.querySelector(".form-status").textContent = "Event updated.";
      } catch (error) {
        adminBody.querySelector(".form-status").textContent = error.message;
      }
    }),
  );
  adminBody
    .querySelector("#admin-event-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const status = form.querySelector(".form-status");
      try {
        await api("/api/events", {
          method: "POST",
          body: Object.fromEntries(new FormData(form)),
        });
        showAdmin("events");
      } catch (error) {
        status.textContent = error.message;
      }
    });
}

function renderRegistrations(registrations) {
  adminBody.innerHTML = `<section class="panel-box"><h2>Event registrations</h2><div class="admin-table"><div class="table-row table-head"><span>ATTENDEE</span><span>EVENT</span><span>REFERENCE</span><span>DATE</span></div>${registrations.map((item) => `<div class="table-row"><span><b>${adminEscape(item.name)}</b><small>${adminEscape(item.email)}</small></span><span>${adminEscape(item.eventId)}</span><span>${adminEscape(item.reference)}</span><span>${adminEscape(new Date(item.createdAt).toLocaleDateString())}</span></div>`).join("")}</div></section>`;
}

function renderOpportunities(opportunities) {
  adminBody.innerHTML = `<section class="panel-box"><h2>Published opportunities</h2><div class="admin-table"><div class="table-row table-head"><span>TITLE</span><span>SKILL</span><span>ACTIVE</span><span>ACTION</span></div>${opportunities.map((item) => `<div class="table-row" data-id="${adminEscape(item._id)}"><span><b>${adminEscape(item.title)}</b><small>${adminEscape(item.details)}</small></span><span>${adminEscape(item.skill)}</span><span><input type="checkbox" ${item.active ? "checked" : ""}></span><button class="save-opportunity">Save</button></div>`).join("")}</div><p class="form-status"></p></section><section class="panel-box"><h2>Add opportunity</h2><form id="admin-opportunity-form" class="auth-form"><label>Title<input name="title" required maxlength="200"></label><label>Skill<input name="skill" maxlength="100"></label><label>Details<textarea name="details" required maxlength="3000"></textarea></label><button class="panel-primary" type="submit">Publish</button><p class="form-status"></p></form></section>`;
  adminBody.querySelectorAll(".save-opportunity").forEach((button) =>
    button.addEventListener("click", async () => {
      const row = button.closest("[data-id]");
      try {
        await api(`/api/opportunities/${row.dataset.id}`, {
          method: "PATCH",
          body: { active: row.querySelector("input").checked },
        });
        adminBody.querySelector(".form-status").textContent =
          "Opportunity updated.";
      } catch (error) {
        adminBody.querySelector(".form-status").textContent = error.message;
      }
    }),
  );
  adminBody
    .querySelector("#admin-opportunity-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      try {
        await api("/api/opportunities", {
          method: "POST",
          body: Object.fromEntries(new FormData(form)),
        });
        showAdmin("opportunities");
      } catch (error) {
        form.querySelector(".form-status").textContent = error.message;
      }
    });
}

function renderApplications(applications) {
  adminBody.innerHTML = `<section class="panel-box"><h2>Opportunity applications</h2><div class="admin-table"><div class="table-row table-head"><span>CREATOR</span><span>OPPORTUNITY</span><span>STATUS</span><span>ACTION</span></div>${applications.map((item) => `<div class="table-row" data-id="${adminEscape(item._id)}"><span><b>${adminEscape(item.user?.name)}</b><small>${adminEscape(item.user?.email)}</small></span><span>${adminEscape(item.opportunity?.title)}</span><span><select>${["submitted", "reviewing", "accepted", "declined"].map((value) => `<option ${item.status === value ? "selected" : ""}>${value}</option>`).join("")}</select></span><button class="save-application">Save</button></div>`).join("")}</div><p class="form-status"></p></section>`;
  adminBody.querySelectorAll(".save-application").forEach((button) =>
    button.addEventListener("click", async () => {
      const row = button.closest("[data-id]");
      try {
        await api(`/api/admin/opportunity-applications/${row.dataset.id}`, {
          method: "PATCH",
          body: { status: row.querySelector("select").value },
        });
        adminBody.querySelector(".form-status").textContent =
          "Application updated.";
      } catch (error) {
        adminBody.querySelector(".form-status").textContent = error.message;
      }
    }),
  );
}

function renderWorkspaces(workspaces, type) {
  const rows = [];
  workspaces.forEach((item) => {
    const creator = item.user;
    if (!creator) return;
    if (type === "collaborations")
      (item.collaborations || []).forEach((record) =>
        rows.push([creator.name, record.title, record.status, record.amount]),
      );
    if (type === "finance")
      (item.invoices || []).forEach((record) =>
        rows.push([creator.name, record.client, record.status, record.amount]),
      );
    if (type === "network")
      rows.push([
        creator.name,
        `${item.network?.connections?.length || 0} connections`,
        `${item.network?.referrals?.length || 0} referrals`,
        `${item.network?.circles?.length || 0} circles`,
      ]);
  });
  adminBody.innerHTML = `<section class="panel-box"><h2>${adminEscape(type)}</h2><div class="admin-table"><div class="table-row table-head"><span>CREATOR</span><span>RECORD</span><span>STATUS</span><span>VALUE</span></div>${rows.map((row) => `<div class="table-row">${row.map((value) => `<span>${adminEscape(value)}</span>`).join("")}</div>`).join("")}</div>${rows.length ? "" : "<p>No records yet.</p>"}</section>`;
}
