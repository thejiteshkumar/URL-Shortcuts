async function loadShortcuts() {
  const { shortcuts } = await chrome.storage.sync.get("shortcuts");
  const list = document.getElementById("list");
  list.innerHTML = "";

  if (!shortcuts) return;

  for (const [key, url] of Object.entries(shortcuts)) {
    const li = document.createElement("li");
    li.textContent = `${key} → ${url}`;
    list.appendChild(li);
  }
}

document
  .getElementById("shortcutForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const key = document.getElementById("key").value.trim();
    const url = document.getElementById("url").value.trim();

    if (!key || !url) return;

    const { shortcuts } = await chrome.storage.sync.get("shortcuts");
    const updated = { ...(shortcuts || {}), [key]: url };

    await chrome.storage.sync.set({ shortcuts: updated });

    document.getElementById("key").value = "";
    document.getElementById("url").value = "";

    loadShortcuts();
  });

loadShortcuts();
