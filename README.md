# 🤖 Zalo OA Chatbot Agent

Hệ thống chatbot thông minh tích hợp với Zalo OA sử dụng LLM libre (hoàn toàn miễn phí).

## ✨ Tính năng chính

✅ Tích hợp Zalo OA qua Webhook & Open API  
✅ Upload tài liệu để training Agent  
✅ Sử dụng LLM miễn phí (Ollama, Groq, HuggingFace, Cohere)  
✅ Admin Dashboard để quản lý tài liệu  
✅ Test LLM trực tiếp trên web  
✅ Tìm kiếm tài liệu liên quan tự động  

---

## 🚀 Cài đặt nhanh

### 1. Clone & Cài đặt Dependencies

```bash
# Tạo thư mục dự án
mkdir zalo-chatbot-agent
cd zalo-chatbot-agent

# Copy các file từ trên vào thư mục này
# - zalo-agent-server.js
# - package.json
# - .env.example

# Cài đặt dependencies
npm install

# Copy .env.example thành .env
cp .env.example .env
```

### 2. Chọn LLM Provider

#### **Option A: Ollama (Khuyên dùng - Hoàn toàn miễn phí)**

```bash
# 1. Download Ollama từ https://ollama.ai
# 2. Sau khi cài đặt, mở Terminal/CMD và chạy:
ollama run mistral

# 3. Cập nhật .env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

**Ưu điểm:** Hoàn toàn miễn phí, chạy offline, không cần API key  
**Nhược điểm:** Cần máy tính có RAM >= 8GB, xử lý chậm hơn

#### **Option B: Groq API (Free Tier - Nhanh nhất)**

```bash
# 1. Đăng ký tại https://console.groq.com
# 2. Tạo API key từ dashboard
# 3. Cập nhật .env
LLM_PROVIDER=groq
GROQ_API_KEY=your_api_key_here
```

**Ưu điểm:** Miễn phí, cực nhanh, model tốt  
**Nhược điểm:** Cần internet, giới hạn request

#### **Option C: HuggingFace (Free Tier)**

```bash
# 1. Đăng ký tại https://huggingface.co
# 2. Tạo Access Token trong Settings > Access Tokens
# 3. Cập nhật .env
LLM_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_token_here
```

#### **Option D: Cohere (Free Tier)**

```bash
# 1. Đăng ký tại https://cohere.ai
# 2. Lấy API key từ dashboard
# 3. Cập nhật .env
LLM_PROVIDER=cohere
COHERE_API_KEY=your_api_key_here
```

### 3. Khởi chạy Server

```bash
# Development (có auto-reload)
npm run dev

# Hoặc Production
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

### 4. Truy cập Admin Dashboard

Mở trình duyệt: **http://localhost:3000/admin-dashboard.html**

---

## 🔗 Cấu hình Zalo OA

### Bước 1: Tạo Webhook URL

Nếu server chạy local, bạn cần expose nó ra internet:

```bash
# Cách 1: Dùng ngrok (nhanh nhất)
ngrok http 3000
# Copy URL từ output: https://xxxxx.ngrok.io

# Cách 2: Dùng CloudFlare Tunnel
cloudflare tunnel run

# Cách 3: Deploy lên VPS/Server có public IP
# Sau đó dùng IP đó cộng port
```

### Bước 2: Cấu hình trong Zalo OA

