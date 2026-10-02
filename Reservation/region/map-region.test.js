const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// 지도: 실제 HTML과 비트 마스크를 사용해 투명 여백과 지역 선택을 검증합니다.
function loadMap() {
  function element(names = []) {
    const classes = new Set(names);
    return {
      attributes: {},
      events: {},
      children: [],
      hidden: true,
      style: {
        setProperty(name, value) {
          this[name] = value;
        },
      },
      classList: {
        [Symbol.iterator]: () => classes[Symbol.iterator](),
        contains: (name) => classes.has(name),
        toggle: (name, enabled) =>
          enabled ? classes.add(name) : classes.delete(name),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
      },
      addEventListener(name, handler) {
        this.events[name] = handler;
      },
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      getAttribute(name) {
        return this.attributes[name];
      },
      append(child) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
      querySelectorAll() {
        return this.children;
      },
      getBoundingClientRect() {
        return {
          left: this.offsetLeft,
          top: this.offsetTop,
          right: this.offsetLeft + this.offsetWidth,
          bottom: this.offsetTop + this.offsetHeight,
          width: this.offsetWidth,
          height: this.offsetHeight,
        };
      },
    };
  }
  const html = fs.readFileSync(path.join(__dirname, "map-region.html"), "utf8");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, "map-asset-manifest.json"), "utf8"),
  );
  const images = [
    ...html.matchAll(
      /<img class="map-region ([^"]+)" src="([^"]+)" alt="([^"]+)" width="(\d+)" height="(\d+)"/g,
    ),
  ].map((match) => {
    const item = manifest.find((entry) => entry.file === match[2]);
    const image = element(["map-region", match[1]]);
    image.alt = match[3];
    image.attributes.width = match[4];
    image.attributes.height = match[5];
    [image.offsetLeft, image.offsetTop] = item.position;
    [image.offsetWidth, image.offsetHeight] = item.displaySize;
    return image;
  });
  const zoom = element(),
    stations = element(),
    reset = element(),
    map = element();
  map.clientWidth = 1265;
  map.clientHeight = 731;
  map.querySelector = (selector) =>
    ({
      ".map-zoom-layer": zoom,
      ".map-stations": stations,
      ".map-reset-button": reset,
    })[selector];
  map.querySelectorAll = () => images;
  const messages = [];
  const context = vm.createContext({
    document: { querySelector: () => map, createElement: () => element() },
    window: {
      parent: {
        postMessage: (message, origin) => messages.push({ message, origin }),
      },
      addEventListener() {},
    },
    Map,
    Uint8Array,
    atob,
  });
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "map-region-mask-data.js"), "utf8"),
    context,
  );
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "map-region.js"), "utf8"),
    context,
  );
  return { images, map, stations, zoom, reset, messages, context };
}

test("Busan uses the shared region hover and click flow, excluding transparent padding", () => {
  const { images, map, stations, zoom, reset } = loadMap();
  const busan = images.find((image) => image.alt === "부산광역시");
  assert.ok(busan, "Busan must appear in the map");
  map.events.pointermove({ clientX: 703, clientY: 509 });
  assert.equal(busan.classList.contains("is-hovered"), true);
  map.events.pointermove({ clientX: 743, clientY: 542 });
  assert.equal(busan.classList.contains("is-hovered"), false);
  map.events.click({ clientX: 703, clientY: 509 });
  assert.equal(busan.classList.contains("is-selected"), true);
  assert.deepEqual(
    stations.children.map((marker) => marker.textContent),
    ["부산", "구포"],
  );
  assert.match(zoom.style.transform, /scale\(3\)/);
  assert.equal(reset.hidden, false);
});

test("Busan stations return to the reservation popup and reset like existing regions", () => {
  const { images, stations, reset, zoom, messages } = loadMap();
  const busan = images.find((image) => image.alt === "부산광역시");
  assert.ok(busan, "Busan must support keyboard selection");
  busan.events.keydown({ key: "Enter", preventDefault() {} });
  for (const marker of stations.children) {
    marker.events.click({ stopPropagation() {} });
    assert.equal(marker.attributes["aria-pressed"], "true");
    assert.equal(marker.classList.contains("is-selected"), true);
    assert.equal(messages.at(-1).message.station, marker.textContent);
    assert.equal(messages.at(-1).message.type, "korail:station-selected");
  }
  assert.equal(stations.children[0].attributes["aria-pressed"], "false");
  reset.events.click({ stopPropagation() {} });
  assert.equal(stations.children.length, 0);
  assert.equal(reset.hidden, true);
  assert.equal(zoom.style.transform, "");
  assert.equal(busan.classList.contains("is-selected"), false);
  const seoul = images.find((image) => image.alt === "서울특별시");
  seoul.events.keydown({ key: " ", preventDefault() {} });
  assert.deepEqual(
    stations.children.map((marker) => marker.textContent),
    ["서울", "용산"],
  );
});

test("Busan keeps nearby station buttons separated on narrow maps without moving their anchors", () => {
  const { images, map, stations, zoom } = loadMap();
  const ratio = 328 / 1265;
  map.clientWidth = 328;
  map.clientHeight = 731 * ratio;
  images.forEach((image) => {
    image.offsetLeft *= ratio;
    image.offsetTop *= ratio;
    image.offsetWidth *= ratio;
    image.offsetHeight *= ratio;
  });
  const busan = images.find((image) => image.alt === "부산광역시");
  assert.ok(busan);
  busan.events.keydown({ key: "Enter", preventDefault() {} });
  const scale = Number(zoom.style.transform.match(/scale\(([^)]+)\)/)[1]);
  const separation =
    (Math.abs(
      parseFloat(stations.children[0].style.top) -
        parseFloat(stations.children[1].style.top),
    ) /
      100) *
    map.clientHeight *
    scale;
  assert.ok(
    separation > 24,
    "The selected button and its neighbor must not overlap",
  );
  assert.equal(stations.children[0].style.top, `${(512 / 731) * 100}%`);
  assert.equal(stations.children[1].style.top, `${(501 / 731) * 100}%`);
});
