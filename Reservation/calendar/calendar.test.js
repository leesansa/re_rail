const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('직접 입력한 총 인원이 달력을 열 때 반영된다', () => {
  const element = () => ({
    textContent: '', value: '', disabled: false, hidden: false,
    dataset: {}, listeners: {},
    classList: { add() {}, toggle() {} },
    addEventListener(name, handler) { this.listeners[name] = handler; },
    setAttribute() {}, append() {}, replaceChildren() {},
  });
  const ids = new Map();
  const get = (id) => {
    if (!ids.has(id)) ids.set(id, element());
    return ids.get(id);
  };
  const rows = Array.from({ length: 7 }, () => {
    const output = element();
    const decrement = element();
    const increment = element();
    decrement.dataset.step = '-1';
    increment.dataset.step = '1';
    return {
      querySelector(selector) {
        return { output, '[data-step="-1"]': decrement, '[data-step="1"]': increment }[selector] ?? null;
      },
      querySelectorAll(selector) { return selector === '[data-step]' ? [decrement, increment] : []; },
    };
  });
  const dialog = element();
  dialog.querySelectorAll = (selector) => selector === '.people-row' ? rows : [];
  dialog.showModal = () => {};
  dialog.close = () => {};
  const calendarButton = element();
  const passengerLabel = element();
  passengerLabel.textContent = '총 1명';
  const passengerButton = { querySelector: () => passengerLabel, setAttribute() {} };
  const reservationDate = { dateTime: '2026-10-21T00:00:00+09:00' };
  const document = {
    getElementById: (id) => id === 'korail-calendar-dialog' ? dialog : get(id),
    querySelector: (selector) => ({
      '.selected-date': reservationDate,
      '.passenger-field': passengerButton,
      '.calendar-button': calendarButton,
    })[selector] ?? null,
    createElement: element,
    addEventListener(name, handler) { this[name] = handler; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'calendar.js'), 'utf8'), { document, Date });
  document.DOMContentLoaded();

  passengerLabel.textContent = '총 4명';
  calendarButton.listeners.click();

  assert.equal(get('people-total').textContent, 4);
  assert.equal(rows[0].querySelector('output').textContent, 4);
  assert.equal(rows.slice(1).reduce((sum, row) => sum + Number(row.querySelector('output').textContent), 0), 0);
});
