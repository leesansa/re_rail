// 추가 01. 헤더: 원본 시안의 닫기 버튼 상태를 유지합니다.

// 추가 02. 검색창: 역 이름·초성을 입력하는 즉시 목록을 좁힙니다.
const stationSearch = document.querySelector(".station-search-input");
const searchButton = document.querySelector(".search-button");
const consonants = Array.from("ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ");

function normalizeSearch(text) {
  return text.replace(/\s+/g, "").toLocaleLowerCase("ko");
}

function stationInitials(name) {
  return Array.from(name, (character) => {
    const code = character.charCodeAt(0);
    return code >= 0xac00 && code <= 0xd7a3
      ? consonants[Math.floor((code - 0xac00) / 588)]
      : character.toLocaleLowerCase("ko");
  }).join("");
}

function matchesStation(station, query) {
  return normalizeSearch(station.name).includes(query) || stationInitials(station.name).includes(query);
}

// 추가 03. 조회 방식: 현재 화면의 '역명으로 찾기' 선택 상태를 유지합니다.

// 추가 04. 역명 목록: 별도 데이터 파일에서 버튼을 만들고 하나의 역만 선택합니다.
const stationList = document.querySelector(".station-list");
const emptyMessage = document.querySelector(".station-empty");
const stations = window.stationDirectoryData;
let selectedStation = null;

function selectStation(name) {
  selectedStation = name;
  stationList.querySelectorAll(".station-button").forEach((button) => {
    const selected = button.textContent === name;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  // 추가: 예약 화면의 팝업에서 열린 경우 역명 목록의 선택도 부모 화면에 전달합니다.
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "korail:station-selected", station: name }, "*");
  }
}

function renderStations() {
  const query = normalizeSearch(stationSearch.value);
  const filtered = stations.filter((station) => matchesStation(station, query));
  const rows = [];

  for (let index = 0; index < filtered.length; index += 4) {
    const group = filtered.slice(index, index + 4);
    const row = document.createElement("li");
    row.className = "station-row";
    if (!query && group[0].rowOffset) row.classList.add("is-offset");
    if (!query) row.setAttribute("data-figma-node", group[0].rowNode);

    for (const station of group) {
      const button = document.createElement("button");
      button.className = `station-button station-width-${station.width}`;
      button.type = "button";
      button.textContent = station.name;
      button.setAttribute("data-figma-node", station.node);
      button.setAttribute("aria-pressed", String(station.name === selectedStation));
      if (station.name === selectedStation) button.classList.add("is-selected");
      button.addEventListener("click", () => selectStation(station.name));
      row.append(button);
    }
    rows.push(row);
  }

  stationList.replaceChildren(...rows);
  emptyMessage.hidden = filtered.length > 0;
}

stationSearch.addEventListener("input", renderStations);
searchButton.addEventListener("click", () => {
  stationSearch.focus();
  renderStations();
});
renderStations();
