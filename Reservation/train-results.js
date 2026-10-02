// 01. 회원 메뉴 임시 링크: 이동할 페이지가 완성될 때까지 클릭 이동만 막는다.
document.querySelectorAll(".utility-placeholder-link").forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

// 01. 언어 선택: 번역 데이터 연결 전까지 선택한 언어 이름을 헤더에 반영한다.
const languageControl = document.querySelector(".utility-language-control");
if (languageControl) {
  const languageButton = languageControl.querySelector(".utility-language");
  const languageMenu = languageControl.querySelector(".utility-language-menu");
  const languageLabel = languageButton.querySelector("span");
  const closeLanguageMenu = () => {
    languageMenu.hidden = true;
    languageButton.setAttribute("aria-expanded", "false");
  };

  languageButton.addEventListener("click", () => {
    const wasOpen = !languageMenu.hidden;
    closeLanguageMenu();
    if (wasOpen) return;
    languageMenu.hidden = false;
    languageButton.setAttribute("aria-expanded", "true");
    languageMenu.querySelector('[aria-pressed="true"]').focus();
  });

  languageMenu.querySelectorAll("button").forEach((option) => {
    option.addEventListener("click", () => {
      languageLabel.textContent = option.textContent;
      languageButton.setAttribute("aria-label", `언어 선택, 현재 ${option.textContent}`);
      languageMenu.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === option));
      });
      closeLanguageMenu();
      languageButton.focus();
    });
  });

  document.addEventListener("click", (event) => {
    if (!languageControl.contains(event.target)) closeLanguageMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || languageMenu.hidden) return;
    closeLanguageMenu();
    languageButton.focus();
  });
}

const trainList = document.querySelector(".train-list");
const emptyStatus = document.querySelector(".train-empty");
const loadingStatus = document.querySelector(".train-loading");
const loadTrigger = document.querySelector(".train-load-trigger");
const activeFilters = { seat: "일반석", route: "직통", type: "전체" };
let visibleTrains = [];
let renderVersion = 0;
let loadObserver = null;
const isDefaultFilter = () =>
  activeFilters.seat === "일반석" &&
  activeFilters.route === "직통" &&
  activeFilters.type === "전체";

// 06. 배열의 열차 한 건을 기존 카드 구조로 렌더링한다.
const renderFare = (fare) =>
  fare
    ? `<button class="fare-column fare-button" type="button">
         <span class="fare-label">${fare.label}</span>
         <strong class="fare-price">${fare.price}</strong>
         ${fare.discount ? `<span class="fare-discount">${fare.discount}</span>` : ""}
       </button>`
    : `<div class="fare-column fare-unavailable" aria-label="특실 없음">
         <strong class="fare-price">-</strong>
       </div>`;

const renderTrainCard = (train) => {
  const date = selectedDateTime.dateTime.slice(0, 10);
  return `<li class="train-card" data-train-id="${train.id}">
    <img class="train-card-background" src="assets/train-card.png" alt="" width="1055" height="130" />
    <div class="train-journey">
      <img class="train-logo${train.type === "ITX 새마을" ? " train-logo-itx" : ""}"
        src="${train.logo}" alt="${train.type}" width="${train.logoWidth}" height="21" />
      <div class="journey-timeline">
        <time datetime="${date}T${train.departure}:00+09:00">${train.departure}</time>
        <div class="journey-track">
          <span class="journey-duration">${train.duration}</span>
          <img src="assets/journey-arrow.svg" alt="도착" />
          ${train.stop ? `<span class="stop-marker" aria-hidden="true"></span><span class="journey-stop">${train.stop}</span>` : ""}
        </div>
        <time datetime="${date}T${train.arrival}:00+09:00">${train.arrival}</time>
      </div>
    </div>
    ${renderFare(train.fares.일반석)}
    ${renderFare(train.fares.특실)}
  </li>`;
};

// 세 필터의 교집합으로 목록을 다시 만들고, 결과가 없으면 안내를 표시한다.
const renderTrains = () => {
  if (!trainList || !emptyStatus) return;
  renderVersion += 1;
  visibleTrains = trainCatalog.filter(activeFilters);
  trainList.innerHTML = visibleTrains.map(renderTrainCard).join("");
  emptyStatus.hidden = visibleTrains.length > 0;
  if (loadingStatus) loadingStatus.hidden = true;
  if (loadTrigger) {
    // 필터 결과는 중복 없이 표시하고, 기존 무한 스크롤은 기본 목록에서만 유지한다.
    loadTrigger.hidden = visibleTrains.length === 0 || !isDefaultFilter();
    if (loadObserver) {
      loadObserver.unobserve(loadTrigger);
      if (!loadTrigger.hidden) loadObserver.observe(loadTrigger);
    }
  }
};

