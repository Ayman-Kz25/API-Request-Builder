// src/scripts/features/request-builder/body.js

import {
    getJsonValue,
    setJsonValue,
    hasJsonEditor,
    validateJson as validateEditorJson,
    formatJson as formatEditorJson,
    minifyJson as minifyEditorJson,
} from "../editor/json-editor.js";

const elements = {
    formatButton: null,
    validationStatus: null,
    type: null,
    rawEditor: null,
    jsonEditor: null,
    structuredEditor: null,
    fieldsList: null,
    fieldsEmpty: null,
    addFieldButton: null,
    structuredHint: null,
};

let bodyType = "json";
let rawBody = "";
let structuredFields = [];

let initialized = false;

function cacheElements() {
    elements.formatButton = document.getElementById(
        "format-body-button",
    );

    elements.validationStatus = document.getElementById(
        "body-validation-status",
    );
    elements.type = document.getElementById("body-type");
    elements.rawEditor = document.getElementById("raw-body-editor");
    elements.jsonEditor = document.getElementById("json-editor");
    elements.structuredEditor = document.getElementById("structured-body-editor");
    elements.fieldsList = document.getElementById("body-fields-list");
    elements.fieldsEmpty = document.getElementById("body-fields-empty");
    elements.addFieldButton = document.getElementById("add-body-field-button");
    elements.structuredHint = document.getElementById("structured-body-hint");
}

function bindEvents() {
    elements.formatButton?.addEventListener(
        "click",
        handleFormat,
    );

    document.addEventListener(
        "json-editor:change",
        handleEditorChange,
    );
    elements.type?.addEventListener("change", handleBodyTypeChange);
    elements.rawEditor?.addEventListener("input", handleRawBodyChange);
    elements.addFieldButton?.addEventListener("click", () => addStructuredField());
    elements.fieldsList?.addEventListener("input", handleStructuredInput);
    elements.fieldsList?.addEventListener("change", handleStructuredInput);
    elements.fieldsList?.addEventListener("click", handleStructuredClick);
}

function handleEditorChange(event) {
    if (bodyType !== "json") return;
    const value = event.detail?.value ?? "";

    validateRequestBody(value);

    if (elements.validationStatus) {
        elements.validationStatus.dataset.empty =
            value.trim() ? "false" : "true";
    }
}

function handleBodyTypeChange(event) {
    setBodyType(event.target.value);
}

function handleRawBodyChange(event) {
    rawBody = event.target.value;
    validateRequestBody(rawBody, bodyType);
}

function createFieldId() {
    return crypto?.randomUUID?.() || `body-field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function handleStructuredInput(event) {
    const row = event.target.closest("[data-body-field]");
    if (!row) return;
    const field = structuredFields.find((item) => item.id === row.dataset.bodyField);
    if (!field) return;
    const name = event.target.dataset.bodyFieldInput;
    if (name === "enabled") field.enabled = event.target.checked;
    if (name === "key") field.key = event.target.value;
    if (name === "value") field.value = event.target.value;
    if (name === "file") field.file = event.target.files?.[0] || null;
    if (name === "type") {
        field.type = event.target.value;
        if (field.type !== "file") field.file = null;
        renderStructuredFields();
    }
    updateStructuredBody();
}

function handleStructuredClick(event) {
    const button = event.target.closest("[data-remove-body-field]");
    if (!button) return;
    structuredFields = structuredFields.filter((item) => item.id !== button.dataset.removeBodyField);
    renderStructuredFields();
    updateStructuredBody();
}

function addStructuredField(field = {}) {
    structuredFields.push({ id: field.id || createFieldId(), key: field.key || "", value: field.value || "", type: field.type || "text", file: null, enabled: field.enabled !== false });
    renderStructuredFields();
}

function renderStructuredFields() {
    if (!elements.fieldsList) return;
    elements.fieldsList.replaceChildren();
    structuredFields.forEach((field) => {
        const row = document.createElement("div");
        row.dataset.bodyField = field.id;
        row.className = "grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-2";
        const valueControl = bodyType === "multipart" && field.type === "file"
            ? `<input data-body-field-input="file" type="file" class="min-w-0 text-xs text-muted-foreground" aria-label="Choose file for ${escapeAttribute(field.key || "body field")}">`
            : `<input data-body-field-input="value" class="h-9 min-w-0 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Value" value="${escapeAttribute(field.value)}">`;
        row.innerHTML = `<input data-body-field-input="enabled" type="checkbox" class="h-4 w-4" aria-label="Enable body field" ${field.enabled ? "checked" : ""}>
          <input data-body-field-input="key" class="h-9 min-w-0 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Field name" value="${escapeAttribute(field.key)}">
          ${valueControl}
          <select data-body-field-input="type" class="${bodyType === "multipart" ? "h-9 rounded-md border border-border bg-surface px-2 text-xs" : "hidden"}" aria-label="Field type"><option value="text" ${field.type === "text" ? "selected" : ""}>Text</option><option value="file" ${field.type === "file" ? "selected" : ""}>File</option></select>
          <button data-remove-body-field="${field.id}" type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface-raised" aria-label="Remove body field">×</button>`;
        elements.fieldsList.appendChild(row);
    });
    elements.fieldsEmpty?.classList.toggle("hidden", structuredFields.length > 0);
}

function updateStructuredBody() {
    const enabled = structuredFields.filter((field) => field.enabled && field.key.trim());
    rawBody = bodyType === "form-urlencoded"
        ? new URLSearchParams(enabled.map((field) => [field.key, field.value])).toString()
        : enabled.map((field) => `${field.key}=${field.value}`).join("\n");
}