1. Truy cập [https://oa.zalo.me](https://oa.zalo.me)
2. Vào **Settings → API & Services → Webhook**
3. Điền **Webhook URL**:
   ```
   https://your-public-url/webhook?token=your_secure_token
   ```
4. Chọn event cần lắng nghe:
   - ✅ user_send_text (Tin nhắn văn bản)
   - ✅ user_send_file (Upload file)

5. Lấy **Access Token** từ mục API & Services
6. Cập nhật `.env`:
   ```
   ZALO_WEBHOOK_TOKEN=your_secure_token
   ZALO_ACCESS_TOKEN=your_access_token
   ZALO_OA_ID=your_oa_id
   ```

### Bước 3: Test Webhook

```bash
# Terminal/CMD
curl -X POST http://localhost:3000/webhook?token=your_secure_token \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "event_name": "user_send_text",
      "sender": {"id": "123456"},
      "message": {"text": "Xin chào"}
    }]
  }'
```

---

## 📚 Quản lý Tài liệu

### Via Dashboard (Dễ nhất)

1. Mở http://localhost:3000/admin-dashboard.html
2. Tab **"📤 Upload Tài liệu"**
3. Nhập tên & nội dung tài liệu
4. Click "Upload"

### Via API

```bash
# Upload tài liệu
curl -X POST http://localhost:3000/api/documents/upload-form?filename=guide.txt \
  -H "Content-Type: text/plain" \
  -d "Nội dung tài liệu..."

# Danh sách tài liệu
curl http://localhost:3000/api/documents

# Xóa tài liệu
curl -X DELETE http://localhost:3000/api/documents/{id}

# Test LLM
curl -X POST http://localhost:3000/api/test-llm \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Xin chào"}'
```

---

## 🧠 Cách Agent hoạt động

```
User gửi tin nhắn → Zalo OA →  Webhook Server
                                    ↓
                        Tìm tài liệu liên quan
                                    ↓
                        Gọi LLM với context
                                    ↓
                        Response → Gửi về Zalo OA
```

### Ví dụ

Nếu user hỏi: **"Giá sản phẩm A bao nhiêu?"**

1. Server nhận tin nhắn
2. Tìm kiếm tài liệu chứa "giá", "sản phẩm", "A"
3. Gộp nội dung tài liệu + câu hỏi gửi cho LLM
4. LLM trả lời dựa vào tài liệu
5. Gửi phản hồi về Zalo OA

---

## 📁 Cấu trúc thư mục

```
zalo-chatbot-agent/
├── zalo-agent-server.js      # Main server
├── admin-dashboard.html       # Web UI
├── package.json               # Dependencies
├── .env                       # Config (copy từ .env.example)
├── knowledge_base.json        # Tài liệu (auto-create)
└── README.md                  # File này
```

---

## 🔧 API Reference

### POST /api/documents/upload-form

Upload tài liệu

```
Query Parameters:
  filename: string (tên file)

Body: text/plain (nội dung)

Response:
{
  "success": true,
  "message": "Document uploaded successfully",
  "document": {
    "id": "timestamp",
    "filename": "guide.txt",
    "uploadedAt": "2024-01-01T10:00:00Z"
  }
}
```

### GET /api/documents

Lấy danh sách tài liệu

```
Response:
{
  "success": true,
  "count": 5,
  "documents": [
    {
      "id": "1234567890",
      "filename": "guide.txt",
      "uploadedAt": "2024-01-01T10:00:00Z",
      "preview": "Nội dung..."
    },
    ...
  ]
}
```

### DELETE /api/documents/:id

Xóa tài liệu

```
Response:
{
  "success": true,
  "message": "Document deleted"
}
```

### POST /api/test-llm

Test LLM

```
Body:
{
  "prompt": "Xin chào"
}

Response:
{
  "success": true,
  "response": "Xin chào! Tôi là assistant hữu ích..."
}
```

### GET /health

Kiểm tra server

```
Response:
{
  "status": "ok",
  "llm_provider": "ollama",
  "documents_count": 5,
  "timestamp": "2024-01-01T10:00:00Z"
}
```

---

## 🚨 Troubleshooting

### Lỗi: "Ollama không khả dụng"

```bash
# Kiểm tra Ollama có chạy không
curl http://localhost:11434

# Nếu lỗi, chạy Ollama
ollama run mistral

# Nếu vẫn lỗi, restart Ollama
killall ollama  # Linux/Mac
taskkill /IM ollama.exe  # Windows
```

### Lỗi: "Cannot connect to Zalo API"

- Kiểm tra Access Token có đúng không
- Kiểm tra internet connection
- Kiểm tra OA ID trong Zalo

### Webhook không nhận sự kiện

- Kiểm tra Webhook URL công khai (dùng ngrok)
- Kiểm tra token webhook đúng không
- Check logs server: `tail -f zalo-agent-server.js`

### Performance chậm

- Dùng Groq thay vì Ollama (nhanh hơn)
- Tăng timeout trong code
- Giảm độ dài prompt

---

## 🔐 Bảo mật

### Trước khi Deploy Production

1. **Thay đổi Webhook Token**
   ```
   Tạo token mạnh: openssl rand -hex 16
   ```

2. **Sử dụng HTTPS**
   ```
   Dùng Let's Encrypt (miễn phí)
   Cấu hình trong nginx/apache
   ```

3. **Bảo vệ Admin Dashboard**
   ```javascript
   // Thêm authentication
   app.use(express.static('public', {
     setHeaders: (res, path) => {
       if (path.includes('dashboard')) {
         res.setHeader('X-Custom-Auth', 'required');
       }
     }
   }));
   ```

4. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

5. **Validate Inputs**
   ```bash
   npm install express-validator
   ```

---

## 📊 Mở rộng

### Thêm hỗ trợ Database

```javascript
// Thay thế file-based storage bằng MongoDB
npm install mongoose

// Cập nhật KnowledgeBase class
```

### Thêm tìm kiếm vector (AI similarity)

```bash
npm install @xenova/transformers
```

### Hỗ trợ nhiều loại file

```bash
npm install pdf-parse docx mammoth
```

### Thêm analytics

```bash
npm install mixpanel
```

---

## 📞 Support

Nếu có vấn đề:

1. Check lại hướng dẫn trên
2. Xem logs server: `console.log` output
3. Test API bằng curl/Postman
4. Check github issues (nếu có repo)

---

## 📝 License

MIT License - Sử dụng tự do cho dự án cá nhân & thương mại

---

## 🎉 Chúc mừng!

Bạn đã hoàn tất cấu hình. Giờ hãy:

1. ✅ Upload tài liệu qua dashboard
2. ✅ Test LLM trên web
3. ✅ Gửi tin nhắn qua Zalo OA
4. ✅ Agent sẽ tự động trả lời!

**Happy coding! 🚀**
