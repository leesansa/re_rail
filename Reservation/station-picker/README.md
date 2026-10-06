# Reservation 역 선택 팝업

바탕화면 KorailStationPicker의 주요역·지역별·지도로 확인 기능을 Reservation의 출발역/도착역 버튼에 연결합니다.
페이지를 열면 자동으로 표시하지 않고, 역명을 누를 때만 팝업을 엽니다.
선택한 역은 팝업을 연 버튼에 반영되며, 닫으면 그 버튼으로 초점이 돌아갑니다.

- ../Reservation.js/station-picker/js/station-dialog-template.js: 별도로 분리한 팝업 마크업. 예약 화면의 station-picker-mount에 생성합니다.
- ../Reservation.js/station-picker/js/station-dialog.js: 이름/초성 검색, 탭 전환, 출발역/도착역 적용, 닫기/초점 복원.
- ../Reservation.js/station-picker/js/stations-data.js: 원본 주요역·지역별·전체 역 목록.
- ../Reservation.js/station-picker/js/map-region.js: 원본 지도 호버, 투명 여백 제외, 확대, 역 선택, 전체 지도.
- ../Reservation.js/station-picker/js/map-region-mask-data.js: 원본 PNG의 투명 영역 판별 데이터.
- css/station-dialog.css: 팝업 헤더부터 아래 순서의 외부 스타일.
- css/map-region.css: 원본 지도 배치와 상호작용 스타일.
- `../../assets/`: Korail 글꼴과 `map/`의 지역 지도 이미지 16개.

`../Reservation.html/Reservation.html`은 외부 CSS를 link로 연결하고, 마크업/데이터/지도/선택 동작 순으로 defer 스크립트를 연결합니다.
HTML을 fetch하지 않으므로 로컬 파일로 열어도 동작합니다. 폴더 전체를 함께 유지해 주세요.
변경하거나 새로 연결한 부분은 수정/추가 주석으로 표시했습니다.

검증: Reservation 폴더에서 node --test Reservation.js/*.test.js Reservation.js/calendar/*.test.js
