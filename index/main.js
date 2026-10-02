/**
 * re_rail 메인 페이지 인터랙션 스크립트
 */

document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------------------
  // 01. 메인 배너 호버 인터랙션 (기존 코드 개선 및 유지)
  // ----------------------------------------------------
  const banner = document.querySelector(".main-banner");
  if (banner) {
    const bannerLink = banner.closest("a");
    if (bannerLink) {
      bannerLink.style.display = "block";
      bannerLink.style.overflow = "hidden";
      banner.style.display = "block";
      banner.style.transformOrigin = "center center";
      banner.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";

      const updateBanner = (isHover) => {
        banner.style.transform = isHover ? "scale(1.04)" : "scale(1)";
      };

      bannerLink.addEventListener("mouseenter", () => updateBanner(true));
      bannerLink.addEventListener("mouseleave", () => updateBanner(false));
      bannerLink.addEventListener("focus", () => updateBanner(true));
      bannerLink.addEventListener("blur", () => updateBanner(false));
    }
  }

  // ----------------------------------------------------
  // 02. 예매 상단 탭 전환 (기차예매 / 간편예매 / 할인상품)
  // ----------------------------------------------------
  const bookingTabs = document.querySelectorAll(".booking-tab");
  const panelTrain = document.getElementById("panel-train");
  const panelSimple = document.getElementById("panel-simple");

  const switchTab = (tabName) => {
    bookingTabs.forEach((t) => {
      const isMatch = t.dataset.tab === tabName;
      t.classList.toggle("active", isMatch);
      t.setAttribute("aria-selected", String(isMatch));
    });

    if (tabName === "train") {
      if (panelTrain) {
        panelTrain.hidden = false;
        panelTrain.classList.add("active");
      }
      if (panelSimple) {
        panelSimple.hidden = true;
        panelSimple.classList.remove("active");
      }
    } else if (tabName === "simple") {
      if (panelSimple) {
        panelSimple.hidden = false;
        panelSimple.classList.add("active");
      }
      if (panelTrain) {
        panelTrain.hidden = true;
        panelTrain.classList.remove("active");
      }
    } else if (tabName === "discount") {
      alert("할인상품 서비스 준비 중입니다. 기차예매를 이용해 주세요.");
      switchTab("train");
    }
  };

  bookingTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  // ----------------------------------------------------
  // 03. 편도 / 왕복 선택 토글
  // ----------------------------------------------------
  const tripBtns = document.querySelectorAll(".trip-btn");
  let currentTripType = "oneway"; // 'oneway' | 'round'
  const returnDateGroup = document.getElementById("return-date-group");

  tripBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tripBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
      currentTripType = btn.dataset.trip;

      // 왕복일 때와 편도일 때 날짜 표시 업데이트
      updateDateDisplay();
    });
  });

  // ----------------------------------------------------
  // 04. 출발역 ↔ 도착역 스왑(맞바꾸기)
  // ----------------------------------------------------
  const swapBtn = document.getElementById("swap-btn");
  const departureNameEl = document.getElementById("departure-name");
  const arrivalNameEl = document.getElementById("arrival-name");
  const departureBtn = document.getElementById("departure-btn");
  const arrivalBtn = document.getElementById("arrival-btn");

  let isSwapped = false;
  if (swapBtn && departureNameEl && arrivalNameEl) {
    swapBtn.addEventListener("click", () => {
      const temp = departureNameEl.textContent;
      departureNameEl.textContent = arrivalNameEl.textContent;
      arrivalNameEl.textContent = temp;

      departureBtn.setAttribute("aria-label", `출발역 선택, 현재 ${departureNameEl.textContent}`);
      arrivalBtn.setAttribute("aria-label", `도착역 선택, 현재 ${arrivalNameEl.textContent}`);

      isSwapped = !isSwapped;
      swapBtn.classList.toggle("swapped", isSwapped);
    });
  }

  // ----------------------------------------------------
  // 05. 역 선택 모달 다이얼로그
  // ----------------------------------------------------
  const stationDialog = document.getElementById("station-dialog");
  const stationDialogTitle = document.getElementById("station-dialog-title");
  const stationInput = document.getElementById("station-input");
  const stationSearchApply = document.getElementById("station-search-apply");

  let currentTargetStationEl = null;

  const openStationDialog = (targetType) => {
    if (!stationDialog) return;
    if (targetType === "dep") {
      currentTargetStationEl = departureNameEl;
      stationDialogTitle.textContent = "출발역 선택";
      stationInput.placeholder = "출발역 이름 또는 초성 (예: 서울, ㅅㅇ)";
    } else {
      currentTargetStationEl = arrivalNameEl;
      stationDialogTitle.textContent = "도착역 선택";
      stationInput.placeholder = "도착역 이름 또는 초성 (예: 부산, ㅂㅅ)";
    }
    stationInput.value = "";
    stationDialog.showModal();
    stationInput.focus();
  };

  if (departureBtn) {
    departureBtn.addEventListener("click", () => openStationDialog("dep"));
  }
  if (arrivalBtn) {
    arrivalBtn.addEventListener("click", () => openStationDialog("arr"));
  }

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

  // 주요역 / 지역별 탭
  const showStationTab = (tab) => {
    stationTabs.forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    document.getElementById("station-panel-major").hidden = tab !== "major";
    document.getElementById("station-panel-region").hidden = tab !== "region";
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
  const selectStation = (name) => {
    if (currentTargetStationEl) {
      currentTargetStationEl.textContent = name;
    }
    resetStationDialog();
    stationDialog.close();
  };

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
      if (e.key === "Enter") {
        e.preventDefault();
        applyCustomStation();
      }
    });
  }
  if (stationSearchApply) {
    stationSearchApply.addEventListener("click", applyCustomStation);
  }

  // ----------------------------------------------------
  // 06. 날짜 및 인원 설정 모달 다이얼로그
  // ----------------------------------------------------
  const travelDialog = document.getElementById("travel-dialog");
  const travelInfoBtn = document.getElementById("travel-info-btn");
  const travelForm = document.getElementById("travel-form");
  const travelDateText = document.getElementById("travel-date-text");
  const travelPassengersText = document.getElementById("travel-passengers-text");

  const inputDepDate = document.getElementById("input-dep-date");
  const inputArrDate = document.getElementById("input-arr-date");
  const inputPassengerCount = document.getElementById("input-passenger-count");
  const passengerMinus = document.getElementById("passenger-minus");
  const passengerPlus = document.getElementById("passenger-plus");

  let state = {
    depDate: "2026-10-21",
    arrDate: "2026-10-21",
    passengers: 1,
  };

  const formatDateString = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${y}년 ${m}월 ${d}일`;
  };

  const updateDateDisplay = () => {
    if (!travelDateText) return;
    if (currentTripType === "round") {
      const [depY, depM, depD] = state.depDate.split("-");
      const [arrY, arrM, arrD] = state.arrDate.split("-");
      travelDateText.textContent = `${depY}년 ${depM}월 ${depD}일 ~ ${arrM}월 ${arrD}일`;
      if (returnDateGroup) returnDateGroup.style.display = "block";
    } else {
      const [depY, depM, depD] = state.depDate.split("-");
      travelDateText.textContent = `${depY}년 ${depM}월 ${depD}일`;
      if (returnDateGroup) returnDateGroup.style.display = "none";
    }
    if (travelPassengersText) {
      travelPassengersText.textContent = `${state.passengers}인`;
    }
  };

  // 초기 여정 구분(편도)에 맞춰 날짜와 인원을 표시합니다.
  updateDateDisplay();

  // ----------------------------------------------------
  // 06-1. 코레일 날짜/시간 선택 듀얼 캘린더 모달
  // ----------------------------------------------------
  const calendarDialog = document.getElementById("korail-calendar-dialog");
  const calendarTriggerWrap = document.getElementById("calendar-trigger-wrap");
  const calendarIconBtn = document.getElementById("calendar-icon-btn");
  const calCloseBtn = document.getElementById("cal-close-btn");
  const calSearchConfirmBtn = document.getElementById("cal-search-confirm-btn");

  const calDepYear = document.getElementById("cal-dep-year");
  const calDepDate = document.getElementById("cal-dep-date");
  const calDepHour = document.getElementById("cal-dep-hour");

  const calArrCard = document.getElementById("cal-arr-card");
  const calArrYear = document.getElementById("cal-arr-year");
  const calArrDate = document.getElementById("cal-arr-date");
  const calArrHour = document.getElementById("cal-arr-hour");

  const calTripTabs = document.querySelectorAll(".cal-trip-tab");

  const calDaysLeft = document.getElementById("cal-days-left");
  const calDaysRight = document.getElementById("cal-days-right");
  const calHeadingLeft = document.getElementById("cal-heading-left");
  const calHeadingRight = document.getElementById("cal-heading-right");

  const calPrevBtn = document.getElementById("cal-prev-btn");
  const calNextBtn = document.getElementById("cal-next-btn");

  // 초기 상태: 2026년 10월 기준, 선택일 2026-10-21 (수), 18시
  let calCurrentYear = 2026;
  let calCurrentMonth = 10;
  let selectedDep = { year: 2026, month: 10, day: 21, dayName: "수", hour: 18 };
  let selectedArr = { year: 2026, month: 10, day: 21, dayName: "수", hour: 18 };
  let calTripMode = "oneway";
  let selectStep = 0;

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const holidays = {
    "2026-10-03": "개천절",
    "2026-10-05": "대체공휴일",
    "2026-10-09": "한글날",
  };

  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getFirstDayOfWeek = (year, month) => new Date(year, month - 1, 1).getDay();

  const calendarDateValue = (date) => Date.UTC(date.year, date.month - 1, date.day);
  const normalizeReturnDate = () => {
    if (calendarDateValue(selectedArr) < calendarDateValue(selectedDep)) {
      selectedArr = { ...selectedDep, hour: selectedArr.hour };
    }
  };

  const renderSingleMonth = (container, headingEl, year, month) => {
    if (!container || !headingEl) return;
    headingEl.textContent = `${year}. ${String(month).padStart(2, "0")}.`;
    container.innerHTML = "";

    const daysCount = getDaysInMonth(year, month);
    const startDay = getFirstDayOfWeek(year, month);

    for (let i = 0; i < startDay; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "cal-day-cell empty";
      container.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysCount; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const cell = document.createElement("div");
      cell.className = "cal-day-cell";
      cell.dataset.date = dateString;

      if (dayOfWeek === 0) cell.classList.add("sun");
      if (dayOfWeek === 6) cell.classList.add("sat");
      if (holidays[dateString]) cell.classList.add("holiday");

      const isDep = selectedDep && selectedDep.year === year && selectedDep.month === month && selectedDep.day === day;
      const isArr = calTripMode === "round" && selectedArr && selectedArr.year === year && selectedArr.month === month && selectedArr.day === day;

      if (isDep) {
        cell.classList.add("selected");
        cell.innerHTML = `<span class="cell-num">${day}</span><span class="cell-badge">출발일</span>`;
      } else if (isArr) {
        cell.classList.add("selected-arr");
        cell.innerHTML = `<span class="cell-num">${day}</span><span class="cell-badge">도착일</span>`;
      } else {
        cell.innerHTML = `<span class="cell-num">${day}</span>`;
      }

      const unavailableReturn = calTripMode === "round" && selectStep === 1 &&
        calendarDateValue({ year, month, day }) < calendarDateValue(selectedDep);
      if (unavailableReturn) {
        cell.classList.add("unavailable-return");
        cell.setAttribute("aria-disabled", "true");
      } else {
        cell.addEventListener("click", () => handleDateClick(year, month, day, dayNames[dayOfWeek]));
      }
      container.appendChild(cell);
    }
  };

  const renderDualCalendar = () => {
    renderSingleMonth(calDaysLeft, calHeadingLeft, calCurrentYear, calCurrentMonth);
    let nextYear = calCurrentYear;
    let nextMonth = calCurrentMonth + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    renderSingleMonth(calDaysRight, calHeadingRight, nextYear, nextMonth);
  };

  const updateCardDisplay = () => {
    if (selectedDep) {
      if (calDepYear) calDepYear.textContent = `${selectedDep.year}년`;
      if (calDepDate) calDepDate.textContent = `${selectedDep.month}월 ${selectedDep.day}일(${selectedDep.dayName})`;
      if (calDepHour) calDepHour.value = selectedDep.hour || 18;
    }
    if (selectedArr) {
      if (calArrYear) calArrYear.textContent = `${selectedArr.year}년`;
      if (calArrDate) calArrDate.textContent = `${selectedArr.month}월 ${selectedArr.day}일(${selectedArr.dayName})`;
      if (calArrHour) calArrHour.value = selectedArr.hour || 18;
    }
  };

  const handleDateClick = (year, month, day, dayName) => {
    const hourVal = parseInt(calDepHour.value, 10) || 18;
    if (calTripMode === "oneway") {
      selectedDep = { year, month, day, dayName, hour: hourVal };
    } else {
      if (selectStep === 0) {
        selectedDep = { year, month, day, dayName, hour: hourVal };
        normalizeReturnDate();
        selectStep = 1;
      } else {
        if (calendarDateValue({ year, month, day }) < calendarDateValue(selectedDep)) return;
        selectedArr = { year, month, day, dayName, hour: parseInt(calArrHour.value, 10) || 18 };
        selectStep = 0;
      }
    }
    updateCardDisplay();
    renderDualCalendar();
  };

  calTripTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      calTripTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      calTripMode = tab.dataset.calTrip;

      if (calTripMode === "round") {
        normalizeReturnDate();
        updateCardDisplay();
        calArrCard?.classList.remove("disabled");
        if (calArrHour) calArrHour.disabled = false;
        selectStep = 1;
      } else {
        calArrCard?.classList.add("disabled");
        if (calArrHour) calArrHour.disabled = true;
        selectStep = 0;
      }
      renderDualCalendar();
    });
  });

  if (calPrevBtn) {
    calPrevBtn.addEventListener("click", () => {
      calCurrentMonth--;
      if (calCurrentMonth < 1) {
        calCurrentMonth = 12;
        calCurrentYear--;
      }
      renderDualCalendar();
    });
  }

  if (calNextBtn) {
    calNextBtn.addEventListener("click", () => {
      calCurrentMonth++;
      if (calCurrentMonth > 12) {
        calCurrentMonth = 1;
        calCurrentYear++;
      }
      renderDualCalendar();
    });
  }


  const peopleRows = [...document.querySelectorAll('.people-row')];
  let savedPeople = [1, 0, 0, 0, 0, 0, 0];
  let draftPeople = [...savedPeople];
  const peopleTotal = () => draftPeople.reduce((a, b) => a + b, 0);
  const closePeopleNotes = () => {
    document.querySelectorAll('.people-note').forEach(note => { note.hidden = true; });
    document.querySelectorAll('.people-info').forEach(button => button.setAttribute('aria-expanded', 'false'));
  };
  const renderPeople = () => {
    const total = peopleTotal();
    peopleRows.forEach((row, index) => {
      row.querySelector('output').textContent = draftPeople[index];
      row.querySelector('[data-step="-1"]').disabled = draftPeople[index] === 0 || total <= 1;
      row.querySelector('[data-step="1"]').disabled = total >= 9;
    });
    document.getElementById('people-total').textContent = total;
  };
  peopleRows.forEach((row, index) => {
    row.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
      const step = Number(button.dataset.step);
      const total = peopleTotal();
      if ((step < 0 && (draftPeople[index] === 0 || total <= 1)) || (step > 0 && total >= 9)) return;
      draftPeople[index] += step;
      renderPeople();
    }));
    const info = row.querySelector('.people-info');
    if (info) {
      info.addEventListener('click', () => {
        const show = info.getAttribute('aria-expanded') !== 'true';
        closePeopleNotes();
        info.setAttribute('aria-expanded', String(show));
        document.getElementById(info.getAttribute('aria-controls')).hidden = !show;
      });
      row.querySelector('.people-note-close').addEventListener('click', () => { closePeopleNotes(); info.focus(); });
    }
  });
  renderPeople();

  const openCalendarModal = () => {
    if (!calendarDialog) return;
    updateCardDisplay();
    renderDualCalendar();
    draftPeople = [...savedPeople];
    closePeopleNotes();
    renderPeople();
    calendarDialog.showModal();
  };

  // ★ 사용자의 요구: "날짜있는 쪽이랑 캘린더 아이콘 둘 중에 하나라도 누르면 이렇게 모달 뜨게"
  if (calendarTriggerWrap) {
    calendarTriggerWrap.addEventListener("click", (e) => {
      e.stopPropagation();
      openCalendarModal();
    });
  }
  if (calendarIconBtn) {
    calendarIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openCalendarModal();
    });
  }
  if (travelDateText) {
    travelDateText.addEventListener("click", (e) => {
      e.stopPropagation();
      openCalendarModal();
    });
  }

  if (calCloseBtn) {
    calCloseBtn.addEventListener("click", () => calendarDialog.close());
  }

  // 모달 밖 backdrop 클릭 시 닫기
  if (calendarDialog) {
    calendarDialog.addEventListener("click", (e) => {
      if (e.target === calendarDialog) {
        calendarDialog.close();
      }
    });
  }

  // [검색하기] 버튼 클릭 시 메인 화면 텍스트 반영
  if (calSearchConfirmBtn) {
    calSearchConfirmBtn.addEventListener("click", () => {
      if (calTripMode === "round" && calendarDateValue(selectedArr) < calendarDateValue(selectedDep)) {
        alert("도착일은 출발일과 같거나 이후 날짜로 선택해 주세요.");
        return;
      }
      savedPeople = [...draftPeople];
      state.passengers = peopleTotal();
      travelPassengersText.textContent = `${state.passengers}인`;
      inputPassengerCount.value = state.passengers;
      const depHour = parseInt(calDepHour.value, 10) || 18;
      selectedDep.hour = depHour;

      if (calTripMode === "oneway") {
        travelDateText.textContent = `${selectedDep.year}년 ${String(selectedDep.month).padStart(2, "0")}월 ${String(selectedDep.day).padStart(2, "0")}일(${selectedDep.dayName}) ${depHour}시 이후`;
        state.depDate = `${selectedDep.year}-${String(selectedDep.month).padStart(2, "0")}-${String(selectedDep.day).padStart(2, "0")}`;
      } else {
        travelDateText.textContent = `${selectedDep.year}년 ${String(selectedDep.month).padStart(2, "0")}월 ${String(selectedDep.day).padStart(2, "0")}일 ~ ${String(selectedArr.month).padStart(2, "0")}월 ${String(selectedArr.day).padStart(2, "0")}일`;
        state.depDate = `${selectedDep.year}-${String(selectedDep.month).padStart(2, "0")}-${String(selectedDep.day).padStart(2, "0")}`;
        state.arrDate = `${selectedArr.year}-${String(selectedArr.month).padStart(2, "0")}-${String(selectedArr.day).padStart(2, "0")}`;
      }

      calendarDialog.close();
    });
  }

  // 날짜와 인원은 같은 팝업에서 설정합니다.
  travelPassengersText?.addEventListener('click', (e) => {
    e.stopPropagation();
    openCalendarModal();
  });

  // 인원수 증감 버튼
  if (passengerMinus && passengerPlus && inputPassengerCount) {
    passengerMinus.addEventListener("click", () => {
      let cur = parseInt(inputPassengerCount.value, 10) || 1;
      if (cur > 1) {
        inputPassengerCount.value = cur - 1;
      }
    });

    passengerPlus.addEventListener("click", () => {
      let cur = parseInt(inputPassengerCount.value, 10) || 1;
      if (cur < 9) {
        inputPassengerCount.value = cur + 1;
      }
    });
  }

  // 날짜/인원 폼 제출 적용
  if (travelForm) {
    travelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (currentTripType === "round" && inputArrDate.value && inputDepDate.value && inputArrDate.value < inputDepDate.value) {
        alert("도착일은 출발일과 같거나 이후 날짜로 선택해 주세요.");
        inputArrDate.focus();
        return;
      }
      state.depDate = inputDepDate.value || "2026-10-21";
      state.arrDate = inputArrDate.value || "2026-10-21";
      state.passengers = parseInt(inputPassengerCount.value, 10) || 1;

      updateDateDisplay();
      travelDialog.close();
    });
  }

  // ----------------------------------------------------
  // 07. [조회] 버튼 클릭 시 예매 결과 페이지로 이동
  // ----------------------------------------------------
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const departure = departureNameEl ? departureNameEl.textContent.trim() : "서울";
      const arrival = arrivalNameEl ? arrivalNameEl.textContent.trim() : "부산";
      const passengers = state.passengers || 1;
      const trip = currentTripType;
      const date = state.depDate || "2026-10-21";

      const queryParams = new URLSearchParams({
        departure,
        arrival,
        date,
        passengers: String(passengers),
        trip,
      });

      // 예매 결과 페이지로 이동
      window.location.href = `../Reservation/index.html?${queryParams.toString()}`;
    });
  }

  // ----------------------------------------------------
  // 08. 간편예매 폼 상호작용
  // ----------------------------------------------------
  const simpleMinus = document.getElementById("simple-minus");
  const simplePlus = document.getElementById("simple-plus");
  const simpleCountText = document.getElementById("simple-count-text");
  let simplePassengerCount = 1;

  if (simpleMinus && simplePlus && simpleCountText) {
    simpleMinus.addEventListener("click", () => {
      if (simplePassengerCount > 1) {
        simplePassengerCount--;
        simpleCountText.textContent = `${simplePassengerCount}명`;
      }
    });

    simplePlus.addEventListener("click", () => {
      if (simplePassengerCount < 9) {
        simplePassengerCount++;
        simpleCountText.textContent = `${simplePassengerCount}명`;
      }
    });
  }

  // 간편예매 출발역/도착역 클릭 시 역 선택 다이얼로그 연동
  const simpleDepInput = document.getElementById("simple-dep");
  const simpleArrInput = document.getElementById("simple-arr");

  if (simpleDepInput) {
    simpleDepInput.addEventListener("click", () => {
      currentTargetStationEl = {
        set textContent(val) { simpleDepInput.value = val; },
        get textContent() { return simpleDepInput.value; }
      };
      if (stationDialog) {
        stationDialogTitle.textContent = "출발역 선택";
        stationInput.placeholder = "출발역 이름 또는 초성 (예: 서울, ㅅㅇ)";
        stationInput.value = "";
        stationDialog.showModal();
        stationInput.focus();
      }
    });
  }

  if (simpleArrInput) {
    simpleArrInput.addEventListener("click", () => {
      currentTargetStationEl = {
        set textContent(val) { simpleArrInput.value = val; },
        get textContent() { return simpleArrInput.value; }
      };
      if (stationDialog) {
        stationDialogTitle.textContent = "도착역 선택";
        stationInput.placeholder = "도착역 이름 또는 초성 (예: 부산, ㅂㅅ)";
        stationInput.value = "";
        stationDialog.showModal();
        stationInput.focus();
      }
    });
  }

  // 간편예매 저장/조회 버튼
  const simpleSubmitBtn = document.getElementById("simple-submit-btn");
  if (simpleSubmitBtn) {
    simpleSubmitBtn.addEventListener("click", () => {
      const alias = document.getElementById("simple-alias")?.value.trim() || "";
      const dep = simpleDepInput?.value.trim() || "서울";
      const arr = simpleArrInput?.value.trim() || "부산";
      const trainType = document.getElementById("simple-train-type")?.value || "KTX";
      const depDay = document.getElementById("simple-dep-day")?.value || "월";
      const depTime = document.getElementById("simple-dep-time")?.value || "08시";
      const room = document.getElementById("simple-room")?.value || "일반실";
      const seat = document.getElementById("simple-seat")?.value || "순방향";

      // 간편예매 설정 로컬 저장
      const simpleSettings = {
        alias,
        dep,
        arr,
        passengers: simplePassengerCount,
        trainType,
        depDay,
        depTime,
        room,
        seat,
      };
      localStorage.setItem("korail_simple_booking", JSON.stringify(simpleSettings));

      // 예매 결과 페이지로 이동
      const queryParams = new URLSearchParams({
        departure: dep,
        arrival: arr,
        passengers: String(simplePassengerCount),
        type: trainType,
        time: depTime,
        seat: room,
      });

      window.location.href = `../Reservation/index.html?${queryParams.toString()}`;
    });
  }
});
