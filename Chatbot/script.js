// 코레일 챗봇 화면 동작
(() => {
  const body = document.body;
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const log = document.getElementById("chat-log");

  // 01. 질문별 답변 (정적 시안용 샘플 데이터)
  const answers = [
    {
      keys: ["faq", "자주"],
      text: "자주 찾는 질문입니다.\n· 승차권 환불 수수료\n· 정기승차권 이용 방법\n· 열차 지연 보상\n궁금한 항목을 입력해 주세요.",
    },
    {
      keys: ["상담내역"],
      text: "로그인 후 마이페이지에서 지난 상담내역을 확인하실 수 있습니다.",
    },
    {
      keys: ["저장된", "대화 목록"],
      text: "저장된 대화가 없습니다. 대화 중 저장한 내용이 이곳에 표시됩니다.",
    },
    {
      keys: ["정기승차권"],
      text: "정기승차권은 이용 시작일 5일 전부터 구매할 수 있으며, 유효기간 내 남은 기간에 따라 환불됩니다.",
    },
    {
      keys: ["환불", "분실", "구매", "승차권"],
      text: "승차권은 홈페이지·코레일톡·역 창구에서 구매할 수 있습니다.\n환불은 출발 시각 전후에 따라 수수료가 달라지며, 분실 시 역 창구에서 재발행 신청이 가능합니다.",
    },
    {
      keys: ["장바구니", "전달"],
      text: "장바구니에 담은 승차권은 결제 기한 내에 결제해야 하며, 결제한 승차권은 '전달하기'로 동행인에게 보낼 수 있습니다.",
    },
    {
      keys: ["지연", "운행중지"],
      text: "열차가 20분 이상 지연되면 지연 시간에 따라 운임의 일부를 보상해 드립니다. 운행중지 시 전액 환불됩니다.",
    },
    {
      keys: ["부가운임"],
      text: "승차권 없이 승차하거나 부정 승차한 경우 기준 운임 외에 부가운임이 부과됩니다.",
    },
    {
      keys: ["기념입장권"],
      text: "기념입장권은 지정된 역에서 판매하며, 승강장 입장 및 기념 소장용으로 이용하실 수 있습니다.",
    },
    {
      keys: ["테마", "여행"],
      text: "테마열차여행 상품을 안내해 드립니다. 관광열차, 계절 한정 상품 등을 레츠코레일 여행 메뉴에서 확인하세요.",
    },
    {
      keys: ["고객센터", "전화", "1544"],
      text: "철도고객센터 1544-7788 / 1588-7788 로 문의해 주세요.\n(시안 버튼 표기 번호: 1544-8787)",
    },
    {
      keys: ["교통", "편의", "시설"],
      text: "역 주변 버스·택시 승강장, 주차장, 렌터카 등 지역 교통 편의 시설 정보를 역별로 안내해 드립니다.",
    },
    {
      keys: ["마일리지", "할인"],
      text: "KTX 마일리지는 결제 금액의 일부가 적립되며, 청소년·경로·다자녀 등 다양한 할인 혜택이 있습니다.",
    },
    {
      keys: ["안녕", "hi", "hello"],
      text: "안녕하세요! 코레일 챗봇입니다. 무엇을 도와드릴까요?",
    },
  ];

  const fallback =
    "죄송합니다. 질문을 이해하지 못했어요.\n왼쪽 메뉴나 추천 질문을 선택하시거나 철도고객센터로 문의해 주세요.";

  const findAnswer = (question) => {
    const q = question.toLowerCase();
    const hit = answers.find((item) =>
      item.keys.some((key) => q.includes(key)),
    );
    return hit ? hit.text : fallback;
  };

  // 02. 메시지 출력
  const addMessage = (text, who) => {
    const el = document.createElement("p");
    el.className = `message ${who}`;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const ask = (question) => {
    const text = question.trim();
    if (!text) return;

    log.hidden = false;
    body.classList.add("chatting");
    addMessage(text, "user");

    const typing = addMessage("답변을 준비하고 있어요…", "bot typing");
    setTimeout(() => {
      typing.classList.remove("typing");
      typing.textContent = findAnswer(text);
      log.scrollTop = log.scrollHeight;
    }, 500);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(input.value);
    input.value = "";
    input.focus();
  });

  // 03. 좌측 메뉴·추천 질문 클릭 → 질문 전송
  document.querySelectorAll("[data-question]").forEach((btn) => {
    btn.addEventListener("click", () => ask(btn.dataset.question));
  });

  // 04. 전체메뉴 토글
  const menuToggle = document.querySelector(".menu-toggle");
  if (window.matchMedia("(max-width: 768px)").matches) {
    body.classList.add("menu-closed");
    menuToggle.setAttribute("aria-expanded", "false");
  }
  menuToggle.addEventListener("click", () => {
    const closed = body.classList.toggle("menu-closed");
    menuToggle.setAttribute("aria-expanded", String(!closed));
  });

  // 05. 홈: 대화 초기화
  document
    .querySelector('[data-action="home"]')
    .addEventListener("click", (e) => {
      e.preventDefault();
      log.innerHTML = "";
      log.hidden = true;
      body.classList.remove("chatting");
      input.value = "";
    });

  // 06. 관련 사이트 드롭다운
  const relatedToggle = document.querySelector(".related-toggle");
  const relatedList = document.getElementById("related-list");
  relatedToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = relatedList.hidden;
    relatedList.hidden = !open;
    relatedToggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", () => {
    relatedList.hidden = true;
    relatedToggle.setAttribute("aria-expanded", "false");
  });
})();

