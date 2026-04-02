# 🧠 Codeoscope

**Codeoscope** is an AI-powered codebase explorer that helps developers understand unfamiliar or legacy projects with architectural clarity. Upload a GitHub repo or local folder, and instantly get file-level explanations, system architecture maps, data flow diagrams, and smart insights — just like having a senior engineer walk you through it.

---

## Features

- **Upload local folders or GitHub repositories**
- **LLM-based code and file explanations**
- **Auto-generated architecture diagrams**
- **Data flow diagrams for local projects**
- **Dependency maps to uncover tight couplings**
- **Paste-and-analyze code snippets**
- **User authentication with Firebase**
- **Modern dark/light theme toggle**

---

## Tech Stack

| Layer        | Tools                                         |
|--------------|-----------------------------------------------|
| Frontend     | React, TypeScript, TailwindCSS, Lucide Icons  |
| Backend/API  | [Bolt.new](https://bolt.new) + Firebase       |
| AI Analysis  | OpenAI / LLM integration                      |
| Auth & User  | Firebase Authentication                       |
| Deployment   | Netlify or Vercel (recommended)               |

---

## Getting Started

### Prerequisites:

- Node.js (v16 or newer)
- Git
- Firebase project (for authentication)
- OpenAI API key (or use Bolt.new's built-in LLM blocks)

---

### Steps to install and run locally:

1. **Clone the repo**

```bash
git clone https://github.com/mdeshp11/Codeoscope.git
cd Codeoscope
npm install
npm run dev
```

**Try it live:**  [https://codeoscope.netlify.app](https://codeoscope.netlify.app)
