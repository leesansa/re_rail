// 수정: 역 선택 팝업 마크업을 별도 파일로 분리합니다.
// 외부 HTML을 fetch하지 않아 Reservation.html을 file://로 열어도 동작합니다.
// defer 스크립트 순서상 지도·역 선택 초기화 전에 이 마크업이 만들어집니다.
(() => {
  const mount = document.getElementById("station-picker-mount");
  if (!mount || document.getElementById("station-dialog")) return;
  mount.insertAdjacentHTML("beforeend", `
<dialog id="station-dialog" class="custom-dialog" aria-labelledby="station-dialog-title">
      <div class="dialog-header">
        <h2 id="station-dialog-title">역 선택</h2>
        <form method="dialog">
          <button type="submit" class="dialog-close-btn" aria-label="닫기"><span class="popup-close-icon" aria-hidden="true"></span></button>
        </form>
      </div>
      <div class="dialog-body">
        <div class="station-search-box">
          <input type="text" id="station-input" aria-label="역 이름 또는 초성 검색" class="station-search-input" placeholder="역 이름 또는 초성 검색 (서울 : ㅅㅇ)" autocomplete="off" />
          <button type="button" id="station-search-apply" class="dialog-action-btn">선택</button>
        </div>

        <div class="station-results" id="station-results" hidden>
          <p class="dialog-subhead" id="station-results-title">검색 결과</p>
          <div class="popular-stations-grid station-scroll" id="station-results-list"></div>
        </div>

        <div class="station-tabs-wrap" id="station-tabs-wrap">
          <!-- 수정: 주요역·지역별·지도로 확인을 동일한 너비의 세 탭으로 배치합니다. -->
          <div class="station-tabs" role="tablist" aria-label="역 선택 방법">
            <button type="button" class="station-tab is-active" id="station-tab-major" role="tab" aria-selected="true" aria-controls="station-panel-major" tabindex="0" data-tab="major">주요역</button>
            <button type="button" class="station-tab" id="station-tab-region" role="tab" aria-selected="false" aria-controls="station-panel-region" tabindex="-1" data-tab="region">지역별</button>
            <button type="button" class="station-tab" id="station-tab-map" role="tab" aria-selected="false" aria-controls="station-panel-map" tabindex="-1" data-tab="map">지도로 확인</button>
          </div>

          <div class="station-panel" id="station-panel-major" role="tabpanel" aria-labelledby="station-tab-major">
            <div class="popular-stations-grid station-scroll" id="popular-stations"></div>
          </div>

          <div class="station-panel" id="station-panel-region" role="tabpanel" aria-labelledby="station-tab-region" hidden>
            <p class="dialog-subhead">01. 지역 선택</p>
            <div class="region-chips" id="region-chips"></div>
            <p class="dialog-subhead">02. 역 선택</p>
            <div class="popular-stations-grid station-scroll" id="region-stations"></div>
          </div>
          <!-- 수정: Reservation/region의 원본 지도와 확대·역 선택·전체 지도 기능을 같은 팝업에 통합합니다. -->
          <div class="station-panel" id="station-panel-map" role="tabpanel" aria-labelledby="station-tab-map" hidden>
            <section class="region-map" aria-label="지역별 지도">
        <!-- 추가: 선택한 지역을 중심으로 지도와 역 표식을 함께 확대하는 레이어 -->
        <div class="map-zoom-layer">
          <!-- 이미지에 포함된 윤곽선과 색상을 유지하며 지도나 지역명을 새로 그리지 않습니다. -->
          <div class="map-image-layer">
            <!-- 경기도: Figma 27:29 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-gyeonggi"
              src="station-picker/assets/map/경기도.png"
              alt="경기도"
              width="151"
              height="176"
            />
            <!-- 강원특별자치도: Figma 27:30 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-gangwon"
              src="station-picker/assets/map/강원특별자치도.png"
              alt="강원특별자치도"
              width="234"
              height="202"
            />
            <!-- 충청북도: Figma 27:31 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-chungbuk"
              src="station-picker/assets/map/충청북도.png"
              alt="충청북도"
              width="142"
              height="159"
            />
            <!-- 충청남도: Figma 27:32 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-chungnam"
              src="station-picker/assets/map/충청남도.png"
              alt="충청남도"
              width="215"
              height="139"
            />
            <!-- 경상북도: Figma 27:33 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-gyeongbuk"
              src="station-picker/assets/map/경상북도.png"
              alt="경상북도"
              width="415"
              height="251"
            />
            <!-- 전북특별자치도: Figma 27:35 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-jeonbuk"
              src="station-picker/assets/map/전북특별자치도.png"
              alt="전북특별자치도"
              width="202"
              height="112"
            />
            <!-- 대구광역시: Figma 27:36 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-daegu"
              src="station-picker/assets/map/대구광역시.png"
              alt="대구광역시"
              width="59"
              height="94"
            />
            <!-- 울산광역시: Figma 27:37 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-ulsan"
              src="station-picker/assets/map/울산광역시.png"
              alt="울산광역시"
              width="54"
              height="54"
            />
            <!-- 경상남도: Figma 27:38 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-gyeongnam"
              src="station-picker/assets/map/경상남도.png"
              alt="경상남도"
              width="169"
              height="179"
            />
            <!-- 전라남도: Figma 27:39 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-jeonnam"
              src="station-picker/assets/map/전라남도.png"
              alt="전라남도"
              width="293"
              height="196"
            />
            <!-- 서울특별시: Figma 27:41 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-seoul"
              src="station-picker/assets/map/서울특별시.png"
              alt="서울특별시"
              width="45"
              height="38"
            />
            <!-- 인천광역시: Figma 27:42 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-incheon"
              src="station-picker/assets/map/인천광역시.png"
              alt="인천광역시"
              width="229"
              height="140"
            />
            <!-- 광주광역시: Figma 27:40 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-gwangju"
              src="station-picker/assets/map/광주광역시.png"
              alt="광주광역시"
              width="43"
              height="30"
            />
            <!-- 대전광역시: Figma 27:82 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-daejeon"
              src="station-picker/assets/map/대전광역시.png"
              alt="대전광역시"
              width="35"
              height="44"
            />
            <!-- 세종특별자치시: Figma 27:83 원본 PNG와 레이어 순서 유지 -->
            <img
              class="map-region region-sejong"
              src="station-picker/assets/map/세종특별자치시.png"
              alt="세종특별자치시"
              width="32"
              height="45"
            />
            <!-- 부산광역시 1: Figma 33:4 원본 PNG, 마지막 지역 레이어의 순서 유지 -->
            <img
              class="map-region region-busan"
              src="station-picker/assets/map/부산광역시.png"
              alt="부산광역시"
              width="59"
              height="67"
            />
          </div>
          <!-- 추가: 지역을 선택하기 전에는 비어 있는 주요 역 표시 레이어 -->
          <div
            class="map-stations"
            aria-live="polite"
            aria-label="선택한 지역의 주요 역"
          ></div>
        </div>
        <!-- 추가: 확대된 지도를 원래 크기로 되돌리는 버튼 -->
        <button class="map-reset-button" type="button" hidden>전체 지도</button>
      </section>
          </div>
        </div>
      </div>
    </dialog>
  `);
})();