/* =====================================================================
 * [추가] FAQ 검색 챗봇 (faq-data.js 연동)
 * ---------------------------------------------------------------------
 * - 위쪽 기존 코드는 수정하지 않고, 이 블록만 추가했습니다.
 * - 질문 입력창(#chat-form)에 입력한 내용으로 korailFaq 배열을 검색해
 *   가장 비슷한 FAQ를 입력창 아래 "답변 박스(#answer-box)"에 보여줍니다.
 * - 답변이 나오면 추천 버튼 4개(#quick-list)는 숨기고, [돌아가기]로 복귀합니다.
 * - 기존 submit 동작(샘플 답변)과 겹치지 않도록, 문서 단계(capture)에서
 *   먼저 submit을 가로채 FAQ 검색으로 처리합니다.
 * - 왼쪽 메뉴·추천 버튼(data-question)은 기존 동작을 그대로 유지합니다.
 * ===================================================================== */
(() => {
  // faq-data.js가 연결되지 않았으면 기존 동작만 사용
  if (typeof korailFaq === "undefined") return;

  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const box = document.getElementById("answer-box");
  if (!form || !input || !box) return;

  // 01. 검색 준비: 공백·기호 제거 후 2글자 단위(bigram)로 쪼개기
  const normalize = (text) => text.toLowerCase().replace(/[^0-9a-z가-힣]/g, "");

  const toBigrams = (text) => {
    const s = normalize(text);
    const set = new Set();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    if (s.length === 1) set.add(s);
    return set;
  };

  // FAQ마다 질문·카테고리·답변의 bigram을 미리 만들어 둠
  const faqIndex = korailFaq.map((item) => ({
    item,
    q: toBigrams(item.question),
    c: toBigrams(item.category),
    a: toBigrams(item.answer),
  }));

  // 너무 흔한 글자 조합(예: "나요", "있나")은 검색에서 제외
  // → FAQ 질문 10개 이상에 들어 있는 bigram
  const gramCount = {};
  faqIndex.forEach(({ q }) =>
    q.forEach((g) => (gramCount[g] = (gramCount[g] || 0) + 1)),
  );
  const isCommon = (g) => (gramCount[g] || 0) >= 10;

  // 비슷한 말 바꾸기 (FAQ에 쓰인 단어로 맞춤) - 필요하면 여기에 추가
  const synonyms = {
    강아지: "애완용 동물",
    고양이: "애완용 동물",
    반려동물: "애완용 동물",
    인터넷: "와이파이",
    wifi: "와이파이",
    잃어버: "분실",
    취소: "환불",
    충전: "충전기 콘센트",
  };

  const expandQuery = (query) => {
    let text = query.toLowerCase();
    Object.entries(synonyms).forEach(([word, target]) => {
      if (text.includes(word)) text += ` ${target}`;
    });
    return text;
  };

  // 02. 점수 계산: 질문 일치 3점, 카테고리 2점, 답변 1점
  const searchFaq = (query) => {
    const grams = [...toBigrams(expandQuery(query))].filter((g) => !isCommon(g));
    if (!grams.length) return [];

    return faqIndex
      .map(({ item, q, c, a }) => {
        let score = 0;
        grams.forEach((g) => {
          if (q.has(g)) score += 3;
          if (c.has(g)) score += 2;
          if (a.has(g)) score += 1;
        });
        return { item, score: score / grams.length };
      })
      .filter((r) => r.score >= 1) // 너무 약한 일치는 제외
      .sort((x, y) => y.score - x.score);
  };

  // 03. 답변 박스 그리기 (시안: 로봇 아이콘 + 답변 + 돌아가기 버튼)
  const quickList = document.getElementById("quick-list");

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  // 돌아가기: 답변 박스를 닫고 추천 버튼 4개를 다시 보여줌
  const goBack = () => {
    box.hidden = true;
    box.innerHTML = "";
    if (quickList) quickList.hidden = false;
    input.focus();
  };

  // 박스 공통 틀: 왼쪽 위 로봇 아이콘 / 본문 / 오른쪽 아래 돌아가기
  const openBox = (fillBody) => {
    box.innerHTML = "";

    // 로봇 아이콘: 제목의 아이콘(.bot-icon)을 복사해서 사용
    const icon = el("div", "answer-box-icon");
    const botSvg = document.querySelector(".bot-icon");
    if (botSvg) icon.appendChild(botSvg.cloneNode(true));

    const body = el("div", "answer-box-body");
    fillBody(body);

    const back = el("button", "answer-back");
    back.type = "button";
    back.innerHTML =
      '<span>돌아가기</span><span class="answer-back-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 12 12"><path d="M9 1.5v9L2 6z" /></svg></span>';
    back.addEventListener("click", goBack);

    box.append(icon, body, back);
    box.hidden = false;
    if (quickList) quickList.hidden = true; // 추천 버튼 4개 숨김
  };

  // FAQ 하나 + 관련 질문 버튼
  const showAnswer = (item, related = []) => {
    openBox((body) => {
      body.append(
        el("span", "answer-box-cat", item.category),
        el("p", "answer-box-q", `Q. ${item.question}`),
        el("p", "answer-box-a", item.answer),
      );

      if (related.length) {
        const wrap = el("div", "answer-box-related");
        wrap.appendChild(el("span", "", "이런 질문은 어떠세요?"));
        related.forEach((r) => {
          const btn = el("button", "", r.question);
          btn.type = "button";
          btn.addEventListener("click", () => showAnswer(r));
          wrap.appendChild(btn);
        });
        body.appendChild(wrap);
      }
    });
  };

  // 찾지 못했을 때
  const showNotFound = (query) => {
    openBox((body) => {
      body.append(
        el("p", "answer-box-q", `"${query}"에 대한 답변을 찾지 못했어요.`),
        el(
          "p",
          "answer-box-a",
          "다른 단어로 다시 물어보시거나 철도고객센터(☎1588-7788)로 문의해 주세요.",
        ),
      );
    });
  };

  // 04. 질문 처리
  const answerQuery = (query) => {
    const text = query.trim();
    if (!text) return;

    const results = searchFaq(text);
    if (!results.length) {
      showNotFound(text);
      return;
    }

    // 관련 질문: 1등 점수의 절반 이상인 것만 최대 3개
    const related = results
      .slice(1)
      .filter((r) => r.score >= results[0].score / 2)
      .slice(0, 3)
      .map((r) => r.item);

    showAnswer(results[0].item, related);
  };

  // 05. 질문 입력창 연결 (기존 submit보다 먼저 실행)
  document.addEventListener(
    "submit",
    (e) => {
      if (e.target !== form) return;
      e.preventDefault();
      e.stopPropagation(); // 기존 샘플 답변 코드가 실행되지 않도록 막음
      answerQuery(input.value);
      input.value = "";
      input.focus();
    },
    true,
  );

  /* -------------------------------------------------------------------
   * 06. [추가] 왼쪽 전체메뉴 → 답변 박스로 연결
   * - 메뉴를 누르면 기존 샘플 답변(말풍선) 대신 답변 박스에 내용을 보여줍니다.
   * - faqIds: faq-data.js의 id 목록 → 질문 버튼으로 보여주고, 누르면 답변 표시
   * - text: FAQ에 없는 메뉴(상담내역 등)는 안내 문구만 표시
   * ------------------------------------------------------------------- */
  const sideMenuAnswers = {
    "자주 찾는 질문(FAQ)": {
      title: "자주 찾는 질문(FAQ)",
      text: "궁금한 분야를 선택해 주세요.",
      categories: true, // 카테고리 버튼 8개 표시
    },
    상담내역: {
      title: "상담내역",
      text: "로그인 후 마이페이지에서 지난 상담내역을 확인하실 수 있습니다.",
    },
    "저장된 대화 목록": {
      title: "저장된 대화 목록",
      text: "저장된 대화가 없습니다.\n대화 중 저장한 내용이 이곳에 표시됩니다.",
    },
    "승차권 구매/환불/분실": {
      title: "승차권 구매/환불/분실",
      text: "승차권 구매·환불·분실과 관련된 질문입니다.",
      faqIds: [13143, 13144, 24202, 13161, 13162, 13164, 13190],
    },
    "정기승차권 구매/환불": {
      title: "정기승차권 구매/환불",
      text: "정기승차권 구매·환불과 관련된 질문입니다.",
      faqIds: [13215, 13163],
    },
    "장바구니/전달하기": {
      title: "장바구니/전달하기",
      text: "승차권 전달하기와 관련된 질문입니다.",
      faqIds: [13158, 13208, 13159],
    },
    "열차지연/운행중지": {
      title: "열차지연/운행중지",
      text: "열차 지연·운행중지와 관련된 질문입니다.",
      faqIds: [13160, 13175],
    },
    "부가운임 기준": {
      title: "부가운임 기준",
      text: "부가운임과 관련된 질문입니다.",
      faqIds: [13155, 13156],
    },
    기념입장권: {
      title: "기념입장권",
      text: "기념입장권은 지정된 역에서 판매하며, 승강장 입장 및 기념 소장용으로 이용하실 수 있습니다.\n자세한 사항은 철도고객센터(☎1588-7788)로 문의해 주세요.",
    },
  };

  // 질문 버튼 목록 (누르면 해당 FAQ 답변 표시)
  const addQuestionButtons = (body, items) => {
    const wrap = el("div", "answer-box-related answer-box-menu");
    items.forEach((item) => {
      const btn = el("button", "", item.question);
      btn.type = "button";
      btn.addEventListener("click", () => showAnswer(item));
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
  };

  // 카테고리 하나의 질문 목록
  const showCategory = (category) => {
    openBox((body) => {
      body.append(
        el("span", "answer-box-cat", "자주 찾는 질문"),
        el("p", "answer-box-q", category),
      );
      addQuestionButtons(
        body,
        korailFaq.filter((f) => f.category === category),
      );
    });
  };

  const showMenu = (name) => {
    const menu = sideMenuAnswers[name];
    if (!menu) return false;

    openBox((body) => {
      body.append(
        el("span", "answer-box-cat", "전체메뉴"),
        el("p", "answer-box-q", menu.title),
        el("p", "answer-box-a", menu.text),
      );

      if (menu.faqIds) {
        const items = menu.faqIds
          .map((id) => korailFaq.find((f) => f.id === id))
          .filter(Boolean);
        addQuestionButtons(body, items);
      }

      if (menu.categories) {
        const wrap = el("div", "answer-box-related answer-box-menu");
        [...new Set(korailFaq.map((f) => f.category))].forEach((category) => {
          const btn = el("button", "", category);
          btn.type = "button";
          btn.addEventListener("click", () => showCategory(category));
          wrap.appendChild(btn);
        });
        body.appendChild(wrap);
      }
    });
    return true;
  };

  // 왼쪽 메뉴 클릭을 기존 코드보다 먼저 받아 답변 박스로 처리
  document.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest(".side-menu [data-question]");
      if (!btn) return;
      if (showMenu(btn.dataset.question)) {
        e.stopPropagation(); // 기존 샘플 답변(말풍선)이 실행되지 않도록 막음
      }
    },
    true,
  );
})();
/* ===== [추가] FAQ 검색 챗봇 끝 ===== */
