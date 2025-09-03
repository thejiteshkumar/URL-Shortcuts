async function loadShortcuts() {
  const { shortcuts } = await chrome.storage.sync.get("shortcuts");
  const list = document.getElementById("shortcutsList");
  list.innerHTML = "";

  if (!shortcuts) return;

  for (const [key, url] of Object.entries(shortcuts)) {
    // Container
    const row = document.createElement("div");
    row.className =
      "group flex items-center justify-between text-sm text-gray-300 bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition";

    const info = document.createElement("div");
    info.className = "grid grid-cols-2 gap-2 flex-grow";
    const shortcutSpan = document.createElement("span");
    shortcutSpan.textContent = key;
    const urlSpan = document.createElement("span");
    urlSpan.textContent = url;
    urlSpan.className = "truncate";
    info.appendChild(shortcutSpan);
    info.appendChild(urlSpan);

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.className =
      "ml-2 text-red-400 hover:text-red-600 hidden group-hover:block transition";

    // Delete logic
    delBtn.addEventListener("click", async () => {
      const { shortcuts } = await chrome.storage.sync.get("shortcuts");
      if (!shortcuts) return;
      delete shortcuts[key];
      await chrome.storage.sync.set({ shortcuts });
      loadShortcuts();
    });

    row.appendChild(info);
    row.appendChild(delBtn);
    list.appendChild(row);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const shortcutInput = document.getElementById("shortcutInput");
  const urlInput = document.getElementById("urlInput");
  const saveButton = document.getElementById("saveButton");

  saveButton.addEventListener("click", async () => {
    const key = shortcutInput.value.trim();
    const url = urlInput.value.trim();

    if (!key || !url) {
      alert("Please enter both shortcut and URL.");
      return;
    }

    // Normalize shortcut → always start with "/"
    const shortcutKey = key.startsWith("/") ? key : "/" + key;

    // Fetch existing shortcuts
    const { shortcuts } = await chrome.storage.sync.get("shortcuts");
    const updated = { ...(shortcuts || {}), [shortcutKey]: url };

    // Save back to sync storage
    await chrome.storage.sync.set({ shortcuts: updated });

    // Clear inputs
    shortcutInput.value = "";
    urlInput.value = "";

    if (typeof loadShortcuts === "function") {
      loadShortcuts();
    }
  });
});

document.addEventListener("DOMContentLoaded", loadShortcuts);
