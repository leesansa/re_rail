const assert = require("node:assert/strict");
const test = require("node:test");
const { trains, filter } = require("./train-data.js");

test("기본 조회 조건은 원래 열차 다섯 대를 순서대로 보여준다", () => {
  const result = filter({ seat: "일반석", route: "직통", type: "전체" });
  assert.deepEqual(result.map((train) => train.id), trains.map((train) => train.id));
});

test("좌석 등급은 해당 요금이 있는 열차만 보여준다", () => {
  assert.equal(filter({ seat: "특실", route: "직통", type: "전체" }).length, 4);
  assert.equal(filter({ seat: "우등실", route: "직통", type: "전체" }).length, 0);
});

test("운행 방식과 열차 종류를 함께 적용한다", () => {
  const result = filter({ seat: "특실", route: "경유", type: "KTX" });
  assert.deepEqual(result.map((train) => train.id), ["ktx-0558"]);
  assert.equal(filter({ seat: "일반석", route: "환승", type: "전체" }).length, 0);
  assert.equal(filter({ seat: "일반석", route: "직통", type: "무궁화" }).length, 0);
});
