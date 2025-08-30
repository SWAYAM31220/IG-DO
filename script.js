// Configuration
const API_BASE_URL = "https://downloader-0f5k.onrender.com";

// DOM elements
const urlInput = document.getElementById("urlInput");
const clearBtn = document.getElementById("clearBtn");
const platformSelect = document.getElementById("platformSelect");
const downloadBtn = document.getElementById("downloadBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");
const resultSection = document.getElementById("resultSection");
const resultTitle = document.getElementById("resultTitle");
const resultMeta = document.getElementById("resultMeta");
const mediaContainer = document.getElementById("mediaContainer");

// Enhanced platform detection with shortened URLs
function detectPlatform(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("instagram.com/reel/")) return "reel";
  if (urlLower.includes("instagram.com/p/")) return "igpost";
  if (urlLower.includes("tiktok.com") || urlLower.includes("vm.tiktok.com"))
    return "tiktok";
  if (
    urlLower.includes("youtube.com") ||
    urlLower.includes("youtu.be") ||
    urlLower.includes("m.youtube.com")
  )
    return "youtube";
  if (
    urlLower.includes("facebook.com") ||
    urlLower.includes("fb.watch") ||
    urlLower.includes("m.facebook.com")
  )
    return "facebook";
  if (urlLower.includes("threads.net")) return "threads";
  if (urlLower.includes("pinterest.com") || urlLower.includes("pin.it"))
    return "pinterest";
  if (
    urlLower.includes("twitter.com") ||
    urlLower.includes("x.com") ||
    urlLower.includes("t.co")
  )
    return "twitter";
  if (urlLower.includes("pornhub.com")) return "pornhub";
  return null;
}

// URL validation
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// UI helpers
function showElement(el) {
  el.classList.remove("hidden");
}
function hideElement(el) {
  el.classList.add("hidden");
}
function resetUI() {
  hideElement(loadingSpinner);
  hideElement(errorMessage);
  hideElement(resultSection);
  downloadBtn.disabled = false;
}
function showError(message) {
  errorText.textContent = message;
  showElement(errorMessage);
  hideElement(loadingSpinner);
  downloadBtn.disabled = false;
}
function showLoading() {
  showElement(loadingSpinner);
  hideElement(errorMessage);
  hideElement(resultSection);
  downloadBtn.disabled = true;
}

// Create media item
function createMediaItem(item, index, total, title) {
  const mediaItem = document.createElement("div");
  mediaItem.className = "media-item";

  const thumbnailHtml = item.thumbnail
    ? `<img src="${item.thumbnail}" alt="Thumbnail" class="media-thumbnail">`
    : "";
  let titleHtml = "";
  if (title) titleHtml = `<div class="media-title">${title}</div>`;
  else if (item.type === "image" && total > 1)
    titleHtml = `<div class="media-title">Image ${index + 1} of ${total}</div>`;

  const metaHtml = item.duration
    ? `<div class="media-meta">Duration: ${item.duration}</div>`
    : "";

  const label =
    item.label ||
    `Download ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`;
  const actionsHtml = item.url
    ? `
    <div class="download-actions">
        <a href="${item.url}" target="_blank" class="download-link" download>
            <i class="fas fa-download"></i> ${label}
        </a>
        <button class="copy-btn" onclick="copyToClipboard('${item.url}', this)">
            <i class="fas fa-copy"></i> Copy Link
        </button>
    </div>
`
    : "";

  mediaItem.innerHTML = `
        <div class="media-info">
            ${thumbnailHtml}
            ${titleHtml}
            ${metaHtml}
            ${actionsHtml}
        </div>
    `;
  return mediaItem;
}

// Show results
function showResult(data) {
  resultTitle.textContent = data.title || "Download Ready";
  let metaText = "";
  if (data.platform)
    metaText += `Platform: ${
      data.platform.charAt(0).toUpperCase() + data.platform.slice(1)
    }`;
  if (data.type)
    metaText += ` • Type: ${data.type.replace("_", " & ").toUpperCase()}`;
  resultMeta.textContent = metaText;

  mediaContainer.innerHTML = "";

  if (data.type === "images" && data.items.length > 1) {
    mediaContainer.className = "media-container media-grid";
  } else {
    mediaContainer.className = "media-container";
  }

  data.items.forEach((item, index) => {
    const mediaItem = createMediaItem(
      item,
      index,
      data.items.length,
      data.title
    );
    mediaContainer.appendChild(mediaItem);
  });

  showElement(resultSection);
  hideElement(loadingSpinner);
  downloadBtn.disabled = false;
}

// Copy to clipboard
window.copyToClipboard = async function (text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const original = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.classList.add("copied");
    setTimeout(() => {
      button.innerHTML = original;
      button.classList.remove("copied");
    }, 2000);
  } catch (err) {
    console.error(err);
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
      button.innerHTML = '<i class="fas fa-copy"></i> Copy Link';
    }, 2000);
  }
};

// Handle download
async function handleDownload() {
  const url = urlInput.value.trim();
  if (!url) {
    showError("Please enter a URL");
    return;
  }
  if (!isValidUrl(url)) {
    showError("Please enter a valid URL");
    return;
  }

  let platform = platformSelect.value;
  if (platform === "auto") {
    platform = detectPlatform(url);
    if (!platform) {
      showError("Could not detect platform. Please select manually.");
      return;
    }
  }

  showLoading();

  try {
    const response = await fetch(`${API_BASE_URL}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, url }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to process request");
    if (data.status === "success") showResult(data);
    else showError(data.message || "Failed to get download link");
  } catch (error) {
    console.error(error);
    showError(error.message || "An unexpected error occurred");
  }
}

// Auto-detect platform on URL input
function handleUrlChange() {
  const url = urlInput.value.trim();
  clearBtn.classList.toggle("visible", !!url);
  if (url && isValidUrl(url)) {
    const detectedPlatform = detectPlatform(url);
    if (detectedPlatform) platformSelect.value = detectedPlatform;
  }
}

// Event listeners
downloadBtn.addEventListener("click", handleDownload);
urlInput.addEventListener("input", handleUrlChange);
urlInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleDownload();
});
clearBtn.addEventListener("click", () => {
  urlInput.value = "";
  platformSelect.value = "auto";
  clearBtn.classList.remove("visible");
  resetUI();
  urlInput.focus();
});
platformSelect.addEventListener("change", resetUI);
document.querySelectorAll(".platform-icon").forEach((icon) => {
  icon.addEventListener("click", () => {
    const platform = icon.getAttribute("data-platform");
    if (platform) platformSelect.value = platform;
    urlInput.focus();
  });
});
urlInput.addEventListener("paste", () => setTimeout(handleUrlChange, 100));

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  resetUI();
  urlInput.focus();
});
