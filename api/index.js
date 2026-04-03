/**
 * Zalo OA Chatbot Agent
 * Kết nối Zalo OA Webhook với LLM Agent
 * 
 * Cài đặt: npm install express axios dotenv cors body-parser
 * Chạy: node zalo-agent-server.js
 */

const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==================== CONFIG ====================
const ZALO_WEBHOOK_TOKEN = process.env.ZALO_WEBHOOK_TOKEN || 'your_webhook_token';
const ZALO_OA_ID = process.env.ZALO_OA_ID || 'your_oa_id';
const ZALO_ACCESS_TOKEN = process.env.ZALO_ACCESS_TOKEN || 'your_access_token';
const ZALO_SEND_MESSAGE_URL = 'https://openapi.zalo.me/v3.0/oa/message/send';

// Local LLM options (Free & Open Source)
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'ollama'; // 'ollama', 'cohere', 'groq', 'huggingface'
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const COHERE_API_KEY = process.env.COHERE_API_KEY || '';

// ==================== AGENT STORAGE ====================
class KnowledgeBase {
  constructor() {
    this.documents = [];
    this.loadFromFile();
  }

  addDocument(filename, content, metadata = {}) {
    const doc = {
      id: Date.now().toString(),
      filename,
      content,
      metadata,
      uploadedAt: new Date().toISOString()
    };
    this.documents.push(doc);
    this.saveToFile();
    return doc;
  }

  getRelevantDocuments(query, limit = 3) {
    // Simple similarity search (tính điểm matching)
    const scored = this.documents.map(doc => ({
      ...doc,
      score: this.calculateSimilarity(query, doc.content)
    }));
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter(doc => doc.score > 0.1);
  }

  calculateSimilarity(query, text) {
    // Simple keyword matching
    const queryWords = query.toLowerCase().split(/\s+/);
    const textWords = text.toLowerCase().split(/\s+/);
    const matches = queryWords.filter(word => textWords.includes(word)).length;
    return matches / Math.max(queryWords.length, 1);
  }

  saveToFile() {
    fs.writeFileSync(
      path.join(__dirname, 'knowledge_base.json'),
      JSON.stringify(this.documents, null, 2)
    );
  }

  loadFromFile() {
    try {
      const filePath = path.join(__dirname, 'knowledge_base.json');
      if (fs.existsSync(filePath)) {
        this.documents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.log('Knowledge base file not found, starting fresh');
      this.documents = [];
    }
  }

  getAllDocuments() {
    return this.documents;
  }

  deleteDocument(id) {
    this.documents = this.documents.filter(doc => doc.id !== id);
    this.saveToFile();
  }
}

const knowledgeBase = new KnowledgeBase();

// ==================== LLM PROVIDERS ====================

async function callLLM(prompt, context = '') {
  const fullPrompt = context ? `${context}\n\nCâu hỏi: ${prompt}` : prompt;

  try {
    switch (LLM_PROVIDER) {
      case 'ollama':
        return await callOllama(fullPrompt);
      case 'groq':
        return await callGroq(fullPrompt);
      case 'huggingface':
        return await callHuggingFace(fullPrompt);
      case 'cohere':
        return await callCohere(fullPrompt);
      default:
        return 'LLM provider không được cấu hình';
    }
  } catch (error) {
    console.error('LLM Error:', error.message);
    return `Lỗi khi xử lý: ${error.message}`;
  }
}

// Ollama (chạy locally, completely free)
async function callOllama(prompt) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: 'mistral', // hoặc llama2, neural-chat, etc
      prompt: prompt,
      stream: false,
      temperature: 0.7,
    }, { timeout: 30000 });
    return response.data.response.trim();
  } catch (error) {
    console.error('Ollama error:', error.message);
    return 'Ollama không khả dụng. Vui lòng cài đặt Ollama và chạy: ollama run mistral';
  }
}

// Groq API (free tier available)
async function callGroq(prompt) {
  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq error:', error.message);
    throw error;
  }
}

