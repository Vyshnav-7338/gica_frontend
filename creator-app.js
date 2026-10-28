(() => {
  const STORAGE = "gicaCreatorAppV1";
  const SESSION = "gicaCreatorSession";

  let session = null;

  try {
    session = JSON.parse(
      localStorage.getItem(SESSION) || "null"
    );
  } catch (error) {
    console.error("Session parse error:", error);
    session = null;
  }

  let accountUser = session?.user || null;

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[char]
    );

  /* =========================================================
     DEFAULT DATA
  ========================================================= */

  const defaults = {
    profile: {
      name: "",
      username: "",
      type: "",
      category: "",
      country: "",
      city: "",
      headline: "",
      bio: "",
      email: "",
      mobile: "",
    },

    portfolio: [],

    services: [],

    inquiries: [],

    invoices: [],

    collaborations: [],

    applications: [],

    profileViews: 0,

    isPublic: true,
    showPortfolio: true,
    acceptInquiries: true,

    settings: {
      loginNotifications: true,
      twoFactor: false,
    },

    network: {
      circles: [],
      connections: [],
      availability:
        "Available for Collaboration",
      referrals: [],
      posts: [],
      boardPosts: [],
      meetingRsvp: false,
    },

    eventRegistrations: [],
  };

  /* =========================================================
     LOAD LOCAL DATA
  ========================================================= */

  let state;

  try {
    const saved =
      JSON.parse(
        localStorage.getItem(STORAGE) || "{}"
      );

    state = {
      ...defaults,
      ...saved,

      profile: {
        ...defaults.profile,
        ...(saved.profile || {}),
      },

      settings: {
        ...defaults.settings,
        ...(saved.settings || {}),
      },

      network: {
        ...defaults.network,
        ...(saved.network || {}),
      },

      portfolio: Array.isArray(saved.portfolio)
        ? saved.portfolio
        : [],

      services: Array.isArray(saved.services)
        ? saved.services
        : [],

      inquiries: Array.isArray(saved.inquiries)
        ? saved.inquiries
        : [],

      invoices: Array.isArray(saved.invoices)
        ? saved.invoices
        : [],

      collaborations: Array.isArray(
        saved.collaborations
      )
        ? saved.collaborations
        : [],

      applications: Array.isArray(
        saved.applications
      )
        ? saved.applications
        : [],

      eventRegistrations: Array.isArray(
        saved.eventRegistrations
      )
        ? saved.eventRegistrations
        : [],
    };
  } catch (error) {
    console.error(
      "Local data parse error:",
      error
    );

    state = structuredClone(defaults);
  }

  /* =========================================================
     SESSION USER → PROFILE
  ========================================================= */

  if (accountUser) {
    state.profile.name =
      accountUser.name ||
      state.profile.name ||
      "";

    state.profile.username =
      accountUser.username ||
      state.profile.username ||
      "";

    state.profile.type =
      accountUser.creatorType ||
      state.profile.type ||
      "";

    state.profile.category =
      accountUser.category ||
      state.profile.category ||
      "";

    state.profile.country =
      accountUser.country ||
      state.profile.country ||
      "";

    state.profile.email =
      accountUser.email ||
      state.profile.email ||
      "";

    state.profile.mobile =
      accountUser.mobile ||
      state.profile.mobile ||
      "";

    state.profile.city =
      accountUser.city ??
      state.profile.city ??
      "";

    state.profile.headline =
      accountUser.professionalHeadline ??
      accountUser.headline ??
      state.profile.headline ??
      "";

    state.profile.bio =
      accountUser.bio ??
      state.profile.bio ??
      "";

    if (typeof accountUser.isPublic === "boolean") {
      state.isPublic = accountUser.isPublic;
    }

    if (typeof accountUser.showPortfolio === "boolean") {
      state.showPortfolio = accountUser.showPortfolio;
    }

    if (typeof accountUser.acceptInquiries === "boolean") {
      state.acceptInquiries = accountUser.acceptInquiries;
    }
  }

  /* =========================================================
     SAVE LOCAL
  ========================================================= */

  function save() {
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify(state)
      );

      renderLiveSummary();

      return Promise.resolve(state);
    } catch (error) {
      console.error(
        "Local save error:",
        error
      );

      toast(
        "Unable to save data.",
        true
      );

      return Promise.reject(error);
    }
  }

  /* =========================================================
     TOAST
  ========================================================= */

  function toast(
    message,
    error = false
  ) {
    let element =
      $(".app-toast");

    if (!element) {
      element =
        document.createElement("div");

      element.className =
        "app-toast";

      document.body.appendChild(
        element
      );
    }

    element.textContent =
      message;

    element.classList.toggle(
      "error",
      error
    );

    element.classList.add(
      "show"
    );

    clearTimeout(
      element.timer
    );

    element.timer =
      setTimeout(() => {
        element.classList.remove(
          "show"
        );
      }, 2600);
  }

  /* =========================================================
     MODAL
  ========================================================= */

  function modal(
    title,
    fields,
    onSubmit
  ) {
    const wrap =
      document.createElement("div");

    wrap.className =
      "app-modal";

    const fieldsHtml =
      fields
        .map((field) => {
          const value =
            field.value || "";

          if (
            field.type === "select"
          ) {
            return `
              <label>
                ${esc(field.label)}

                <select
                  name="${esc(field.name)}"
                >
                  ${(field.options || [])
                    .map(
                      (option) => `
                        <option
                          value="${esc(option)}"
                          ${
                            option === value
                              ? "selected"
                              : ""
                          }
                        >
                          ${esc(option)}
                        </option>
                      `
                    )
                    .join("")}
                </select>
              </label>
            `;
          }

          if (
            field.type === "textarea"
          ) {
            return `
              <label>
                ${esc(field.label)}

                <textarea
                  name="${esc(field.name)}"
                  rows="4"
                >${esc(value)}</textarea>
              </label>
            `;
          }

          return `
            <label>
              ${esc(field.label)}

              <input
                name="${esc(field.name)}"
                type="${esc(
                  field.type ||
                    "text"
                )}"
                value="${esc(value)}"
              />
            </label>
          `;
        })
        .join("");

    wrap.innerHTML = `
      <div class="app-modal-card">

        <button
          class="modal-close"
          type="button"
        >
          ×
        </button>

        <span>
          GICA CREATOR PANEL
        </span>

        <h2>
          ${esc(title)}
        </h2>

        <form>
          ${fieldsHtml}

          <button
            class="panel-primary"
            type="submit"
          >
            Save
          </button>
        </form>

      </div>
    `;

    document.body.appendChild(
      wrap
    );

    requestAnimationFrame(
      () => {
        wrap.classList.add(
          "open"
        );
      }
    );

    function close() {
      wrap.classList.remove(
        "open"
      );

      setTimeout(
        () => wrap.remove(),
        180
      );
    }

    $(".modal-close", wrap)
      ?.addEventListener(
        "click",
        close
      );

    wrap.addEventListener(
      "click",
      (event) => {
        if (
          event.target === wrap
        ) {
          close();
        }
      }
    );

    $("form", wrap)
      ?.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();

          const data =
            Object.fromEntries(
              new FormData(
                event.currentTarget
              )
            );

          onSubmit(data);

          close();
        }
      );
  }

  /* =========================================================
     DOWNLOAD
  ========================================================= */

  function download(
    name,
    content,
    type = "text/plain"
  ) {
    const blob =
      new Blob(
        [content],
        { type }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement("a");

    link.href = url;
    link.download = name;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      500
    );
  }

  /* =========================================================
     IDENTITY
  ========================================================= */

  function applyIdentity() {
    const name =
      state.profile.name ||
      "Creator";

    const firstName =
      name
        .trim()
        .split(/\s+/)[0] ||
      "Creator";

    $$(".panel-user b")
      .forEach(
        (element) => {
          element.textContent =
            name;
        }
      );

    const creatorId =
      accountUser?.creatorId ||
      "—";

    const idElement =
      $(".panel-user small");

    if (idElement) {
      idElement.textContent =
        creatorId;
    }

    const greeting =
      $(
        "#panel-dashboard .welcome-copy > span"
      );

    const hour =
      new Date().getHours();

    let dayPart =
      "GOOD EVENING";

    if (hour < 12) {
      dayPart =
        "GOOD MORNING";
    } else if (
      hour < 17
    ) {
      dayPart =
        "GOOD AFTERNOON";
    }

    if (greeting) {
      greeting.textContent =
        `${dayPart}, ${firstName.toUpperCase()}`;
    }

    const dashboard =
      $("#panel-dashboard");

    if (dashboard) {
      dashboard.dataset.title =
        `Welcome, ${firstName}.`;
    }

    const title =
      $("#panel-title");

    if (
      title &&
      (
        !location.hash ||
        location.hash ===
          "#dashboard"
      )
    ) {
      title.textContent =
        `Welcome, ${firstName}.`;
    }

    const headerImage =
      $(".panel-user img");

    if (headerImage) {
      headerImage.alt =
        `${name} profile`;
    }

    document.title =
      `${name} | GICA Creator Panel`;
  }

  /* =========================================================
     DASHBOARD SUMMARY
  ========================================================= */

  function renderLiveSummary() {
    const set = (
      selector,
      value
    ) => {
      const element =
        $(selector);

      if (element) {
        element.textContent =
          value;
      }
    };

    const pendingInvoices =
      state.invoices.filter(
        (item) =>
          item.status ===
            "PENDING" ||
          item.status ===
            "OVERDUE"
      );

    const amount = (
      item
    ) =>
      Number(
        String(
          item.amount || ""
        ).replace(
          /[^0-9.]/g,
          ""
        )
      ) || 0;

    const pendingAmount =
      pendingInvoices.reduce(
        (sum, item) =>
          sum + amount(item),
        0
      );

    const totalAmount =
      state.invoices.reduce(
        (sum, item) =>
          sum + amount(item),
        0
      );

    const paidAmount =
      state.invoices
        .filter(
          (item) =>
            item.status ===
            "PAID"
        )
        .reduce(
          (sum, item) =>
            sum +
            amount(item),
          0
        );

    const rupees = (
      value
    ) =>
      `₹${Number(
        value || 0
      ).toLocaleString(
        "en-IN"
      )}`;

    const views =
      Number(
        state.profileViews
      ) || 0;

    const newInquiries =
      state.inquiries.filter(
        (item) =>
          item.status ===
          "NEW"
      ).length;

    set(
      "#panel-dashboard .welcome-copy p",
      `${views} profile views and ${newInquiries} new inquiries.`
    );

    const filled =
      [
        state.profile.headline,
        state.profile.bio,
        state.profile.city,
        state.portfolio.length,
        state.services.length,
      ].filter(Boolean)
        .length;

    const completion =
      Math.round(
        (filled / 5) * 100
      );

    set(
      "#panel-dashboard .completion-card h2",
      `Your professional profile is ${completion}% complete.`
    );

    set(
      "#panel-dashboard .progress-ring strong",
      `${completion}%`
    );

    const cards =
      $$(
        "#panel-dashboard .kpi-grid article"
      );

    const values = [
      [
        "PROFILE VIEWS",
        views,
      ],
      [
        "NEW INQUIRIES",
        newInquiries,
      ],
      [
        "ACTIVE COLLABS",
        state.collaborations
          .length,
      ],
      [
        "PENDING INVOICES",
        rupees(
          pendingAmount
        ),
      ],
    ];

    cards.forEach(
      (card, index) => {
        if (
          !values[index]
        ) {
          return;
        }

        const label =
          card.querySelector(
            "span"
          );

        const value =
          card.querySelector(
            "strong"
          );

        const small =
          card.querySelector(
            "small"
          );

        if (label) {
          label.textContent =
            values[index][0];
        }

        if (value) {
          value.textContent =
            values[index][1];
        }

        if (small) {
          small.textContent =
            "Local data";
        }
      }
    );

    const financeCards =
      $$(
        "#panel-finance .kpi-grid article"
      );

    const financeValues = [
      [
        "INVOICED",
        rupees(totalAmount),
      ],
      [
        "MARKED PAID",
        rupees(paidAmount),
      ],
      [
        "PENDING",
        rupees(
          pendingAmount
        ),
      ],
      [
        "INVOICE COUNT",
        state.invoices
          .length,
      ],
    ];

    financeCards.forEach(
      (card, index) => {
        if (
          !financeValues[
            index
          ]
        ) {
          return;
        }

        const label =
          card.querySelector(
            "span"
          );

        const value =
          card.querySelector(
            "strong"
          );

        if (label) {
          label.textContent =
            financeValues[
              index
            ][0];
        }

        if (value) {
          value.textContent =
            financeValues[
              index
            ][1];
        }
      }
    );

    const creatorId =
      accountUser?.creatorId ||
      "—";

    set(
      "#profile-creator-id",
      creatorId
    );

    set(
      "#panel-membership .member-id-large",
      creatorId
    );

    if (
      accountUser
        ?.isEmailVerified
    ) {
      set(
        "#panel-membership .verification-seal span",
        "EMAIL VERIFIED"
      );
    } else {
      set(
        "#panel-membership .verification-seal span",
        "NOT VERIFIED"
      );
    }

    set(
      ".panel-user small",
      creatorId
    );
  }

  /* =========================================================
     PROFILE
  ========================================================= */

  function renderProfile() {
    const setFieldValue = (selector, value) => {
      const element = $(selector);
      if (!element) return;
      element.value =
        value === undefined || value === null
          ? ""
          : String(value);
    };

    const creatorType =
      $("#profile-creator-type");

    if (creatorType) {
      const creatorTypes = [
        "",
        "Influencer",
        "Content Creator",
        "Digital Creator",
        "UGC Creator",
        "Creative Professional",
        "Other",
      ];

      const currentType =
        state.profile.type || "";

      if (
        currentType &&
        !creatorTypes.includes(currentType)
      ) {
        creatorTypes.push(currentType);
      }

      creatorType.replaceChildren(
        ...creatorTypes.map(
          (value) =>
            new Option(
              value || "Not added",
              value
            )
        )
      );

      creatorType.value = currentType;
    }

    setFieldValue(
      "#profile-name",
      state.profile.name
    );

    setFieldValue(
      "#profile-username",
      state.profile.username
    );

    setFieldValue(
      "#profile-category",
      state.profile.category
    );

    setFieldValue(
      "#profile-country",
      state.profile.country
    );

    setFieldValue(
      "#profile-mobile",
      state.profile.mobile
    );

    setFieldValue(
      "#profile-email",
      state.profile.email
    );

    setFieldValue(
      "#profile-status",
      accountUser?.status || ""
    );

    setFieldValue(
      "#profile-city",
      state.profile.city
    );

    setFieldValue(
      "#profile-headline",
      state.profile.headline
    );

    setFieldValue(
      "#profile-bio",
      state.profile.bio
    );

    const settings =
      $$(
        "#panel-settings .panel-form-grid input"
      );

    if (settings[0]) {
      settings[0].value =
        state.profile.email || "";
    }

    if (settings[1]) {
      settings[1].value =
        state.profile.mobile || "";
    }

    const publicLink =
      $("#profile-public-link") ||
      $("#panel-profile code");

    if (publicLink) {
      const username =
        state.profile.username || "";

      publicLink.textContent =
        username
          ? `gica.global/@${username}`
          : "gica.global/@";
    }

    const visibility =
      $$(
        "#panel-profile .setting-row input[type='checkbox']"
      );

    if (visibility[0]) {
      visibility[0].checked =
        state.isPublic !== false;
    }

    if (visibility[1]) {
      visibility[1].checked =
        state.showPortfolio !== false;
    }

    if (visibility[2]) {
      visibility[2].checked =
        state.acceptInquiries !== false;
    }
  }

  /* =========================================================
     PROFILE SAVE
  ========================================================= */

  function bindProfileSave() {
    const saveButton =
      $("#save-profile-btn") ||
      $(
        "#panel-profile .panel-page-head .panel-primary"
      );

    if (!saveButton) {
      return;
    }

    saveButton.onclick =
      () => {
        state.profile.name =
          $("#profile-name")
            ?.value
            ?.trim() || "";

        state.profile.username =
          $("#profile-username")
            ?.value
            ?.trim() || "";

        state.profile.type =
          $("#profile-creator-type")
            ?.value
            ?.trim() || "";

        state.profile.category =
          $("#profile-category")
            ?.value
            ?.trim() || "";

        state.profile.country =
          $("#profile-country")
            ?.value
            ?.trim() || "";

        state.profile.mobile =
          $("#profile-mobile")
            ?.value
            ?.trim() || "";

        state.profile.email =
          $("#profile-email")
            ?.value
            ?.trim() || "";

        state.profile.city =
          $("#profile-city")
            ?.value
            ?.trim() || "";

        state.profile.headline =
          $("#profile-headline")
            ?.value
            ?.trim() || "";

        state.profile.bio =
          $("#profile-bio")
            ?.value
            ?.trim() || "";

        const visibility =
          $$(
            "#panel-profile .setting-row input[type='checkbox']"
          );

        state.isPublic =
          Boolean(
            visibility[0]?.checked
          );

        state.showPortfolio =
          Boolean(
            visibility[1]?.checked
          );

        state.acceptInquiries =
          Boolean(
            visibility[2]?.checked
          );

        save();

        applyIdentity();

        renderProfile();
      };
  }
  
