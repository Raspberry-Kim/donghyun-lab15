# 동현닥™: 출처·이용 안내

동현닥은 1990년 Nintendo R&D1의 퍼즐 게임 「닥터 마리오(Dr. Mario)」(닌텐도 패미컴·게임보이 · Nintendo 발매)의 **뼈대**에서 영감을 받은 비상업적 취미 작품이다. 닥터 마리오와 마리오는 Nintendo의 상표이며 권리도 Nintendo에 있다. 동현닥은 이들과 관계가 없고 승인도 받지 않았다.

## 원작에서 가져온 것

- 뼈대만 참고했다: 병 안의 바이러스 위로 두 칸짜리 알약을 떨어뜨려 같은 색 넷을 가로·세로로 이어 없애는 것, 바이러스를 다 없애면 다음 단계로 가는 것, 받침을 잃은 알약이 떨어져 연쇄가 나는 것, 속도 셋(느림·보통·빠름).
- 다르게 만들었다: 1인용, 단계 20으로 끝이 있음, 동현랭으로 고르는 속도·바이러스 단계·깔린 알약, 알약 모양 셋(캡슐·태블릿·주사기), 단계 보너스, 닥터를 포동이로, 바이러스를 새 도트 얼굴로, 시리즈 플레이그라운드에 맞춘 색, 저장·불러오기, 전체 화면, 게임패드.
- 원작 게임의 그림·음악·효과음·글·코드는 하나도 쓰지 않았다. 원작 파일과 그 일부는 이 저장소에 없고, 원작 파일에서 그림이나 자료를 꺼내 쓰지도 않았다.
- 구체적인 수치(병 크기·낙하 간격·점수·바이러스 수와 줄·던지기 시간)는 공개 자료의 설명을 참고하되 모두 동현닥이 정한 것이다.

## 동현닥이 새로 만든 것

- 게임 엔진(`src/engine.js`: 판·던지기·옮기기·회전·굳기·지움·떨어지기·연쇄·점수·단계 진행), 화면(`src/render.js`), 조작·메뉴·저장(`src/app.js`), 동현랭 출전 규약과 예제(`src/examples.js`), 문서, 시험.
- 바이러스 얼굴 셋(`src/sprites.js`)은 9×9 도트 두 프레임으로 새로 그렸다.
- 게임 속 닥터 포동이는 [동현크](https://github.com/Raspberry-Kim/donghyun-lab9)의 `src/sprites.js`에 있는 `P_idle` 24×20 도트와 W/G/K/R/E 색을 그대로 가져왔다. 동현닥에서 꼬리·머리·앞발·뒷발 던지기 동작을 붙였다. 시리즈 공통 머리글 아이콘은 그대로다.
- 동현랭 실행기(`src/donghyun.js`)는 [동현랭 저장소](https://github.com/Raspberry-Kim/donghyun-lang)의 v1.55를 고치지 않고 썼다. 합성 효과음(`src/sfx.js`)과 게임패드(`src/gamepad.js`), 편집기·전체 화면·저장 메뉴는 동현램·동현큐의 방식을 따랐다.

## 포동이

포동이의 모습과 이름(도트와 머리글 그림 포함)에 대한 권리는 MIT 코드 라이선스와 별개로 만든 사람에게 있다. 코드를 가져다 쓸 때 이 그림과 이름은 바꿔 쓰기를 권한다.

## 참고한 자료

- Dr. Mario — Wikipedia: https://en.wikipedia.org/wiki/Dr._Mario
- 닥터마리오 — 위키백과: https://ko.wikipedia.org/wiki/닥터마리오
- Dr. Mario Releases — MobyGames: https://www.mobygames.com/game/6116/dr-mario/releases/

## 글꼴

검은고딕 Black Han Sans · Pretendard · 나눔고딕코딩 — SIL Open Font License 1.1 (`licenses/`).

## 라이선스

동현닥 코드·문서: MIT (`LICENSE`). 동현랭 실행기: MIT (`licenses/DONGHYUN-MIT.txt`).
