const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { fileURLToPath, pathToFileURL } = require("node:url");

const root = path.join(__dirname, "../..");
const page = path.join(root, "index.html");
const html = fs.readFileSync(page, "utf8").replace(/<!--[\s\S]*?-->/g, "");

test("index의 JS와 CSS가 유형별 폴더에 있고 두 메인 페이지에서 로드된다", () => {
  const files = fs.readdirSync(path.join(root, "index"), { recursive: true });
  for (const file of files) {
    if (file.endsWith(".js")) assert.ok(file.startsWith(`js${path.sep}`), file);
    if (file.endsWith(".css")) assert.ok(file.startsWith(`css${path.sep}`), file);
  }
  for (const pagePath of [page, path.join(root, "index", "main.html")]) {
    const source = fs.readFileSync(pagePath, "utf8").replace(/<!--[\s\S]*?-->/g, "");
    for (const [, url] of source.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+\.(?:js|css))"/g)) {
      assert.ok(fs.existsSync(path.resolve(path.dirname(pagePath), url)), `${pagePath}: ${url}`);
    }
  }
});

test("루트 메인 페이지가 실제 스크립트 파일을 불러온다", () => {
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)];
  assert.ok(scripts.length > 0);
  for (const [, src] of scripts) {
    assert.ok(fs.existsSync(path.resolve(root, src)), src);
  }
});

test("두 메인 페이지가 독립 폴더 없이 헤더 스크립트를 불러온다", () => {
  assert.equal(fs.existsSync(path.join(root, "header-export")), false);
  for (const pagePath of [page, path.join(root, "index", "main.html")]) {
    const source = fs.readFileSync(pagePath, "utf8");
    const scripts = [...source.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)];
    const header = scripts.find(([, src]) => src.endsWith("header.js"));
    assert.ok(header, pagePath);
    assert.ok(fs.existsSync(path.resolve(path.dirname(pagePath), header[1])));
  }
});

test("루트 메인 페이지의 연결된 내부 페이지가 존재한다", () => {
  const links = [...html.matchAll(/<a\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => !tag.includes("utility-placeholder-link"))
    .map((tag) => tag.match(/\bhref="([^"]+)"/)?.[1])
    .filter((href) => href?.endsWith(".html") && !/^https?:/.test(href));
  assert.ok(links.length > 0);
  for (const href of links) {
    assert.ok(fs.existsSync(path.resolve(root, href)), href);
  }
});

test("예약 이동 경로가 메인 스크립트 위치를 기준으로 계산된다", () => {
  const script = path.join(__dirname, "main.js");
  const context = vm.createContext({
    document: {
      currentScript: { src: pathToFileURL(script).href },
      addEventListener() {},
    },
    URL,
  });
  vm.runInContext(fs.readFileSync(script, "utf8"), context);
  const destination = context.reservationPageUrl();
  assert.equal(
    fileURLToPath(destination),
    path.join(root, "Reservation", "Reservation.html", "Reservation.html"),
  );
});
