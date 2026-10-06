// 열차 카드 원본 데이터: HTML의 li 내용은 이 배열에서 생성한다.
// 서대구 정차 열차는 환승 없이 운행하므로 직통과 경유 조건에 모두 포함한다.
const trainCatalog = (() => {
  const trains = [
    {
      id: "ktx-0513",
      type: "KTX",
      logo: "../../assets/아이콘/아이콘_코레일21.png",
      logoWidth: 66,
      departure: "05:13",
      arrival: "07:50",
      duration: "2시간 37분 소요",
      routes: ["직통"],
      stop: null,
      fares: {
        일반석: { label: "일반실", price: "40,400원", discount: "25%할인" },
        특실: { label: "특실", price: "64,900원", discount: "운임 25%할인" },
      },
    },
    {
      id: "ktx-0527",
      type: "KTX",
      logo: "../../assets/아이콘/아이콘_코레일21.png",
      logoWidth: 66,
      departure: "05:27",
      arrival: "08:16",
      duration: "2시간 49분 소요",
      routes: ["직통"],
      stop: null,
      fares: {
        일반석: { label: "일반실", price: "40,200원", discount: "25%할인" },
        특실: { label: "특실", price: "64,700원", discount: "운임 25%할인" },
      },
    },
    {
      id: "itx-0554",
      type: "ITX 새마을",
      logo: "../../assets/아이콘/아이콘_코레일22.png",
      logoWidth: 85,
      departure: "05:54",
      arrival: "11:09",
      duration: "5시간 15분 소요",
      routes: ["직통"],
      stop: null,
      fares: {
        일반석: { label: "일반실", price: "42,600원", discount: null },
        특실: null,
      },
    },
    {
      id: "ktx-0558",
      type: "KTX",
      logo: "../../assets/아이콘/아이콘_코레일21.png",
      logoWidth: 66,
      departure: "05:58",
      arrival: "08:03",
      duration: "2시간 45분 소요",
      routes: ["직통", "경유"],
      stop: "서대구역 정차",
      fares: {
        일반석: { label: "일반실", price: "40,000원", discount: "25%할인" },
        특실: { label: "특실", price: "64,300원", discount: "운임 25%할인" },
      },
    },
    {
      id: "ktx-sancheon-0603",
      type: "KTX 산천",
      logo: "../../assets/아이콘/아이콘_코레일23.png",
      logoWidth: 92,
      departure: "06:03",
      arrival: "08:51",
      duration: "2시간 37분 소요",
      routes: ["직통"],
      stop: null,
      fares: {
        일반석: { label: "일반실", price: "53,600원", discount: "25%할인" },
        특실: { label: "특실", price: "78,100원", discount: "운임 25%할인" },
      },
    },
  ];

  // 세 조회 조건을 동시에 적용한다. 없는 좌석/운행 방식/열차 종류는 빈 배열을 반환한다.
  const filter = (filters) =>
    trains.filter(
      (train) =>
        Boolean(train.fares[filters.seat]) &&
        train.routes.includes(filters.route) &&
        (filters.type === "전체" || train.type === filters.type),
    );

  return { trains, filter };
})();

if (typeof module !== "undefined") module.exports = trainCatalog;
