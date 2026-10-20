# Onyx MRO
**Reliability-Centered Maintenance, Repair, and Overhaul Management System**

Onyx MRO is an enterprise web application designed for fleet operators and industrial equipment maintenance teams. It delivers predictive maintenance scheduling, work order cost accounting, component lifecycle tracking, incident management with 4-pillar Root Cause Analysis (RCA), and Failure Mode and Effects Analysis (FMEA).

## Complete User Manual
- **Web App Manual**: Available directly at `/manual.html` (or `/user-manual.html`) when running or deploying the application.
- **In-App Access**: Click the **User Manual** button located directly above the Database Status indicator in the application sidebar.
- **Markdown Version**: Also available in the repository root as [USER_MANUAL.md](USER_MANUAL.md).

---

## Tech Stack & Architecture
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend / Database**: Supabase (PostgreSQL with real-time heartbeat and RPC procedures)

## Getting Started
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```


The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
