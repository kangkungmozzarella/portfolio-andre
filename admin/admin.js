import { schema, emptyRecord, validateContent } from "/cms/schema.mjs";
const $ = (selector) => document.querySelector(selector);
const e = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const form = $("#content-form");
const mediaDialog = $("#media-dialog");
let content, baseline, version, token;
let active = Object.keys(schema)[0];
let busy = false,
  dirty = false;
let media = [],
  mediaCallback = null,
  mediaReturnPath = null;
let openItems = new Set();
const fieldDefinitions = new Map();
const get = (path) => path.split(".").reduce((obj, key) => obj[key], content);
function set(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  keys.reduce((obj, key) => obj[key], content)[last] = value;
}
const filename = (path) => path.split("/").pop();
const imageURL = (path) =>
  "/" + path.split("/").map(encodeURIComponent).join("/");
function message(text, error = false, target = "#message") {
  const node = $(target);
  node.textContent = text;
  node.classList.toggle("error", error);
  node.hidden = !text;
}
function updateState() {
  dirty = JSON.stringify(content) !== baseline;
  $("#save").disabled = busy || !dirty;
  $("#discard").disabled = busy || !dirty;
  $("#save").textContent = busy ? "Menyimpan…" : "Simpan perubahan";
  $("#save-state").textContent = busy
    ? "Sedang menyimpan ke laptop…"
    : dirty
      ? "Ada perubahan belum disimpan"
      : "Semua perubahan tersimpan di laptop";
  $("#save-state").classList.toggle("unsaved", dirty && !busy);
}
async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...options.headers, ...(token ? { "X-CMS-Token": token } : {}) },
  });
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json"))
    throw new Error(
      "CMS belum terhubung. Jalankan npm run cms, lalu buka alamat /admin/ yang ditampilkan.",
    );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Permintaan gagal. Coba lagi.");
  return data;
}
function nav() {
  $("#section-nav").innerHTML = Object.entries(schema)
    .map(
      ([key, section], i) =>
        `<button type="button" class="nav-item" data-section="${key}" ${key === active ? 'aria-current="page"' : ""}>${section.label}<span>${section.type === "list" ? String(content[key].length).padStart(2, "0") : String(i + 1).padStart(2, "0")}</span></button>`,
    )
    .join("");
}
function rememberOpen() {
  form
    .querySelectorAll("details[data-item]")
    .forEach((item) =>
      item.open
        ? openItems.add(item.dataset.item)
        : openItems.delete(item.dataset.item),
    );
}
function fieldsHTML(fields, base) {
  return `<div class="fields">${Object.entries(fields)
    .filter(([, field]) => !field.hidden)
    .map(([key, field]) => fieldHTML(field, `${base}.${key}`))
    .join("")}</div>`;
}
function fieldHTML(field, path) {
  fieldDefinitions.set(path, field);
  const value = get(path),
    id = `field-${path}`;
  const label = `<span class="field-label">${e(field.label)}${field.required ? '<span class="required" aria-hidden="true">*</span>' : ""}</span>`;
  const hint = field.hint
    ? `<span class="field-hint" id="hint-${path}">${e(field.hint)}</span>`
    : "";
  const attrs = `id="${id}" data-field="${path}" ${field.required ? "required" : ""} ${field.max && !["lines", "list", "images"].includes(field.type) ? `maxlength="${field.max}"` : ""} ${hint ? `aria-describedby="hint-${path}"` : ""}`;
  if (field.type === "list")
    return `<div class="collection-field">${label}${collectionHTML(field, path)}${hint}</div>`;
  if (field.type === "image")
    return `<div class="field wide">${label}<div class="image-field"><div class="image-preview">${value ? `<img src="${e(imageURL(value))}" alt="${e(field.label)}">` : '<span aria-hidden="true">＋</span>'}</div><div><p class="image-name">${e(value ? filename(value) : "Belum ada gambar dipilih")}</p><button type="button" class="button ghost" data-media-path="${path}" aria-label="Pilih ${e(field.label.toLowerCase())}">Pilih gambar</button></div></div>${hint}</div>`;
  if (field.type === "images")
    return `<div class="field wide">${label}<div class="image-gallery">${value.map((src, i) => `<div class="gallery-card"><button type="button" class="gallery-image" data-media-path="${path}.${i}" aria-label="Ganti gambar ${i + 1}"><img src="${e(imageURL(src))}" alt="Gambar galeri ${i + 1}"><span>${i === 0 ? "Sampul" : `Gambar ${i + 1}`}</span></button><div class="gallery-actions"><button type="button" class="icon-button" data-move="${path}" data-index="${i}" data-direction="-1" ${i === 0 ? "disabled" : ""} aria-label="Geser gambar ${i + 1} ke kiri">←</button><button type="button" class="icon-button danger" data-remove="${path}" data-index="${i}" ${value.length <= field.min ? "disabled" : ""} aria-label="Hapus gambar ${i + 1}">×</button><button type="button" class="icon-button" data-move="${path}" data-index="${i}" data-direction="1" ${i === value.length - 1 ? "disabled" : ""} aria-label="Geser gambar ${i + 1} ke kanan">→</button></div></div>`).join("")}${value.length < field.max ? `<button type="button" class="gallery-add" data-add-image="${path}">＋ Tambah gambar</button>` : ""}</div>${hint}</div>`;
  if (field.type === "select")
    return `<label class="field" for="${id}">${label}<select ${attrs}>${Object.entries(
      field.options,
    )
      .map(
        ([key, title]) =>
          `<option value="${key}" ${key === value ? "selected" : ""}>${e(title)}</option>`,
      )
      .join("")}</select>${hint}</label>`;
  if (["textarea", "lines"].includes(field.type))
    return `<label class="field wide" for="${id}">${label}<textarea ${attrs} rows="${field.type === "lines" ? 5 : 3}">${e(Array.isArray(value) ? value.join("\n") : value)}</textarea>${hint}</label>`;
  return `<label class="field" for="${id}">${label}<input ${attrs} type="${["url", "email"].includes(field.type) ? field.type : "text"}" value="${e(value)}">${hint}</label>`;
}
function collectionHTML(definition, path) {
  fieldDefinitions.set(path, definition);
  const items = get(path);
  return `<div class="collection-actions"><p>${items.length} item · gunakan panah untuk mengubah urutan</p><button type="button" class="button primary" data-add="${path}" ${items.length >= definition.max ? "disabled" : ""}>＋ Tambah item</button></div><div class="collection-list">${
    items
      .map((item, i) => {
        const itemPath = `${path}.${i}`;
        const title =
          item.title || item.role || item.label || `Item baru ${i + 1}`;
        return `<details class="item-card" data-item="${itemPath}" ${openItems.has(itemPath) ? "open" : ""}><summary><span class="item-number">${String(i + 1).padStart(2, "0")}</span><span class="item-title">${e(title)}</span></summary><div class="item-body"><div class="item-tools"><div><button type="button" class="icon-button" data-move="${path}" data-index="${i}" data-direction="-1" ${i === 0 ? "disabled" : ""} aria-label="Pindahkan ${e(title)} ke atas">↑</button><button type="button" class="icon-button" data-move="${path}" data-index="${i}" data-direction="1" ${i === items.length - 1 ? "disabled" : ""} aria-label="Pindahkan ${e(title)} ke bawah">↓</button></div><button type="button" class="button danger" data-remove="${path}" data-index="${i}" ${items.length <= definition.min ? "disabled" : ""}>Hapus item</button></div>${fieldsHTML(definition.fields, itemPath)}</div></details>`;
      })
      .join("") ||
    '<div class="empty-state">Belum ada item.<p>Tambahkan item pertama untuk menampilkannya di portfolio.</p></div>'
  }</div>`;
}
function render() {
  const section = schema[active];
  fieldDefinitions.clear();
  $("#section-title").textContent = section.label;
  $("#section-description").textContent = section.description;
  $("#section-index").textContent =
    `KONTEN PORTFOLIO / ${String(Object.keys(schema).indexOf(active) + 1).padStart(2, "0")}`;
  form.innerHTML =
    section.type === "list"
      ? collectionHTML(section, active)
      : `<div class="form-panel">${fieldsHTML(section.fields, active)}</div>`;
  nav();
  updateState();
}
async function load() {
  const data = await api("/api/content");
  content = data.content;
  baseline = JSON.stringify(content);
  version = data.version;
  token = data.token;
  openItems = new Set(
    Object.entries(schema)
      .filter(([, s]) => s.type === "list")
      .map(([key]) => `${key}.0`),
  );
  render();
}
$("#section-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-section]");
  if (!button || busy) return;
  rememberOpen();
  active = button.dataset.section;
  message("");
  render();
});
form.addEventListener("input", (event) => {
  const path = event.target.dataset.field;
  if (!path) return;
  const field = fieldDefinitions.get(path);
  set(
    path,
    field.type === "lines"
      ? event.target.value.split(/\r?\n/).filter((line) => line.trim())
      : event.target.value,
  );
  if (["title", "role", "label"].includes(path.split(".").pop())) {
    const details = event.target.closest("[data-item]");
    if (details)
      details.querySelector(".item-title").textContent =
        event.target.value || "Item baru";
  }
  updateState();
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  save();
});
form.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || busy) return;
  rememberOpen();
  if (button.dataset.mediaPath)
    return openMedia(
      (path) => set(button.dataset.mediaPath, path),
      button.dataset.mediaPath,
    );
  if (button.dataset.addImage)
    return openMedia(
      (path) => get(button.dataset.addImage).push(path),
      button.dataset.addImage,
    );
  if (button.dataset.add) {
    const path = button.dataset.add,
      list = get(path),
      definition = fieldDefinitions.get(path);
    list.push(emptyRecord(definition.fields));
    openItems.add(`${path}.${list.length - 1}`);
    render();
    const newItem = form.querySelector(
      `[data-item="${path}.${list.length - 1}"]`,
    );
    newItem?.scrollIntoView({ block: "nearest" });
    newItem?.querySelector("input,textarea")?.focus({ preventScroll: true });
  } else if (button.dataset.remove) {
    const path = button.dataset.remove,
      index = Number(button.dataset.index);
    if (
      !confirm("Hapus item ini? Perubahan diterapkan setelah kamu menyimpan.")
    )
      return;
    get(path).splice(index, 1);
    render();
  } else if (button.dataset.move) {
    const path = button.dataset.move,
      index = Number(button.dataset.index),
      target = index + Number(button.dataset.direction),
      list = get(path);
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    openItems.delete(`${path}.${index}`);
    openItems.add(`${path}.${target}`);
    render();
    form.querySelector(`[data-item="${path}.${target}"] summary`)?.focus();
  }
});
async function save() {
  if (busy || !dirty) return;
  try {
    validateContent(content);
  } catch (error) {
    message(error.message, true);
    return;
  }
  busy = true;
  form.inert = true;
  $("#section-nav").inert = true;
  updateState();
  message("");
  try {
    const data = await api("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, version }),
    });
    content = data.content;
    version = data.version;
    baseline = JSON.stringify(content);
    rememberOpen();
    render();
    message(
      "Tersimpan di laptop. Buka portfolio untuk melihat hasilnya; commit dan push saat siap publish.",
    );
  } catch (error) {
    message(error.message, true);
  } finally {
    busy = false;
    form.inert = false;
    $("#section-nav").inert = false;
    updateState();
  }
}
$("#save").addEventListener("click", save);
$("#discard").addEventListener("click", async () => {
  if (
    busy ||
    !confirm(
      "Muat ulang konten tersimpan? Perubahan yang belum disimpan akan dibuang.",
    )
  )
    return;
  try {
    await load();
    message("Konten tersimpan sudah dimuat ulang.");
  } catch (error) {
    message(error.message, true);
  }
});
window.addEventListener("beforeunload", (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    if (content) save();
  }
});

