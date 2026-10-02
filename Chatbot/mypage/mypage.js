// 마이페이지 시안 동작
// - 아래 예시 데이터(member, tickets, history, mileageLog, coupons)로 화면을 채웁니다.
// - 탭을 누르면 해당 내용을 보여주고, 예약 승차권은 [예매 취소]로 취소 상태로 바꿀 수 있습니다.
// - 실제 서버와 연결되지 않은 시안이므로, 새로고침하면 처음 상태로 돌아갑니다.
(() => {
  /* ---------------------------------------------------------------
   * 01. 예시 데이터
   * --------------------------------------------------------------- */
  const member = {
    name: "홍길동",
    no: "1234567890",
    grade: "VIP",
    email: "hong****@example.com",
    phone: "010-****-1234",
    joined: "2021-03-15",
    mileage: 12450,
  };

  const tickets = [
    {
      id: 1,
      train: "KTX 101",
      from: "서울",
      to: "부산",
      date: "2026-10-09 (금)",
      time: "07:00 → 09:42",
      seat: "5호차 12A",
      price: 59800,
      cancelled: false,
    },
    {
      id: 2,
      train: "ITX-새마을 1003",
      from: "용산",
      to: "광주송정",
      date: "2026-10-18 (일)",
      time: "10:05 → 13:31",
      seat: "3호차 7D",
      price: 38300,
      cancelled: false,
    },
  ];

  const history = [
    { date: "2026-09-21", train: "KTX 012", route: "부산 → 서울", price: 59800, status: "이용 완료" },
    { date: "2026-09-05", train: "KTX-산천 405", route: "서울 → 강릉", price: 27600, status: "이용 완료" },
    { date: "2026-08-14", train: "ITX-청춘 2015", route: "용산 → 춘천", price: 8600, status: "환불" },
    { date: "2026-07-30", train: "KTX 105", route: "서울 → 대전", price: 23700, status: "이용 완료" },
  ];

  const mileageLog = [
    { date: "2026-09-21", desc: "KTX 승차권 구매 적립", amount: 2990 },
    { date: "2026-09-05", desc: "KTX-산천 승차권 구매 적립", amount: 1380 },
    { date: "2026-08-02", desc: "승차권 결제 시 사용", amount: -5000 },
    { date: "2026-07-30", desc: "KTX 승차권 구매 적립", amount: 1185 },
  ];

  const coupons = [
    { title: "일반열차 10% 할인", expire: "2026-12-31까지" },
    { title: "KTX 특실 무료 업그레이드", expire: "2026-12-31까지" },
  ];

  /* ---------------------------------------------------------------
   * 02. 도우미 함수
   * --------------------------------------------------------------- */
  const panel = document.getElementById("panel");
  const won = (n) => `${n.toLocaleString("ko-KR")}원`;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const makeTable = (headers, rows) => {
    const table = el("table", "table");
    const thead = el("thead");
    const tr = el("tr");
    headers.forEach((h) => tr.appendChild(el("th", "", h)));
    thead.appendChild(tr);
    const tbody = el("tbody");
    rows.forEach((cells) => {
      const row = el("tr");
      cells.forEach((cell) => {
        const td = el("td");
        if (cell instanceof Node) td.appendChild(cell);
        else td.textContent = cell;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.append(thead, tbody);
    return table;
  };

  /* ---------------------------------------------------------------
   * 03. 회원 요약 카드
   * --------------------------------------------------------------- */
  const renderSummary = () => {
    document.getElementById("member-name").textContent = member.name;
    document.getElementById("member-no").textContent = member.no;
    document.getElementById("member-grade").textContent = member.grade;
    document.getElementById("sum-mileage").textContent = `${member.mileage.toLocaleString("ko-KR")}점`;
    document.getElementById("sum-coupon").textContent = `${coupons.length}장`;
    document.getElementById("sum-ticket").textContent = `${tickets.filter((t) => !t.cancelled).length}건`;
  };

  /* ---------------------------------------------------------------
   * 04. 탭별 화면
   * --------------------------------------------------------------- */

  // 예약 승차권: 승차권 카드 + 예매 취소(확인 단계 포함)
  const renderTickets = () => {
    panel.innerHTML = "";
    panel.appendChild(el("h2", "", "예약 승차권"));

    if (!tickets.length) {
      panel.appendChild(el("p", "empty", "예약한 승차권이 없습니다."));
      return;
    }

    tickets.forEach((t) => {
      const card = el("article", `ticket${t.cancelled ? " is-cancelled" : ""}`);

      const info = el("div");
      const route = el("p", "ticket-route");
      route.append(t.from, el("span", "arrow", "→"), t.to);
      info.append(
        el("span", "ticket-train", t.train),
        route,
        el("p", "ticket-meta", `${t.date} · ${t.time} · ${t.seat}`),
      );

      const side = el("div", "ticket-side");
      side.appendChild(el("span", "ticket-price", won(t.price)));

      if (t.cancelled) {
        side.appendChild(el("span", "status", "예매 취소됨"));
      } else {
        const cancelBtn = el("button", "btn btn-danger", "예매 취소");
        cancelBtn.type = "button";
        cancelBtn.addEventListener("click", () => {
          // 확인 단계: 버튼을 [취소 확정] [아니오]로 바꿈
          const row = el("div", "confirm-row");
          const yes = el("button", "btn btn-danger", "취소 확정");
          const no = el("button", "btn", "아니오");
          yes.type = "button";
          no.type = "button";
          yes.addEventListener("click", () => {
            t.cancelled = true;
            renderSummary();
            renderTickets();
          });
          no.addEventListener("click", renderTickets);
          row.append(yes, no);
          cancelBtn.replaceWith(row);
        });
        side.appendChild(cancelBtn);
      }

      card.append(info, side);
      panel.appendChild(card);
    });
  };

  // 구입 이력: 표
  const renderHistory = () => {
    panel.innerHTML = "";
    panel.appendChild(el("h2", "", "승차권 구입 이력"));
    panel.appendChild(
      makeTable(
        ["구입일", "열차", "구간", "금액", "상태"],
        history.map((h) => [h.date, h.train, h.route, won(h.price), el("span", "status", h.status)]),
      ),
    );
  };

  // 마일리지·쿠폰: 적립/사용 내역 표 + 쿠폰 카드
  const renderMileage = () => {
    panel.innerHTML = "";
    panel.appendChild(el("h2", "", `KTX 마일리지 ${member.mileage.toLocaleString("ko-KR")}점`));
    panel.appendChild(
      makeTable(
        ["날짜", "내용", "마일리지"],
        mileageLog.map((m) => [
          m.date,
          m.desc,
          el(
            "span",
            m.amount > 0 ? "plus" : "minus",
            `${m.amount > 0 ? "+" : ""}${m.amount.toLocaleString("ko-KR")}`,
          ),
        ]),
      ),
    );

    const list = el("div", "coupon-list");
    coupons.forEach((c) => {
      const box = el("div", "coupon");
      box.append(el("strong", "", c.title), el("span", "", c.expire));
      list.appendChild(box);
    });
    panel.append(el("h2", "section-gap", "보유 할인쿠폰"), list);
  };

  // 회원정보: 정보 목록 + 버튼(시안 안내 메시지)
  const renderInfo = () => {
    panel.innerHTML = "";
    panel.appendChild(el("h2", "", "회원정보"));

    const list = el("ul", "info-list");
    [
      ["이름", member.name],
      ["회원번호", member.no],
      ["회원등급", member.grade],
      ["이메일", member.email],
      ["휴대폰", member.phone],
      ["가입일", member.joined],
    ].forEach(([label, value]) => {
      const li = el("li");
      li.append(el("span", "label", label), el("span", "", value));
      list.appendChild(li);
    });
    panel.appendChild(list);

    const actions = el("div", "info-actions");
    const toast = el("p", "toast");
    toast.hidden = true;
    ["정보 수정", "비밀번호 변경"].forEach((label) => {
      const btn = el("button", "btn", label);
      btn.type = "button";
      btn.addEventListener("click", () => {
        toast.textContent = `"${label}" 기능은 시안 화면에서는 지원하지 않아요.`;
        toast.hidden = false;
      });
      actions.appendChild(btn);
    });
    panel.append(actions, toast);
  };

  /* ---------------------------------------------------------------
   * 05. 탭 연결
   * --------------------------------------------------------------- */
  const views = {
    tickets: renderTickets,
    history: renderHistory,
    mileage: renderMileage,
    info: renderInfo,
  };

  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      views[tab.dataset.tab]();
    });
  });

  renderSummary();
  renderTickets();
})();
