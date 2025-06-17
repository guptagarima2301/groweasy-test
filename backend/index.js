const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');


const config = require('./config/business-profile.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());


let results = [];


function extractLocation(chat) {
  
  for (let msg of chat) {
    if (msg.sender === 'user' && /location|city|area|looking for/i.test(msg.text)) {
      
      return msg.text;
    }
  }
  
  for (let msg of chat) {
    if (msg.sender === 'user') return msg.text;
  }
  return "Unspecified";
}

function extractPropertyType(chat) {
  for (let msg of chat) {
    if (msg.sender === 'user' && /(flat|villa|plot|apartment|house|bungalow)/i.test(msg.text)) {
      const match = msg.text.match(/(flat|villa|plot|apartment|house|bungalow)/i);
      return match ? match[0] : "Unspecified";
    }
  }
  return "Unspecified";
}

function extractPurpose(chat) {
  for (let msg of chat) {
    if (msg.sender === 'user' && /(investment|personal use|own stay|self use)/i.test(msg.text)) {
      const match = msg.text.match(/(investment|personal use|own stay|self use)/i);
      return match ? match[0] : "Unspecified";
    }
  }
  return "Unspecified";
}

function extractBudget(chat) {
  for (let msg of chat) {
    if (msg.sender === 'user' && /(\d+\s?l|lakh|crore|million|thousand|k)/i.test(msg.text)) {
      const match = msg.text.match(/(\d+[\.\d]*\s?(l|lakh|crore|million|thousand|k))/i);
      return match ? match[0] : msg.text;
    }
  }
  return "Unspecified";
}

function extractTimeline(chat) {
  for (let msg of chat) {
    if (msg.sender === 'user' && /(month|week|year|immediate|urgent|days)/i.test(msg.text)) {
      const match = msg.text.match(/(\d+\s?(month|week|year|day)s?|immediate|urgent)/i);
      return match ? match[0] : msg.text;
    }
  }
  return "Unspecified";
}


app.post('/api/start-chat', (req, res) => {
  const { lead } = req.body;
  const firstQuestion = config.qualifying_questions[0];
  res.json({
    chat: [
      { sender: 'bot', text: `Hi ${lead.name}! ${firstQuestion}` }
    ]
  });
});


function mockAIResponse(chat) {
  const lastUserMsg = chat[chat.length - 1]?.text?.toLowerCase() || "";

  
  if (chat.length === 1) {
    return "Great! Are you looking for a flat, villa, or plot? Also, is this for investment or personal use?";
  }
  
  if (/(flat|villa|plot|apartment|house|bungalow)/i.test(lastUserMsg)) {
    return "What’s your budget range? (e.g., 50L–80L)";
  }
  
  if (/(\d+\s?l|lakh|crore|million|thousand|k)/i.test(lastUserMsg)) {
    return "What is your move-in timeline?";
  }
  
  if (/(month|week|year|immediate|urgent|days)/i.test(lastUserMsg)) {
    
    const metadata = {
      Location: extractLocation(chat),
      "Property Type": extractPropertyType(chat),
      Budget: extractBudget(chat),
      Timeline: extractTimeline(chat),
      Purpose: extractPurpose(chat)
    };
    return `Lead Status: Hot
Extracted Metadata:
${Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
  }
  
  if (lastUserMsg.includes("just browsing") || lastUserMsg.includes("not sure")) {
    const metadata = {
      Location: extractLocation(chat),
      Intent: "Browsing",
      Engagement: "Low"
    };
    return `Lead Status: Cold
Extracted Metadata:
${Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
  }
  
  if (lastUserMsg.match(/asdf|test|123/)) {
    const metadata = {
      Reason: "Fake/test entry",
      Action: "Flagged for review"
    };
    return `Lead Status: Invalid
Extracted Metadata:
${Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
  }
  return "Could you please clarify your requirements?";
}


app.post('/api/chat', async (req, res) => {
  const { chat, lead } = req.body;
  const botReply = mockAIResponse(chat);

  let classification = null, metadata = null;
  if (botReply.includes('Lead Status:')) {
    const statusMatch = /Lead Status:\s*(\w+)/.exec(botReply);
    if (statusMatch) classification = statusMatch[1];
    const metaMatch = botReply.match(/Extracted Metadata:\s*([\s\S]*)/i);
    if (metaMatch) {
      metadata = {};
      const lines = metaMatch[1].split('\n');
      lines.forEach(line => {
        const [k, v] = line.split(':').map(s => s && s.trim());
        if (k && v) metadata[k] = v;
      });
    }
    results.push({ lead, chat, classification, metadata });
  }

  res.json({ reply: botReply, classification, metadata });
});


app.get('/api/results', (req, res) => {
  res.json(results);
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
