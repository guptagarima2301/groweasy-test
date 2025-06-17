import React, { useState } from 'react';
import axios from 'axios';
import Chat from './chat';
import './styles.css';

export default function App() {
  const [lead, setLead] = useState({ name: '', phone: '', source: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = e => setLead({ ...lead, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container">
      <h2>GrowEasy Lead Qualification Bot</h2>
      {!submitted ? (
        <form onSubmit={handleSubmit} className="lead-form">
          <input name="name" placeholder="Name" required onChange={handleChange} />
          <input name="phone" placeholder="Phone" required onChange={handleChange} />
          <input name="source" placeholder="Source" onChange={handleChange} />
          <input name="message" placeholder="Message (optional)" onChange={handleChange} />
          <button type="submit">Start Chat</button>
        </form>
      ) : (
        <Chat lead={lead} />
      )}
    </div>
  );
}
