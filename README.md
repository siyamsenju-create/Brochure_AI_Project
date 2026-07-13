# AI Company Brochure Generator

An enterprise-grade AI-powered web application that automatically crawls company websites, extracts structured content, generates professional, highly detailed company brochures using local Ollama LLM models, and exports them to Markdown, PDF, DOCX, and HTML formats through a premium, state-of-the-art user interface.
## Images
![Uploading Screenshot 2026-07-13 at 7.46.13 PM.png…]()
![Uploading Screenshot 2026-07-13 at 7.47.38 PM.png…]()
![Uploading Screenshot 2026-07-13 at 7.47.21 PM.png…]()


---

## 🚀 Key Features

*   **Intelligent Web Crawler**: Recursively crawls websites up to a specified depth and page count. Respects rate-limits, extracts structural text, and filters out noise.
*   **Ollama Integration**: Harnesses local large language models (e.g., `llama3`, `mistral`, `gemma2`) to structure, synthesize, and compile crawled data into structured business brochures.
*   **Real-time Streaming (SSE)**: Uses Server-Sent Events (SSE) to stream crawler logs and LLM brochure generation output directly to the UI in real-time.
*   **Premium Glassmorphic UI**: High-fidelity modern dashboard with clean animations, customizable settings (crawling constraints, LLM temperature, context windows), history logs, and instant exports.
*   **Multi-Format Export**: One-click download options for:
    *   **Markdown** (raw structured source)
    *   **PDF** (professionally formatted document layout)
    *   **DOCX** (fully editable Microsoft Word document)
    *   **HTML** (styled, stand-alone web view of the brochure)

---

## 🛠️ Technology Stack

### Frontend
*   **React 19** & **TypeScript**
*   **Vite** (build system & development server)
*   **Lucide React** (icons)
*   **Canvas Confetti** (success micro-interactions)
*   **Vanilla CSS** (tailored dark-mode glassmorphic theme)

### Backend
*   **Node.js** (v20+) & **Express**
*   **Cheerio** & **Axios** (scraping and crawling utilities)
*   **tsx** (TypeScript execution for Node)
*   **PDFKit** (PDF generation)
*   **docx** (Microsoft Word document assembly)
*   **marked** (Markdown parser)

---

## 📦 Getting Started

### Prerequisites
1.  **Node.js** installed on your system.
2.  **Ollama** installed and running locally.
    *   Install from [ollama.com](https://ollama.com)
    *   Pull a model of your choice, e.g.:
        ```bash
        ollama pull llama3
        ```

### Installation

1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/siyamsenju-create/Brochure_AI_Project.git
   cd Brochure_AI_Project
   ```

2. Install dependencies for the project:
   ```bash
   npm install
   ```

### Running the Application

Start both the frontend and backend servers concurrently:
```bash
npm run dev
```

*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **Backend API**: [http://localhost:3001](http://localhost:3001)

Ensure your local Ollama server is running (usually on `http://localhost:11434`).

---

## 📂 Project Structure

```
├── README.md               # Project documentation
├── package.json            # Scripts & dependencies
├── tsconfig.json           # TS configuration
├── vite.config.ts          # Vite configuration
├── index.html              # Frontend HTML entrypoint
├── src/                    # Frontend React Application
│   ├── App.tsx             # Root React component
│   ├── main.tsx            # App entrypoint
│   ├── index.css           # Styling system & theme
│   ├── components/         # Reusable UI components
│   ├── pages/              # Main screen views
│   └── utils/              # Helper utilities and file exporters
└── server/                 # Express Backend API
    ├── index.ts            # Main API entrypoint
    ├── config.ts           # Crawler & LLM configurations
    ├── ai/                 # Ollama streaming & prompting
    ├── crawler/            # Web scraping implementation
    ├── db/                 # local JSON-based persistence
    └── export/             # PDF, HTML, and DOCX generation scripts
```

---

## 📄 License

This project is licensed under the MIT License.
