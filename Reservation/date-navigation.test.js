const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// 날짜 선택: 실제 예약 스크립트로 양옆 날짜, 달력 전달, 연속 이동을 확인합니다.
function loadDateNavigation(initialDate = "2026-10-21T00:00:00+09:00") {
  const element = () => {
    const classes = new Set();
    return {
      textContent: "", events: {}, offsetWidth: 900,
      classList: { add: name => classes.add(name), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name) },
      addEventListener(name, handler) { this.events[name] = handler; },
    };
  };
  const preview = () => {
    const node = element();
    node.day = element(); node.hour = element();
    node.querySelector = selector => selector === ".date-preview-day" ? node.day : node.hour;
    return node;
  };
  const elements = {
    ".previous-date": element(), ".next-date": element(),
    ".selected-date": Object.assign(element(), { dateTime: initialDate }),
    ".previous-date-preview": preview(), ".next-date-preview": preview(),
    ".date-strip": element(), ".train-list": { innerHTML: "", addEventListener() {} },
    ".train-empty": { hidden: true }, ".train-loading": { hidden: true },
    ".train-load-trigger": { hidden: false },
  };
  const context = vm.createContext({
    document: { querySelector: selector => elements[selector] ?? null, querySelectorAll: () => [] },
    window: { location: { search: "" } }, URLSearchParams,
  });
  for (const file of ["train-data.js", "train-results.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), context);
  }
  const click = selector => elements[selector].events.click();
  const select = detail => elements[".selected-date"].events["korail:date-selected"]({ detail });
  return { elements, click, select };
}

test("처음부터 전날·선택 날짜·다음날을 Figma의 짧은 형식으로 표시한다", () => {
  const { elements: e } = loadDateNavigation();
  assert.equal(e[".previous-date-preview"].dateTime, "2026-10-20T00:00:00+09:00");
  assert.equal(e[".previous-date-preview"].day.textContent, "10-20-(화)");
  assert.equal(e[".selected-date"].textContent, "10-21-(수) 00:00");
  assert.equal(e[".next-date-preview"].dateTime, "2026-10-22T00:00:00+09:00");
  assert.equal(e[".next-date-preview"].hour.textContent, " 00:00");
  assert.equal(e[".date-strip"].classList.contains("is-sliding-next"), false);
});

test("화살표를 빠르게 연속 클릭해도 연도 경계와 시간 및 애니메이션 방향을 유지한다", () => {
  const { elements: e, click } = loadDateNavigation("2026-12-31T18:00:00+09:00");
  click(".next-date"); click(".next-date"); click(".previous-date");
  assert.equal(e[".selected-date"].dateTime, "2027-01-01T18:00:00+09:00");
  assert.equal(e[".previous-date-preview"].dateTime, "2026-12-31T18:00:00+09:00");
  assert.equal(e[".next-date-preview"].dateTime, "2027-01-02T18:00:00+09:00");
  assert.equal(e[".date-strip"].classList.contains("is-sliding-previous"), true);
  assert.equal(e[".date-strip"].classList.contains("is-sliding-next"), false);
  assert.match(e[".train-list"].innerHTML, /datetime="2027-01-01T05:13:00\+09:00"/);
});

test("달력 선택과 윤년 이동도 양옆 날짜를 갱신하고 시간만 바뀌면 슬라이드하지 않는다", () => {
  const { elements: e, select, click } = loadDateNavigation();
  select({ year: 2028, month: 3, day: 1, hour: 9 });
  assert.equal(e[".previous-date-preview"].day.textContent, "02-29-(화)");
  assert.equal(e[".next-date-preview"].hour.textContent, " 09:00");
  assert.equal(e[".date-strip"].classList.contains("is-sliding-next"), true);
  click(".previous-date");
  assert.equal(e[".selected-date"].textContent, "02-29-(화) 09:00");
  select({ year: 2028, month: 2, day: 29, hour: 14 });
  assert.equal(e[".selected-date"].textContent, "02-29-(화) 14:00");
  assert.equal(e[".date-strip"].classList.contains("is-sliding-previous"), false);
});
