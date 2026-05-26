# Focustone DAW — Drum Beat Maker 화면 생성 프롬프트

> VS Code의 AI 어시스턴트(Claude, Copilot, Cursor 등)에 아래 프롬프트 전체를 붙여 넣으세요.
> 한 번에 4개의 파일을 생성합니다.

---

## 📋 프롬프트 (여기서부터 복사)

웹 브라우저 기반 DAW(Digital Audio Workstation) 앱 **"Focustone DAW"** 의
**Drum Beat Maker 화면**을 HTML + React(Babel inline) + Tailwind CSS + Web Audio API 로 만들어줘.

별도의 빌드 도구 없이 **그냥 더블클릭으로 열리는 단일 HTML 페이지**여야 해.

---

### 1. 파일 구성 (반드시 이 4개 파일로 분리)

```
Drum Beat Maker.html      ← 루트, 폰트/Tailwind/스크립트 로드
drum-engine.js            ← Vanilla JS, Web Audio 드럼 합성 엔진
components.jsx            ← Babel JSX, 모든 React 컴포넌트
app.jsx                   ← Babel JSX, App 본체 + ReactDOM 렌더
```

- `components.jsx` 마지막에 `Object.assign(window, { ... })` 으로 모든 컴포넌트를 전역에 노출
  (Babel script들끼리 스코프가 분리되어 있기 때문)
- 스타일 객체 이름이 충돌하지 않도록 inline style 위주로 작성

---

### 2. 사용 라이브러리 (반드시 이 버전, integrity 포함)

```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">

<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"
  integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L"
  crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"
  integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm"
  crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"
  integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y"
  crossorigin="anonymous"></script>
```

---

### 3. 디자인 시스템

**컬러 (Tailwind config에 등록)**

| 토큰 | 값 | 용도 |
|---|---|---|
| `surface-dim` | `#0c0c0e` | 최하단 배경 |
| `surface` | `#131315` | 카드 배경 |
| `surface-container` | `#1b1a1d` | 컨테이너 |
| `primary` | `#dbfcff` | primary 변형 |
| `primary-container` | `#00f0ff` | **cyan accent (메인)** |
| `secondary` | `#a7ffb3` | **mint accent (보조)** |
| `secondary-container` | `#00ee70` | mint 강조 |
| `on-surface` | `#e5e1e4` | 본문 텍스트 |
| `on-surface-variant` | `#b9cacb` | 보조 텍스트 |
| `outline` | `#849495` | 보더 |
| `outline-variant` | `#3b494b` | 약한 보더 |

**그라데이션**
- Primary 액션: `linear-gradient(135deg,#7df4ff 0%,#00f0ff 60%,#00dbe9 100%)` + cyan glow
- Success 액션: `linear-gradient(135deg,#a7ffb3 0%,#00ee70 100%)` + mint glow
- 카드 배경: `linear-gradient(160deg, rgba(32,31,33,.85), rgba(14,14,16,.85))`
- 앰비언트: 화면 좌상단 cyan, 우하단 mint radial gradient (각 6% 알파)

**폰트**

| 패밀리 | 용도 |
|---|---|
| `Space Grotesk` (300–900) | display, mono-data, heading |
| `Inter` (400–700) | body, label-caps |
| `Material Symbols Outlined` | 아이콘 (FILL/wght variation 사용) |

라벨에 `font-label-caps text-[10–11px] tracking-widest uppercase` 일관 적용.
숫자 표시에 `font-mono-data` 사용.

**모양**
- 카드: `rounded-2xl border border-white/5`
- 버튼: `rounded-lg`
- 글로우는 `box-shadow: 0 0 N px <color>/.4` 패턴
- 모든 액티브 상태는 컬러 + textShadow/boxShadow 동시 적용

---

### 4. 레이아웃 (1440×1024 기준)

```
┌──────────────────────────────────────────────────────────────┐
│  TopBar (h-14)  [Focustone DAW logo] [nav]      [⚙ ? Export] │
├────────┬─────────────────────────────────────────────────────┤
│ SideNav│  PageHeader (Drum Beat Maker · BPM · Preview)       │
│ (240px)│                                                     │
│        │  ┌─────────────────────────────┬─────────────────┐  │
│        │  │  Sequencer Card (col 9)     │ Right (col 3)   │  │
│        │  │   ▸ Step markers (1–16)     │ ┌──────────┐   │  │
│        │  │   ▸ 6+ track rows           │ │ Channel  │   │  │
│        │  │   ▸ + Add Instrument        │ │ Inspector│   │  │
│        │  │   ▸ keyboard hint footer    │ ├──────────┤   │  │
│        │  │                             │ │Sequencer │   │  │
│        │  ├──────────┬──────────────────┤ │ Settings │   │  │
│        │  │ Peak     │ RMS │ Master Buss│ ├──────────┤   │  │
│        │  └──────────┴─────┴────────────┘ │ Pattern  │   │  │
│        │                                  │ Bank A–D │   │  │
│        │                                  └──────────┘   │  │
├────────┴─────────────────────────────────────────────────────┤
│  Transport (h-92): Position | Tempo | ⏮ ⏹ [▶ 56px] ⏺ ⟲ ⏱ | CPU │
└──────────────────────────────────────────────────────────────┘
```

