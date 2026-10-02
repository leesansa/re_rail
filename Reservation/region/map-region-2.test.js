const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class TestElement {
  constructor() {
    this.children = [];
    this.attributes = {};
    this.events = {};
    this.value = "";
    this.hidden = false;
    this.classNames = new Set();
    this.classList = {
      add: (name) => this.classNames.add(name),
      toggle: (name, enabled) => enabled ? this.classNames.add(name) : this.classNames.delete(name),
      contains: (name) => this.classNames.has(name),
    };
  }
  set className(value) { this.classNames = new Set(value.split(/\s+/)); }
  get className() { return [...this.classNames].join(" "); }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, handler) { this.events[name] = handler; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  querySelectorAll(selector) {
    const descendants = this.children.flatMap((child) => [child, ...child.querySelectorAll(selector)]);
    return descendants.filter((child) => child.classList.contains(selector.slice(1)));
  }
  focus() { this.focused = true; }
}

function openStationPage(embedded = false) {
  const search = new TestElement();
  const searchButton = new TestElement();
  const list = new TestElement();
  const empty = new TestElement();
  const elements = {
    ".station-search-input": search,
    ".search-button": searchButton,
    ".station-list": list,
    ".station-empty": empty,
  };
  const messages = [];
  const browserWindow = {};
  browserWindow.parent = embedded
    ? { postMessage: (message, origin) => messages.push({ message, origin }) }
    : browserWindow;
  const context = vm.createContext({
    window: browserWindow,
    document: {
      querySelector: (selector) => elements[selector],
      createElement: () => new TestElement(),
    },
  });
  const directory = __dirname;
  vm.runInContext(fs.readFileSync(path.join(directory, "map-region-2-data.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(directory, "map-region-2.js"), "utf8"), context);
  return { search, searchButton, list, empty, messages };
}

function buttons(list) { return list.querySelectorAll(".station-button"); }

test("initial list renders all 36 stations in source order", () => {
  const { list } = openStationPage();
  assert.equal(buttons(list).length, 36);
  assert.equal(buttons(list)[0].textContent, "강릉");
  assert.equal(buttons(list).at(-1).textContent, "조치원");
});

test("name and initial consonant input filter the visible stations", () => {
  const { search, list, empty } = openStationPage();
  search.value = "서울";
  search.events.input();
  assert.deepEqual(buttons(list).map((button) => button.textContent), ["서울"]);
  search.value = "ㅅㅇ";
  search.events.input();
  const names = buttons(list).map((button) => button.textContent);
  assert.ok(names.includes("서울"));
  assert.ok(names.includes("수원"));
  assert.ok(!names.includes("부산"));
  search.value = "없는역";
  search.events.input();
  assert.equal(buttons(list).length, 0);
  assert.equal(empty.hidden, false);
});

test("clicking a station keeps one selected button while filtering", () => {
  const { search, list } = openStationPage();
  search.value = "서울";
  search.events.input();
  buttons(list)[0].events.click();
  assert.equal(buttons(list)[0].attributes["aria-pressed"], "true");
  assert.ok(buttons(list)[0].classList.contains("is-selected"));
  search.value = "";
  search.events.input();
  assert.equal(buttons(list).filter((button) => button.classList.contains("is-selected")).length, 1);
});

test("a station click in the popup sends its name to the reservation page", () => {
  const { list, messages } = openStationPage(true);
  buttons(list)[0].events.click();
  assert.equal(messages.length, 1);
  assert.equal(messages[0].message.type, "korail:station-selected");
  assert.equal(messages[0].message.station, "강릉");
});
