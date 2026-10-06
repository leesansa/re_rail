const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = __dirname;
const picker = path.join(root, "station-picker");

test("예약 페이지에서 기존 iframe 팝업은 주석이고 새 역 선택 모달을 로드한다", () => {
  const html = fs.readFileSync(path.join(root, "../Reservation.html/Reservation.html"), "utf8");
  const active = html.replace(/<!--[\s\S]*?-->/g, "");
  assert.doesNotMatch(active, /id="route-dialog"/);
  assert.match(active, /id="station-picker-mount"/);
  assert.match(active, /class="station-field departure-field"/);
  assert.match(active, /class="station-field arrival-field"/);
  const template = fs.readFileSync(path.join(picker, "js/station-dialog-template.js"), "utf8");
  assert.equal((template.match(/class="map-region region-/g) ?? []).length, 16);
  for (const file of [
    "css/station-dialog.css", "css/map-region.css", "js/stations-data.js",
    "js/map-region-mask-data.js", "js/map-region.js", "js/station-dialog.js",
  ]) {
    const url = file.startsWith("css/")
      ? `../station-picker/${file}`
      : `../Reservation.js/station-picker/${file}`;
    assert.ok(active.includes(url));
    const localFile = file.startsWith("css/")
      ? path.join(root, "../station-picker", file)
      : path.join(picker, file);
    assert.ok(fs.existsSync(localFile));
  }
});

test("선택한 역을 팝업을 연 필드와 접근성 이름에 적용한다", () => {
  const context = vm.createContext({ document: { addEventListener() {} } });
  vm.runInContext(fs.readFileSync(path.join(picker, "js/station-dialog.js"), "utf8"), context);
  const field = {
    span: { textContent: "서울" },
    querySelector(selector) { return selector === "span" ? this.span : null; },
    setAttribute(name, value) { this[name] = value; },
  };
  context.applyStationToField(field, "수원", "출발역");
  assert.equal(field.span.textContent, "수원");
  assert.equal(field["aria-label"], "출발역 수원");
});

test("새 팝업의 지도에서 역을 선택하면 목록 선택 이벤트를 보낸다", () => {
  const element = (names = []) => {
    const classes = new Set(names);
    return {
      events: {}, children: [], attributes: {}, style: { setProperty() {} },
      classList: {
        [Symbol.iterator]: () => classes[Symbol.iterator](),
        contains: (name) => classes.has(name),
        toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
      },
      addEventListener(name, handler) { this.events[name] = handler; },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name]; },
      append(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      querySelectorAll() { return this.children; },
    };
  };
  const image = element(["map-region", "region-seoul"]);
  Object.assign(image, {
    alt: "서울특별시", offsetLeft: 485, offsetTop: 187,
    offsetWidth: 45, offsetHeight: 38,
  });
  image.attributes.width = "45";
  image.attributes.height = "38";
  const zoom = element();
  const stations = element();
  const reset = element();
  const map = element();
  map.clientWidth = 1265;
  map.clientHeight = 731;
  map.querySelector = (selector) => ({
    ".map-zoom-layer": zoom, ".map-stations": stations, ".map-reset-button": reset,
  })[selector];
  map.querySelectorAll = () => [image];
  const documentEvents = {};
  const dispatched = [];
  const context = vm.createContext({
    document: {
      querySelector: () => map,
      createElement: () => element(),
      addEventListener(name, handler) { documentEvents[name] = handler; },
      dispatchEvent(event) { dispatched.push(event); },
    },
    window: {
      regionMaskData: { "region-seoul": Buffer.alloc(Math.ceil(45 * 38 / 8), 255).toString("base64") },
      addEventListener() {},
    },
    CustomEvent: function (type, options) { this.type = type; this.detail = options.detail; },
    atob,
  });
  vm.runInContext(fs.readFileSync(path.join(picker, "js/map-region.js"), "utf8"), context);
  documentEvents.DOMContentLoaded();
  image.events.keydown({ key: "Enter", preventDefault() {} });
  assert.equal(stations.children.length, 2);
  stations.children[0].events.click({ stopPropagation() {} });
  assert.equal(dispatched[0].type, "korail:station-selected");
  assert.equal(dispatched[0].detail.station, "서울");
});
