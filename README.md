# 🎮 멀티플레이 지뢰찾기 (Multiplayer Minesweeper)

실시간으로 친구와 대결할 수 있는 웹 기반 멀티플레이 지뢰찾기 게임입니다.

![Game Preview](https://via.placeholder.com/800x400?text=Multiplayer+Minesweeper)

## ✨ 주요 기능

- **🎯 실시간 1:1 대전**: 같은 지뢰 배치의 보드에서 상대방과 경쟁
- **👀 실시간 상태 공유**: 상대방의 진행률을 실시간으로 확인
- **🎬 관전 모드**: 진행 중인 게임을 실시간으로 관전
- **📊 게임 통계**: 승패 후 상세한 통계 확인
- **🔄 재대결**: 게임 종료 후 바로 재대결 가능

## 🎮 게임 방법

### 기본 조작
- **좌클릭**: 셀 열기
- **우클릭**: 깃발 꽂기/제거
- **더블클릭 / 휠클릭**: 주변 셀 자동 열기 (Chord)

### 승리 조건
- 상대방보다 먼저 모든 안전한 셀을 열면 승리
- 상대방이 지뢰를 밟으면 자동 승리

### 난이도
| 난이도 | 보드 크기 | 지뢰 개수 |
|--------|-----------|-----------|
| 초급 | 9 × 9 | 10 |
| 중급 | 16 × 16 | 40 |
| 고급 | 30 × 16 | 99 |

## 🚀 시작하기

### 요구 사항
- Node.js 18.x 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd mine_search_game

# 모든 의존성 설치
npm run install:all

# 또는 개별 설치
npm install
cd client && npm install
```

### 개발 모드 실행

터미널 1 - 서버:
```bash
npm run dev
```

터미널 2 - 클라이언트:
```bash
cd client && npm run dev
```

서버: http://localhost:3001
클라이언트: http://localhost:3000

### 프로덕션 빌드

```bash
# 클라이언트 빌드
cd client && npm run build

# 서버 실행
npm start
```

## 📁 프로젝트 구조

```
mine_search_game/
├── server/                    # 백엔드 서버
│   ├── index.js              # Express + Socket.IO 서버
│   └── game/
│       ├── MinesweeperGame.js # 지뢰찾기 게임 로직
│       └── RoomManager.js     # 방 관리 시스템
├── client/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameScreen.jsx
│   │   │   ├── screens/       # 각 화면 컴포넌트
│   │   │   │   ├── HomeScreen.jsx
│   │   │   │   ├── LobbyScreen.jsx
│   │   │   │   ├── PlayScreen.jsx
│   │   │   │   ├── ResultScreen.jsx
│   │   │   │   └── SpectateScreen.jsx
│   │   │   └── game/          # 게임 관련 컴포넌트
│   │   │       ├── MinesweeperBoard.jsx
│   │   │       └── OpponentPreview.jsx
│   │   ├── context/           # React Context
│   │   │   ├── SocketContext.jsx
│   │   │   └── GameContext.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── public/
├── plans/
│   └── PRD.md                 # 제품 요구사항 문서
├── package.json
└── README.md
```

## 🔧 기술 스택

### Backend
- **Node.js** - 런타임
- **Express** - 웹 프레임워크
- **Socket.IO** - 실시간 양방향 통신

### Frontend
- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Socket.IO Client** - 실시간 통신

## 📡 Socket.IO 이벤트

### 클라이언트 → 서버
| 이벤트 | 설명 |
|--------|------|
| `create-room` | 새 방 생성 |
| `join-room` | 방 참여 |
| `spectate-room` | 관전자로 입장 |
| `set-difficulty` | 난이도 설정 |
| `player-ready` | 준비 상태 토글 |
| `start-game` | 게임 시작 |
| `cell-click` | 셀 클릭 |
| `cell-flag` | 깃발 토글 |
| `cell-chord` | Chord 액션 |

### 서버 → 클라이언트
| 이벤트 | 설명 |
|--------|------|
| `room-created` | 방 생성 완료 |
| `room-joined` | 방 참여 완료 |
| `game-started` | 게임 시작 |
| `board-update` | 보드 상태 업데이트 |
| `opponent-update` | 상대방 진행 상황 |
| `game-over` | 게임 종료 및 결과 |

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- 원본 지뢰찾기 게임에 영감을 받았습니다
- Socket.IO 커뮤니티
- React 및 Tailwind CSS 팀

---

Made with ❤️ for multiplayer gaming enthusiasts
