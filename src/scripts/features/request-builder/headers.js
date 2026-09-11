// src/scripts/features/request-builder/headers.js

const elements = {
    list: null,
    addButton: null,
    empty: null,
    preset: null,
};

let headers = [];
let initialized = false;

function cacheElements() {
    elements.list = document.getElementById("headers-list");
    elements.addButton = document.getElementById("add-header-button");
    elements.empty = document.getElementById("headers-empty");
    elements.preset = document.getElementById("header-preset-select");
}

function bindEvents() {
    elements.addButton?.addEventListener("click", handleAdd);

    elements.list?.addEventListener("input", handleInput);
    elements.list?.addEventListener("change", handleInput);
    elements.list?.addEventListener("click", handleClick);
    elements.preset?.addEventListener("change", handlePreset);
}

function handlePreset(event) {
    const value = event.target.value;
    event.target.value = "";

    if (!value) return;

    const separator = value.indexOf(":");
    const name = value.slice(0, separator).trim();
    const headerValue = value.slice(separator + 1);
    setHeader(name, headerValue);
}

function handleAdd(event) {
    event.preventDefault();
    addHeader();
}

function handleInput(event) {
    const input = event.target;

    if (!input.matches("[data-header-field]")) {
        return;
    }

    const row = input.closest("[data-header-index]");

    if (!row) {
        return;
    }

    const index = Number(row.dataset.headerIndex);
    const field = input.dataset.headerField;

    if (!Number.isInteger(index) || !headers[index]) {
        return;
    }

    if (field === "name") {
        headers[index].name = input.value;
    }

    if (field === "value") {
        headers[index].value = input.value;
    }

    if (field === "enabled") {
        headers[index].enabled = input.checked;
    }
}

function handleClick(event) {
    const button = event.target.closest("[data-header-action]");

    if (!button) {
        return;
    }

    const row = button.closest("[data-header-index]");

    if (!row) {
        return;
    }

    const index = Number(row.dataset.headerIndex);

    if (!Number.isInteger(index)) {
        return;
    }

    if (button.dataset.headerAction === "remove") {
        removeHeader(index);
    }
}

function normalizeHeader(header = {}) {
    if (!header || typeof header !== "object") {
        return {
            name: "",
            value: "",
            enabled: true,
        };
    }

    return {
        name: String(header.name ?? "").trim(),
        value: String(header.value ?? ""),
        enabled: header.enabled !== false,
    };
}

function normalizeHeaders(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map(normalizeHeader);
}

function renderHeaders() {
    if (!elements.list) {
        cacheElements();
    }

    if (!elements.list) {
        return;
    }

    elements.list.innerHTML = "";

    headers.forEach((header, index) => {
        elements.list.appendChild(
            createHeaderRow(header, index)
        );
    });

    updateEmptyState();
}

function updateEmptyState() {
    if (!elements.empty) {
        return;
    }

    elements.empty.classList.toggle(
        "hidden",
        headers.length > 0
    );
}

function createHeaderRow(header, index) {
    const row = document.createElement("div");

    row.dataset.headerIndex = String(index);

    row.className =
        "grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center";

    const enabled = document.createElement("input");

    enabled.type = "checkbox";
    enabled.checked = header.enabled;
    enabled.dataset.headerField = "enabled";
    enabled.className = "h-4 w-4";
    enabled.setAttribute("aria-label", "Enable header");

    const nameInput = document.createElement("input");

    nameInput.type = "text";
    nameInput.value = header.name;
    nameInput.placeholder = "Header name";
    nameInput.autocomplete = "off";
    nameInput.dataset.headerField = "name";
    nameInput.className =
        "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

    const valueInput = document.createElement("input");

    valueInput.type = "text";
    valueInput.value = header.value;
    valueInput.placeholder = "Header value";
    valueInput.autocomplete = "off";
    valueInput.dataset.headerField = "value";
    valueInput.className =
        "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.dataset.headerAction = "remove";
    removeButton.className =
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-sm transition hover:bg-muted";
    removeButton.setAttribute("aria-label", "Remove header");
    removeButton.title = "Remove header";
    removeButton.textContent = "×";

    row.append(
        enabled,
        nameInput,
        valueInput,
        removeButton
    );

    return row;
}

