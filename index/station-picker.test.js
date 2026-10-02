const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const directory = __dirname;
const picker = path.join(directory, "station-picker");

test("메인 페이지에서 새 역 선택 팝업과 지도 파일을 로드한다", () => {
  const html = fs.readFileSync(path.join(directory, "main.html"), "utf8");
  const active = html.replace(/<!--[\s\S]*?-->/g, "");
  assert.equal((active.match(/id="station-dialog"/g) ?? []).length, 1);
  assert.equal((active.match(/class="map-region region-/g) ?? []).length, 16);
  assert.match(active, /id="station-tab-map"/);
  assert.doesNotMatch(active, /src="\.\/stations-data\.js"/);
  for (const file of [
    "css/station-dialog.css", "css/map-region.css", "js/stations-data.js",
    "js/map-region-mask-data.js", "js/map-region.js", "js/station-dialog.js",
  ]) {
    assert.ok(active.includes(`station-picker/${file}`));
    assert.ok(fs.existsSync(path.join(picker, file)));
  }
  for (const match of active.matchAll(/src="station-picker\/(assets\/map\/[^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(picker, match[1])));
  }
});

test("역 선택값을 메인 버튼과 간편예매 입력칸에 적용한다", () => {
  const context = vm.createContext({ document: { addEventListener() {} } });
  vm.runInContext(fs.readFileSync(path.join(picker, "js/station-dialog.js"), "utf8"), context);
  const button = { setAttribute(name, value) { this[name] = value; } };
  const label = { tagName: "SPAN", textContent: "서울" };
  const input = { tagName: "INPUT", value: "", setAttribute(name, value) { this[name] = value; } };

  context.applyStationToTarget(label, button, "출발역", "수원");
  context.applyStationToTarget(input, input, "도착역", "부산");

  assert.equal(label.textContent, "수원");
  assert.equal(button["aria-label"], "출발역 선택, 현재 수원");
  assert.equal(input.value, "부산");
  assert.equal(input["aria-label"], "도착역 부산");
});