// HuggingFace Inference API (free tier)
async function callHuggingFace(prompt) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`
        }
      }
    );
    return response.data[0].generated_text;
  } catch (error) {
    console.error('HuggingFace error:', error.message);
    throw error;
  }
}

// Cohere API (free tier)
async function callCohere(prompt) {
  try {
    const response = await axios.post('https://api.cohere.ai/v1/generate', {
      model: 'command',
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.generations[0].text.trim();
  } catch (error) {
    console.error('Cohere error:', error.message);
    throw error;
  }
}

// ==================== ZALO WEBHOOK ====================

// Webhook để nhận tin nhắn từ Zalo OA
app.post('/webhook', (req, res) => {
  const { token } = req.query;

  // Verify token
  if (token !== ZALO_WEBHOOK_TOKEN) {
    console.log('Invalid token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { events } = req.body;

  if (!events || !Array.isArray(events)) {
    return res.status(200).json({ message: 'OK' });
  }

  // Xử lý các sự kiện
  events.forEach(async (event) => {
    try {
      if (event.event_name === 'user_send_text') {
        await handleUserMessage(event);
      } else if (event.event_name === 'user_send_file') {
        await handleFileUpload(event);
      }
    } catch (error) {
      console.error('Error processing event:', error);
    }
  });

  res.status(200).json({ message: 'OK' });
});

// Xử lý tin nhắn văn bản từ người dùng
async function handleUserMessage(event) {
  const { sender } = event;
  const userId = sender.id;
  const userMessage = event.message.text;

  console.log(`📨 Message from ${userId}: ${userMessage}`);

  // Lấy tài liệu liên quan từ knowledge base
  const relevantDocs = knowledgeBase.getRelevantDocuments(userMessage);
  let context = '';

  if (relevantDocs.length > 0) {
    context = 'Thông tin liên quan:\n' + relevantDocs
      .map(doc => `[${doc.filename}]: ${doc.content.substring(0, 500)}...`)
      .join('\n\n');
  }

  // Gọi LLM để tạo phản hồi
  const systemPrompt = `Bạn là một assistant hữu ích cho Zalo OA. Hãy trả lời bằng tiếng Việt một cách ngắn gọn và chuyên nghiệp.`;
  const response = await callLLM(userMessage, context);

  // Gửi phản hồi về Zalo
  await sendZaloMessage(userId, response);
}

// Xử lý upload tài liệu
async function handleFileUpload(event) {
  const { sender, message } = event;
  const userId = sender.id;

  console.log(`📄 File upload from ${userId}`);

  // Trong thực tế, bạn cần download file từ Zalo
  // Ở đây là ví dụ đơn giản
  const confirmMsg = 'Tài liệu của bạn đã được nhận. Hệ thống đang xử lý...';
  await sendZaloMessage(userId, confirmMsg);
}

// Gửi tin nhắn về Zalo OA
async function sendZaloMessage(userId, message) {
  try {
    const payload = {
      recipient: {
        user_id: userId
      },
      message: {
        text: message
      }
    };

    await axios.post(ZALO_SEND_MESSAGE_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': ZALO_ACCESS_TOKEN
      }
    });

    console.log(`✅ Message sent to ${userId}`);
  } catch (error) {
    console.error('Error sending Zalo message:', error.response?.data || error.message);
  }
}

// ==================== ADMIN API ====================

// Upload tài liệu (API)
app.post('/api/documents/upload', express.text({ type: 'text/*' }), (req, res) => {
  try {
    const { filename, metadata } = req.body ? JSON.parse(req.query.meta || '{}') : {};
    const content = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'filename và content được yêu cầu' });
    }

    const doc = knowledgeBase.addDocument(filename, content, metadata);
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: doc
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload tài liệu (Form data)
app.post('/api/documents/upload-form', express.text(), (req, res) => {
  try {
    const filename = req.query.filename || 'document.txt';
    const content = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content được yêu cầu' });
    }

    const doc = knowledgeBase.addDocument(filename, content);
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: doc
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Danh sách tài liệu
app.get('/api/documents', (req, res) => {
  const docs = knowledgeBase.getAllDocuments();
  res.json({
    success: true,
    count: docs.length,
    documents: docs.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      uploadedAt: doc.uploadedAt,
      preview: doc.content.substring(0, 200) + '...'
    }))
  });
});

// Xóa tài liệu
app.delete('/api/documents/:id', (req, res) => {
  knowledgeBase.deleteDocument(req.params.id);
  res.json({ success: true, message: 'Document deleted' });
});

// Test LLM
app.post('/api/test-llm', express.json(), async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt được yêu cầu' });
  }

  try {
    const response = await callLLM(prompt);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    llm_provider: LLM_PROVIDER,
    documents_count: knowledgeBase.getAllDocuments().length,
    timestamp: new Date().toISOString()
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Zalo Agent Server running on port ${PORT}`);
  console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook?token=${ZALO_WEBHOOK_TOKEN}`);
  console.log(`📚 LLM Provider: ${LLM_PROVIDER}`);
  console.log(`\n📚 API Endpoints:`);
  console.log(`   - POST /api/documents/upload-form (Upload tài liệu)`);
  console.log(`   - GET /api/documents (Danh sách tài liệu)`);
  console.log(`   - DELETE /api/documents/:id (Xóa tài liệu)`);
  console.log(`   - POST /api/test-llm (Test LLM)`);
  console.log(`   - GET /health (Health check)`);
  console.log(`\n`);
});

module.exports = app;
