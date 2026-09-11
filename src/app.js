import { createIcons, icons } from "lucide";

import { initializeTheme } from "./scripts/ui/theme.js";
import { initDOM } from "./scripts/ui/dom.js";
import { initTabs } from "./scripts/ui/tabs.js";
import { initDropdown } from "./scripts/ui/dropdown.js";
import { initLoader } from "./scripts/ui/loader.js";
import { initEmptyState } from "./scripts/ui/empty-state.js";

import {
  getRequest,
  initRequestBuilder,
  getFinalRequestUrl,
  validateRequest,
  resetRequest,
} from "./scripts/features/request-builder/request-builder.js";

import { initQueryParams } from "./scripts/features/request-builder/query-params.js";
import { initHeaders } from "./scripts/features/request-builder/headers.js";
import { initRequestBody } from "./scripts/features/request-builder/body.js";

import {
  initResponseViewer,
  getResponse,
} from "./scripts/features/response-viewer/response-viewer.js";

import { initResponseTabs } from "./scripts/features/response-viewer/response-tabs.js";

import { initHistory } from "./scripts/features/history/history.js";
import { initHistoryRenderer } from "./scripts/features/history/history-renderer.js";

import { initCodeGenerator } from "./scripts/features/code-generator/code-generator.js";

import { initJsonEditor } from "./scripts/features/editor/json-editor.js";

import { sendRequest } from "./scripts/api/request.js";
import { initSidebar } from "./scripts/ui/sidebar.js";

let initialized = false;

let responseViewer = null;
let codeGenerator = null;

/**
 * Initialize the application.
 */
export function initializeApp() {
  if (initialized) {
    return;
  }

  initialized = true;

  initDOM(document);

  initializeTheme();
  initTabs();
  initDropdown();
  initSidebar();

  initLoader();
  initEmptyState();

  initRequestBuilder();
  initQueryParams();
  initHeaders();
  initRequestBody();

  initJsonEditor("#json-editor");

  responseViewer = initResponseViewer();

  initResponseTabs();

  initHistoryRenderer();
  initHistory();

  codeGenerator = initCodeGenerator();

  bindAppEvents();

  renderIcons();
}

/**
 * Bind application-level events.
 */
function bindAppEvents() {
  const sendButton = document.getElementById("send-request-button");
  const generateCodeButton = document.getElementById("generate-code-button");
  const copyResponseButton = document.getElementById("copy-response-button");
  const downloadResponseButton = document.getElementById(
    "download-response-button"
  );
  const backToRequestButton = document.getElementById(
    "back-to-request-button"
  );

  sendButton?.addEventListener("click", handleSendRequest);

  generateCodeButton?.addEventListener("click", handleGenerateCode);

  copyResponseButton?.addEventListener("click", handleCopyResponse);

  downloadResponseButton?.addEventListener(
    "click",
    handleDownloadResponse
  );

  backToRequestButton?.addEventListener(
    "click",
    handleBackToRequest
  );

  document.addEventListener(
    "sidebar:navigate",
    handleSidebarNavigation
  );
}

/**
 * Handle navigation events emitted by the sidebar.
 */
function handleSidebarNavigation(event) {
  const action = event.detail?.action;

  switch (action) {
    case "new-request":
      handleNewRequest();
      break;

    case "collections":
      handleCollections();
      break;

    case "history":
      handleHistory();
      break;

    case "environments":
      handleEnvironments();
      break;

    case "keyboard-shortcuts":
      handleKeyboardShortcuts();
      break;

    default:
      console.warn("Unknown sidebar action:", action);
  }
}

/**
 * Show the main request workspace.
 */
function showRequestWorkspace() {
  const requestWorkspace = document.getElementById("request-workspace");
  const featurePlaceholder = document.getElementById("feature-placeholder");

  requestWorkspace?.classList.remove("hidden");

  featurePlaceholder?.classList.add("hidden");
  featurePlaceholder?.classList.remove("flex");

  updateWorkspaceTitle(
    "Workspace",
    "HTTP Request Workspace"
  );
}

/**
 * Show a temporary placeholder for features that are not implemented yet.
 */