---

### 5. 각 컴포넌트 상세 요구사항

#### 5.1 TopBar
- 좌측: `FocustoneMark` SVG (cyan→mint 그라데이션 F-tone 글리프) + "Focustone" 워드마크(그라데이션 텍스트) + `DAW` 캡션
- 가운데: nav 링크 (Project / Library / Automation) — 작은 uppercase 라벨
- 우측: settings · help 아이콘 버튼 + **Export 버튼** (cyan 그라데이션, 글로우)

#### 5.2 SideNav (240px)
- 상단 "Studio Session" + 현재 BPM 표시
- 메뉴 4개: Beat Maker (active, cyan 좌측 보더), BPM Analysis, Sample Library, Focustone AI
- 하단 "+ New Pattern" 버튼 + Settings 링크
- 모든 라벨은 uppercase tracking-wide

#### 5.3 PageHeader
- "Drum Beat Maker" h1 (Space Grotesk Bold 34px)
- 메타 row: 🟢 Beat-Sync Active · 📏 {stepsPerBar} Steps · {bars} Bar(s) · 𝄞 {signature}
- 우측 BPM 카드: 숫자 입력 가능한 cyan glowing BPM + "Preview with Track" 버튼
  - 재생 중이면 mint 그라데이션으로 전환

#### 5.4 StepMarkers (시퀀서 상단 ruler)
- 좌측 268px 빈 공간 (트랙 헤더 폭과 동일)
- 16/32/64개 점 또는 숫자, 비트 시작 위치만 밝게 강조
- 바 시작은 더 진하게, 현재 playStep은 cyan textShadow

#### 5.5 TrackRow
- 좌측 252px 헤더 영역:
  - 트랙 색상 막대 (1×9px, 글로우)
  - 트랙 이름 (Space Grotesk Medium 13px)
  - 하단 row: **M** (mute, on=빨강 글로우) / **S** (solo, on=노랑 글로우) / 🔊 + 볼륨 슬라이더
  - 호버 시 우상단 X (제거)
- 우측 그리드:
  - `repeat({totalSteps}, 1fr)` aspect-square 패드
  - **on/off**: 클릭 토글
  - **우클릭**: 벨로시티 순환 (110 → 60 → 110 → 80 → 40)
  - 활성 셀: 트랙 컬러 그라데이션 + 글로우 + 하단 velocity 막대
  - 현재 playStep은 scale(1.08) + 더 강한 글로우
  - 4비트마다 미세하게 배경 톤 차이
  - Bar 경계 셀에는 좌측 cyan 1px 보더

#### 5.6 AddInstrument (드롭다운)
- 점선 보더 버튼 "+ Add Instrument"
- 클릭 시 8가지 드럼 라이브러리 팝오버:
  - Kick · Snare Core · Hi-Hat Closed · Hi-Hat Open · Clap · Low Tom · Perc Click · Rim Shot
- 각 항목 좌측 컬러 막대로 식별

#### 5.7 ChannelInspector (우측 첫 카드)
- 선택된 트랙 정보 + voice 코드
- Gain (volume → -24..+6 dB 환산) / Velocity (0–127) / Panning (-1..+1, L/R 표기)
- 모든 슬라이더는 트랙 컬러로 thumb 글로우

#### 5.8 SequencerSettings (우측 두 번째 카드) ⭐ 중요
- **Steps / Bar**: 8 · 16 · 32 (세그먼트 버튼, 1/8 1/16 1/32 노트 캡션)
- **Bars**: 1 · 2 · 4 · 8 (`bars × stepsPerBar` 표시)
- **Time Signature**: 3/4 · 4/4 · 6/8 · 7/8
- **Swing**: 0–50% 슬라이더 (mint 컬러)
- **Quantize Input**: 토글 스위치 (cyan 그라데이션)
- 우상단에 현재 총 step 수 표시
- 값 변경 시 시퀀서 그리드 즉시 리사이즈 (기존 패턴 보존, 길어지면 0 패딩 / 짧아지면 잘림)

#### 5.9 Pattern Bank (우측 세 번째 카드)
- A/B/C/D 4개의 정사각 슬롯 (A는 active cyan, 나머지는 dim)
- 우상단 "Save" 버튼 → 모달 오픈

#### 5.10 Meters + Master
- Peak / RMS 미터 (-60..+3 dB 매핑, 세로 막대 + 숫자)
- Master Buss 카드: 우측에 32개 막대로 fake spectrum 애니메이션 (cyan/mint/orange)