/* =========================================================
   PORTFOLIO API
========================================================= */

const PORTFOLIO_API = "http://localhost:7010/api/portfolio";

function getPortfolioId(item) {
  return String(item._id || item.id);
}

/* =========================================================
   LOAD PORTFOLIO FROM MONGODB
========================================================= */

async function loadPortfolio() {
  const root = $(".portfolio-manager");

  if (root) {
    root.innerHTML = "<p>Loading portfolio items...</p>";
  }

  try {
    const response = await fetch(PORTFOLIO_API);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load portfolio");
    }

    state.portfolio = (result.data || []).map((item) => ({
      ...item,
      id: String(item._id),
      meta: item.description,
      status: (item.visibility || "private").toUpperCase(),
      tone: "red"
    }));

    renderPortfolio();
  } catch (error) {
    console.error("Portfolio loading error:", error);

    if (root) {
      root.innerHTML = `
        <div class="network-empty">
          <h3>Unable to load portfolio</h3>
          <p>${esc(error.message)}</p>
        </div>
      `;
    }

    toast("Failed to load portfolio");
  }
}

/* =========================================================
   PORTFOLIO
========================================================= */

function renderPortfolio() {
  const root = $(".portfolio-manager");

  if (!root) {
    return;
  }

  if (!state.portfolio.length) {
    root.innerHTML = `
      <div class="network-empty">
        <h3>No portfolio items</h3>
        <p>Add your first portfolio item.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = state.portfolio.map((item, index) => `
    <article data-id="${esc(getPortfolioId(item))}">
      <div class="work-thumb ${esc(item.tone || "red")}">
        ${String(index + 1).padStart(2, "0")}
      </div>

      <div>
        <b>${esc(item.title)}</b>
        <small>${esc(item.meta || item.description || "")}</small>
      </div>

      <span class="status">
        ${esc(item.status || "PRIVATE")}
      </span>

      <div class="item-actions">
        <button type="button" class="item-edit">Edit</button>
        <button type="button" class="item-delete">Delete</button>
      </div>
    </article>
  `).join("");

  $$(".item-edit", root).forEach((button) => {
    button.onclick = () => {
      const id = button.closest("article").dataset.id;
      editPortfolio(id);
    };
  });

  $$(".item-delete", root).forEach((button) => {
    button.onclick = async () => {
      const id = button.closest("article").dataset.id;

      if (!confirm("Delete this portfolio item?")) {
        return;
      }

      try {
        const response = await fetch(
          `${PORTFOLIO_API}/${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to delete item");
        }

        state.portfolio = state.portfolio.filter(
          (item) => getPortfolioId(item) !== id
        );

        // Refresh frontend state and UI
        save();
        renderPortfolio();

        toast("Portfolio item deleted");
      } catch (error) {
        console.error("Portfolio delete error:", error);
        toast(error.message || "Failed to delete portfolio item");
      }
    };
  });
}