export function initHeaders() {
    cacheElements();

    if (!initialized) {
        bindEvents();
        initialized = true;
    }

    renderHeaders();

    return {
        getHeaders,
        setHeaders,
        addHeader,
        updateHeader,
        removeHeader,
        clearHeaders,
        getEnabledHeaders,
        findHeader,
        hasHeader,
        setHeader,
        removeHeaderByName,
        removeEmptyHeaders,
        focusHeaders,
    };
}

export function getHeaders() {
    return headers.map((header) => ({
        ...header,
    }));
}

export function setHeaders(value = []) {
    headers = normalizeHeaders(value);
    renderHeaders();

    return getHeaders();
}

export function addHeader(header = {}) {
    const normalized = normalizeHeader(header);

    headers.push(normalized);
    renderHeaders();

    focusHeader(headers.length - 1);

    return {
        ...normalized,
    };
}

export function updateHeader(index, updates = {}) {
    if (!Number.isInteger(index) || !headers[index]) {
        return null;
    }

    if ("name" in updates) {
        headers[index].name = String(
            updates.name ?? ""
        ).trim();
    }

    if ("value" in updates) {
        headers[index].value = String(
            updates.value ?? ""
        );
    }

    if ("enabled" in updates) {
        headers[index].enabled = updates.enabled !== false;
    }

    renderHeaders();

    return {
        ...headers[index],
    };
}

export function removeHeader(index) {
    if (!Number.isInteger(index) || !headers[index]) {
        return null;
    }

    const [removed] = headers.splice(index, 1);

    renderHeaders();

    return {
        ...removed,
    };
}

export function clearHeaders() {
    headers = [];
    renderHeaders();
}

export function getEnabledHeaders() {
    return headers
        .filter(
            (header) =>
                header.enabled !== false &&
                header.name.trim() !== ""
        )
        .map((header) => ({
            name: header.name.trim(),
            value: header.value,
        }));
}

export function findHeader(name) {
    const target = String(name ?? "")
        .trim()
        .toLowerCase();

    if (!target) {
        return null;
    }

    const header = headers.find(
        (item) =>
            item.name.trim().toLowerCase() === target
    );

    return header ? { ...header } : null;
}

export function hasHeader(name) {
    return Boolean(findHeader(name));
}

export function setHeader(
    name,
    value = "",
    enabled = true
) {
    const normalizedName = String(name ?? "").trim();

    if (!normalizedName) {
        return null;
    }

    const index = headers.findIndex(
        (header) =>
            header.name.trim().toLowerCase() ===
            normalizedName.toLowerCase()
    );

    const header = {
        name: normalizedName,
        value: String(value ?? ""),
        enabled: enabled !== false,
    };

    if (index >= 0) {
        headers[index] = header;
    } else {
        headers.push(header);
    }

    renderHeaders();

    return {
        ...header,
    };
}

export function removeHeaderByName(name) {
    const target = String(name ?? "")
        .trim()
        .toLowerCase();

    if (!target) {
        return null;
    }

    const index = headers.findIndex(
        (header) =>
            header.name.trim().toLowerCase() === target
    );

    if (index < 0) {
        return null;
    }

    return removeHeader(index);
}

export function removeEmptyHeaders() {
    headers = headers.filter(
        (header) =>
            header.name.trim() !== "" ||
            header.value.trim() !== ""
    );

    renderHeaders();

    return getHeaders();
}

function focusHeader(index) {
    if (!elements.list) {
        return;
    }

    requestAnimationFrame(() => {
        const row = elements.list.querySelector(
            `[data-header-index="${index}"]`
        );

        row?.querySelector(
            '[data-header-field="name"]'
        )?.focus();
    });
}

export function focusHeaders() {
    if (!elements.list) {
        cacheElements();
    }

    elements.list?.querySelector(
        '[data-header-field="name"]'
    )?.focus();
}

export default {
    initHeaders,
    getHeaders,
    setHeaders,
    addHeader,
    updateHeader,
    removeHeader,
    clearHeaders,
    getEnabledHeaders,
    findHeader,
    hasHeader,
    setHeader,
    removeHeaderByName,
    removeEmptyHeaders,
    focusHeaders,
};
