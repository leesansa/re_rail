// 페이지 연결 전의 임시 링크는 클릭할 수 있지만 이동하지 않는다.
document.querySelectorAll(".utility-placeholder-link").forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

// 언어 메뉴는 선택한 항목만 헤더에 표시한다.
const languageControl = document.querySelector(".utility-language-control");
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
