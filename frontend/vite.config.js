import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['socket.io-client'],

          // Feature-based chunks
          'auth': [
            './src/auth/Login.jsx',
            './src/auth/Register.jsx',
            './src/auth/AdminLogin.jsx',
            './src/auth/useAuthStore.js'
          ],
          'client-pages': [
            './src/pages/client/Dashboard.jsx',
            './src/pages/client/TicketCreate.jsx',
            './src/pages/client/TicketView.jsx',
            './src/pages/client/TicketDetailView.jsx',
            './src/pages/client/Profile.jsx'
          ],
          'admin-pages': [
            './src/pages/superadmin/Dashboard.jsx',
            './src/pages/superadmin/ClientsView.jsx',
            './src/pages/superadmin/TicketsView.jsx',
            './src/pages/superadmin/SuperAdminTicketDetailPage.jsx'
          ],
          'company-pages': [
            './src/pages/superadmin/CompaniesView.jsx',
            './src/pages/superadmin/CreateCompany.jsx',
            './src/pages/superadmin/CompanyDetailView.jsx',
            './src/pages/superadmin/EditCompany.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600, // Increase warning limit to 600kb
    minify: 'terser', // Use terser for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  }
});
