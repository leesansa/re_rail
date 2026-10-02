// 추가: 바탕화면의 독립 달력을 예약 페이지의 날짜 및 인원 표시와 연결합니다.
document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.getElementById('korail-calendar-dialog');
  const $ = (id) => document.getElementById(id);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const holidays = new Set(['2026-10-03', '2026-10-05', '2026-10-09']);
  const state = {
    year: 2026, month: 10, trip: 'oneway', step: 'departure',
    departure: { year: 2026, month: 10, day: 21, hour: 18 },
    returnDate: { year: 2026, month: 10, day: 21, hour: 18 },
    people: [1, 0, 0, 0, 0, 0, 0],
  };
  const reservationDate = document.querySelector('.selected-date');
  const passengerButton = document.querySelector('.passenger-field');
  const applyDeparture = () => {
    reservationDate?.dispatchEvent(new CustomEvent('korail:date-selected', {
      detail: { ...state.departure },
    }));
  };

  // 날짜와 시간을 표시하고 두 달을 렌더링합니다.
  const dateKey = (date) => `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  const dateValue = (date) => Date.UTC(date.year, date.month - 1, date.day);
  const dateLabel = (date) => `${date.month}월 ${date.day}일(${dayNames[new Date(date.year, date.month - 1, date.day).getDay()]})`;
  const hourValue = (input, fallback) => {
    const value = Number(input.value);
    return input.value.trim() !== '' && Number.isInteger(value) && value >= 0 && value <= 23 ? value : fallback;
  };
  const updateCards = () => {
    $('cal-dep-year').textContent = `${state.departure.year}년`;
    $('cal-dep-date').textContent = dateLabel(state.departure);
    $('cal-dep-hour').value = state.departure.hour;
    $('cal-arr-year').textContent = `${state.returnDate.year}년`;
    $('cal-arr-date').textContent = dateLabel(state.returnDate);
    $('cal-arr-hour').value = state.returnDate.hour;
    $('cal-arr-card').classList.toggle('disabled', state.trip === 'oneway');
    $('cal-arr-hour').disabled = state.trip === 'oneway';
    dialog.querySelectorAll('.cal-trip-tab').forEach((tab) => {
      const active = tab.dataset.calTrip === state.trip;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
  };
  const renderMonth = (grid, heading, year, month) => {
    heading.textContent = `${year}. ${String(month).padStart(2, '0')}.`;
    grid.replaceChildren();
    const startDay = new Date(year, month - 1, 1).getDay();
    const days = new Date(year, month, 0).getDate();
    for (let index = 0; index < startDay; index++) {
      const empty = document.createElement('span');
      empty.className = 'cal-day-cell empty';
      grid.append(empty);
    }
    for (let day = 1; day <= days; day++) {
      const date = { year, month, day };
      const weekday = new Date(year, month - 1, day).getDay();
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cal-day-cell';
      cell.dataset.date = dateKey(date);
      cell.setAttribute('aria-label', `${year}년 ${month}월 ${day}일 ${dayNames[weekday]}요일`);
      if (weekday === 0) cell.classList.add('sun');
      if (weekday === 6) cell.classList.add('sat');
      if (holidays.has(dateKey(date))) cell.classList.add('holiday');
      const departure = dateKey(date) === dateKey(state.departure);
      const returning = state.trip === 'round' && dateKey(date) === dateKey(state.returnDate);
      if (departure) {
        cell.classList.add('selected');
        cell.innerHTML = `<span class="cell-num">${day}</span><span class="cell-badge">출발일</span>`;
      } else if (returning) {
        cell.classList.add('selected-arr');
        cell.innerHTML = `<span class="cell-num">${day}</span><span class="cell-badge">도착일</span>`;
      } else {
        cell.innerHTML = `<span class="cell-num">${day}</span>`;
      }
      if (state.trip === 'round' && state.step === 'return' && dateValue(date) < dateValue(state.departure)) {
        cell.classList.add('unavailable-return');
        cell.disabled = true;
      } else {
        cell.addEventListener('click', () => selectDate(date));
      }
      grid.append(cell);
    }
  };
  const renderCalendar = () => {
    renderMonth($('cal-days-left'), $('cal-heading-left'), state.year, state.month);
    const next = new Date(state.year, state.month, 1);
    renderMonth($('cal-days-right'), $('cal-heading-right'), next.getFullYear(), next.getMonth() + 1);
  };
  const selectDate = (date) => {
    state.departure.hour = hourValue($('cal-dep-hour'), state.departure.hour);
    state.returnDate.hour = hourValue($('cal-arr-hour'), state.returnDate.hour);
    if (state.trip === 'oneway' || state.step === 'departure') {
      state.departure = { ...date, hour: state.departure.hour };
      if (dateValue(state.returnDate) < dateValue(state.departure)) {
        state.returnDate = { ...date, hour: state.returnDate.hour };
      }
      if (state.trip === 'round') state.step = 'return';
    } else {
      if (dateValue(date) < dateValue(state.departure)) return;
      state.returnDate = { ...date, hour: state.returnDate.hour };
      state.step = 'departure';
    }
    updateCards();
    renderCalendar();
    // 추가: 출발일은 달력에서 누르는 즉시 예약 화면에 반영합니다.
    if (state.trip === 'oneway' || state.step === 'return') applyDeparture();
  };

  // 편도/왕복, 월 이동과 시간 입력을 연결합니다.
  dialog.querySelectorAll('.cal-trip-tab').forEach((tab) => tab.addEventListener('click', () => {
    state.trip = tab.dataset.calTrip;
    state.step = state.trip === 'round' ? 'return' : 'departure';
    if (dateValue(state.returnDate) < dateValue(state.departure)) {
      state.returnDate = { ...state.departure, hour: state.returnDate.hour };
    }
    updateCards();
    renderCalendar();
  }));
  const shiftMonth = (step) => {
    const month = new Date(state.year, state.month - 1 + step, 1);
    state.year = month.getFullYear();
    state.month = month.getMonth() + 1;
    renderCalendar();
  };
  ['cal-prev-btn', 'cal-prev-btn-2'].forEach((id) => $(id).addEventListener('click', () => shiftMonth(-1)));
  ['cal-next-btn', 'cal-next-btn-1'].forEach((id) => $(id).addEventListener('click', () => shiftMonth(1)));
  [['cal-dep-hour', 'departure'], ['cal-arr-hour', 'returnDate']].forEach(([id, key]) => {
    $(id).addEventListener('change', () => {
      state[key].hour = hourValue($(id), state[key].hour);
      $(id).value = state[key].hour;
    });
  });

  // 인원 선택은 총 1~9명으로 제한합니다.
  const rows = [...dialog.querySelectorAll('.people-row')];
  const peopleTotal = () => state.people.reduce((sum, count) => sum + count, 0);
  const renderPeople = () => {
    const total = peopleTotal();
    rows.forEach((row, index) => {
      row.querySelector('output').textContent = state.people[index];
      row.querySelector('[data-step="-1"]').disabled = state.people[index] === 0 || total <= 1;
      row.querySelector('[data-step="1"]').disabled = total >= 9;
    });
    $('people-total').textContent = total;
  };
  const closeNotes = () => {
    dialog.querySelectorAll('.people-note').forEach((note) => { note.hidden = true; });
    dialog.querySelectorAll('.people-info').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  };
  rows.forEach((row, index) => {
    row.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
      const step = Number(button.dataset.step);
      if ((step < 0 && (state.people[index] === 0 || peopleTotal() <= 1)) || (step > 0 && peopleTotal() >= 9)) return;
      state.people[index] += step;
      renderPeople();
    }));
    const info = row.querySelector('.people-info');
    if (info) {
      info.addEventListener('click', () => {
        const open = info.getAttribute('aria-expanded') !== 'true';
        closeNotes();
        if (open) {
          info.setAttribute('aria-expanded', 'true');
          $(info.getAttribute('aria-controls')).hidden = false;
        }
      });
      row.querySelector('.people-note-close').addEventListener('click', () => { closeNotes(); info.focus(); });
    }
  });

  // 열기, 닫기 및 검색 결과 표시입니다.
  document.querySelector('.calendar-button')?.addEventListener('click', () => {
    // 추가: 양옆 날짜 이동 버튼으로 바뀐 날짜를 다시 열 때 가져옵니다.
    if (reservationDate?.dateTime) {
      const [year, month, day] = reservationDate.dateTime.slice(0, 10).split('-').map(Number);
      const hour = Number(reservationDate.dateTime.slice(11, 13));
      state.departure = { year, month, day, hour: Number.isInteger(hour) ? hour : 0 };
      state.year = year;
      state.month = month;
      if (dateValue(state.returnDate) < dateValue(state.departure)) {
        state.returnDate = { ...state.departure, hour: state.returnDate.hour };
      }
    }
    updateCards();
    renderCalendar();
    renderPeople();
    closeNotes();
    dialog.showModal();
  });
  $('cal-close-btn').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  $('cal-search-confirm-btn').addEventListener('click', () => {
    state.departure.hour = hourValue($('cal-dep-hour'), state.departure.hour);
    state.returnDate.hour = hourValue($('cal-arr-hour'), state.returnDate.hour);
    // 추가: 검색하기를 누르면 시간과 탑승 인원도 예약 화면에 반영합니다.
    applyDeparture();
    if (passengerButton) {
      passengerButton.querySelector('span').textContent = `총 ${peopleTotal()}명`;
      passengerButton.setAttribute('aria-label', `탑승 인원 총 ${peopleTotal()}명`);
      const passengerInput = document.getElementById('passenger-count');
      if (passengerInput) passengerInput.value = peopleTotal();
    }
    dialog.close();
  });
  updateCards();
  renderCalendar();
  renderPeople();
});
