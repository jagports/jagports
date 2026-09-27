(() => {
  const fallbackLanguage = "en";
  const storageKey = "vieps.ui.language";
  let resources = globalThis.VIEPS_I18N_RESOURCES || {};
  let language = fallbackLanguage;

  function supportedLanguages() {
    const configured = Object.keys(resources);
    return configured.length ? configured : [fallbackLanguage];
  }

  function normalizeLanguage(value) {
    const candidate = String(value || "").toLowerCase().split("-")[0];
    return supportedLanguages().includes(candidate) ? candidate : fallbackLanguage;
  }

  function readPath(root, key) {
    return key.split(".").reduce((value, segment) => value && value[segment], root);
  }

  function interpolate(value, options) {
    return String(value).replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, name) =>
      Object.hasOwn(options, name) ? String(options[name]) : `{{${name}}}`
    );
  }

  function lookup(locale, key, options) {
    const candidates = [];
    if (options.count !== undefined && options.count !== null) {
      const category = new Intl.PluralRules(locale).select(Number(options.count));
      candidates.push(`${key}_${category}`);
    }
    candidates.push(key);
    for (const candidate of candidates) {
      const value = readPath(resources[locale], candidate);
      if (typeof value === "string") return interpolate(value, options);
    }
    return null;
  }

  function t(key, options = {}) {
    return lookup(language, key, options)
      ?? (language === fallbackLanguage ? null : lookup(fallbackLanguage, key, options))
      ?? key;
  }

  function formatCurrency(value, currency = "EUR") {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "");
    return new Intl.NumberFormat(language, { currency, style: "currency" }).format(number);
  }

  function formatNumber(value, options = {}) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "");
    return new Intl.NumberFormat(language, options).format(number);
  }

  function applyDocument() {
    if (typeof document === "undefined") return;
    if (document.documentElement) document.documentElement.lang = language;
    if (typeof document.querySelectorAll === "function") {
      for (const node of document.querySelectorAll("[data-i18n]")) {
        node.textContent = t(node.getAttribute("data-i18n"));
      }
      for (const node of document.querySelectorAll("[data-i18n-placeholder]")) {
        node.setAttribute("placeholder", t(node.getAttribute("data-i18n-placeholder")));
      }
      for (const node of document.querySelectorAll("[data-i18n-aria-label]")) {
        node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria-label")));
      }
    }
    const selector = typeof document.getElementById === "function" ? document.getElementById("languageSelect") : null;
    if (selector) selector.value = language;
  }

  function storedLanguage() {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem(storageKey) : null;
    } catch {
      return null;
    }
  }

  function storeLanguage(value) {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(storageKey, value);
    } catch {
      // Persistence is optional; locale selection still applies to the current page.
    }
  }

  function init(options = {}) {
    resources = options.resources || globalThis.VIEPS_I18N_RESOURCES || resources;
    language = normalizeLanguage(options.language || storedLanguage() || fallbackLanguage);
    applyDocument();
    return language;
  }

  function changeLanguage(value) {
    language = normalizeLanguage(value);
    storeLanguage(language);
    applyDocument();
    return language;
  }

  globalThis.viepsI18n = {
    applyDocument,
    changeLanguage,
    formatCurrency,
    formatNumber,
    get fallbackLanguage() { return fallbackLanguage; },
    get language() { return language; },
    init,
    normalizeLanguage,
    t,
  };
})();