#### 5.11 TransportBar (하단 h-92)
- 좌측: **Position** `bar.beat.step` (cyan glow) + **Tempo** BPM
- 가운데:
  - ⏮ Rewind · ⏹ Stop (icon-text 조합)
  - **🔘 큰 원형 Play 버튼 (56px, cyan 그라데이션, 글로우, 재생 중엔 mint + ping animation ring)**
  - ⏺ Record (빨강) · ⟲ Loop (mint) · ⏱ Metronome (yellow)
- 우측: "Engine · Stable · 14% CPU" 상태

#### 5.12 모달 (Save / Export)
- Backdrop blur + 카드 그라데이션
- Save: 패턴 이름 입력 + 메타 표시
- Export: WAV(권장) / MIDI / Stems / Focustone Pattern(.fpatt) 라디오 선택

#### 5.13 Toast
- 화면 하단 중앙, cyan glass-morphism
- 액션 후 1.5–2초간 표시

---

### 6. Web Audio Drum Engine (`drum-engine.js`)

8가지 보이스를 **샘플 파일 없이** 합성으로 만들 것:

| voice | 합성 방식 |
|---|---|
| **kick** | sine 140Hz → 38Hz 지수 감쇠 + triangle 2200Hz 클릭 레이어 |
| **snare** | high-pass 1200Hz noise burst + triangle 220→160Hz body |
| **hihat** | high-pass 7000Hz noise burst, 45ms decay |
| **openhat** | high-pass 6000Hz noise burst, 280ms decay |
| **clap** | band-pass 1500Hz noise 3-burst + 200ms tail |
| **tom** | sine 220→110Hz 지수 감쇠 |
| **perc** | square 880→560Hz short blip |
| **rim** | square 320Hz, 40ms |

전역 API:
```js
window.DrumEngine = {
  resume(),        // Audio context 활성화 (사용자 제스처 후)
  now(),           // audioContext.currentTime
  trigger(voice, when, velocity, gain),
  setMasterVolume(v),
  getLevels(),     // { peak: dB, rms: dB } — AnalyserNode로 측정
  voices: [...]
};
```

마스터 출력 전에 AnalyserNode를 두고 `requestAnimationFrame`으로 peak/rms 갱신.

---

### 7. 스케줄러 (App 내부 `useScheduler` 훅)

look-ahead 알고리즘 사용:
- `setInterval(25ms)` 로 깨어나서, 다음 120ms 안에 도달할 step들을 미리 스케줄
- `60 / bpm / stepsPerBeat` 초 = 1 step 시간
- **swing**: 홀수 step (off-beat) 에 `swing% × 0.5 × stepSec` 만큼 지연
- 솔로 트랙 있으면 나머지는 muted 처리
- 각 step의 시각적 하이라이트는 해당 audio time에 맞춰 `setTimeout` 으로 UI 업데이트
- 정지 시 stepRef = 0, playStep = -1

---

### 8. 인터랙션 명세

| 행동 | 결과 |
|---|---|
| 스텝 셀 클릭 | on/off 토글 + on 시 즉시 사운드 미리듣기 |
| 스텝 셀 우클릭 | velocity 순환 (높음→중간→낮음) |
| Preview / Big Play 버튼 | 재생/일시정지 |
| Stop | 재생 정지 + step 0 |
| BPM 입력 변경 | 실시간 템포 변경 |
| M 버튼 | 트랙 음소거 (재생 시 패드는 35% 투명) |
| S 버튼 | 솔로 (다른 트랙 자동 음소거) |
| 볼륨 슬라이더 | gain 즉시 반영 |
| Inspector Gain/Vel/Pan | 즉시 반영 |
| Steps/Bar, Bars 변경 | 그리드 리사이즈, 패턴 0-padding |
| Swing 슬라이더 | 재생 중에도 실시간 swing 적용 |
| + Add Instrument | 트랙 추가, 자동 선택 |
| X 호버 클릭 | 트랙 제거 |
| Save 버튼 / Export 버튼 | 모달 오픈 |

---

### 9. 기본 패턴 (8/8 그루브)

- Kick: 1, 5, 9, 13 (4-on-the-floor)
- Snare: 5, 13 (백비트) + 16 (ghost)
- Hi-Hat Closed: 1,3,5,7,9,11,13,15 (8분음표)
- Hi-Hat Open: 15
- Clap: 5, 13
- Tom: 16 (fill)

---

### 10. 코드 품질 규칙

- 모든 컴포넌트는 함수형 + Hooks
- TypeScript 아니라 plain JSX
- inline style 적극 사용 (Tailwind로 표현 안 되는 그라데이션/glow)
- props drilling 허용 (Context 안 씀)
- ref는 scheduler에서 최신 state 참조용으로만
- 콘솔 에러 0
- 1440×1024 / 1280×800 모두 안정적으로 표시

---

### 11. 시작 명령

위 명세대로 `Drum Beat Maker.html` / `drum-engine.js` / `components.jsx` / `app.jsx` 4개 파일을 생성해 줘.
완성 후 `Drum Beat Maker.html` 을 열면 6트랙 기본 패턴이 로드되고, Play 버튼을 누르면 실제 드럼 사운드가 재생되어야 해.

## 📋 (여기까지 복사)
