import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// --- Active Case Correction for Vercel/Linux environments ---
// Programmatically detects and renames directories like "Src" or "Admin" to lowercase 
// to prevent case-sensitivity errors on Vercel's build container.
const ensureLowercaseDirectory = (dirName: string) => {
  try {
    const root = process.cwd();
    if (!fs.existsSync(root)) return;
    const files = fs.readdirSync(root);
    const found = files.find(f => f.toLowerCase() === dirName.toLowerCase());
    if (found && found !== dirName) {
      const foundPath = path.join(root, found);
      const tempPath = path.join(root, `${dirName}_temp_case_${Date.now()}`);
      const correctPath = path.join(root, dirName);
      console.log(`[Casing Corrector]: Renaming directory "${found}" to "${dirName}" to fix Vercel/Linux builds.`);
      fs.renameSync(foundPath, tempPath);
      fs.renameSync(tempPath, correctPath);
      console.log(`[Casing Corrector]: Renamed "${found}" to "${dirName}" successfully.`);
    }
  } catch (err: any) {
    console.error(`[Casing Corrector Error] for "${dirName}":`, err.message);
  }
};

ensureLowercaseDirectory('src');
ensureLowercaseDirectory('admin');

export default defineConfig(() => {
  // --- Case-Insensitive Path Resolver Helper ---
  const findCaseSensitivePath = (base: string, relativePath: string): string | null => {
    const segments = relativePath.split(/[/\\]/);
    let currentPath = base;

    for (const segment of segments) {
      if (!segment) continue;
      try {
        if (!fs.existsSync(currentPath)) return null;
        const files = fs.readdirSync(currentPath);
        const match = files.find(f => f.toLowerCase() === segment.toLowerCase());
        if (!match) return null;
        currentPath = path.join(currentPath, match);
      } catch {
        return null;
      }
    }
    return currentPath;
  };

  // --- Temporary Debug Diagnostics for Case Sensitivity on Vercel ---
  console.log("------------------ VERCEL BUILD PROCESS DIAGNOSTICS ------------------");
  console.log("process.cwd():", process.cwd());
  console.log("__dirname:", __dirname);
  try {
    const rootFiles = fs.readdirSync(process.cwd());
    console.log("Root directory contents:", rootFiles);
    
    // Check for src directory casing
    const srcDirName = rootFiles.find(name => name.toLowerCase() === 'src');
    if (srcDirName) {
      console.log(`Found Src directory named: "${srcDirName}"`);
      console.log(`"${srcDirName}" contents:`, fs.readdirSync(path.join(process.cwd(), srcDirName)));
    } else {
      console.log("No directory named 'src' or 'Src' found in root.");
    }

    // Check for admin directory casing
    const adminDirName = rootFiles.find(name => name.toLowerCase() === 'admin');
    if (adminDirName) {
      console.log(`Found Admin directory named: "${adminDirName}"`);
      console.log(`"${adminDirName}" contents:`, fs.readdirSync(path.join(process.cwd(), adminDirName)));
    } else {
      console.log("No directory named 'admin' or 'Admin' found in root.");
    }
  } catch (err: any) {
    console.log("Diagnostics failure:", err.message);
  }
  console.log("----------------------------------------------------------------------");

  // --- Dynamic HTML Input Finder ---
  // This automatically finds all HTML entry points with exact case preservation, avoiding any missing module errors.
  const findHtmlInputs = (dir: string): Record<string, string> => {
    const inputs: Record<string, string> = {};
    const explore = (currentPath: string) => {
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // Avoid scanning directories we don't want to include
          if (['node_modules', 'dist', 'build', '.git', 'src'].includes(item.toLowerCase())) {
            continue;
          }
          explore(fullPath);
        } else if (item.toLowerCase().endsWith('.html')) {
          const relativePath = path.relative(process.cwd(), fullPath);
          const name = relativePath
            .replace(/\.html$/i, '')
            .replace(/[\\/]/g, '_')
            .toLowerCase();
          inputs[name] = fullPath;
        }
      }
    };
    explore(dir);
    return inputs;
  };

  const inputs = findHtmlInputs(process.cwd());
  console.log("Dynamically registered Vite input modules:", inputs);

  // A custom resolver plugin to prevent Vercel case sensitivity errors in files & modules (e.g., /src/app.js)
  const caseInsensitiveResolverPlugin = {
    name: 'case-insensitive-resolver',
    resolveId(source: string, importer: string | undefined) {
      if (source.startsWith('/') || source.startsWith('.') || source.includes('src/') || source.includes('admin/')) {
        // Clean leading slash and any bundle queries
        const cleaned = source.split('?')[0].replace(/^\//, '');
        if (cleaned.startsWith('src/') || cleaned.startsWith('admin/') || cleaned.includes('/src/') || cleaned.includes('/admin/')) {
          const relativePath = cleaned.includes('src/') 
            ? cleaned.substring(cleaned.indexOf('src/')) 
            : cleaned.substring(cleaned.indexOf('admin/'));
          
          const resolved = findCaseSensitivePath(process.cwd(), relativePath);
          if (resolved) {
            return resolved;
          }
        }
      }
      return null;
    }
  };

  return {
    plugins: [caseInsensitiveResolverPlugin, react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: inputs
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