/* =========================================================
   ADD / EDIT PORTFOLIO
========================================================= */

function editPortfolio(id) {
  const item = id
    ? state.portfolio.find(
        (value) => getPortfolioId(value) === String(id)
      )
    : null;

  if (id && !item) {
    toast("Portfolio item not found");
    return;
  }

  modal(
    item ? "Edit portfolio item" : "Add portfolio item",
    [
      {
        label: "Title",
        name: "title",
        value: item?.title || ""
      },
      {
        label: "Description / platform",
        name: "meta",
        value: item?.description || item?.meta || ""
      },
      {
        label: "Visibility",
        name: "status",
        type: "select",
        value: item?.visibility || "private",
        options: ["public", "private"]
      }
    ],
    async (data) => {
      const title = (data.title || "").trim();
      const description = (data.meta || "").trim();
      const visibility = (data.status || "private").toLowerCase();

      if (!title || !description) {
        toast("Title and description are required");
        return;
      }

      try {
        const url = item
          ? `${PORTFOLIO_API}/${encodeURIComponent(getPortfolioId(item))}`
          : `${PORTFOLIO_API}/create`;

        const response = await fetch(url, {
          method: item ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title,
            description,
            visibility
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to save portfolio");
        }

        // Reload the actual database data
        await loadPortfolio();

        toast(item ? "Portfolio updated" : "Portfolio created");
      } catch (error) {
        console.error("Portfolio save error:", error);
        toast(error.message || "Failed to save portfolio");
      }
    }
  );
}


  /* =========================================================
     SERVICES
  ========================================================= */

  function renderServices() {
    const root =
      $(".service-manager");

    if (!root) {
      return;
    }

    if (
      !state.services.length
    ) {
      root.innerHTML =
        "<p>No services added yet.</p>";

      return;
    }

    root.innerHTML =
      state.services
        .map(
          (item) => `
            <article
              data-id="${item.id}"
            >

              <span>
                ${esc(
                  item.channel
                )}
              </span>

              <h3>
                ${esc(
                  item.title
                )}
              </h3>

              <p>
                ${esc(
                  item.description
                )}
              </p>

              <div>
                <b>
                  ${esc(
                    item.price
                  )}
                </b>

                <small>
                  ${esc(
                    item.delivery
                  )}
                </small>
              </div>

              <i>
                ${esc(
                  item.availability
                )}
              </i>

              <div
                class="service-actions"
              >
                <button
                  class="service-edit"
                >
                  Edit
                </button>

                <button
                  class="service-delete"
                >
                  Delete
                </button>
              </div>

            </article>
          `
        )
        .join("");

    $$(
      ".service-edit",
      root
    ).forEach(
      (button) => {
        button.onclick =
          () => {
            editService(
              Number(
                button.closest(
                  "article"
                ).dataset.id
              )
            );
          };
      }
    );

    $$(
      ".service-delete",
      root
    ).forEach(
      (button) => {
        button.onclick =
          () => {
            const id =
              Number(
                button.closest(
                  "article"
                ).dataset.id
              );

            if (
              !confirm(
                "Delete this service?"
              )
            ) {
              return;
            }

            state.services =
              state.services.filter(
                (item) =>
                  item.id !== id
              );

            save();

            renderServices();

            toast(
              "Service deleted"
            );
          };
      }
    );
  }

  function editService(
    id
  ) {
    const item =
      state.services.find(
        (value) =>
          value.id === id
      );

    modal(
      item
        ? "Edit creator service"
        : "Add creator service",

      [
        {
          label:
            "Service name",
          name: "title",
          value:
            item?.title,
        },

        {
          label: "Channel",
          name: "channel",
          value:
            item?.channel,
        },

        {
          label:
            "Description",
          name:
            "description",
          type: "textarea",
          value:
            item?.description,
        },

        {
          label:
            "Starting price",
          name: "price",
          value:
            item?.price,
        },

        {
          label:
            "Delivery time",
          name:
            "delivery",
          value:
            item?.delivery,
        },

        {
          label:
            "Availability",
          name:
            "availability",
          type: "select",
          value:
            item?.availability ||
            "Available",
          options: [
            "Available",
            "Limited",
            "Unavailable",
          ],
        },
      ],

      (data) => {
        if (item) {
          Object.assign(
            item,
            data
          );
        } else {
          state.services.push(
            {
              id: Date.now(),
              ...data,
            }
          );
        }

        save();

        renderServices();

        toast(
          "Service saved"
        );
      }
    );
  }

  /* =========================================================
     INQUIRIES
  ========================================================= */

  function renderInquiries(
    filter = "ALL"
  ) {
    const root =
      $(".data-list");

    if (!root) {
      return;
    }

    const list =
      state.inquiries.filter(
        (item) =>
          filter === "ALL" ||
          item.status ===
            filter
      );

    root.innerHTML = `
      <div class="data-head">
        <span>INQUIRY</span>
        <span>BRAND</span>
        <span>VALUE</span>
        <span>STATUS</span>
        <span></span>
      </div>

      ${list
        .map(
          (item) => `
            <article
              data-id="${esc(
                item.id
              )}"
            >

              <span>
                <b>
                  ${esc(
                    item.id
                  )}
                </b>

                <small>
                  ${esc(
                    item.project
                  )}
                </small>
              </span>

              <span>
                ${esc(
                  item.brand
                )}
              </span>

              <span>
                ${esc(
                  item.value
                )}
              </span>

              <span
                class="status"
              >
                ${esc(
                  item.status
                )}
              </span>

              <button
                class="inquiry-open"
              >
                Open
              </button>

            </article>
          `
        )
        .join("")}
    `;

    $$(
      ".inquiry-open",
      root
    ).forEach(
      (button) => {
        button.onclick =
          () => {
            openInquiry(
              button.closest(
                "article"
              ).dataset.id
            );
          };
      }
    );
  }

  function openInquiry(
    id
  ) {
    const item =
      state.inquiries.find(
        (value) =>
          value.id === id
      );

    if (!item) {
      return;
    }

    modal(
      `Manage ${id}`,

      [
        {
          label:
            "Project",
          name:
            "project",
          value:
            item.project,
        },

        {
          label:
            "Brand",
          name:
            "brand",
          value:
            item.brand,
        },

        {
          label:
            "Value",
          name:
            "value",
          value:
            item.value,
        },

        {
          label:
            "Status",
          name:
            "status",
          type: "select",
          value:
            item.status,
          options: [
            "NEW",
            "CONTACTED",
            "DISCUSSION",
            "QUOTATION",
            "CONVERTED",
            "COMPLETED",
            "SPAM",
          ],
        },
      ],

      (data) => {
        Object.assign(
          item,
          data
        );

        save();

        renderInquiries();

        toast(
          "Inquiry updated"
        );
      }
    );
  }

  /* =========================================================
     INVOICES
  ========================================================= */

  function renderInvoices() {
    const root =
      $(".simple-transactions");

    if (!root) {
      return;
    }

    if (
      !state.invoices.length
    ) {
      root.innerHTML =
        "<p>No invoices added yet.</p>";

      return;
    }

    root.innerHTML =
      state.invoices
        .map(
          (item) => `
            <div>

              <span>
                <b>
                  ${esc(
                    item.id
                  )}
                </b>

                <small>
                  ${esc(
                    item.client
                  )}
                </small>
              </span>

              <strong>
                ${esc(
                  item.amount
                )}
              </strong>

              <i class="status">
                ${esc(
                  item.status
                )}
              </i>

            </div>
          `
        )
        .join("");
  }

  function newInvoice() {
    modal(
      "Create invoice",

      [
        {
          label:
            "Client",
          name:
            "client",
        },

        {
          label:
            "Amount",
          name:
            "amount",
          value: "₹",
        },

        {
          label:
            "Status",
          name:
            "status",
          type: "select",
          value:
            "PENDING",
          options: [
            "PENDING",
            "PAID",
            "OVERDUE",
          ],
        },
      ],

      (data) => {
        state.invoices.unshift(
          {
            id:
              `GICA-INV-${String(
                Date.now()
              ).slice(-6)}`,
            ...data,
          }
        );

        save();

        renderInvoices();

        toast(
          "Invoice created"
        );
      }
    );
  }

  /* =========================================================
     COLLABORATIONS
  ========================================================= */

  function renderCollaborations() {
    const root =
      $(
        "#panel-collaborations .collab-board"
      );

    if (!root) {
      return;
    }

    const statuses = [
      "NEGOTIATION",
      "IN PRODUCTION",
      "CLIENT APPROVAL",
      "PAYMENT",
      "COMPLETED",
    ];

    root.innerHTML =
      statuses
        .map(
          (status) => {
            const list =
              state.collaborations.filter(
                (item) =>
                  item.status ===
                  status
              );

            return `
              <div>

                <h3>
                  ${status}
                  <b>
                    ${list.length}
                  </b>
                </h3>

                ${list
                  .map(
                    (
                      item
                    ) => `
                      <article
                        data-collab-id="${esc(
                          item.id
                        )}"
                      >

                        <span>
                          ${esc(
                            item.id
                          )}
                        </span>

                        <h4>
                          ${esc(
                            item.title
                          )}
                        </h4>

                        <p>
                          ${esc(
                            item.client
                          )}
                          ·
                          ${esc(
                            item.details
                          )}
                        </p>

                        <small>
                          ${esc(
                            item.amount
                          )}
                        </small>

                        <button
                          class="panel-secondary"
                        >
                          Manage
                        </button>

                      </article>
                    `
                  )
                  .join("")}

              </div>
            `;
          }
        )
        .join("");

    $$(
      "button",
      root
    ).forEach(
      (button) => {
        button.onclick =
          () => {
            const id =
              button.closest(
                "article"
              ).dataset
                .collabId;

            const item =
              state.collaborations.find(
                (value) =>
                  String(
                    value.id
                  ) === id
              );

            editCollaboration(
              item
            );
          };
      }
    );
  }

  function editCollaboration(
    item
  ) {
    modal(
      item
        ? "Manage collaboration"
        : "Add collaboration",

      [
        {
          label: "Title",
          name: "title",
          value:
            item?.title,
        },

        {
          label: "Client",
          name: "client",
          value:
            item?.client,
        },

        {
          label: "Details",
          name: "details",
          value:
            item?.details,
        },

        {
          label: "Amount",
          name: "amount",
          value:
            item?.amount,
        },

        {
          label: "Stage",
          name: "status",
          type: "select",
          value:
            item?.status ||
            "NEGOTIATION",
          options: [
            "NEGOTIATION",
            "IN PRODUCTION",
            "CLIENT APPROVAL",
            "PAYMENT",
            "COMPLETED",
          ],
        },
      ],

      (data) => {
        if (item) {
          Object.assign(
            item,
            data
          );
        } else {
          state.collaborations.push(
            {
              id:
                `COL-${Date.now()}`,
              ...data,
            }
          );
        }

        save();

        renderCollaborations();

        toast(
          "Collaboration saved"
        );
      }
    );
  }

  /* =========================================================
     NETWORK
  ========================================================= */

  function renderCircles() {
    const root =
      $("#my-circles-list");

    const empty =
      $("#circles-empty");

    if (!root) {
      return;
    }

    root.innerHTML =
      state.network.circles
        .map(
          (name) => `
            <article
              data-circle="${esc(
                name
              )}"
            >

              <div>
                <span>
                  GICA CREATOR CIRCLE
                </span>

                <h3>
                  ${esc(name)}
                </h3>

                <p>
                  Member · Professional network
                </p>
              </div>

              <button
                class="panel-secondary circle-leave"
              >
                Leave
              </button>

            </article>
          `
        )
        .join("");

    if (empty) {
      empty.hidden =
        state.network.circles
          .length > 0;
    }

    $$(
      ".circle-leave",
      root
    ).forEach(
      (button) => {
        button.onclick =
          () => {
            const name =
              button.closest(
                "article"
              ).dataset.circle;

            if (
              !confirm(
                `Leave ${name}?`
              )
            ) {
              return;
            }

            state.network.circles =
              state.network.circles.filter(
                (value) =>
                  value !== name
              );

            save();

            renderCircles();

            toast(
              "Circle updated"
            );
          };
      }
    );
  }

  function renderNetworkFeed() {
    const root =
      $("#network-feed-list");

    if (!root) {
      return;
    }

    root.innerHTML =
      state.network.posts
        .map(
          (item) => `
            <article>

              <div
                class="post-avatar"
              >
                ${(item.author ||
                  "GICA")
                  .split(/\s+/)
                  .map(
                    (part) =>
                      part[0]
                  )
                  .join("")
                  .slice(0, 2)}
              </div>

              <div>

                <span>
                  ${esc(
                    item.type
                  )}
                  ·
                  ${esc(
                    item.time ||
                      "Now"
                  )}
                </span>

                <h4>
                  ${esc(
                    item.author ||
                      state.profile
                        .name
                  )}
                </h4>

                <p>
                  ${esc(
                    item.message
                  )}
                </p>

              </div>

            </article>
          `
        )
        .join("");
  }

  function renderReferrals() {
    const root =
      $("#referral-list");

    if (!root) {
      return;
    }

    root.innerHTML =
      state.network.referrals
        .map(
          (item) => `
            <article>

              <span>
                <b>
                  ${esc(
                    item.id
                  )}
                </b>

                <small>
                  ${esc(
                    item.requirement
                  )}
                </small>
              </span>

              <span>
                ${esc(
                  item.creator
                )}
              </span>

              <span>
                ${esc(
                  item.client
                )}
              </span>

              <i
                class="status warning"
              >
                ${esc(
                  item.status
                )}
              </i>

            </article>
          `
        )
        .join("");
  }

  /* =========================================================
     EVENTS LOCAL
  ========================================================= */

  function renderRegisteredEvents() {
    const root =
      $("#registered-events-list");

    const empty =
      $(
        "#registered-events-empty"
      );

    const count =
      $(
        "#registered-event-count"
      );

    const tabCount =
      $("#event-tab-count");

    const list =
      state.eventRegistrations ||
      [];

    if (count) {
      count.textContent =
        list.length;
    }

    if (tabCount) {
      tabCount.textContent =
        list.length;
    }

    if (!root) {
      return;
    }

    root.innerHTML =
      list
        .map(
          (item) => `
            <article
              data-reference="${esc(
                item.reference
              )}"
            >

              <div
                class="registered-event-mark"
              >
                ✓
              </div>

              <div>

                <span>
                  REGISTRATION CONFIRMED
                </span>

                <h3>
                  ${esc(
                    item.title ||
                      item.eventId
                  )}
                </h3>

                <small>
                  Reference:
                  <b>
                    ${esc(
                      item.reference
                    )}
                  </b>
                </small>

              </div>

              <button
                class="cancel-event"
              >
                Cancel registration
              </button>

            </article>
          `
        )
        .join("");

    if (empty) {
      empty.hidden =
        list.length > 0;
    }

    $$(
      ".cancel-event",
      root
    ).forEach(
      (button) => {
        button.onclick =
          () => {
            const reference =
              button.closest(
                "article"
              ).dataset
                .reference;

            state.eventRegistrations =
              state.eventRegistrations.filter(
                (item) =>
                  item.reference !==
                  reference
              );

            save();

            renderRegisteredEvents();

            toast(
              "Registration cancelled"
            );
          };
      }
    );
  }

  function bindEventButtons() {
    $$(
      ".event-quick-register"
    ).forEach(
      (button) => {
        button.onclick =
          () => {
            const article =
              button.closest(
                "[data-event-id]"
              );

            const eventId =
              article?.dataset
                ?.eventId;

            if (!eventId) {
              return;
            }

            const title =
              article.querySelector(
                "h3"
              )?.textContent ||
              "GICA Event";

            const exists =
              state.eventRegistrations.some(
                (item) =>
                  item.eventId ===
                  eventId
              );

            if (exists) {
              toast(
                "Already registered",
                true
              );

              return;
            }

            state.eventRegistrations.push(
              {
                eventId,
                title,
                name:
                  state.profile
                    .name,
                email:
                  state.profile
                    .email,
                mobile:
                  state.profile
                    .mobile,
                reference:
                  `GICA-REG-${String(
                    Date.now()
                  ).slice(-8)}`,
              }
            );

            save();

            renderRegisteredEvents();

            button.textContent =
              "Registered ✓";

            toast(
              "Event registered locally"
            );
          };
      }
    );
  }

  /* =========================================================
     SETTINGS
  ========================================================= */

  function bindSettings() {
    const inputs =
      $$(
        "#panel-settings input"
      );

    if (inputs[0]) {
      inputs[0].value =
        state.profile.email ||
        "";
    }

    if (inputs[1]) {
      inputs[1].value =
        state.profile.mobile ||
        "";
    }

    if (inputs[2]) {
      inputs[2].checked =
        state.settings
          .loginNotifications;
    }

    if (inputs[3]) {
      inputs[3].checked =
        state.settings
          .twoFactor;
    }

    const saveButton =
      $(
        "#panel-settings .panel-primary"
      );

    if (saveButton) {
      saveButton.onclick =
        () => {
          if (inputs[0]) {
            state.profile.email =
              inputs[0].value.trim();
          }

          if (inputs[1]) {
            state.profile.mobile =
              inputs[1].value.trim();
          }

          if (inputs[2]) {
            state.settings.loginNotifications =
              inputs[2].checked;
          }

          if (inputs[3]) {
            state.settings.twoFactor =
              inputs[3].checked;
          }

          save();

          toast(
            "Settings saved locally"
          );
        };
    }
  }

  /* =========================================================
     OTHER BUTTONS
  ========================================================= */

  function bindActions() {
    bindProfileSave();

    const addPortfolio =
      $(
        "#panel-portfolio .panel-page-head .panel-primary"
      );

    if (addPortfolio) {
      addPortfolio.onclick =
        () =>
          editPortfolio();
    }

    const addService =
      $(
        "#panel-services .panel-page-head .panel-primary"
      );

    if (addService) {
      addService.onclick =
        () =>
          editService();
    }

    const collaborationHead =
      $(
        "#panel-collaborations .panel-page-head"
      );

    if (
      collaborationHead &&
      !collaborationHead.querySelector(
        ".add-collaboration-local"
      )
    ) {
      const button =
        document.createElement(
          "button"
        );

      button.className =
        "panel-primary add-collaboration-local";

      button.textContent =
        "+ Add collaboration";

      button.onclick =
        () =>
          editCollaboration();

      collaborationHead.appendChild(
        button
      );
    }

    const invoiceButton =
      $(
        "#panel-finance .box-head .panel-primary"
      );

    if (invoiceButton) {
      invoiceButton.onclick =
        newInvoice;
    }

    $$(
      ".filter-pills button"
    ).forEach(
      (button) => {
        button.onclick =
          () => {
            button.parentElement
              .querySelectorAll(
                "button"
              )
              .forEach(
                (item) =>
                  item.classList.remove(
                    "active"
                  )
              );

            button.classList.add(
              "active"
            );

            const text =
              button.textContent
                .trim()
                .toUpperCase();

            let filter =
              text.split(" ")[0];

            if (
              filter === "ALL"
            ) {
              filter = "ALL";
            }

            if (
              filter ===
              "QUOTATIONS"
            ) {
              filter =
                "QUOTATION";
            }

            renderInquiries(
              filter
            );
          };
      }
    );

    const copyButton =
      $(
        "#panel-profile .panel-secondary"
      );

    if (copyButton) {
      copyButton.onclick =
        async () => {
          const text =
            $(
              "#panel-profile code"
            )?.textContent ||
            "";

          try {
            await navigator.clipboard.writeText(
              text
            );

            toast(
              "Profile link copied"
            );
          } catch {
            toast(
              text
            );
          }
        };
    }

    const mediaButtons =
      $$(
        "#panel-portfolio .media-kit-card button"
      );

    if (mediaButtons[1]) {
      mediaButtons[1].onclick =
        () => {
          download(
            "GICA-media-kit.txt",

            [
              "GICA MEDIA KIT",
              "",
              state.profile
                .name,
              accountUser
                ?.creatorId ||
                "",
              state.profile
                .headline,
              "",
              state.profile
                .bio,
              "",
              `Portfolio: ${state.portfolio
                .map(
                  (item) =>
                    item.title
                )
                .join(", ")}`,
            ].join("\n")
          );
        };
    }

    const networkPost =
      $("#network-post-form");

    if (networkPost) {
      networkPost.onsubmit =
        (event) => {
          event.preventDefault();

          const data =
            Object.fromEntries(
              new FormData(
                networkPost
              )
            );

          state.network.posts.unshift(
            {
              id: Date.now(),
              ...data,
              author:
                state.profile
                  .name ||
                "Creator",
              time: "Now",
            }
          );

          save();

          networkPost.reset();

          renderNetworkFeed();

          toast(
            "Post saved locally"
          );
        };
    }

    const availability =
      $(
        "#creator-availability"
      );

    if (availability) {
      availability.value =
        state.network
          .availability;

      availability.onchange =
        () => {
          state.network.availability =
            availability.value;

          save();

          toast(
            "Availability updated"
          );
        };
    }

    const search =
      $(".panel-search input");

    if (search) {
      search.oninput =
        () => {
          const query =
            search.value
              .toLowerCase()
              .trim();

          $$(
            ".panel-sidebar [data-panel]"
          ).forEach(
            (link) => {
              link.hidden =
                Boolean(
                  query &&
                    !link.textContent
                      .toLowerCase()
                      .includes(
                        query
                      )
                );
            }
          );
        };
    }

    $(".notification-button")
      ?.addEventListener(
        "click",
        () => {
          toast(
            `${state.inquiries.length} inquiries`
          );
        }
      );

    $(".panel-logout")
      ?.addEventListener(
        "click",
        () => {
          localStorage.removeItem(
            SESSION
          );
        }
      );

    bindEventButtons();

    bindSettings();
  }

  /* =========================================================
     START
  ========================================================= */

  function start() {
    applyIdentity();

    renderProfile();

    renderPortfolio();

    renderServices();

    renderInquiries();

    renderInvoices();

    renderCollaborations();

    renderCircles();

    renderNetworkFeed();

    renderReferrals();

    renderRegisteredEvents();

    renderLiveSummary();

    bindActions();

    document.body.classList.add(
      "creator-ready"
    );

    console.log(
      "GICA display-only mode loaded."
    );

    console.log(
      "Current local user:",
      accountUser
    );

    console.log(
      "Current local state:",
      state
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start
    );
  } else {
    start();
  }
})();