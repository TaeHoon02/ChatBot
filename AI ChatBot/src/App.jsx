import { useState, useRef, useEffect } from "react";

function App() {
  // 1. 기존 상태들
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "안녕하세요! 경증 지체 장애인을 위한 맞춤형 일자리 찾기 도우미입니다.\n\n어떤 분야의 취업에 관심이 있으신가요? 아래 버튼을 누르시거나 직접 입력해 주세요.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ▼ [새로 추가된 부분] 3가지 드롭다운 선택값을 저장할 상태
  const [region, setRegion] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [jobType, setJobType] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ▼ [새로 추가된 부분] 맞춤 검색 폼 제출 시 실행되는 함수
  const handleFilterSubmit = (e) => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지
    if (isLoading) return;

    // 선택된 값들을 모아서 하나의 검색어로 만듭니다.
    const filterQuery = `[맞춤 검색] 지역: ${region || "전체"}, 기업분류: ${companyType || "전체"}, 직종: ${jobType || "전체"}`;

    // 아래에 있는 기존 sendMessage 함수를 호출해서 백엔드로 보냅니다.
    sendMessage(filterQuery);
  };

  // 2. 백엔드 통신 함수 (기존과 동일)
  const sendMessage = async (text = null) => {
    const messageToSend = text || inputValue.trim();
    if (messageToSend === "") return;
    if (isLoading) return;

    setMessages((prev) => [...prev, { sender: "user", text: messageToSend }]);
    setInputValue("");
    setIsLoading(true);

    try {
      // ⚠️ 나중에 백엔드 API 주소로 변경할 곳
      const response = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        throw new Error("서버 응답 에러");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch (error) {
      console.error("API 통신 실패:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "현재 서버와 연결되어 있지 않습니다. (나중에 백엔드가 켜지면 정상 작동합니다)",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-0 sm:p-4 text-slate-800 font-sans">
      <main className="flex flex-col w-full max-w-2xl h-[100dvh] sm:h-[85vh] bg-white sm:rounded-2xl shadow-xl overflow-hidden">
        <header className="bg-blue-600 text-white p-4 sm:p-5 text-center text-lg sm:text-xl font-bold shrink-0">
          AI 커리어 가이드
        </header>

        <div
          className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-50"
          role="log"
          aria-live="polite"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-[1.05rem] sm:text-[1.1rem] leading-relaxed break-keep shadow-sm ${
                msg.sender === "ai"
                  ? "bg-slate-200 self-start rounded-tl-sm"
                  : "bg-blue-200 self-end rounded-tr-sm"
              }`}
            >
              <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ▼ [새로 추가된 부분] 3가지 드롭다운이 들어간 폼 영역 */}
        <form
          onSubmit={handleFilterSubmit}
          className="p-3 sm:p-4 bg-slate-100 flex flex-wrap gap-2 border-t border-slate-200 shrink-0"
          aria-label="맞춤 조건 검색"
        >
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            disabled={isLoading}
            className="flex-1 min-w-[110px] p-2.5 sm:p-3 text-sm sm:text-base border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-200 cursor-pointer"
          >
            <option value="">🌍 지역 (전체)</option>
            <option value="서울특별시">서울특별시</option>
            <option value="경기도">경기도</option>
            <option value="인천광역시">인천광역시</option>
            <option value="울산광역시">울산광역시</option>
            <option value="재택근무">재택근무</option>
          </select>

          <select
            value={companyType}
            onChange={(e) => setCompanyType(e.target.value)}
            disabled={isLoading}
            className="flex-1 min-w-[110px] p-2.5 sm:p-3 text-sm sm:text-base border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-200 cursor-pointer"
          >
            <option value="">🏢 기업 (전체)</option>
            <option value="대기업">대기업</option>
            <option value="공사/공기업">공사/공기업</option>
            <option value="일반구인">일반구인</option>
          </select>

          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            disabled={isLoading}
            className="flex-1 min-w-[110px] p-2.5 sm:p-3 text-sm sm:text-base border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-200 cursor-pointer"
          >
            <option value="">💼 직종 (전체)</option>
            <option value="사무직">사무직</option>
            <option value="물류">물류</option>
            <option value="요식업">요식업</option>
          </select>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-slate-800 text-white px-5 py-2.5 sm:py-3 font-bold text-sm sm:text-base rounded-xl hover:bg-slate-900 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            맞춤 검색
          </button>
        </form>

        <div className="flex p-3 sm:p-4 border-t border-slate-200 gap-2 bg-white shrink-0">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={
              isLoading
                ? "서버 응답 대기 중..."
                : "궁금한 점을 자유롭게 입력하세요"
            }
            aria-label="메시지 입력란"
            onKeyPress={handleKeyPress}
            className="flex-1 p-3 sm:p-4 text-base sm:text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus-visible:border-blue-600 focus-visible:ring-4 focus-visible:ring-amber-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <button
            disabled={isLoading}
            className="bg-blue-600 text-white px-5 sm:px-8 py-3 sm:py-4 font-bold text-base sm:text-lg rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500 transition-all min-w-[70px] sm:min-w-[90px] disabled:bg-blue-400 disabled:cursor-not-allowed"
            onClick={() => sendMessage()}
            aria-label="메시지 전송"
          >
            {isLoading ? "전송 중..." : "전송"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
