# 🌿 EcoLens AI — Smart Waste Classifier

> **Snap. Classify. Recycle.** — Drop any waste image and let AI identify the material, rate its recyclability, and generate eco-friendly disposal tips in seconds.

![EcoLens AI](https://img.shields.io/badge/EcoLens-AI-00ff88?style=for-the-badge&logo=leaf&logoColor=black)
![Django](https://img.shields.io/badge/Django-5.1+-092E20?style=for-the-badge&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Mistral](https://img.shields.io/badge/Mistral-Pixtral_Vision-FF7000?style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🖼️ **Drag & Drop Upload** | Intuitive drop zone with live preview and file validation |
| 🤖 **AI Classification** | Mistral Pixtral Vision identifies 6 waste material types |
| 📊 **Confidence Score** | Animated circular ring showing AI certainty (0–100%) |
| ♻️ **6 Waste Categories** | Plastic · Paper · Metal · Glass · Organic · Unknown |
| 🌱 **Eco-Insights** | 3 actionable, item-specific disposal & recycling tips |
| 🔬 **Scan Animation** | Cinematic laser-line HUD while AI processes the image |
| 🌙 **Dark Mode UI** | Eco-Neon green accents with glassmorphism cards |
| 📱 **Responsive** | Pixel-perfect on mobile, tablet, and desktop |

---

## 🛠️ Tech Stack

### Backend
- **[Django 5.1+](https://djangoproject.com)** — Web framework
- **[Django REST Framework](https://www.django-rest-framework.org)** — API layer
- **[django-cors-headers](https://github.com/adamchainz/django-cors-headers)** — CORS handling
- **[Mistral Pixtral Vision](https://mistral.ai)** — AI image classification (`pixtral-12b-2409`)
- **[httpx](https://www.python-httpx.org)** — Async-capable HTTP client for Mistral API calls
- **[Pillow](https://python-pillow.org)** — Image processing & normalisation

### Frontend
- **[React 18](https://react.dev)** + **[Vite](https://vitejs.dev)** — UI & build tooling
- **[Tailwind CSS 3](https://tailwindcss.com)** — Utility-first styling
- **[Framer Motion](https://www.framer.com/motion)** — Animations & transitions
- **[Lucide React](https://lucide.dev)** — Icon library
- **[Axios](https://axios-http.com)** — HTTP client

---

## 📁 Project Structure

```
EcoLens-AI/
├── backend/
│   ├── classifier/
│   │   ├── views.py          # Core API view — image → Mistral → JSON
│   │   └── urls.py
│   ├── ecolens/
│   │   ├── settings.py       # Django settings + env config
│   │   └── urls.py
│   ├── .env                  # Your API keys (not committed)
│   ├── .env.example          # Template for environment variables
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Complete single-file React UI
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── start.sh                  # One-command launcher
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+ (tested on 3.14)
- Node.js 18+
- A **Mistral API key** — get one free at [console.mistral.ai](https://console.mistral.ai)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/EcoLens-AI.git
cd EcoLens-AI
```

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and add your key:

```env
MISTRAL_API_KEY=your_mistral_api_key_here
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
```

### 3. Launch (one command)

```bash
cd EcoLens-AI
./start.sh
```

The script will:
- Create a Python virtual environment
- Install all backend dependencies
- Run Django migrations
- Start Django on `http://localhost:8000`
- Install frontend npm packages (first run only)
- Start the Vite dev server on `http://localhost:5173`

### 4. Open the app

Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔧 Manual Setup

If you prefer running each server separately:

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 API Reference

### `POST /api/classify/`

Classifies a waste item from an uploaded image.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `image` | File | The image to classify (PNG/JPG/WEBP, max 10 MB) |

**Response** — `200 OK`

```json
{
  "category":   "Plastic",
  "confidence": 92,
  "item_name":  "PET Plastic Water Bottle",
  "tips": [
    "Rinse the bottle and remove the cap before placing it in the recycling bin.",
    "Check the recycling number — PET (#1) is accepted by most curbside programmes.",
    "Consider refilling a reusable bottle to reduce single-use plastic consumption."
  ]
}
```

**Categories**

| Value | Description |
|---|---|
| `Plastic` | PET, HDPE, PVC, and other plastic materials |
| `Paper` | Cardboard, newspapers, magazines, packaging |
| `Metal` | Aluminium cans, steel, copper, tin |
| `Glass` | Bottles, jars, glassware |
| `Organic` | Food waste, garden waste, biodegradables |
| `Unknown` | Item not clearly identifiable |

---

## 🎨 UI Highlights

- **Dark background** `#060c09` with animated dot-grid overlay
- **Neon green** `#00ff88` primary accent with `textShadow` bloom effect
- **Glassmorphism** cards — `backdrop-filter: blur(32px)` + subtle borders
- **Laser scan animation** — green gradient line sweeping 0% → 100% → 0% on a 2 s loop
- **Circular confidence ring** — SVG `stroke-dashoffset` animation with category-coloured glow
- **Framer Motion** `AnimatePresence` for state transitions (idle → scanning → result)
- **Per-category accent colours** — Blue (Plastic) · Amber (Paper) · Slate (Metal) · Cyan (Glass) · Green (Organic) · Purple (Unknown)

---

## 🤝 Contributing

Pull requests are welcome.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Mistral AI](https://mistral.ai) for the Pixtral vision model
- [Framer Motion](https://www.framer.com/motion) for buttery animations
- [Lucide](https://lucide.dev) for the icon set
- Built during the **Adani University ACM Vibe Coding Hackathon** 🚀

---

<div align="center">
  <strong>EcoLens AI</strong> · Making recycling smarter, one scan at a time. 🌍
</div>
