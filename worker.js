// --- Simple key→URL map, synced. Seed on install if user has none.
const DEFAULT_SHORTCUTS = {
  "/ai": "https://gemini.google.com",
  "/gh": "https://github.com",
  "/gg": "https://www.google.com",
};

// Normalize user input (accept with or without leading slash)
function normalizeKey(input) {
  if (!input) return "";
  input = input.trim();
  return input.startsWith("/") ? input : "/" + input;
}

// Fetch shortcuts from storage (returns a Promise)
function getShortcuts() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ shortcuts: null }, ({ shortcuts }) => {
      resolve(shortcuts || {});
    });
  });
}

// Seed defaults on install if nothing exists yet
chrome.runtime.onInstalled.addListener(async () => {
  const current = await getShortcuts();
  if (!current || Object.keys(current).length === 0) {
    chrome.storage.sync.set({ shortcuts: DEFAULT_SHORTCUTS });
  }
});

// Show a default hint under the omnibox right away
chrome.omnibox.setDefaultSuggestion({
  description:
    "Type a shortcut like <match>/ai</match> → <url>https://gemini.google.com</url>",
});

// As user types after keyword `s`, provide suggestions
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const shortcuts = await getShortcuts();

  // Try both raw and normalized lookups
  const key = normalizeKey(text);
  const matches = Object.entries(shortcuts)
    .filter(([k]) => k.startsWith(key))
    .slice(0, 5);

  if (matches.length === 0) {
    // Offer to open as a search or raw URL if user typed something
    if (text.trim()) {
      suggest([
        {
          content: text,
          description: `Open as typed: <url>${text}</url>`,
        },
      ]);
    }
    return;
  }

  // Build nice suggestions
  const suggestions = matches.map(([k, url]) => ({
    content: k, // what gets passed to onInputEntered
    description: `<match>${k}</match> → <url>${url}</url>`,
  }));

  suggest(suggestions);
});

// When user presses Enter on a suggestion or free text
chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const shortcuts = await getShortcuts();

  let target = null;

  // Exact match first (normalized and raw)
  const normalized = normalizeKey(text);
  if (shortcuts[normalized]) {
    target = shortcuts[normalized];
  } else if (shortcuts[text]) {
    target = shortcuts[text];
  }

  // If not a shortcut, accept raw URL (prepend https:// if it looks like a host)
  if (!target) {
    const t = text.trim();
    if (/^https?:\/\//i.test(t)) {
      target = t;
    } else if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(t)) {
      target = "https://" + t;
    } else {
      // Fallback: perform a Google search
      const q = encodeURIComponent(t);
      target = `https://www.google.com/search?q=${q}`;
    }
  }

  // Open according to how the user confirmed the input
  switch (disposition) {
    case "currentTab":
      chrome.tabs.update({ url: target });
      break;
    case "newForegroundTab":
      chrome.tabs.create({ url: target });
      break;
    case "newBackgroundTab":
      chrome.tabs.create({ url: target, active: false });
      break;
    default:
      chrome.tabs.update({ url: target });
  }
});
