import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/tests/setup.js'],
    include: ['src/tests/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage/frontend',
      include: [
        'src/utils/**/*.js', 
        'src/pages/AdminLogin.jsx', 
        'src/pages/AdminDashboard.jsx',
        'src/pages/Login.jsx',
        'src/pages/UserDashboard.jsx',
        'src/pages/Questionnaire.jsx',
        'src/pages/Results.jsx'
      ]
    }
  }
});
