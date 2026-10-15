(function () {
  const baseUrl = (
    window.GICA_API_BASE_URL ||
    "http://68.178.168.48:7010"
  ).replace(/\/$/, "");

  async function request(path, options = {}) {
    const {
      method = "GET",
      body,
      token,
    } = options;

    if (!path.startsWith("/api/")) {
      throw new Error("Invalid API path.");
    }

    let response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          ...(body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
        ...(body !== undefined
          ? { body: JSON.stringify(body) }
          : {}),
      });
    } catch (error) {
      console.error("API connection error:", error);
      throw new Error(
        "Could not connect to the GICA API. Please check the server and try again."
      );
    }

    const rawText = await response.text();
    let data = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (error) {
        // Keep plain-text server errors so they can be shown to the user.
        data = { message: rawText };
      }
    }

    if (!response.ok) {
      const validationMessage = Array.isArray(data?.errors)
        ? data.errors
            .map((item) => item?.message || item?.msg || String(item))
            .filter(Boolean)
            .join(" ")
        : "";

      throw new Error(
        data?.message ||
          data?.error ||
          validationMessage ||
          `Request failed (${response.status}).`
      );
    }

    return data || {};
  }

  window.GicaApi = {
    request,
    baseUrl,
  };
})();
