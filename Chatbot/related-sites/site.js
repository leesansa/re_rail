// 관련 사이트 시안 페이지 공통 동작
// - 카드(.card)를 누르면 아래 상세 안내(#detail)에 data-title / data-detail 내용을 보여줍니다.
// - 같은 카드를 다시 누르면 상세 안내를 닫습니다.
(() => {
  const detail = document.getElementById("detail");
  if (!detail) return;

  let current = null;

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      if (current === card) {
        detail.hidden = true;
        current = null;
        return;
      }

      detail.innerHTML = "";
      const title = document.createElement("strong");
      title.textContent = card.dataset.title;
      const text = document.createElement("p");
      text.style.margin = "0";
      text.textContent = card.dataset.detail;
      detail.append(title, text);

      detail.hidden = false;
      current = card;
      detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
})();
