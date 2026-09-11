// src/scripts/core/constants.js

export const APP = Object.freeze({
    NAME: "Endpoint",
    VERSION: "1.0.0",
    DEFAULT_THEME: "dark",
});

export const HTTP_METHODS = Object.freeze([
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
    "TRACE",
]);

export const DEFAULT_HTTP_METHOD = "GET";

export const REQUEST_TABS = Object.freeze({
    PARAMS: "params",
    HEADERS: "headers",
    BODY: "body",
    AUTH: "auth",
});

export const DEFAULT_REQUEST_TAB = REQUEST_TABS.PARAMS;

export const AUTH_TYPES = Object.freeze({
    NONE: "none",
    BEARER: "bearer",
    BASIC: "basic",
    API_KEY: "api-key",
});

export const DEFAULT_AUTH = Object.freeze({
    type: AUTH_TYPES.NONE,
    fields: {},
});

export const RESPONSE_TABS = Object.freeze({
    PRETTY: "pretty",
    RAW: "raw",
    HEADERS: "headers",
});

export const DEFAULT_RESPONSE_TAB = RESPONSE_TABS.PRETTY;

export const THEMES = Object.freeze({
    LIGHT: "light",
    DARK: "dark",
});

export const STORAGE_KEYS = Object.freeze({
    THEME: "endpoint-theme",
    HISTORY: "endpoint-history",
});

export const HISTORY = Object.freeze({
    MAX_ITEMS: 50,
});

export const EVENTS = Object.freeze({
    REQUEST_CHANGED: "request:changed",
    REQUEST_SENT: "request:sent",
    RESPONSE_RECEIVED: "response:received",
    RESPONSE_ERROR: "response:error",
    REQUEST_TAB_CHANGED: "request:tab:changed",
    RESPONSE_TAB_CHANGED: "response:tab:changed",
    THEME_CHANGED: "theme:changed",
    HISTORY_CHANGED: "history:changed",
    SIDEBAR_CHANGED: "sidebar:changed",
    LOADING_STARTED: "loading:started",
    LOADING_FINISHED: "loading:finished",
});

export const REQUEST_TIMEOUT = 30000;

export const RESPONSE_FORMAT = Object.freeze({
    JSON: "json",
    XML: "xml",
    HTML: "html",
    TEXT: "text",
    UNKNOWN: "unknown",
});
