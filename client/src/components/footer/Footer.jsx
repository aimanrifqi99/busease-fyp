import React, { useState, useEffect, useRef } from "react";
import "./footer.css";
const API_URL = process.env.REACT_APP_API_URL;

const Footer = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationState, setConversationState] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setQuestion("");
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user ? user._id : null;
      const apiResponse = await fetch(`${API_URL}/api/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, userId, conversationState }),
      });
      if (!apiResponse.ok) throw new Error("Failed to fetch AI response");
      const data = await apiResponse.json();
      if (data.conversationState) {
        setConversationState(data.conversationState);
      } else {
        setConversationState({});
      }
      setMessages((prev) => [...prev, { sender: "assistant", text: data.response }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: "An error occurred. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="footer">
      <div className="footer-container">
        <h3 className="chatbot-title">Chat with our AI assistant</h3>
        <div id="chatbot-container">
          <div className="chatbot-messages">
            {messages.length === 0 && !loading && (
              <div className="chatbot-message assistant">
                <div className="chatbot-message-content">
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/8943/8943377.png"
                    alt="Chatbot"
                    className="chatbot-avatar"
                  />
                  <div className="message-text">
                    Hi there! How can I help you today?
                  </div>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chatbot-message ${m.sender}`}>
                {m.sender === "assistant" ? (
                  <div className="chatbot-message-content">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/8943/8943377.png"
                      alt="Chatbot"
                      className="chatbot-avatar"
                    />
                    <div
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, "<br>") }}
                    />
                  </div>
                ) : (
                  <div className="chatbot-message-content user-message">
                    <div className="message-text">
                      {m.text.split("\n").map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chatbot-message assistant">
                <div className="chatbot-message-content">
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/8943/8943377.png"
                    alt="Chatbot"
                    className="chatbot-avatar"
                  />
                  <div className="message-text">Typing...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-form">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="chatbot-input"
                required
              />
              <button
                type="submit"
                className="chatbot-submit-btn"
                disabled={loading || !question.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
