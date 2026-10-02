const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function control(text = "") {
  const span = { textContent: text };
  return {
    events: {},
    attributes: {},
    addEventListener(name, handler) { this.events[name] = handler; },
    querySelector(selector) { return selector === "span" ? span : null; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; },
    span,
  };
}

test("the map popup returns a station to the field that opened it", () => {
  const departure = control("서울");
  const arrival = control("부산");
  const swap = control();
  const title = { textContent: "" };
  const frameWindow = {};
  const frame = { src: "", contentWindow: frameWindow };
  const dialog = {
    open: false,
    events: {},
    addEventListener(name, handler) { this.events[name] = handler; },
    showModal() { this.open = true; },
    close() { this.open = false; this.events.close?.(); },
  };
  const elements = {
    ".departure-field": departure,
    ".arrival-field": arrival,
    ".swap-button": swap,
    "#route-dialog": dialog,
    "#route-dialog-title": title,
    "#station-picker-frame": frame,
  };
  const windowEvents = {};
  const context = vm.createContext({
    document: {
      querySelector: (selector) => elements[selector] ?? null,
      querySelectorAll: () => [],
    },
    window: { addEventListener(name, handler) { windowEvents[name] = handler; } },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "train-results.js"), "utf8"), context);

  departure.events.click();
  assert.equal(dialog.open, true);
  assert.equal(frame.src, "region/map-region.html");
  assert.equal(title.textContent, "출발역 선택");

  windowEvents.message({ source: {}, data: { type: "korail:station-selected", station: "수원" } });
  assert.equal(departure.span.textContent, "서울");
  windowEvents.message({ source: frameWindow, data: { type: "korail:station-selected", station: "수원" } });
  assert.equal(departure.span.textContent, "수원");
  assert.equal(departure.attributes["aria-label"], "출발역 수원");
  assert.equal(dialog.open, false);

  arrival.events.click();
  windowEvents.message({ source: frameWindow, data: { type: "korail:station-selected", station: "강릉" } });
  assert.equal(arrival.span.textContent, "강릉");
  assert.equal(arrival.attributes["aria-label"], "도착역 강릉");
  swap.events.click();
  assert.equal(departure.span.textContent, "강릉");
  assert.equal(arrival.span.textContent, "수원");
});

test("clicking a map station sends the selected name to the reservation page", () => {
  function element(names = []) {
    const classes = new Set(names);
    const node = {
      attributes: {}, events: {}, children: [],
      style: { setProperty(name, value) { this[name] = value; } },
      classList: {
        [Symbol.iterator]: () => classes[Symbol.iterator](),
        contains: (name) => classes.has(name),
        toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
        remove: (...items) => items.forEach((name) => classes.delete(name)),
      },
      addEventListener(name, handler) { this.events[name] = handler; },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name]; },
      append(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      querySelectorAll() { return this.children; },
    };
    return node;
  }
  const image = element(["map-region", "region-seoul"]);
  image.alt = "서울특별시";
  image.attributes.width = "45";
  image.attributes.height = "38";
  image.offsetLeft = 485;
  image.offsetTop = 187;
  image.offsetWidth = 45;
  image.offsetHeight = 38;
  const zoom = element();
  const stations = element();
  const reset = element();
  const map = element();
  map.clientWidth = 1265;
  map.clientHeight = 731;
  map.querySelector = (selector) => ({
    ".map-zoom-layer": zoom,
    ".map-stations": stations,
    ".map-reset-button": reset,
  })[selector];
  map.querySelectorAll = () => [image];
  const messages = [];
  const context = vm.createContext({
    document: { querySelector: () => map, createElement: () => element() },
    window: {
      parent: { postMessage: (message, origin) => messages.push({ message, origin }) },
      addEventListener() {},
    },
    Map, Uint8Array, atob,
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "region", "map-region-mask-data.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "region", "map-region.js"), "utf8"), context);
  image.events.keydown({ key: "Enter", preventDefault() {} });
  assert.equal(stations.children.length, 2);
  stations.children[0].events.click({ stopPropagation() {} });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].message.type, "korail:station-selected");
  assert.equal(messages[0].message.station, "서울");
});