// 기존 스크롤 추가 동작도 현재 필터 결과의 배열을 기준으로 유지한다.
if (trainList && loadingStatus && loadTrigger && typeof IntersectionObserver !== "undefined") {
  let isLoading = false;

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting || isLoading || !visibleTrains.length || !isDefaultFilter()) return;

      isLoading = true;
      observer.unobserve(loadTrigger);
      loadingStatus.hidden = false;
      const currentVersion = renderVersion;

      window.setTimeout(() => {
        if (currentVersion !== renderVersion) {
          loadingStatus.hidden = true;
          isLoading = false;
          if (!loadTrigger.hidden) observer.observe(loadTrigger);
          return;
        }
        trainList.insertAdjacentHTML("beforeend", visibleTrains.map(renderTrainCard).join(""));
        loadingStatus.hidden = true;
        isLoading = false;
        observer.observe(loadTrigger);
      }, 400);
    },
    { rootMargin: "0px 0px 300px 0px" },
  );

  loadObserver = observer;
  observer.observe(loadTrigger);
}

// 03. 날짜 이동 및 임시 달력 팝업
// 화면에 표시된 날짜를 기준으로 하루씩 이동하고,
// 실제 달력 페이지가 완성되기 전까지만 유지.
const previousDateButton = document.querySelector(".previous-date");
const nextDateButton = document.querySelector(".next-date");
const calendarButton = document.querySelector(".calendar-button");
const selectedDateTime = document.querySelector(".selected-date");
const calendarDialog = document.querySelector("#calendar-dialog");

if (previousDateButton && nextDateButton && selectedDateTime) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const initialDate = selectedDateTime.dateTime.slice(0, 10);
  const [year, month, day] = initialDate.split("-").map(Number);
  const selectedDate = new Date(Date.UTC(year, month - 1, day));

  const updateSelectedDate = () => {
    const date = selectedDate.toISOString().slice(0, 10);
    selectedDateTime.dateTime = date + "T00:00:00+09:00";
    selectedDateTime.textContent =
      date + "-(" + weekdays[selectedDate.getUTCDay()] + ") 00:00";
    renderTrains();
  };

  previousDateButton.addEventListener("click", () => {
    selectedDate.setUTCDate(selectedDate.getUTCDate() - 1);
    updateSelectedDate();
  });

  nextDateButton.addEventListener("click", () => {
    selectedDate.setUTCDate(selectedDate.getUTCDate() + 1);
    updateSelectedDate();
  });
}

if (calendarButton && calendarDialog) {
  calendarButton.addEventListener("click", () => calendarDialog.showModal());
}

// 04. 여정 선택: 실제 역 선택 화면이 완성되면 임시 팝업 내용을 교체.
const departureButton = document.querySelector(".departure-field");
const arrivalButton = document.querySelector(".arrival-field");
const swapButton = document.querySelector(".swap-button");
const passengerButton = document.querySelector(".passenger-field");
const routeDialog = document.querySelector("#route-dialog");
const routeDialogTitle = document.querySelector("#route-dialog-title");
const routeDialogMessage = document.querySelector("#route-dialog-message");
const passengerDialog = document.querySelector("#passenger-dialog");
const passengerForm = document.querySelector("#passenger-form");
const passengerCountInput = document.querySelector("#passenger-count");

if (departureButton && arrivalButton && swapButton && routeDialog) {
  const openRouteDialog = (title) => {
    routeDialogTitle.textContent = title;
    routeDialogMessage.textContent = `${title} 화면을 준비 중입니다.`;
    routeDialog.showModal();
  };

  departureButton.addEventListener("click", () =>
    openRouteDialog("출발역 선택"),
  );

  arrivalButton.addEventListener("click", () => openRouteDialog("도착역 선택"));

  swapButton.addEventListener("click", () => {
    const departureName = departureButton.querySelector("span");
    const arrivalName = arrivalButton.querySelector("span");
    const previousDeparture = departureName.textContent;

    departureName.textContent = arrivalName.textContent;
    arrivalName.textContent = previousDeparture;
    departureButton.setAttribute(
      "aria-label",
      `출발역 ${departureName.textContent}`,
    );
    arrivalButton.setAttribute(
      "aria-label",
      `도착역 ${arrivalName.textContent}`,
    );
  });
}

// URL 파라미터가 있으면 초기 출발역, 도착역, 인원수에 반영
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("departure") && departureButton) {
  const depSpan = departureButton.querySelector("span");
  if (depSpan) depSpan.textContent = urlParams.get("departure");
  departureButton.setAttribute("aria-label", `출발역 ${urlParams.get("departure")}`);
}
if (urlParams.has("arrival") && arrivalButton) {
  const arrSpan = arrivalButton.querySelector("span");
  if (arrSpan) arrSpan.textContent = urlParams.get("arrival");
  arrivalButton.setAttribute("aria-label", `도착역 ${urlParams.get("arrival")}`);
}
if (urlParams.has("passengers") && passengerButton) {
  const count = urlParams.get("passengers");
  const passSpan = passengerButton.querySelector("span");
  if (passSpan) passSpan.textContent = `총 ${count}명`;
  passengerButton.setAttribute("aria-label", `탑승 인원 총 ${count}명`);
}

