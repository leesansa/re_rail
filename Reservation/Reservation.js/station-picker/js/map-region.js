// 수정: 지도 변수와 함수는 팝업의 기존 역 선택 코드와 충돌하지 않도록 분리합니다.
document.addEventListener("DOMContentLoaded", () => {
  // 투명 PNG의 실제 지역 부분만 hover 및 클릭 대상으로 취급합니다.
  const regionMap = document.querySelector(".region-map");
  const zoomLayer = regionMap.querySelector(".map-zoom-layer");
  const regionImages = [...regionMap.querySelectorAll(".map-region")];
  const stationLayer = regionMap.querySelector(".map-stations");
  const resetButton = regionMap.querySelector(".map-reset-button");
  const regionMasks = new Map();
  let selectedRegion = null;
  let currentZoom = 1;
  
  // 추가: 좌표는 기존 지도 원본 크기(1265 × 731)를 기준으로 둡니다.
  const majorStations = {
    경기도: [
      ["광명", 483, 227],
      ["수원", 505, 261],
    ],
    강원특별자치도: [
      ["강릉", 689, 168],
      ["동해", 711, 235],
      ["원주", 585, 246],
      ["정동진", 705, 198],
    ],
    충청북도: [
      ["오송", 552, 322],
      ["제천", 626, 286],
    ],
    충청남도: [
      ["천안아산", 476, 326],
      ["공주", 470, 376],
    ],
    경상북도: [
      ["안동", 682, 325],
      ["김천구미", 633, 405],
      ["경주", 742, 431],
    ],
    전북특별자치도: [
      ["익산", 487, 424],
      ["전주", 531, 448],
      ["정읍", 458, 472],
    ],
    대구광역시: [
      ["대구", 655, 408],
      ["동대구", 674, 414],
      ["서대구", 645, 438],
    ],
    울산광역시: [["울산", 735, 478]],
    경상남도: [
      ["밀양", 681, 496],
      ["마산", 638, 532],
      ["진주", 593, 535],
    ],
    전라남도: [
      ["목포", 387, 574],
      ["나주", 445, 551],
      ["순천", 542, 558],
      ["여수EXPO", 549, 617],
    ],
    서울특별시: [
      ["서울", 502, 207],
      ["용산", 492, 217],
    ],
    인천광역시: [["인천", 434, 235]],
    광주광역시: [["광주송정", 485, 508]],
    대전광역시: [
      ["대전", 552, 363],
      ["서대전", 543, 377],
    ],
    세종특별자치시: [["조치원", 536, 330]],
    // 부산광역시: 원본 지도 윤곽 안에 부산·구포역을 배치하고 공통 선택 기능을 사용합니다.
    부산광역시: [
      ["부산", 715, 512],
      ["구포", 711, 501],
    ],
  };
  
  // 추가: PNG에서 미리 계산한 비트 마스크로 file://에서도 지역의 투명 여백을 제외합니다.
  function prepareRegionMask(image) {
    const regionClass = [...image.classList].find((name) =>
      name.startsWith("region-"),
    );
    const encoded = window.regionMaskData[regionClass];
    regionMasks.set(
      image,
      Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0)),
    );
  }
  
  function regionAt(clientX, clientY) {
    for (const image of [...regionImages].reverse()) {
      const rect = image.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX >= rect.right ||
        clientY < rect.top ||
        clientY >= rect.bottom
      )
        continue;
      const mask = regionMasks.get(image);
      if (!mask) continue;
      const width = Number(image.getAttribute("width"));
      const height = Number(image.getAttribute("height"));
      const x = Math.min(
        width - 1,
        Math.floor(((clientX - rect.left) / rect.width) * width),
      );
      const y = Math.min(
        height - 1,
        Math.floor(((clientY - rect.top) / rect.height) * height),
      );
      const pixel = y * width + x;
      if (mask[pixel >> 3] & (1 << (pixel & 7))) return image;
    }
    return null;
  }
  
  // 추가: 지역의 원본 좌표를 기준으로 확대해, 역 표식도 같은 위치를 따라가게 합니다.
  function zoomToRegion(image) {
    // 부산의 가까운 두 역은 작은 화면에서도 겹치지 않도록 원본 기준 확대 크기를 유지합니다.
    const zoomLimit =
      image.alt === "부산광역시"
        ? Math.max(3, (3 * 1265) / regionMap.clientWidth)
        : 3;
    const zoom = Math.min(
      zoomLimit,
      Math.max(1.6, (regionMap.clientWidth * 0.45) / image.offsetWidth),
    );
    const centerX = image.offsetLeft + image.offsetWidth / 2;
    const centerY = image.offsetTop + image.offsetHeight / 2;
    const translateX = regionMap.clientWidth / 2 - centerX * zoom;
    const translateY = regionMap.clientHeight / 2 - centerY * zoom;
    currentZoom = zoom;
    zoomLayer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoom})`;
    stationLayer.querySelectorAll(".map-station").forEach((marker) => {
      marker.style.setProperty(
        "--marker-scale",
        (marker.classList.contains("is-selected") ? 1.18 : 1) / currentZoom,
      );
    });
  }
  
  // 추가: 역 버튼은 지도 배율과 관계없이 읽기 좋은 크기로 유지하고, 선택한 역만 키웁니다.
  function selectStation(marker) {
    stationLayer.querySelectorAll(".map-station").forEach((station) => {
      const selected = station === marker;
      station.classList.toggle("is-selected", selected);
      station.setAttribute("aria-pressed", String(selected));
      station.style.setProperty(
        "--marker-scale",
        (selected ? 1.18 : 1) / currentZoom,
      );
    });
    // 수정: 지도에서 선택한 역을 목록과 동일한 결과 표시·팝업 닫기 흐름에 전달합니다.
    document.dispatchEvent(new CustomEvent("korail:station-selected", {
      detail: { station: marker.textContent },
    }));
  }
  
  function showStations(image) {
    selectedRegion = image;
    regionImages.forEach((region) =>
      region.classList.toggle("is-selected", region === image),
    );
    stationLayer.replaceChildren();
    for (const [name, x, y] of majorStations[image.alt] || []) {
      const marker = document.createElement("button");
      marker.className = "map-station";
      marker.type = "button";
      marker.style.left = `${(x / 1265) * 100}%`;
      marker.style.top = `${(y / 731) * 100}%`;
      marker.textContent = name;
      marker.setAttribute("aria-pressed", "false");
      marker.addEventListener("click", (event) => {
        event.stopPropagation();
        selectStation(marker);
      });
      stationLayer.append(marker);
    }
    stationLayer.setAttribute("aria-label", `${image.alt} 주요 역`);
    resetButton.hidden = false;
    zoomToRegion(image);
  }
  
  // 추가: 전체 지도 버튼을 누르면 확대와 역 선택을 함께 초기화합니다.
  function resetMap() {
    selectedRegion = null;
    currentZoom = 1;
    zoomLayer.style.transform = "";
    regionImages.forEach((image) =>
      image.classList.remove("is-selected", "is-hovered"),
    );
    stationLayer.replaceChildren();
    stationLayer.setAttribute("aria-label", "선택한 지역의 주요 역");
    resetButton.hidden = true;
    regionMap.classList.remove("is-over-region");
  }
  
  // 지도 지역에 포인터 및 키보드 이벤트를 연결합니다.
  for (const image of regionImages) {
    image.setAttribute("role", "button");
    image.setAttribute("tabindex", "0");
    image.setAttribute("aria-label", `${image.alt} 주요 역 보기`);
    prepareRegionMask(image);
    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      showStations(image);
    });
  }
  
  regionMap.addEventListener("pointermove", (event) => {
    const hovered = regionAt(event.clientX, event.clientY);
    regionImages.forEach((image) =>
      image.classList.toggle("is-hovered", image === hovered),
    );
    regionMap.classList.toggle("is-over-region", Boolean(hovered));
  });
  regionMap.addEventListener("pointerleave", () => {
    regionImages.forEach((image) => image.classList.remove("is-hovered"));
    regionMap.classList.remove("is-over-region");
  });
  regionMap.addEventListener("click", (event) => {
    const image = regionAt(event.clientX, event.clientY);
    if (image) showStations(image);
  });
  resetButton.addEventListener("click", (event) => {
    event.stopPropagation();
    resetMap();
  });
  window.addEventListener("resize", () => {
    if (selectedRegion) zoomToRegion(selectedRegion);
  });
  
  // 수정: 지도 탭을 다시 열면 전체 지도로 시작합니다.
  document.addEventListener("korail:map-reset", resetMap);
});
