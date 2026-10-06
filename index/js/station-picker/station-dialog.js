// 추가: KorailStationPicker의 전체 기능을 메인·간편예매 역 선택에 연결합니다.
function applyStationToTarget(target, control, fieldName, name) {
  if (target.tagName === "INPUT") {
    target.value = name;
    target.setAttribute("aria-label", `${fieldName} ${name}`);
  } else {
    target.textContent = name;
    control?.setAttribute("aria-label", `${fieldName} 선택, 현재 ${name}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const stationDialog = document.getElementById("station-dialog");
  const stationInput = document.getElementById("station-input");
  const stationSearchApply = document.getElementById("station-search-apply");
  const departureButton = document.getElementById("departure-btn");
  const arrivalButton = document.getElementById("arrival-btn");
  const simpleDepartureInput = document.getElementById("simple-dep");
  const simpleArrivalInput = document.getElementById("simple-arr");
  let currentTargetStationEl = null;
  let currentTargetControl = null;
  let currentFieldName = "";

  // 추가: 팝업을 연 입력 위치를 기억해 해당 출발역 또는 도착역에 반영합니다.
  const openStationDialog = (target, control, fieldName) => {
    if (stationDialog.open) return;
    currentTargetStationEl = target;
    currentTargetControl = control;
    currentFieldName = fieldName;
    document.getElementById("station-dialog-title").textContent = `${fieldName} 선택`;
    stationInput.placeholder = `${fieldName} 이름 또는 초성 검색`;
    resetStationDialog();
    stationDialog.showModal();
    stationInput.focus();
  };
  departureButton?.addEventListener("click", () => openStationDialog(
    document.getElementById("departure-name"), departureButton, "출발역",
  ));
  arrivalButton?.addEventListener("click", () => openStationDialog(
    document.getElementById("arrival-name"), arrivalButton, "도착역",
  ));
  simpleDepartureInput?.addEventListener("click", () => openStationDialog(
    simpleDepartureInput, simpleDepartureInput, "출발역",
  ));
  simpleArrivalInput?.addEventListener("click", () => openStationDialog(
    simpleArrivalInput, simpleArrivalInput, "도착역",
  ));
  // 역 버튼 그리기 (stations-data.js의 코레일 역 목록 사용)
  const majorGrid = document.getElementById("popular-stations");
  const regionChips = document.getElementById("region-chips");
  const regionGrid = document.getElementById("region-stations");
  const resultsBox = document.getElementById("station-results");
  const resultsTitle = document.getElementById("station-results-title");
  const resultsGrid = document.getElementById("station-results-list");
  const tabsWrap = document.getElementById("station-tabs-wrap");
  const stationTabs = document.querySelectorAll(".station-tab");

  const stationButtons = (names) =>
    names
      .map((name) => `<button type="button" class="station-chip" data-station="${name}">${name}</button>`)
      .join("");

  const regionNames = [...Object.keys(KORAIL_REGION_STATIONS), "전체"];

  const showRegion = (region) => {
    regionChips.querySelectorAll(".region-chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.region === region);
    });
    const names = region === "전체" ? KORAIL_ALL_STATIONS : KORAIL_REGION_STATIONS[region];
    regionGrid.innerHTML = stationButtons(names);
    regionGrid.scrollTop = 0;
  };

  if (majorGrid) {
    majorGrid.innerHTML = stationButtons(KORAIL_MAJOR_STATIONS);
    regionChips.innerHTML = regionNames
      .map((region) => `<button type="button" class="region-chip" data-region="${region}">${region}</button>`)
      .join("");
    showRegion("서울");
  }

  // 수정: 세 탭의 패널·접근성 상태와 지도용 팝업 너비를 함께 전환합니다.
  const showStationTab = (tab) => {
    stationTabs.forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
      btn.setAttribute("tabindex", active ? "0" : "-1");
    });
    document.getElementById("station-panel-major").hidden = tab !== "major";
    document.getElementById("station-panel-region").hidden = tab !== "region";
    document.getElementById("station-panel-map").hidden = tab !== "map";
    stationDialog.classList.toggle("is-map-view", tab === "map");
    if (tab === "map") document.dispatchEvent(new Event("korail:map-reset"));
  };

  // 초성 검색: "서울" → "ㅅㅇ"
  const CHOSUNG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  const toChosung = (text) =>
    [...text]
      .map((ch) => {
        const code = ch.charCodeAt(0) - 0xac00;
        return code >= 0 && code <= 11171 ? CHOSUNG[Math.floor(code / 588)] : ch;
      })
      .join("");
  const isChosungOnly = (text) => [...text].every((ch) => CHOSUNG.includes(ch));

  const searchStations = (query) => {
    const q = query.replace(/\s/g, "");
    if (!q) return [];
    return KORAIL_ALL_STATIONS.filter((name) =>
      isChosungOnly(q) ? toChosung(name).includes(q) : name.includes(q)
    );
  };

  // 검색어가 있으면 결과만, 없으면 탭 화면
  const updateStationSearch = () => {
    const query = stationInput.value.trim();
    const hasQuery = query.length > 0;
    resultsBox.hidden = !hasQuery;
    tabsWrap.hidden = hasQuery;
    if (!hasQuery) return;
    // 수정: 지도에서 검색을 시작하면 검색 결과에 맞는 기본 팝업 너비로 돌아갑니다.
    showStationTab("major");

    const found = searchStations(query);
    resultsTitle.textContent = found.length ? `검색 결과 ${found.length}개` : "검색 결과가 없어요. 역 이름을 다시 확인해 주세요.";
    resultsGrid.innerHTML = stationButtons(found);
  };

  // 다음에 열 때 처음 화면(빈 검색창, 주요역 탭)으로
  const resetStationDialog = () => {
    stationInput.value = "";
    updateStationSearch();
    showStationTab("major");
  };

  // 역 하나 고르기
  // 추가: 주요역·검색·지도에서 고른 역을 같은 필드 적용 함수로 처리합니다.
  const selectStation = (name) => {
    if (currentTargetStationEl) {
      applyStationToTarget(currentTargetStationEl, currentTargetControl, currentFieldName, name);
    }
    resetStationDialog();
    stationDialog.close();
  };

  // 수정: 지도에서 고른 역도 기존 selectStation으로 표시하고 팝업을 닫습니다.
  document.addEventListener("korail:station-selected", (event) => {
    const name = event.detail?.station;
    if (stationDialog.open && typeof name === "string" && name.trim()) selectStation(name);
  });

  // 수정: 좌우 화살표·Home·End로 세 탭을 이동할 수 있습니다.
  stationTabs.forEach((button, index) => {
    button.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % stationTabs.length;
      else if (event.key === "ArrowLeft") next = (index + stationTabs.length - 1) % stationTabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = stationTabs.length - 1;
      else return;
      event.preventDefault();
      showStationTab(stationTabs[next].dataset.tab);
      stationTabs[next].focus();
    });
  });

  if (stationDialog) {
    // 역 버튼, 지역 버튼, 탭 클릭을 모달 한 곳에서 받음 (버튼이 다시 그려져도 동작)
    stationDialog.addEventListener("click", (e) => {
      // 실제 모달 영역 밖을 클릭한 경우만 닫습니다.
      if (e.target === stationDialog) {
        const bounds = stationDialog.getBoundingClientRect();
        const outside = e.clientX < bounds.left || e.clientX > bounds.right ||
          e.clientY < bounds.top || e.clientY > bounds.bottom;
        if (outside) stationDialog.close();
        return;
      }
      const stationBtn = e.target.closest(".station-chip");
      if (stationBtn) {
        selectStation(stationBtn.dataset.station);
        return;
      }
      const regionBtn = e.target.closest(".region-chip");
      if (regionBtn) {
        showRegion(regionBtn.dataset.region);
        return;
      }
      const tabBtn = e.target.closest(".station-tab");
      if (tabBtn) {
        showStationTab(tabBtn.dataset.tab);
      }
    });

    // 모달이 닫히면 다음에 열 때 처음 화면으로
    stationDialog.addEventListener("close", () => {
      if (!stationDialog.open) resetStationDialog(); // 이미 다시 열렸으면 건드리지 않음
    });
  }

  // 입력칸에 쓰거나 [선택]을 누르면: 정확히 같은 역이 있거나 결과가 하나뿐일 때만 적용
  const applyCustomStation = () => {
    const query = stationInput.value.trim();
    if (!query) return;
    const found = searchStations(query);
    const exact = KORAIL_ALL_STATIONS.find((name) => name === query);
    if (exact || found.length === 1) {
      selectStation(exact || found[0]);
    } else {
      updateStationSearch(); // 여러 개면 목록에서 고르게
    }
  };

  if (stationInput) {
    stationInput.addEventListener("input", updateStationSearch);
    stationInput.addEventListener("keydown", (e) => {
      // 보완: 한글 조합 확정 Enter는 역 선택으로 처리하지 않습니다.
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "Enter") {
        e.preventDefault();
        applyCustomStation();
      }
    });
  }
  if (stationSearchApply) {
    stationSearchApply.addEventListener("click", applyCustomStation);
  }


  // Escape 또는 닫기로 종료하면 팝업을 연 버튼·입력란으로 초점을 되돌립니다.
  stationDialog.addEventListener("close", () => {
    if (!stationDialog.open) {
      currentTargetControl?.focus();
      currentTargetStationEl = null;
      currentTargetControl = null;
    }
  });
});
