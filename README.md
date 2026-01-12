
# KPI Guard MVP

## Project Structure
- `index.html`: Entry HTML with Tailwind CSS.
- `index.tsx`: Main React entry point.
- `App.tsx`: Primary application logic and state management.
- `types.ts`: TypeScript interfaces for KPI data and analysis results.
- `services/geminiService.ts`: Integration with Gemini API for marketing analysis.
- `components/`: Modular UI components (Header, MetricCard, InputSection, AnalysisView).

## How to run locally
1. Ensure you have Node.js installed.
2. Create a new directory and initialize a React project or use a sandbox.
3. Install dependencies: `npm install @google/genai lucide-react clsx tailwind-merge`.
4. Add your Gemini API Key to your environment variables as `API_KEY`.
5. Start the development server: `npm start`.
6. Open your browser to the local server address.