function renderMedia() {
  const query = $("#media-search").value.trim().toLowerCase();
  const filtered = media.filter((item) =>
    item.path.toLowerCase().includes(query),
  );
  $("#media-grid").innerHTML =
    filtered
      .map(
        (item) =>
          `<button type="button" class="media-choice" data-select-media="${e(item.path)}"><img src="${e(imageURL(item.path))}" alt="" loading="lazy"><span>${e(item.name)}<small>${e(item.path.replace("assets/images/", ""))} · ${Math.ceil(item.bytes / 1024)} KB</small></span></button>`,
      )
      .join("") ||
    '<p class="media-empty">Tidak ada gambar yang cocok. Coba kata lain atau unggah gambar baru.</p>';
}
async function openMedia(callback, returnPath) {
  mediaCallback = callback;
  mediaReturnPath = returnPath;
  $("#media-search").value = "";
  message("", false, "#media-message");
  $("#media-grid").innerHTML = '<p class="media-empty">Memuat gambar…</p>';
  mediaDialog.showModal();
  try {
    const data = await api("/api/media");
    media = data.images;
    renderMedia();
  } catch (error) {
    message(error.message, true, "#media-message");
  }
}
$("#close-media").addEventListener("click", () => mediaDialog.close());
$("#media-search").addEventListener("input", renderMedia);
$("#media-grid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-select-media]");
  if (!button || !mediaCallback) return;
  mediaCallback(button.dataset.selectMedia);
  mediaDialog.close();
  render();
  form.querySelector(`[data-media-path="${mediaReturnPath}"]`)?.focus();
});
$("#upload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    message("Ukuran gambar maksimal 10 MB.", true, "#media-message");
    event.target.value = "";
    return;
  }
  event.target.disabled = true;
  message("Mengunggah gambar…", false, "#media-message");
  try {
    const result = await api(
      `/api/upload?name=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      },
    );
    mediaCallback(result.path);
    mediaDialog.close();
    render();
    message(
      "Gambar sudah dipilih. Simpan perubahan untuk menampilkannya di portfolio.",
    );
    form.querySelector(`[data-media-path="${mediaReturnPath}"]`)?.focus();
  } catch (error) {
    message(error.message, true, "#media-message");
  } finally {
    event.target.disabled = false;
    event.target.value = "";
  }
});
load().catch((error) => {
  message(error.message, true, "#connection-error");
  $("#save-state").textContent = "Belum terhubung ke CMS lokal";
  $("#section-description").textContent =
    "Jalankan npm run cms, lalu buka halaman admin dari alamat yang ditampilkan di terminal.";
});
