import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import { cameraForSelection, filterPlaces, filterStateFromParams, paramsFromFilter, type FilterState } from "../lib/browse";
import { MAP_STYLE, places, type Place } from "../lib/guide";
import { visibleLabelIds, type LabelBox } from "../lib/labels";
import { evidenceLink, EXTERNAL_ICON_PATH, markOutward } from "../lib/outward";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const root = document.querySelector<HTMLElement>("[data-app]");
if (root) {
  const chips = [...document.querySelectorAll<HTMLButtonElement>("[data-section]")];
  const chipRow = document.querySelector<HTMLElement>(".pills");
  const cards = [...document.querySelectorAll<HTMLElement>("[data-place]")];
  const groups = [...document.querySelectorAll<HTMLElement>("[data-group]")];
  const count = document.querySelector<HTMLElement>("#count");
  const mapNote = document.querySelector<HTMLElement>("#map-note");
  const tileNote = document.querySelector<HTMLElement>("#tile-note");
  const viewToggle = document.querySelector<HTMLButtonElement>("#view-toggle");
  const viewLabel = document.querySelector<HTMLElement>("#view-toggle-label");
  const mapElement = document.querySelector<HTMLElement>("#map");

  let state: FilterState = { section: "", query: "" };
  let selected = "";
  let map: maplibregl.Map | null = null;
  let mapFailed = false;
  let popup: maplibregl.Popup | null = null;
  let popupId = "";
  const markers = new Map<string, maplibregl.Marker>();

  function revealChip(chip: HTMLElement) {
    if (!chipRow) return;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const chipBox = chip.getBoundingClientRect();
    const row = chipRow.getBoundingClientRect();
    const pad = 8;
    if (chipBox.left < row.left + pad) chipRow.scrollLeft -= row.left + pad - chipBox.left;
    else if (chipBox.right > row.right - pad) chipRow.scrollLeft += chipBox.right - (row.right - pad);
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) window.scrollTo(scrollX, scrollY);
  }

  function updateChipHint() {
    if (!chipRow) return;
    const more = chipRow.scrollLeft + chipRow.clientWidth < chipRow.scrollWidth - 2;
    chipRow.classList.toggle("can-scroll", more);
  }

  function writeControls(next: FilterState) {
    for (const chip of chips) {
      const pressed = chip.dataset.section === next.section;
      chip.setAttribute("aria-pressed", pressed ? "true" : "false");
      if (pressed) revealChip(chip);
    }
    updateChipHint();
  }

  function visible(): Place[] {
    return filterPlaces(places, state);
  }

  function layoutLabels() {
    const boxes: LabelBox[] = [];
    for (const [id, marker] of markers) {
      const element = marker.getElement();
      if (element.hidden) continue;
      element.classList.remove("is-culled");
      const rect = element.getBoundingClientRect();
      if (rect.width < 2) continue;
      boxes.push({
        id,
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
        selected: id === selected,
      });
    }
    const measured = new Set(boxes.map((box) => box.id));
    const shown = new Set(visibleLabelIds(boxes));
    for (const [id, marker] of markers) {
      const element = marker.getElement();
      if (element.hidden) continue;
      const keep = !measured.has(id) || shown.has(id);
      element.classList.toggle("is-culled", !keep);
      element.tabIndex = keep ? 0 : -1;
    }
  }

  function syncMarkers() {
    const allowed = new Set(visible().filter((place) => place.pin).map((place) => place.id));
    for (const [id, marker] of markers) {
      const element = marker.getElement();
      const show = allowed.has(id);
      element.hidden = !show;
      element.classList.toggle("is-selected", id === selected);
      if (!show && popupId === id) closePopup();
    }
    const pinned = visible().filter((place) => place.pin);
    if (mapNote) {
      mapNote.hidden = pinned.length > 0;
      mapNote.textContent = pinned.length > 0 ? "" : "No verified pins match this filter.";
    }
    layoutLabels();
  }

  function apply(next: FilterState, historyMode: "push" | "replace") {
    const known = new Set(places.map((place) => place.section));
    state = { section: known.has(next.section) ? next.section : "", query: "" };
    writeControls(state);
    const allowed = new Set(visible().map((place) => place.id));
    if (selected && !allowed.has(selected)) selected = "";
    for (const card of cards) {
      const id = card.dataset.place ?? "";
      card.hidden = !allowed.has(id);
      card.classList.toggle("is-selected", id === selected && selected !== "");
    }
    for (const group of groups) group.hidden = !group.querySelector("[data-place]:not([hidden])");
    if (count) {
      const filtering = Boolean(state.section);
      count.hidden = !filtering;
      const shown = allowed.size;
      count.textContent = filtering ? `${shown} ${shown === 1 ? "place" : "places"}` : "";
    }
    syncMarkers();
    const path = `/${paramsFromFilter(state)}`;
    if (historyMode === "push") history.pushState(state, "", path);
    else history.replaceState(state, "", path);
  }

  function releasePopupLayout() {
    document.body.classList.remove("popup-open");
    mapElement?.style.removeProperty("min-height");
  }

  function containPopup() {
    const shell = popup?.getElement();
    const body = shell?.querySelector<HTMLElement>(".popup");
    if (!shell || !body || !mapElement) return;
    const narrow = window.innerWidth < 960;
    shell.classList.toggle("is-contained", narrow);
    document.body.classList.toggle("popup-open", narrow);
    if (!narrow) {
      body.style.maxHeight = "";
      mapElement.style.removeProperty("min-height");
      return;
    }
    body.style.maxHeight = "none";
    const zoom = mapElement.querySelector(".maplibregl-ctrl-top-right");
    const zoomH = zoom instanceof HTMLElement ? Math.ceil(zoom.getBoundingClientRect().height) : 68;
    const attribH = 64;
    const fabForHeight = document.querySelector<HTMLElement>(".view-fab");
    const fabExtra = fabForHeight && getComputedStyle(fabForHeight).display !== "none" ? Math.ceil(fabForHeight.getBoundingClientRect().height) + 18 : 0;
    const needed = Math.ceil(shell.offsetHeight + zoomH + attribH + fabExtra + 16);
    const nextMin = `${needed}px`;
    if (mapElement.style.minHeight !== nextMin) {
      mapElement.style.minHeight = nextMin;
      map?.resize();
    }
    const attrib = mapElement.querySelector(".maplibregl-ctrl-attrib");
    const attribNow = attrib instanceof HTMLElement ? Math.ceil(attrib.getBoundingClientRect().height) + 28 : attribH;
    const fab = document.querySelector<HTMLElement>(".view-fab");
    const fabSpace = fab && getComputedStyle(fab).display !== "none" ? Math.ceil(fab.getBoundingClientRect().height) + 18 : 0;
    shell.style.bottom = `${attribNow + fabSpace}px`;
    mapElement.scrollIntoView({ block: "end" });
  }

  function closePopup() {
    const current = popup;
    popup = null;
    popupId = "";
    current?.remove();
    releasePopupLayout();
    map?.resize();
  }

  function showMapFailure(message: string) {
    mapFailed = true;
    if (tileNote) {
      tileNote.hidden = false;
      tileNote.textContent = message;
    }
  }

  function openPopup(place: Place) {
    const camera = cameraForSelection(place);
    if (!map || !camera) return;
    closePopup();
    popupId = place.id;
    popup = new maplibregl.Popup({ offset: 18, closeButton: true, closeOnClick: false })
      .setLngLat([camera.lng, camera.lat])
      .setDOMContent(popupNode(place))
      .addTo(map);
    popup.on("close", () => {
      popup = null;
      popupId = "";
      releasePopupLayout();
      map?.resize();
    });
    containPopup();
  }

  function focusSelection() {
    const place = places.find((item) => item.id === selected);
    const camera = cameraForSelection(place);
    if (!map || !place || !camera) return;
    openPopup(place);
    map.easeTo({ center: [camera.lng, camera.lat], zoom: Math.max(map.getZoom(), 14) });
    layoutLabels();
  }

  function selectPlace(id: string, scroll: boolean) {
    selected = id;
    for (const card of cards) card.classList.toggle("is-selected", card.dataset.place === id);
    syncMarkers();
    const place = places.find((item) => item.id === id);
    const card = cards.find((item) => item.dataset.place === id);
    if (scroll && card && !card.hidden) card.scrollIntoView({ block: "nearest" });
    if (!cameraForSelection(place)) {
      closePopup();
      return;
    }
    ensureMap();
    focusSelection();
  }

  function externalIcon(): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ext");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("d", EXTERNAL_ICON_PATH);
    svg.append(path);
    return svg;
  }

  function popupNode(place: Place): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "popup";
    const title = document.createElement("strong");
    title.textContent = place.name;
    const line = document.createElement("p");
    line.textContent = place.summary;
    wrap.append(title, line);
    if (place.pinNote) {
      const note = document.createElement("p");
      note.textContent = place.pinNote;
      wrap.append(note);
    }
    if (place.mapsUrl) {
      const go = document.createElement("a");
      go.className = "outward";
      go.href = place.mapsUrl;
      markOutward(go);
      go.append(document.createTextNode("Google Maps"), externalIcon());
      wrap.append(go);
    }
    if (place.coordUrl) {
      const evidence = evidenceLink(place.coordUrl);
      const source = document.createElement("a");
      source.href = evidence.href;
      markOutward(source);
      source.textContent = evidence.label;
      wrap.append(source);
    }
    return wrap;
  }

  function pill(place: Place): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pill-marker";
    button.dataset.place = place.id;
    button.setAttribute("aria-label", place.name);
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = colorFor(place.section);
    const label = document.createElement("span");
    label.className = "pill-name";
    label.textContent = place.name;
    button.append(dot, label);
    button.title = place.name;
    const choose = (event: Event) => {
      event.stopPropagation();
      selectPlace(place.id, true);
    };
    button.addEventListener("click", choose);
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
    });
    return button;
  }

  function keepRequiredCredits() {
    const root = mapElement?.querySelector(".maplibregl-ctrl-attrib-inner");
    if (root) {
      for (const anchor of [...root.querySelectorAll("a")]) {
        const href = anchor.getAttribute("href") ?? "";
        let host = "";
        try {
          host = new URL(href, window.location.href).hostname;
        } catch {
          continue;
        }
        if (host === "openfreemap.org" && (anchor.textContent ?? "").replace(/\s+/g, " ").trim() === "OpenFreeMap") {
          const previous = anchor.previousSibling;
          anchor.remove();
          if (previous?.nodeType === Node.TEXT_NODE && !(previous.textContent ?? "").trim()) previous.remove();
          continue;
        }
        if (href.startsWith("http")) markOutward(anchor);
      }
      while (root.firstChild?.nodeType === Node.TEXT_NODE && !(root.firstChild.textContent ?? "").trim()) {
        root.firstChild.remove();
      }
    }
    const source = map?.getSource("openmaptiles") as { attribution?: string } | undefined;
    if (source?.attribution?.includes("openfreemap.org")) {
      source.attribution = source.attribution.replace(
        /<a\b[^>]*href="https:\/\/openfreemap\.org"[^>]*>\s*OpenFreeMap\s*<\/a>\s*/i,
        "",
      );
    }
  }

  function ensureMap() {
    if (map || mapFailed || !mapElement || mapElement.clientWidth === 0) return;
    try {
      map = new maplibregl.Map({
        container: mapElement,
        style: MAP_STYLE,
        center: [73.856, 18.52],
        zoom: 11.5,
        attributionControl: false,
        maxZoom: 17,
        minZoom: 10,
      });
    } catch {
      showMapFailure("The map did not start. The list still works.");
      return;
    }
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: false }), "bottom-right");
    const credit = mapElement?.querySelector(".maplibregl-ctrl-attrib");
    if (credit) new MutationObserver(keepRequiredCredits).observe(credit, { childList: true, subtree: true });
    map.on("sourcedata", (event) => {
      if (event.sourceId === "openmaptiles" && event.sourceDataType === "metadata") keepRequiredCredits();
    });
    keepRequiredCredits();
    map.on("error", () => {
      if (tileNote) tileNote.hidden = false;
    });
    map.on("moveend", () => layoutLabels());
    map.on("resize", () => containPopup());
    map.on("load", () => layoutLabels());
    for (const place of places) {
      if (!place.pin || place.lat === null || place.lng === null) continue;
      const marker = new maplibregl.Marker({ element: pill(place), anchor: "center" })
        .setLngLat([place.lng, place.lat])
        .addTo(map);
      markers.set(place.id, marker);
    }
    syncMarkers();
  }

  function colorFor(section: string): string {
    return document.querySelector<HTMLElement>(`[data-group="${section}"]`)?.dataset.color ?? "#44403c";
  }

  function setView(view: "list" | "map") {
    document.body.dataset.view = view;
    if (viewToggle && viewLabel) {
      const onMap = view === "map";
      const label = onMap ? "Show list" : "Show map";
      viewLabel.textContent = label;
      viewToggle.setAttribute("aria-label", label);
      viewToggle.setAttribute("aria-pressed", onMap ? "true" : "false");
    }
    if (view === "map") {
      requestAnimationFrame(() => {
        ensureMap();
        map?.resize();
        focusSelection();
        layoutLabels();
      });
    }
  }

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      const picked = chip.dataset.section ?? "";
      apply({ section: state.section === picked ? "" : picked, query: "" }, "push");
    });
    chip.addEventListener("focus", () => revealChip(chip));
  }
  chipRow?.addEventListener("scroll", updateChipHint);
  for (const card of cards) {
    card.querySelector(".card-hit")?.addEventListener("click", () => selectPlace(card.dataset.place ?? "", false));
  }
  viewToggle?.addEventListener("click", () => {
    setView(document.body.dataset.view === "map" ? "list" : "map");
    viewToggle.focus();
  });
  window.addEventListener("popstate", () => apply(filterStateFromParams(new URLSearchParams(location.search)), "replace"));
  window.addEventListener("resize", () => {
    layoutLabels();
    containPopup();
    updateChipHint();
  });

  apply(filterStateFromParams(new URLSearchParams(location.search)), "replace");
  setView("list");
  ensureMap();
}
