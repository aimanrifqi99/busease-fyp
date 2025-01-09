import React, { useState, useEffect, useRef } from "react";
import "./footer.css";

const Footer = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationState, setConversationState] = useState({});
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to handle API call and fetch AI response
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
  
    // Immediately add the user's message to the conversation
    setMessages(prevMessages => [
      ...prevMessages,
      { sender: 'user', text: question }
    ]);
  
    setQuestion(""); // Clear the input immediately after submitting the question
    setLoading(true); // Show loading state
  
    try {
      // Get userId from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user ? user._id : null;
  
      // Send the user's question and conversation state to the backend API
      const apiResponse = await fetch('/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, userId, conversationState }),
      });
  
      if (!apiResponse.ok) {
        throw new Error('Failed to fetch AI response');
      }
  
      const data = await apiResponse.json();
  
      // Update the conversation state if provided by the server
      if (data.conversationState) {
        setConversationState(data.conversationState);
      } else {
        setConversationState({});
      }
  
      // Add the AI's response to the messages state
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'assistant', text: data.response },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'assistant', text: "An error occurred. Please try again." },
      ]);
    } finally {
      setLoading(false); // Ensure loading state is turned off in both success and error cases
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
            {messages.map((message, index) => (
              <div key={index} className={`chatbot-message ${message.sender}`}>
                {message.sender === 'assistant' ? (
                  <div className="chatbot-message-content">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/8943/8943377.png"
                      alt="Chatbot"
                      className="chatbot-avatar"
                    />
                    <div className="message-text">
                      <div dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br>') }} />
                    </div>
                  </div>
                ) : (
                  <div className="chatbot-message-content user-message">
                    <div className="message-text">
                      {message.text.split('\n').map((line, idx) => (
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
                  <div className="message-text">
                    Typing...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form for user input */}
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
              <button type="submit" className="chatbot-submit-btn" disabled={loading || !question.trim()}>
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
