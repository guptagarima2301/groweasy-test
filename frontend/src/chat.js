import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Chat({ lead }) {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    axios.post('http://localhost:5000/api/start-chat', { lead })
      .then(res => setChat(res.data.chat));
  }, [lead]);

  const sendMessage = async e => {
    e.preventDefault();
    const newChat = [...chat, { sender: 'user', text: input }];
    setChat(newChat);
    setInput('');
    const res = await axios.post('http://localhost:5000/api/chat', { chat: newChat, lead });
    setChat([...newChat, { sender: 'bot', text: res.data.reply }]);
    if (res.data.classification) setStatus(res.data);
  };

  return (
    <div className="chat-box">
      <div className="chat-history">
        {chat.map((m, i) => (
          <div key={i} className={m.sender === 'bot' ? 'bot-msg' : 'user-msg'}>
            {m.text}
          </div>
        ))}
      </div>
      {status ? (
        <div className="result">
          <b>Status:</b> {status.classification}
          <pre>{JSON.stringify(status.metadata, null, 2)}</pre>
        </div>
      ) : (
        <form onSubmit={sendMessage} className="chat-input">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your reply..." required />
          <button type="submit">Send</button>
        </form>
      )}
    </div>
  );
}
