# Personal website backend

A modern, high-performance REST API built with Node.js 24, Express, and ESM. This project leverages Biome for lightning-fast linting/formatting and Vitest for a robust testing suite.

## 🚀 Tech Stack

- Runtime: Node.js v24
- Framework: Express.js (ESM)
- Package Manager: npm
- Linter/Formatter: Biome
- Test Runner: Vitest

## 🛠️ Getting Started

### Prerequisites

- Node.js v24.x or higher
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/Yanis-Kouidri/portfolio-backend.git
cd your-repo-backend
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env
```

## 💻 Development

This project uses the native Node.js 24 watch mode and env-file support to minimize external dependencies like nodemon or dotenv.

### Run locally

```bash
npm run dev
```


### Tests

```bash
npm run test
```

See coverage

```bash
npm run test:coverage
```

### Quality

```bash
npm run lint
```

### Update deps

```bash
npx npm-check-updates
```
