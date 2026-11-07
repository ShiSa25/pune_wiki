import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import { cameraForSelection, filterPlaces, filterStateFromParams, paramsFromFilter, type FilterState } from "../lib/browse";
import { MAP_STYLE, places, type Place } from "../lib/guide";
import { visibleLabelIds, type LabelBox } from "../lib/labels";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const root = document.querySelector<HTMLElement>("[data-app]");
if (root) {
  const search = document.querySelector<HTMLInputElement>("#q");
  const chips = [...document.querySelectorAll<HTMLButtonElement>("[data-section]")];
  const cards = [...document.querySelectorAll<HTMLElement>("[data-place]")];
  const groups = [...document.querySelectorAll<HTMLElement>("[data-group]")];
  const count = document.querySelector<HTMLElement>("#count");
  const empty = document.querySelector<HTMLElement>("#empty");
  const mapNote = document.querySelector<HTMLElement>("#map-note");
  const tileNote = document.querySelector<HTMLElement>("#tile-note");
  const viewButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-view]")];
  const mapElement = document.querySelector<HTMLElement>("#map");

  let state: FilterState = { section: "", query: "" };
  let selected = "";
  let map: maplibregl.Map | null = null;
  let mapFailed = false;
  let popup: maplibregl.Popup | null = null;
  let popupId = "";
  const markers = new Map<string, maplibregl.Marker>();

  function readState(): FilterState {
    const pressed = chips.find((chip) => chip.getAttribute("aria-pressed") === "true");
    return { section: pressed?.dataset.section ?? "", query: search?.value ?? "" };
  }

  function writeControls(next: FilterState) {
    if (search && search.value !== next.query) search.value = next.query;
    for (const chip of chips) {
      chip.setAttribute("aria-pressed", chip.dataset.section === next.section ? "true" : "false");
    }
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
    state = { section: known.has(next.section) ? next.section : "", query: next.query };
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
      const filtering = Boolean(state.section || state.query.trim());
      count.hidden = !filtering;
      const shown = allowed.size;
      count.textContent = filtering ? `${shown} ${shown === 1 ? "place" : "places"}` : "";
    }
    if (empty) empty.hidden = allowed.size > 0;
    syncMarkers();
    const path = `/${paramsFromFilter(state)}`;
    if (historyMode === "push") history.pushState(state, "", path);
    else history.replaceState(state, "", path);
  }

  function closePopup() {
    popup?.remove();
    popup = null;
    popupId = "";
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
  }

  function focusSelection() {
    const place = places.find((item) => item.id === selected);
    const camera = cameraForSelection(place);
    if (!map || !place || !camera) return;
    map.easeTo({ center: [camera.lng, camera.lat], zoom: Math.max(map.getZoom(), 14) });
    openPopup(place);
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

  function popupNode(place: Place): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "popup";
    const title = document.createElement("strong");
    title.textContent = place.name;
    const line = document.createElement("p");
    line.textContent = place.line;
    wrap.append(title, line);
    if (place.mapsUrl) {
      const link = document.createElement("a");
      link.href = place.mapsUrl;
      link.rel = "noreferrer";
      link.textContent = "Open in Google Maps";
      wrap.append(link);
    }
    return wrap;
  }

  function pill(place: Place): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pill-marker";
    button.setAttribute("aria-label", place.name);
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = colorFor(place.section);
    const label = document.createElement("span");
    label.textContent = place.name;
    button.append(dot, label);
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
    map.on("error", () => {
      if (tileNote) tileNote.hidden = false;
    });
    map.on("moveend", () => layoutLabels());
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
    for (const button of viewButtons) {
      button.setAttribute("aria-pressed", button.dataset.view === view ? "true" : "false");
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
      apply({ ...readState(), section: state.section === picked ? "" : picked }, "push");
    });
  }
  search?.addEventListener("input", () => apply(readState(), "replace"));
  document.querySelector("#reset")?.addEventListener("click", () => {
    apply({ section: "", query: "" }, "push");
    search?.focus();
  });
  document.querySelector("#filters")?.addEventListener("submit", (event) => event.preventDefault());
  for (const card of cards) {
    card.querySelector(".card-hit")?.addEventListener("click", () => selectPlace(card.dataset.place ?? "", false));
  }
  for (const button of viewButtons) {
    button.addEventListener("click", () => setView(button.dataset.view === "map" ? "map" : "list"));
  }
  window.addEventListener("popstate", () => apply(filterStateFromParams(new URLSearchParams(location.search)), "replace"));
  window.addEventListener("resize", () => layoutLabels());

  apply(filterStateFromParams(new URLSearchParams(location.search)), "replace");
  setView("list");
  ensureMap();
}
