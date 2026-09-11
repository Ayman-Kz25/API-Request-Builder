// src/scripts/api/request.js

import { DEFAULT_HTTP_METHOD, REQUEST_TIMEOUT } from "../core/constants.js";
import { normalizeResponse } from "./response.js";

const METHODS_WITHOUT_BODY = ["GET", "HEAD"];

function validateUrl(url) {
  if (!url?.trim()) {
    throw new Error("Please enter a valid URL.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url.trim());
  } catch (error) {
    throw new Error("Please enter a valid URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLS are Supported.");
  }

  return parsedUrl;
}

function addHeaders(headers, requestHeaders = []) {
  if (!Array.isArray(requestHeaders)) {
    return;
  }

  requestHeaders.forEach((header) => {
    if (!header?.name?.trim()) {
      return;
    }

    headers.set(header.name.trim(), String(header.value ?? ""));
  });
}

function addAuth(headers, auth) {
  if (!auth) {
    return;
  }

  const fields = auth.fields || {};

  if (auth.type === "bearer" && fields.token) {
    headers.set("Authorization", `Bearer ${fields.token}`);
  }

  if (auth.type === "basic") {
    const username = fields.username || "";
    const password = fields.password || "";

    if (username || password) {
      const encoded = btoa(`${username}:${password}`);

      headers.set("Authorization", `Basic ${encoded}`);
    }
  }

  if (
    auth.type === "api-key" &&
    fields.key &&
    fields.value &&
    fields.location === "header"
  ) {
    headers.set(fields.key, fields.value);
  }
}

function buildRequestConfig({
  method = DEFAULT_HTTP_METHOD,
  headers = [],
  body = "",
  bodyType = "json",
  auth = null,
} = {}) {
  const normalizedMethod =
    String(method).trim().toUpperCase() || DEFAULT_HTTP_METHOD;

  const requestHeaders = new Headers();

  addHeaders(requestHeaders, headers);
  addAuth(requestHeaders, auth);

  const config = {
    method: normalizedMethod,
    headers: requestHeaders,
  };

  if (body && !METHODS_WITHOUT_BODY.includes(normalizedMethod)) {
    config.body = body instanceof FormData
      ? body
      : typeof body === "string"
        ? body
        : JSON.stringify(body);

    if (!requestHeaders.has("Content-Type") && bodyType !== "multipart") {
      const contentTypes = {
        json: "application/json",
        text: "text/plain",
        javascript: "application/javascript",
        xml: "application/xml",
        html: "text/html",
        "form-urlencoded": "application/x-www-form-urlencoded",
      };
      requestHeaders.set("Content-Type", contentTypes[bodyType] || "application/octet-stream");
    }
  }
  return config;
}

export async function sendRequest({
  url,
  method = DEFAULT_HTTP_METHOD,
  headers = [],
  body = "",
  bodyType = "json",
  auth = null,
  timeout = REQUEST_TIMEOUT,
} = {}) {
  const parsedUrl = validateUrl(url);

  const config = buildRequestConfig({
    method,
    headers,
    body,
    bodyType,
    auth,
  });

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  const startedAt = performance.now();

  try {
    const response = await fetch(parsedUrl.href, {
      ...config,
      signal: controller.signal,
    });

    const raw = await response.text();

    const duration = Math.round(performance.now() - startedAt);

    return normalizeResponse(response, raw, duration);
  } catch (error) {
    if(error.name === "AbortError"){
        throw new Error("The request timed out.");
    }

    if(error instanceof TypeError){
        throw new Error("A network error occured. Check the URL and your connection.");
    }

    throw error;
  } finally{
    clearTimeout(timeoutId);
  }
}