function showFeaturePlaceholder({
  title,
  description,
  icon = "construction",
}) {
  const requestWorkspace = document.getElementById("request-workspace");
  const featurePlaceholder = document.getElementById("feature-placeholder");

  const titleElement = document.getElementById(
    "feature-placeholder-title"
  );

  const descriptionElement = document.getElementById(
    "feature-placeholder-description"
  );

  const iconElement = document.getElementById(
    "feature-placeholder-icon"
  );

  if (!featurePlaceholder) {
    console.warn("Feature placeholder element not found");
    return;
  }

  requestWorkspace?.classList.add("hidden");

  featurePlaceholder.classList.remove("hidden");
  featurePlaceholder.classList.add("flex");

  if (titleElement) {
    titleElement.textContent = title;
  }

  if (descriptionElement) {
    descriptionElement.textContent = description;
  }

  if (iconElement) {
    iconElement.setAttribute("data-lucide", icon);
  }

  updateWorkspaceTitle(title, "Endpoint");

  renderIcons();
}

/**
 * Update the header workspace title.
 */
function updateWorkspaceTitle(title, subtitle) {
  const workspaceTitle = document.getElementById("workspace-title");
  const workspaceSubtitle = document.getElementById(
    "workspace-subtitle"
  );

  if (workspaceTitle) {
    workspaceTitle.textContent = title;
  }

  if (workspaceSubtitle) {
    workspaceSubtitle.textContent = subtitle;
  }
}

/**
 * New Request sidebar action.
 */
function handleNewRequest() {
  resetRequest();
  showRequestWorkspace();

  // console.log("New request created");
}

/**
 * Collections sidebar action.
 */
function handleCollections() {
  showFeaturePlaceholder({
    title: "Collections",
    description:
      "Collections are coming soon. You will be able to organize and save your requests here.",
    icon: "folder",
  });
}

/**
 * History sidebar action.
 */
function handleHistory() {
  showFeaturePlaceholder({
    title: "History",
    description:
      "Request history is coming soon. You will be able to browse and reopen previous requests here.",
    icon: "history",
  });
}

/**
 * Environments sidebar action.
 */
function handleEnvironments() {
  showFeaturePlaceholder({
    title: "Environments",
    description:
      "Environments are coming soon. You will be able to manage variables and environment settings here.",
    icon: "braces",
  });
}

/**
 * Keyboard Shortcuts sidebar action.
 */
function handleKeyboardShortcuts() {
  showFeaturePlaceholder({
    title: "Keyboard Shortcuts",
    description:
      "Keyboard shortcuts are coming soon. You will be able to view and customize shortcuts here.",
    icon: "keyboard",
  });
}

/**
 * Back to Request button.
 */
function handleBackToRequest() {
  showRequestWorkspace();
}

/**
 * Send the current HTTP request.
 */
async function handleSendRequest() {
  const validation = validateRequest();

  if (!validation.valid) {
    console.error(validation.errors);
    return;
  }

  const request = getRequest();
  const url = getFinalRequestUrl();

  try {
    const response = await sendRequest({
      url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      bodyType: request.bodyType,
      auth: request.auth,
    });

    responseViewer?.renderResponse(response);
  } catch (error) {
    console.error("Request failed:", error);
  }
}

/**
 * Open the code generator for the current request.
 */
function handleGenerateCode() {
  const request = getRequest();

  codeGenerator?.render(request);
  codeGenerator?.open();
}

/**
 * Copy the current response to the clipboard.
 */
async function handleCopyResponse(event) {
  const button = event.currentTarget;
  const response = getResponse();

  if (!response) {
    return;
  }

  const text = getResponseText(response);

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);

    if (button) {
      button.dataset.copied = "true";

      setTimeout(() => {
        delete button.dataset.copied;
      }, 1200);
    }
  } catch (error) {
    console.error("Failed to copy response:", error);
  }
}

/**
 * Download the current response as JSON.
 */
function handleDownloadResponse() {
  const response = getResponse();

  if (!response) {
    return;
  }

  const text = getResponseText(response);

  if (!text) {
    return;
  }

  const blob = new Blob([text], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "response.json";

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}

/**
 * Convert a response into displayable text.
 */
function getResponseText(response) {
  if (response == null) {
    return "";
  }

  if (typeof response === "string") {
    return response;
  }

  if (typeof response.body === "string") {
    return response.body;
  }

  if (typeof response.text === "string") {
    return response.text;
  }

  if (response.data !== undefined) {
    if (typeof response.data === "string") {
      return response.data;
    }

    try {
      return JSON.stringify(response.data, null, 2);
    } catch {
      return String(response.data);
    }
  }

  try {
    return JSON.stringify(response, null, 2);
  } catch {
    return String(response);
  }
}

/**
 * Render Lucide icons.
 */
function renderIcons() {
  createIcons({
    icons,
  });
}

export default {
  initializeApp,
};
