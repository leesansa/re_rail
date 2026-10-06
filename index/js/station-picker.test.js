const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const directory = path.join(__dirname, "..");
const picker = path.join(__dirname, "station-picker");

test("메인 페이지에서 새 역 선택 팝업과 지도 파일을 로드한다", () => {
  const html = fs.readFileSync(path.join(directory, "main.html"), "utf8");
  const active = html.replace(/<!--[\s\S]*?-->/g, "");
  assert.equal((active.match(/id="station-dialog"/g) ?? []).length, 1);
  assert.equal((active.match(/class="map-region region-/g) ?? []).length, 16);
  assert.match(active, /id="station-tab-map"/);
  assert.doesNotMatch(active, /src="\.\/stations-data\.js"/);
  for (const file of [
    "css/station-picker/station-dialog.css", "css/station-picker/map-region.css",
    "js/station-picker/stations-data.js", "js/station-picker/map-region-mask-data.js",
    "js/station-picker/map-region.js", "js/station-picker/station-dialog.js",
  ]) {
    assert.ok(active.includes(file));
    assert.ok(fs.existsSync(path.join(directory, file)));
  }
  const mapImages = [...active.matchAll(/src="(\.\.\/assets\/map\/[^"]+)"/g)];
  assert.equal(mapImages.length, 16);
  for (const match of mapImages) {
    assert.ok(fs.existsSync(path.join(directory, match[1])));
  }
});

test("역 선택값을 메인 버튼과 간편예매 입력칸에 적용한다", () => {
  const context = vm.createContext({ document: { addEventListener() {} } });
  vm.runInContext(fs.readFileSync(path.join(picker, "station-dialog.js"), "utf8"), context);
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
