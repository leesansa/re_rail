// 코레일 챗봇 화면 동작
// 01. 기본 동작: 전체메뉴 토글 / 관련 사이트 드롭다운
(() => {
  const body = document.body;

  // 01-1. 전체메뉴 토글
  // - 페이지를 열면 왼쪽 메뉴가 접힌 상태로 시작하고, [전체메뉴]를 누를 때마다 펼치기/접기
  const menuToggle = document.querySelector(".menu-toggle");
  const sideMenu = document.getElementById("side-menu");

  // 처음 접힐 때 슬라이드 애니메이션이 보이지 않도록 잠깐 transition 끄기
  sideMenu.style.transition = "none";
  body.classList.add("menu-closed");
  menuToggle.setAttribute("aria-expanded", "false");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      sideMenu.style.transition = ""; // 이후 클릭부터는 원래 애니메이션 사용
    });
  });

  menuToggle.addEventListener("click", () => {
    const closed = body.classList.toggle("menu-closed");
    menuToggle.setAttribute("aria-expanded", String(!closed));
  });

  // 01-2. 홈: index.html의 링크(../index/main.html)로 바로 이동 (JS 처리 없음)

  // 01-3. 관련 사이트 드롭다운 (링크는 index.html에서 related-sites 폴더 페이지로 연결)
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
 * 02. FAQ 검색 챗봇 + 답변 박스 (faq-data.js 연동)
 * ---------------------------------------------------------------------
 * - 질문 입력창(#chat-form)에 입력한 내용으로 korailFaq 배열을 검색해
 *   가장 비슷한 FAQ를 입력창 아래 "답변 박스(#answer-box)"에 보여줍니다.
 * - 왼쪽 전체메뉴·추천 버튼 4개·하단바 메뉴 6개도 같은 답변 박스를 사용합니다.
 * - 답변이 나오면 추천 버튼 4개(#quick-list)는 숨기고, [돌아가기]로 복귀합니다.
 * ===================================================================== */
(() => {
  // faq-data.js가 연결되지 않았으면 검색 기능은 사용하지 않음
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

  // 05. 질문 입력창 연결
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    answerQuery(input.value);
    input.value = "";
    input.focus();
  });

  /* -------------------------------------------------------------------
   * 06. 왼쪽 전체메뉴 + 추천 버튼 4개 + 하단바 메뉴 6개 → 답변 박스로 연결
   * - 메뉴 이름(버튼의 data-question, 링크 글자)으로 아래 menuAnswers에서 내용을 찾습니다.
   * - faqIds: faq-data.js의 id 목록 → 질문 버튼으로 보여주고, 누르면 답변 표시
   * - text: FAQ에 없는 메뉴(상담내역 등)는 안내 문구만 표시
   * ------------------------------------------------------------------- */
  const menuAnswers = {
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
    // 입력창 아래 추천 버튼 4개
    테마열차여행: {
      title: "테마열차여행",
      label: "추천 질문",
      text: "관광열차, 계절 한정 상품 등 다양한 테마열차여행 상품이 있습니다.\n자세한 상품과 예약은 레츠코레일 홈페이지의 여행 메뉴에서 확인해 주세요.",
    },
    철도고객센터: {
      title: "철도고객센터",
      label: "추천 질문",
      faqId: 13191, // "철도고객센터 운영시간 및 전화번호" 답변을 바로 표시
    },
    "지역 교통 편의 시설": {
      title: "지역 교통 편의 시설",
      label: "추천 질문",
      text: "역 주변 버스·택시 승강장, 주차장, 렌터카 등 지역 교통 편의 시설 정보는 역별로 안내해 드립니다.\n이동이 불편하신 분은 아래 교통약자 서비스를 확인해 주세요.",
      faqIds: [13210],
    },
    "마일리지,할인혜택": {
      title: "마일리지·할인혜택",
      label: "추천 질문",
      text: "KTX 마일리지와 할인제도에 관련된 질문입니다.",
      faqIds: [13165, 13166, 13211, 13167, 13154, 13206, 13150, 13151, 13149],
    },
    // 하단바 메뉴 6개 (footer-links)
    이용약관: {
      title: "이용약관",
      label: "약관 및 정책",
      text: "홈페이지·앱 서비스를 이용할 때의 조건을 정한 약관입니다.\n회원 가입과 탈퇴, 회원과 공사의 권리·의무, 서비스 이용 제한 등이 담겨 있습니다.\n\n※ 시안용 요약입니다. 정확한 내용은 코레일 홈페이지 원문을 확인해 주세요.",
    },
    "여객운송약관 및 부속약관": {
      title: "여객운송약관 및 부속약관",
      label: "약관 및 정책",
      text: "열차를 이용할 때 적용되는 여객 운송 조건을 정한 약관입니다.\n운임·요금, 승차권 구입·변경·환불, 위약금, 부가운임 등이 담겨 있습니다.\n\n※ 시안용 요약입니다. 정확한 내용은 코레일 홈페이지 원문을 확인해 주세요.",
    },
    개인정보처리방침: {
      title: "개인정보처리방침",
      label: "약관 및 정책",
      text: "코레일이 개인정보를 어떻게 처리하는지 안내합니다.\n수집하는 항목과 이용 목적, 보유 기간, 제3자 제공, 이용자의 권리와 행사 방법, 개인정보 보호책임자 등이 담겨 있습니다.\n\n※ 시안용 요약입니다. 정확한 내용은 코레일 홈페이지 원문을 확인해 주세요.",
    },
    이메일무단수집거부: {
      title: "이메일무단수집거부",
      label: "약관 및 정책",
      text: "홈페이지에 게시된 이메일 주소를 자동 수집 프로그램 등으로 무단 수집하는 것을 거부합니다.\n이를 위반하면 관련 법령에 따라 처벌받을 수 있습니다.\n\n※ 시안용 요약입니다. 정확한 내용은 코레일 홈페이지 원문을 확인해 주세요.",
    },
    저작권정책: {
      title: "저작권정책",
      label: "약관 및 정책",
      text: "홈페이지에 게시된 글, 사진, 이미지 등 콘텐츠의 저작권은 한국철도공사 또는 원저작자에게 있습니다.\n허락 없이 복제·배포하는 것을 금지합니다.\n\n※ 시안용 요약입니다. 정확한 내용은 코레일 홈페이지 원문을 확인해 주세요.",
    },
    "지원 브라우저 안내": {
      title: "지원 브라우저 안내",
      label: "약관 및 정책",
      text: "· 권장 브라우저: Chrome, 삼성 인터넷, Safari\n· 권장 네트워크: 유선 인터넷 또는 LTE/5G\n· 권장 OS: Android 12.0 이상, iOS 16.0 이상\n\n※ 시안용 요약입니다. 정확한 내용은 코레일 홈페이지 원문을 확인해 주세요.",
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
    const menu = menuAnswers[name];
    if (!menu) return false;

    // 답변 하나를 바로 보여주는 메뉴 (예: 철도고객센터)
    if (menu.faqId) {
      const item = korailFaq.find((f) => f.id === menu.faqId);
      if (item) {
        showAnswer(item);
        return true;
      }
    }

    openBox((body) => {
      body.append(
        el("span", "answer-box-cat", menu.label || "전체메뉴"),
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

  // 07. 메뉴 클릭 → 답변 박스
  document.addEventListener("click", (e) => {
    // 왼쪽 메뉴 + 입력창 아래 추천 버튼 4개
    const btn = e.target.closest(
      ".side-menu [data-question], .quick-list [data-question]",
    );
    if (btn) {
      showMenu(btn.dataset.question);
      return;
    }

    // 하단바 메뉴: 사이트로 이동하지 않고 답변 박스에 표시
    const link = e.target.closest(".footer-links a");
    if (link && showMenu(link.textContent.trim())) {
      e.preventDefault(); // 링크 이동 막기
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
})();
/* ===== 02. FAQ 검색 챗봇 끝 ===== */

