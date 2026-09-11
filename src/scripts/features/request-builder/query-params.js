// src/scripts/features/request-builder/query-params.js

const elements = {
    container: null,
    addButton: null,
    emptyState: null,
};

let initialized = false;

function cacheElements() {
    elements.container = document.getElementById("query-params-list");
    elements.addButton = document.getElementById("add-query-param-button");
    elements.emptyState = document.getElementById("query-params-empty");
}

function getContainer() {
    if (!elements.container) {
        cacheElements();
    }

    return elements.container;
}

function getRows() {
    const container = getContainer();

    if (!container) {
        return [];
    }

    return Array.from(
        container.querySelectorAll("[data-query-param]")
    );
}

function createId() {
    if (crypto?.randomUUID) {
        return crypto.randomUUID();
    }

    return `query-param-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
}

function updateEmptyState() {
    if (!elements.emptyState) {
        return;
    }

    elements.emptyState.classList.toggle(
        "hidden",
        getRows().length > 0
    );
}

function emitChange() {
    document.dispatchEvent(new CustomEvent("query-params:change", {
        detail: { params: getQueryParams() },
    }));
}

function bindEvents() {
    elements.addButton?.addEventListener("click", (event) => {
        event.preventDefault();
        addQueryParam();
    });

    elements.container?.addEventListener("click", (event) => {
        const button = event.target.closest(
            '[data-action="remove-query-param"]'
        );

        if (!button) {
            return;
        }

        const row = button.closest("[data-query-param]");

        if (row) {
            removeQueryParam(row);
        }
    });

    elements.container?.addEventListener("input", emitChange);
    elements.container?.addEventListener("change", emitChange);
}

function createRow(param = {}) {
    const row = document.createElement("div");

    row.className =
        "grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2";

    row.dataset.queryParam = "true";
    row.dataset.id = param.id || createId();

    const enabled = param.enabled !== false;
    const key = String(param.key ?? "");
    const value = String(param.value ?? "");

    row.innerHTML = `
        <input
            type="checkbox"
            class="query-param-enabled h-4 w-4 rounded border-border"
            aria-label="Enable query parameter"
            ${enabled ? "checked" : ""}
        />

        <input
            type="text"
            class="query-param-key h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Parameter"
            aria-label="Query parameter name"
            autocomplete="off"
        />

        <input
            type="text"
            class="query-param-value h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Value"
            aria-label="Query parameter value"
            autocomplete="off"
        />

        <button
            type="button"
            data-action="remove-query-param"
            class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-surface-raised hover:text-foreground"
            aria-label="Remove query parameter"
            title="Remove parameter"
        >
            ×
        </button>
    `;

    row.querySelector(".query-param-key").value = key;
    row.querySelector(".query-param-value").value = value;

    return row;
}

export function initQueryParams() {
    cacheElements();

    if (!initialized) {
        bindEvents();
        initialized = true;
    }

    updateEmptyState();

    emitChange();

    return {
        getQueryParams,
        setQueryParams,
        addQueryParam,
        removeQueryParam,
        clearQueryParams,
    };
}

export function addQueryParam(param = {}) {
    const container = getContainer();

    if (!container) {
        return null;
    }

    const row = createRow(param);

    container.appendChild(row);

    updateEmptyState();

    emitChange();

    row.querySelector(".query-param-key")?.focus();

    return row;
}

export function removeQueryParam(rowOrId) {
    const container = getContainer();

    if (!container) {
        return false;
    }

    let row = null;

    if (rowOrId instanceof HTMLElement) {
        row = rowOrId;
    } else if (typeof rowOrId === "string") {
        row = Array.from(
            container.querySelectorAll("[data-query-param]")
        ).find((item) => item.dataset.id === rowOrId);
    }

    if (!row) {
        return false;
    }

    row.remove();

    updateEmptyState();

    return true;
}

export function clearQueryParams() {
    const container = getContainer();

    if (!container) {
        return;
    }

    container.replaceChildren();

    updateEmptyState();
}

export function getQueryParams() {
    return getRows().map((row) => ({
        id: row.dataset.id || createId(),
        key: row.querySelector(".query-param-key")?.value ?? "",
        value: row.querySelector(".query-param-value")?.value ?? "",
        enabled:
            row.querySelector(".query-param-enabled")?.checked ?? true,
    }));
}

export function setQueryParams(params = []) {
    const container = getContainer();

    if (!container) {
        return;
    }

    clearQueryParams();

    if (!Array.isArray(params)) {
        return;
    }

    params.forEach((param) => {
        if (!param || typeof param !== "object") {
            return;
        }

        addQueryParam({
            id: param.id,
            key: param.key,
            value: param.value,
            enabled: param.enabled !== false,
        });
    });
}

export function getEnabledQueryParams(params = getQueryParams()) {
    if (!Array.isArray(params)) {
        return [];
    }

    return params.filter(
        (param) =>
            param &&
            param.enabled !== false &&
            String(param.key ?? "").trim() !== ""
    );
}

export function toURLSearchParams(params = getQueryParams()) {
    const searchParams = new URLSearchParams();

    getEnabledQueryParams(params).forEach((param) => {
        searchParams.append(
            String(param.key).trim(),
            String(param.value ?? "")
        );
    });

    return searchParams;
}

export function serializeQueryParams(params = getQueryParams()) {
    return toURLSearchParams(params).toString();
}

export function parseQueryParamsFromUrl(url = "") {
    if (typeof url !== "string" || !url) {
        return [];
    }

    try {
        const parsedUrl = new URL(url);

        return Array.from(parsedUrl.searchParams.entries()).map(
            ([key, value]) => ({
                id: createId(),
                key,
                value,
                enabled: true,
            })
        );
    } catch {
        return [];
    }
}

export function removeQueryString(url = "") {
    if (typeof url !== "string" || !url) {
        return "";
    }

    try {
        const parsedUrl = new URL(url);
        parsedUrl.search = "";
        return parsedUrl.href;
    } catch {
        return url;
    }
}

export default {
    initQueryParams,
    getQueryParams,
    setQueryParams,
    addQueryParam,
    removeQueryParam,
    clearQueryParams,
    getEnabledQueryParams,
    toURLSearchParams,
    serializeQueryParams,
    parseQueryParamsFromUrl,
    removeQueryString,
};
