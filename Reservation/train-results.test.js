const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

test("배열에서 열차 카드와 예약 버튼을 처음 렌더링한다", () => {
  const elements = {
    ".train-list": { innerHTML: "", addEventListener() {} },
    ".train-empty": { hidden: true },
    ".train-loading": { hidden: true },
    ".train-load-trigger": { hidden: false },
    ".selected-date": { dateTime: "2026-10-21T00:00:00+09:00" },
  };
  const context = vm.createContext({
    window: { location: { search: "" } }, URLSearchParams,
    document: {
      querySelector: (selector) => elements[selector] ?? null,
      querySelectorAll: () => [],
    },
  });
  const directory = __dirname;

  vm.runInContext(
    fs.readFileSync(path.join(directory, "train-data.js"), "utf8"),
    context,
  );
  vm.runInContext(
    fs.readFileSync(path.join(directory, "train-results.js"), "utf8"),
    context,
  );

  const html = elements[".train-list"].innerHTML;
  assert.equal((html.match(/<li class="train-card"/g) ?? []).length, 5);
  assert.equal(
    (html.match(/class="fare-column fare-button"/g) ?? []).length,
    9,
  );
  assert.match(html, /서대구역 정차/);
  assert.match(html, /datetime="2026-10-21T05:13:00\+09:00"/);
  assert.equal(elements[".train-empty"].hidden, true);
});

test("달력에서 고른 출발일과 시간이 표시 및 열차 카드에 바로 반영된다", () => {
  const listeners = {};
  const date = {
    dateTime: "2026-10-21T00:00:00+09:00",
    addEventListener(name, handler) {
      listeners[name] = handler;
    },
  };
  const button = () => ({ addEventListener() {} });
  const elements = {
    ".train-list": { innerHTML: "", addEventListener() {} },
    ".train-empty": { hidden: true },
    ".train-loading": { hidden: true },
    ".train-load-trigger": { hidden: false },
    ".selected-date": date,
    ".previous-date": button(),
    ".next-date": button(),
  };
  const context = vm.createContext({
    window: { location: { search: "" } }, URLSearchParams,
    document: {
      querySelector: (selector) => elements[selector] ?? null,
      querySelectorAll: () => [],
    },
  });
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "train-data.js"), "utf8"),
    context,
  );
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "train-results.js"), "utf8"),
    context,
  );

  listeners["korail:date-selected"]({
    detail: { year: 2026, month: 11, day: 2, hour: 18 },
  });

  assert.equal(date.dateTime, "2026-11-02T18:00:00+09:00");
  assert.equal(date.textContent, "11-02-(월) 18:00");
  assert.match(
    elements[".train-list"].innerHTML,
    /datetime="2026-11-02T05:13:00\+09:00"/,
  );
});
