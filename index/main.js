const banner = document.querySelector(".main-banner");
const bannerLink = banner.closest("a");

// 확대된 이미지가 배너 영역 밖으로 나오지 않도록 합니다.
bannerLink.style.display = "block";
bannerLink.style.overflow = "hidden";

banner.style.display = "block";
banner.style.transformOrigin = "center center";
banner.style.transition = "transform 0.5s ease";

function updateBanner() {
  const active = bannerLink.matches(":hover, :focus");
  banner.style.transform = active ? "scale(1.05)" : "scale(1)";
}

["mouseenter", "mouseleave", "focus", "blur"].forEach((event) => {
  bannerLink.addEventListener(event, updateBanner);
});