// 탑승 인원 숫자를 직접 입력하고 적용하면 버튼의 표시와 접근성 이름을 갱신한다.
if (
  passengerButton &&
  passengerDialog &&
  passengerForm &&
  passengerCountInput
) {
  passengerButton.addEventListener("click", () => {
    passengerCountInput.value = passengerButton
      .querySelector("span")
      .textContent.match(/\d+/)[0];
    passengerDialog.showModal();
    passengerCountInput.focus();
    passengerCountInput.select();
  });

  passengerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const count = Number(passengerCountInput.value);
    if (!Number.isSafeInteger(count) || count < 1) return;

    passengerButton.querySelector("span").textContent = `총 ${count}명`;
    passengerButton.setAttribute("aria-label", `탑승 인원 총 ${count}명`);
    passengerDialog.close();
  });
}

// 05. 조회 조건 드롭다운: 선택값을 버튼에 반영하고, 바깥 클릭·Esc로 메뉴를 닫는다.
// 열차 종류 이미지는 기본 17~20번에서 선택 상태 21~24번으로 교체한다.
const filterControls = Array.from(document.querySelectorAll(".filter-control"));

if (filterControls.length) {
  const closeFilterMenus = () => {
    filterControls.forEach((control) => {
      control.querySelector(".filter-menu").hidden = true;
      control
        .querySelector(".filter-chip")
        .setAttribute("aria-expanded", "false");
    });
  };

  filterControls.forEach((control) => {
    const trigger = control.querySelector(".filter-chip");
    const menu = control.querySelector(".filter-menu");
    const selectedLabel = trigger.querySelector("span");
    const selectedIcon = trigger.querySelector(".filter-selected-icon");
    const filterName = trigger
      .getAttribute("aria-label")
      .replace(selectedLabel.textContent, "")
      .trim();

    trigger.addEventListener("click", () => {
      const wasOpen = !menu.hidden;
      closeFilterMenus();
      if (wasOpen) return;

      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      menu.querySelector('[aria-pressed="true"]').focus();
    });

    const filterKey = {
      "seat-filter-menu": "seat",
      "route-filter-menu": "route",
      "train-filter-menu": "type",
    }[menu.id];

    menu.querySelectorAll("button").forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.dataset.value ?? option.textContent.trim();
        selectedLabel.textContent = value;
        trigger.setAttribute("aria-label", `${filterName} ${value}`);
        if (selectedIcon) {
          const hasIcon = Boolean(option.dataset.selectedIcon);
          selectedLabel.hidden = hasIcon;
          selectedIcon.hidden = !hasIcon;
          if (hasIcon) selectedIcon.src = option.dataset.selectedIcon;
        }
        menu.querySelectorAll("button").forEach((item) => {
          const isSelected = item === option;
          item.setAttribute("aria-pressed", String(isSelected));
          const icon = item.querySelector("img");
          if (icon)
            icon.src = isSelected
              ? item.dataset.selectedIcon
              : item.dataset.icon;
        });
        activeFilters[filterKey] = value;
        renderTrains();
        closeFilterMenus();
        trigger.focus();
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".filter-control")) closeFilterMenus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openControl = filterControls.find(
      (control) => !control.querySelector(".filter-menu").hidden,
    );
    if (!openControl) return;
    closeFilterMenus();
    openControl.querySelector(".filter-chip").focus();
  });
}

// 처음에는 HTML 목록 대신 train-data.js의 배열을 표시한다.
renderTrains();

// 06. 요금 버튼: 실제 예약 페이지가 완성되면 임시 페이지 경로를 교체.
// 열차 목록은 스크롤 시 복제되므로 목록에 이벤트를 연결해 새 카드도 처리한다.
if (trainList) {
  trainList.addEventListener("click", (event) => {
    const fareButton = event.target.closest(".fare-button");
    if (!fareButton) return;

    const trainCard = fareButton.closest(".train-card");
    const times = trainCard.querySelectorAll(".journey-timeline time");
    const bookingUrl = new URL(
      "booking-placeholder.html",
      window.location.href,
    );
    bookingUrl.search = new URLSearchParams({
      date: selectedDateTime?.dateTime.slice(0, 10) ?? "",
      train: trainCard.querySelector(".train-logo").alt,
      departure: times[0].textContent.trim(),
      arrival: times[1].textContent.trim(),
      seat: fareButton.querySelector(".fare-label").textContent.trim(),
      price: fareButton.querySelector(".fare-price").textContent.trim(),
      passengers:
        passengerButton?.querySelector("span").textContent.match(/\d+/)?.[0] ??
        "1",
    }).toString();
    window.location.href = bookingUrl.href;
  });
}
