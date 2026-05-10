import { useState, useRef, useEffect } from "react";

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "안녕하세요! 경증 지체 장애인을 위한 맞춤형 일자리 찾기 도우미입니다.\n\n어떤 분야의 취업에 관심이 있으신가요? 아래 버튼을 누르시거나 직접 입력해 주세요.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 드롭다운 상태
  const [region, setRegion] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [jobType, setJobType] = useState("");

  // 첨부된 이미지를 관리하는 상태
  const [attachedImage, setAttachedImage] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 파일 선택 (버튼 클릭) 처리
  const handleImageAttach = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setAttachedImage({ file, previewUrl });
    }
    e.target.value = null; // 같은 파일을 지웠다 다시 올릴 수 있도록 초기화
  };

  // 클립보드 붙여넣기 (Ctrl+V) 처리
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        const previewUrl = URL.createObjectURL(file);
        setAttachedImage({ file, previewUrl });
        e.preventDefault(); // 이미지 텍스트가 입력창에 복사되는 것 방지
        break; // 첫 번째 이미지만 가져옵니다
      }
    }
  };

  // 첨부된 이미지 삭제
  const removeAttachment = () => {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl); // 메모리 누수 방지
    }
    setAttachedImage(null);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    const filterQuery = `[맞춤 검색] 지역: ${region || "전체"}, 기업분류: ${companyType || "전체"}, 직종: ${jobType || "전체"}`;
    sendMessage(filterQuery);
  };

  const sendMessage = async (text = null) => {
    const messageText = text || inputValue.trim();

    // 텍스트도 없고 이미지도 없으면 전송 안 함
    if (messageText === "" && !attachedImage) return;
    if (isLoading) return;

    // 1. 화면에 내 메시지와 이미지 띄우기
    const newMsg = {
      sender: "user",
      text: messageText,
      imageUrl: attachedImage ? attachedImage.previewUrl : null,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    setAttachedImage(null); // 전송 후 첨부파일 초기화
    setIsLoading(true);

    // 2. 백엔드 통신
    try {
      // 💡 나중에 백엔드 개발자가 알려주는 실제 API 주소로 여기를 바꿔주세요!
      // 이미지가 포함된 경우 JSON 대신 FormData 방식을 사용해야 합니다!
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageText }), // 임시 데이터
      });

      if (!response.ok) throw new Error("서버 응답 에러");

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch (error) {
      console.error("API 통신 실패:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "현재 서버와 연결되어 있지 않습니다. 이미지를 포함한 기능은 백엔드 연결 후 정상 작동합니다.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-0 sm:p-4 text-slate-800 font-sans">
      <main className="flex flex-col w-full max-w-3xl h-[100dvh] sm:h-[95vh] bg-white sm:rounded-2xl shadow-xl overflow-hidden">
        {" "}
        <header className="bg-blue-600 text-white p-2 sm:p-3 text-center text-base sm:text-lg font-bold shrink-0">
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
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-[1.05rem] sm:text-[1.1rem] leading-relaxed break-keep shadow-sm flex flex-col gap-2 ${
                msg.sender === "ai"
                  ? "bg-slate-200 self-start rounded-tl-sm"
                  : "bg-blue-200 self-end rounded-tr-sm"
              }`}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="전송한 이미지"
                  className="max-w-full rounded-lg border border-slate-300 object-cover"
                />
              )}
              {msg.text && (
                <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* 조건 검색 폼 영역 */}
        <form
          onSubmit={handleFilterSubmit}
          className="p-3 sm:p-4 bg-slate-100 flex flex-wrap gap-2 border-t border-slate-200 shrink-0"
        >
          {/* 태훈 님이 주신 전국 지역 리스트 적용! */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            disabled={isLoading}
            className="flex-1 min-w-[110px] p-2.5 sm:p-3 text-sm sm:text-base border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-200 cursor-pointer"
          >
            <option value="">🌍 지역 (전체)</option>
            <option value="서울특별시">서울특별시</option>
            <option value="부산광역시">부산광역시</option>
            <option value="대구광역시">대구광역시</option>
            <option value="인천광역시">인천광역시</option>
            <option value="광주광역시">광주광역시</option>
            <option value="대전광역시">대전광역시</option>
            <option value="울산광역시">울산광역시</option>
            <option value="경기도">경기도</option>
            <option value="강원특별자치도">강원특별자치도</option>
            <option value="충청북도">충청북도</option>
            <option value="충청남도">충청남도</option>
            <option value="전라북도특별자치도">전라북도특별자치도</option>
            <option value="전라남도">전라남도</option>
            <option value="경상북도">경상북도</option>
            <option value="경상남도">경상남도</option>
            <option value="제주특별자치도">제주특별자치도</option>
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
            <option value="사무/IT/상담">사무 / IT / 상담</option>
            <option value="환경미화/시설">환경미화 / 시설</option>
            <option value="요식업/매장서비스">요식업 / 매장서비스</option>
            <option value="물류/제조/생산">물류 / 제조 / 생산</option>
          </select>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-slate-800 text-white px-5 py-2.5 sm:py-3 font-bold text-sm sm:text-base rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            맞춤 검색
          </button>
        </form>
        {/* 입력 영역 (이미지 미리보기 + 채팅 입력) */}
        <div className="flex flex-col p-3 sm:p-4 border-t border-slate-200 gap-2 bg-white shrink-0">
          {attachedImage && (
            <div className="relative inline-block w-24 h-24 sm:w-28 sm:h-28 ml-1 mb-1">
              <img
                src={attachedImage.previewUrl}
                alt="첨부 미리보기"
                className="w-full h-full object-cover rounded-xl border-2 border-slate-200 shadow-sm"
              />
              <button
                onClick={removeAttachment}
                className="absolute -top-2 -right-2 bg-slate-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 shadow-md transition-colors"
                aria-label="첨부 이미지 삭제"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex gap-2 items-center">
            {/* 📎 파일 첨부 버튼 (클립 모양 아이콘) */}
            <label
              className={`cursor-pointer p-2 sm:p-3 rounded-full hover:bg-slate-100 transition-colors ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
              aria-label="이미지 첨부"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6 sm:w-7 sm:h-7 text-slate-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <input
                type="file"
                // 👇 [요청사항 반영] 이 부분에 accept 속성을 추가했습니다.
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                onChange={handleImageAttach}
                disabled={isLoading}
              />
            </label>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPaste={handlePaste} // ▼ Ctrl+V 붙여넣기 이벤트 연결
              disabled={isLoading}
              placeholder={
                isLoading
                  ? "서버 응답 대기 중..."
                  : "이미지 붙여넣기(Ctrl+V) 또는 메시지 입력"
              }
              className="flex-1 p-3 sm:p-4 text-base sm:text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus-visible:border-blue-600 focus-visible:ring-4 focus-visible:ring-blue-600/20 transition-all disabled:bg-slate-100"
              onKeyPress={handleKeyPress}
            />
            <button
              disabled={
                isLoading || (inputValue.trim() === "" && !attachedImage)
              } // 텍스트/이미지 둘 다 없으면 버튼 비활성화
              className="bg-blue-600 text-white px-5 sm:px-8 py-3 sm:py-4 font-bold text-base sm:text-lg rounded-xl hover:bg-blue-700 transition-all min-w-[70px] sm:min-w-[90px] disabled:bg-slate-300 disabled:cursor-not-allowed"
              onClick={() => sendMessage()}
            >
              {isLoading ? "전송 중" : "전송"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
