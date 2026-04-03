#!/bin/bash

# Zalo Chatbot Agent - Automatic Installation Script
# Usage: bash setup.sh

set -e

echo "🚀 Zalo OA Chatbot Agent - Cài đặt Tự động"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root for some commands
if [ "$EUID" -ne 0 ]; then 
   echo -e "${YELLOW}⚠️  Một số lệnh cần quyền sudo. Sẽ yêu cầu password...${NC}"
fi

# 1. Update system
echo -e "${GREEN}1️⃣  Cập nhật hệ thống...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
echo -e "${GREEN}2️⃣  Cài đặt Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "✅ Node.js đã được cài đặt: $(node --version)"
fi

# 3. Install npm
echo -e "${GREEN}3️⃣  Cài đặt npm dependencies...${NC}"
if [ -f "package.json" ]; then
    npm install
else
    echo -e "${RED}❌ Không tìm thấy package.json${NC}"
    exit 1
fi

# 4. Setup environment file
echo -e "${GREEN}4️⃣  Cấu hình .env file...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ File .env tạo từ .env.example"
        echo -e "${YELLOW}⚠️  Vui lòng chỉnh sửa .env với thông tin Zalo của bạn${NC}"
        read -p "Nhấn Enter để mở .env trong editor..."
        nano .env
    else
        echo -e "${RED}❌ Không tìm thấy .env.example${NC}"
        exit 1
    fi
fi

# 5. Create knowledge_base.json if not exists
echo -e "${GREEN}5️⃣  Khởi tạo knowledge base...${NC}"
if [ ! -f "knowledge_base.json" ]; then
    echo "[]" > knowledge_base.json
    echo "✅ Tạo knowledge_base.json"
fi

# 6. Install Nginx (optional)
echo -e "${GREEN}6️⃣  Cài đặt Nginx (reverse proxy)...${NC}"
read -p "Bạn muốn cài Nginx không? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo apt install -y nginx
    echo "✅ Nginx đã được cài đặt"
fi

# 7. Install Docker (optional)
echo -e "${GREEN}7️⃣  Cài đặt Docker (tùy chọn)...${NC}"
read -p "Bạn muốn cài Docker không? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        echo "✅ Docker đã được cài đặt"
        echo -e "${YELLOW}⚠️  Bạn cần logout và login lại để group permissions có hiệu lực${NC}"
    else
        echo "✅ Docker đã được cài đặt: $(docker --version)"
    fi
fi

# 8. Install PM2 for process management (recommended)
echo -e "${GREEN}8️⃣  Cài đặt PM2 (quản lý process)...${NC}"
read -p "Bạn muốn cài PM2 không? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo npm install -g pm2
    pm2 ecosystem.config.js || echo "ecosystem.config.js chưa tồn tại"
    echo "✅ PM2 đã được cài đặt"
fi

# 9. Choose LLM Provider
echo ""
echo -e "${GREEN}9️⃣  Chọn LLM Provider...${NC}"
echo "1) Ollama (Local, miễn phí 100%)"
echo "2) Groq (Free tier, cực nhanh)"
echo "3) HuggingFace (Free tier)"
echo "4) Cohere (Free tier)"
read -p "Chọn (1-4): " llm_choice

case $llm_choice in
    1)
        echo "Ollama được chọn"
        read -p "Bạn muốn cài Ollama không? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            curl -fsSL https://ollama.ai/install.sh | sh
            echo "✅ Ollama đã được cài đặt"
            echo -e "${YELLOW}Chạy lệnh sau trong terminal mới: ollama run mistral${NC}"
        fi
        ;;
    2)
        echo "✅ Groq được chọn"
        read -p "Nhập Groq API key: " groq_key
        sed -i "s/GROQ_API_KEY=.*/GROQ_API_KEY=$groq_key/" .env
        ;;
    3)
        echo "✅ HuggingFace được chọn"
        read -p "Nhập HuggingFace token: " hf_token
        sed -i "s/HUGGINGFACE_API_KEY=.*/HUGGINGFACE_API_KEY=$hf_token/" .env
        ;;
    4)
        echo "✅ Cohere được chọn"
        read -p "Nhập Cohere API key: " cohere_key
        sed -i "s/COHERE_API_KEY=.*/COHERE_API_KEY=$cohere_key/" .env
        ;;
    *)
        echo -e "${RED}❌ Lựa chọn không hợp lệ${NC}"
        ;;
esac

# 10. Summary
echo ""
echo -e "${GREEN}✅ CÀI ĐẶT HOÀN TẤT!${NC}"
echo "=========================================="
echo ""
echo "📝 Bước tiếp theo:"
echo ""
echo "1️⃣  Chỉnh sửa .env file với thông tin Zalo OA:"
echo "   nano .env"
echo ""
echo "2️⃣  Khởi chạy server:"
echo "   npm start          # Production"
echo "   npm run dev        # Development (auto-reload)"
echo "   pm2 start zalo-agent-server.js  # Với PM2"
echo ""
echo "3️⃣  Truy cập Admin Dashboard:"
echo "   http://localhost:3000/admin-dashboard.html"
echo ""
echo "4️⃣  Upload tài liệu và test LLM trên dashboard"
echo ""
echo "5️⃣  Cấu hình Webhook trong Zalo OA:"
echo "   URL: https://your-domain/webhook?token=YOUR_TOKEN"
echo ""
echo -e "${YELLOW}📚 Xem README.md để biết thêm chi tiết${NC}"
echo ""