function createMultipartBody() {
    const formData = new FormData();

    structuredFields
        .filter((field) => field.enabled && field.key.trim())
        .forEach((field) => {
            if (field.type === "file") {
                if (field.file instanceof File) formData.append(field.key, field.file);
                return;
            }
            formData.append(field.key, field.value);
        });

    return formData;
}

function escapeAttribute(value = "") {
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function handleFormat(event) {
    event.preventDefault();

    const result = formatEditorJson(
        getRequestBody(),
        2,
    );

    if (!result.valid) {
        updateValidationStatus(false);
        return;
    }

    setRequestBody(result.value);
    updateValidationStatus(true);
}

function updateValidationStatus(valid) {
    if (!elements.validationStatus) {
        return;
    }

    elements.validationStatus.textContent = valid
        ? "Valid JSON"
        : "Invalid JSON";

    elements.validationStatus.dataset.valid = String(
        valid,
    );
}

export function initRequestBody() {
    cacheElements();

    if (!initialized) {
        bindEvents();
        initialized = true;
    }

    return {
        getRequestBody,
        setRequestBody,
        clearRequestBody,
        getBodyType,
        setBodyType,
        isValidJson,
        formatJson,
        minifyJson,
        parseJsonBody,
        validateRequestBody,
        getContentTypeForBodyType,
    };
}

export function getRequestBody() {
    if (bodyType === "multipart") return createMultipartBody();
    if (["form-urlencoded", "multipart"].includes(bodyType)) updateStructuredBody();
    return bodyType === "json" && hasJsonEditor()
        ? getJsonValue()
        : rawBody;
}

export function setRequestBody(value = "") {
    const nextValue = value === null || value === undefined
        ? ""
        : typeof value === "string"
            ? value
            : JSON.stringify(value, null, 2);

    if (bodyType !== "json") {
        rawBody = nextValue;
        if (elements.rawEditor) elements.rawEditor.value = rawBody;
        return;
    }

    if (value === null || value === undefined) {
        setJsonValue("");
        return;
    }

    if (typeof value === "string") {
        setJsonValue(value);
        return;
    }

    try {
        setJsonValue(
            JSON.stringify(value, null, 2),
        );
    } catch {
        setJsonValue(String(value));
    }
}

export function clearRequestBody() {
    setRequestBody("");
    updateValidationStatus(true);
}

export function getBodyType() {
    return bodyType;
}

export function setBodyType(type = "json") {
    const supported = ["json", "text", "javascript", "xml", "html", "form-urlencoded", "multipart"];
    const nextType = String(type).toLowerCase();

    if (!supported.includes(nextType)) return bodyType;

    if (bodyType === "json" && hasJsonEditor()) rawBody = getJsonValue();
    bodyType = nextType;

    if (elements.type) elements.type.value = bodyType;

    const isJson = bodyType === "json";
    const isStructured = ["form-urlencoded", "multipart"].includes(bodyType);
    elements.jsonEditor?.classList.toggle("hidden", !isJson);
    elements.rawEditor?.classList.toggle("hidden", isJson || isStructured);
    elements.structuredEditor?.classList.toggle("hidden", !isStructured);

    if (!isJson && !isStructured && elements.rawEditor) {
        elements.rawEditor.value = rawBody;
        elements.rawEditor.placeholder = bodyType === "multipart"
            ? "Use key=value pairs, one per line"
            : bodyType === "form-urlencoded"
                ? "key=value&another=value"
                : "Enter request body";
    }

    if (isStructured) {
        elements.structuredHint.textContent = bodyType === "multipart"
            ? "Add text fields or mark a field as a file reference. File selection will be added with upload handling."
            : "Add fields to be encoded as application/x-www-form-urlencoded.";
        renderStructuredFields();
    }

    elements.formatButton?.classList.toggle("hidden", !isJson);
    validateRequestBody(getRequestBody(), bodyType);
    return bodyType;
}

export function isValidJson(value = getRequestBody()) {
    return validateEditorJson(value).valid;
}

export function formatJson(value = "") {
    return formatEditorJson(value, 2).value;
}

export function minifyJson(value = "") {
    return minifyEditorJson(value).value;
}

export function parseJsonBody(value = getRequestBody()) {
    const result = validateEditorJson(value);

    return result.valid ? result.value : null;
}

export function validateRequestBody(
    value = getRequestBody(),
    type = getBodyType(),
) {
    const body = String(value ?? "").trim();

    if (!body) {
        updateValidationStatus(true);

        return {
            valid: true,
            error: "",
        };
    }

    if (
        type === "json" &&
        !validateEditorJson(body).valid
    ) {
        updateValidationStatus(false);

        return {
            valid: false,
            error: "The request body contains invalid JSON.",
        };
    }

    updateValidationStatus(true);

    return {
        valid: true,
        error: "",
    };
}

export function getContentTypeForBodyType(
    type = getBodyType(),
) {
    return {
        json: "application/json",
        text: "text/plain",
        javascript: "application/javascript",
        xml: "application/xml",
        html: "text/html",
        "form-urlencoded": "application/x-www-form-urlencoded",
        multipart: "multipart/form-data",
    }[String(type).toLowerCase()] || "";
}

export default {
    initRequestBody,
    getRequestBody,
    setRequestBody,
    clearRequestBody,
    getBodyType,
    setBodyType,
    isValidJson,
    formatJson,
    minifyJson,
    parseJsonBody,
    validateRequestBody,
    getContentTypeForBodyType,
};
