import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";

maplibregl.setWorkerUrl(maplibreWorkerUrl);
import { filterPlaces, filterStateFromParams, paramsFromFilter, type FilterState } from "../lib/browse";
import { MAP_STYLE, places, type Place } from "../lib/guide";

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
  let tileFailed = false;
  const markers = new Map<string, maplibregl.Marker>();

  function readState(): FilterState {
    const pressed = chips.find((chip) => chip.getAttribute("aria-pressed") === "true");
    return {
      section: pressed?.dataset.section ?? "",
      query: search?.value ?? "",
    };
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

  function syncMarkers() {
    const allowed = new Set(visible().map((place) => place.id));
    for (const [id, marker] of markers) {
      const element = marker.getElement();
      const show = allowed.has(id);
      element.hidden = !show;
      element.tabIndex = show ? 0 : -1;
      element.classList.toggle("is-selected", id === selected);
      if (!show && marker.getPopup()?.isOpen()) marker.togglePopup();
    }
    const pinned = visible().filter((place) => place.pin);
    if (mapNote) {
      mapNote.hidden = pinned.length > 0;
      mapNote.textContent = pinned.length > 0 ? "" : "No verified pins match this filter.";
    }
  }

  function apply(next: FilterState, historyMode: "push" | "replace") {
    const known = new Set(places.map((place) => place.section));
    state = {
      section: known.has(next.section) ? next.section : "",
      query: next.query,
    };
    writeControls(state);
    const allowed = new Set(visible().map((place) => place.id));
    if (selected && !allowed.has(selected)) selected = "";
    for (const card of cards) {
      const id = card.dataset.place ?? "";
      card.hidden = !allowed.has(id);
      card.classList.toggle("is-selected", id === selected && selected !== "");
    }
    for (const group of groups) {
      group.hidden = !group.querySelector("[data-place]:not([hidden])");
    }
    if (count) {
      const shown = allowed.size;
      const noun = shown === 1 ? "place" : "places";
      count.textContent = state.section || state.query.trim() ? `${shown} ${noun}` : `${places.length} places`;
    }
    if (empty) empty.hidden = allowed.size > 0;
    syncMarkers();
    const path = `/${paramsFromFilter(state)}`;
    if (historyMode === "push") history.pushState(state, "", path);
    else history.replaceState(state, "", path);
  }

  function selectPlace(id: string, scroll: boolean) {
    selected = id;
    for (const card of cards) card.classList.toggle("is-selected", card.dataset.place === id);
    for (const marker of markers.values()) {
      const popup = marker.getPopup();
      if (popup?.isOpen()) marker.togglePopup();
    }
    syncMarkers();
    const place = places.find((item) => item.id === id);
    const card = cards.find((item) => item.dataset.place === id);
    if (scroll && card && !card.hidden) card.scrollIntoView({ block: "nearest" });
    if (!place?.pin || place.lat === null || place.lng === null) return;
    ensureMap();
    map?.easeTo({ center: [place.lng, place.lat], zoom: 15 });
    const marker = markers.get(id);
    const popup = marker?.getPopup();
    if (marker && popup && !popup.isOpen()) marker.togglePopup();
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

  function ensureMap() {
    if (map || !mapElement || mapElement.clientWidth === 0) return;
    map = new maplibregl.Map({
      container: mapElement,
      style: MAP_STYLE,
      center: [73.856, 18.52],
      zoom: 11.4,
      attributionControl: false,
      maxZoom: 17,
      minZoom: 10,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: false,
        customAttribution:
          '<a href="https://openfreemap.org/" rel="noreferrer">OpenFreeMap</a> © <a href="https://openmaptiles.org/" rel="noreferrer">OpenMapTiles</a> · Data <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">© OpenStreetMap</a>',
      }),
      "bottom-right",
    );
    map.on("error", () => {
      tileFailed = true;
      if (tileNote) tileNote.hidden = false;
    });
    for (const place of places) {
      if (!place.pin || place.lat === null || place.lng === null) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pin";
      button.style.background = colorFor(place.section);
      button.setAttribute("aria-label", place.name);
      button.addEventListener("click", () => selectPlace(place.id, true));
      const marker = new maplibregl.Marker({ element: button, anchor: "center" })
        .setLngLat([place.lng, place.lat])
        .setPopup(new maplibregl.Popup({ offset: 16, closeButton: true }).setDOMContent(popupNode(place)))
        .addTo(map);
      markers.set(place.id, marker);
    }
    syncMarkers();
    if (tileFailed && tileNote) tileNote.hidden = false;
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
  for (const card of cards) {
    card.addEventListener("click", () => selectPlace(card.dataset.place ?? "", false));
  }
  for (const button of viewButtons) {
    button.addEventListener("click", () => setView(button.dataset.view === "map" ? "map" : "list"));
  }
  window.addEventListener("popstate", () => {
    const next = filterStateFromParams(new URLSearchParams(location.search));
    apply(next, "replace");
  });

  document.querySelector("#filters")?.addEventListener("submit", (event) => event.preventDefault());

  const initial = filterStateFromParams(new URLSearchParams(location.search));
  apply(initial, "replace");
  ensureMap();
  setView("list");
}
