(() => {
  const messages = globalThis.ViepsMessages || {};
  const defaultLocale = "en";
  const supportedLocales = Object.keys(messages).length ? Object.keys(messages) : [defaultLocale];

  function normalizeLocale(value) {
    const candidate = String(value || "").toLowerCase().split("-")[0];
    return supportedLocales.includes(candidate) ? candidate : defaultLocale;
  }

  function readSavedLocale() {
    try {
      return globalThis.localStorage?.getItem("vieps.uiLocale") || "";
    } catch {
      return "";
    }
  }

  function saveLocale(locale) {
    try {
      globalThis.localStorage?.setItem("vieps.uiLocale", locale);
    } catch {
      // Local storage is optional; locale selection still works for this page load.
    }
  }

  let activeLocale = normalizeLocale(readSavedLocale() || globalThis.navigator?.language || defaultLocale);

  function interpolate(value, params = {}) {
    return String(value).replace(/\{([A-Za-z0-9_]+)\}/g, (_match, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : `{${name}}`);
  }

  function t(key, params = {}) {
    const localized = messages[activeLocale]?.[key];
    const fallback = messages[defaultLocale]?.[key];
    return interpolate(localized ?? fallback ?? key, params);
  }

  function applyElementTranslations(root = globalThis.document) {
    if (!root?.querySelectorAll) return;

    root.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
    });
  }

  function syncLocaleSelector() {
    const selector = globalThis.document?.getElementById?.("uiLocale");
    if (!selector) return;
    selector.value = activeLocale;
  }

  function applyLocale(root = globalThis.document) {
    if (globalThis.document?.documentElement) {
      globalThis.document.documentElement.lang = activeLocale;
    }
    applyElementTranslations(root);
    syncLocaleSelector();
    globalThis.document?.dispatchEvent?.(new CustomEvent("vieps:localechange", {
      detail: { locale: activeLocale },
    }));
  }

  function setLocale(locale, { persist = true } = {}) {
    activeLocale = normalizeLocale(locale);
    if (persist) saveLocale(activeLocale);
    applyLocale();
    return activeLocale;
  }

  function formatNumber(value, options = {}) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "");
    return new Intl.NumberFormat(activeLocale, options).format(number);
  }

  function formatCurrency(value, currency = "EUR") {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "");
    try {
      return new Intl.NumberFormat(activeLocale, { style: "currency", currency }).format(number);
    } catch {
      return `${formatNumber(number, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    }
  }

  const api = {
    defaultLocale,
    supportedLocales,
    t,
    setLocale,
    applyLocale,
    formatNumber,
    formatCurrency,
    get locale() { return activeLocale; },
  };

  globalThis.ViepsI18n = api;

  function setup() {
    const selector = globalThis.document?.getElementById?.("uiLocale");
    selector?.addEventListener?.("change", (event) => setLocale(event.target.value));
    applyLocale();
  }

  if (globalThis.document?.readyState === "loading") {
    globalThis.document.addEventListener("DOMContentLoaded", setup);
  } else if (globalThis.document) {
    setup();
  }
})();
