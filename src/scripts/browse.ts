import {
  describeFilter,
  emptyFilter,
  filterPlaces,
  filterStateFromParams,
  paramsFromFilter,
  sanitizeFilter,
  type FilterState,
  type SearchRecord,
} from "../lib/filter";

const root = document.querySelector<HTMLElement>("[data-browse]");
if (root) {
  const indexNode = document.querySelector<HTMLScriptElement>("#place-index");
  const records = JSON.parse(indexNode?.textContent || "[]") as SearchRecord[];
  document.querySelector("#filters")?.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  const areaLabels = new Map(records.map((record) => [record.areaSlug, record.area]));
  const search = document.querySelector<HTMLInputElement>("#q");
  const area = document.querySelector<HTMLSelectElement>("#area");
  const count = document.querySelector<HTMLElement>("#count");
  const empty = document.querySelector<HTMLElement>("#empty");
  const emptyReason = document.querySelector<HTMLElement>("#empty-reason");
  const chips = [...document.querySelectorAll<HTMLButtonElement>("[data-category]")];
  const rows = [...document.querySelectorAll<HTMLElement>("[data-place]")];
  const sections = [...document.querySelectorAll<HTMLElement>("[data-section]")];

  let state: FilterState = { ...emptyFilter };

  function readControls(): FilterState {
    const pressed = chips.find((chip) => chip.getAttribute("aria-pressed") === "true");
    return sanitizeFilter(
      {
        query: search?.value ?? "",
        category: pressed?.dataset.category ?? "",
        area: area?.value ?? "",
      },
      records,
    );
  }

  function writeControls(next: FilterState) {
    if (search && search.value !== next.query) search.value = next.query;
    if (area) area.value = next.area;
    for (const chip of chips) {
      chip.setAttribute("aria-pressed", chip.dataset.category === next.category ? "true" : "false");
    }
  }

  function apply(next: FilterState, historyMode: "push" | "replace" | "none") {
    state = sanitizeFilter(next, records);
    writeControls(state);
    const allowed = new Set(filterPlaces(records, state).map((record) => record.slug));
    for (const row of rows) {
      row.hidden = !allowed.has(row.dataset.place ?? "");
    }
    for (const section of sections) {
      const visible = section.querySelector("[data-place]:not([hidden])");
      section.hidden = !visible;
    }
    const noun = allowed.size === 1 ? "place" : "places";
    const described = describeFilter(state, (slug) => areaLabels.get(slug) ?? slug);
    if (count) {
      const filtered = Boolean(state.category || state.area || state.query.trim());
      count.textContent = filtered ? `${allowed.size} ${noun} · ${described}` : `${records.length} places`;
    }
    if (empty && emptyReason) {
      empty.hidden = allowed.size > 0;
      emptyReason.textContent =
        allowed.size > 0 ? "" : `No place matches ${described}. Clear the filters to see every place.`;
    }
    if (historyMode !== "none") {
      const path = `/${paramsFromFilter(state)}`;
      if (historyMode === "push") history.pushState(state, "", path);
      else history.replaceState(state, "", path);
    }
    document.documentElement.classList.add("ready");
  }

  function fromUrl(): FilterState {
    return sanitizeFilter(filterStateFromParams(new URLSearchParams(location.search)), records);
  }

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      const current = readControls();
      const picked = chip.dataset.category ?? "";
      apply({ ...current, category: current.category === picked ? "" : picked }, "push");
    });
  }

  search?.addEventListener("input", () => {
    apply(readControls(), "replace");
  });

  area?.addEventListener("change", () => {
    apply(readControls(), "push");
  });

  document.querySelector("#reset")?.addEventListener("click", (event) => {
    event.preventDefault();
    apply(emptyFilter, "push");
    search?.focus();
  });

  window.addEventListener("popstate", () => {
    apply(fromUrl(), "none");
  });

  apply(fromUrl(), "none");
}

const copyButton = document.querySelector<HTMLButtonElement>("#copy-note");
const note = document.querySelector<HTMLTextAreaElement>("#note");
const copyStatus = document.querySelector<HTMLElement>("#copy-status");
copyButton?.addEventListener("click", async () => {
  if (!note || !copyStatus) return;
  const text = note.value;
  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "Copied to your clipboard. Nothing was sent or saved.";
  } catch {
    note.focus();
    note.select();
    copyStatus.textContent = "Clipboard is unavailable. Select the note and copy it yourself. Nothing was sent or saved.";
  }
});
