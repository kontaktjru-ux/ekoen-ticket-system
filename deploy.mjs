import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 1. Budowanie aplikacji Vite...');
execSync('npm run build', { stdio: 'inherit' });

console.log('📦 2. Przygotowywanie plików dla Google Apps Script...');
const oldHtmlPath = 'dist/index.html';
const newHtmlPath = 'dist/Index.html';

// 1. Odczyt wygenerowanego przez Vite pliku
const htmlContent = fs.readFileSync(oldHtmlPath, 'utf8');

const gasPayload = `
    <!-- INITIAL PAYLOAD Z GOOGLE APPS SCRIPT -->
    <script>
      window.SERVER_PAYLOAD = {
        schedule: <?!= (typeof scheduleDataInit !== 'undefined' && scheduleDataInit) ? scheduleDataInit : 'null' ?>,
        clients: <?!= (typeof clientsDataInit !== 'undefined' && clientsDataInit) ? clientsDataInit : 'null' ?>,
        billings: <?!= (typeof billingsDataInit !== 'undefined' && billingsDataInit) ? billingsDataInit : 'null' ?>,
        axon: <?!= (typeof axonDataInit !== 'undefined' && axonDataInit) ? axonDataInit : 'null' ?>,
        ekoen: <?!= (typeof ekoenDataInit !== 'undefined' && ekoenDataInit) ? ekoenDataInit : 'null' ?>,
        mapData: <?!= (typeof mapDataInit !== 'undefined' && mapDataInit) ? mapDataInit : 'null' ?>,
        technicians: <?!= (typeof techniciansDataInit !== 'undefined' && techniciansDataInit) ? techniciansDataInit : 'null' ?>,
        storage: <?!= (typeof storageDataInit !== 'undefined' && storageDataInit) ? storageDataInit : 'null' ?>
      };
    </script>
`;

let finalHtml = htmlContent;
if (finalHtml.includes('</head>')) {
  finalHtml = finalHtml.replace('</head>', gasPayload + '\n</head>');
} else if (finalHtml.includes('<body>')) {
  finalHtml = finalHtml.replace('<body>', '<body>\n' + gasPayload);
} else {
  finalHtml = gasPayload + '\n' + finalHtml;
}

// 2. NAJPIERW USUŃ STARY PLIK (żeby Windows się nie pogubił)
if (fs.existsSync(oldHtmlPath)) {
  fs.unlinkSync(oldHtmlPath);
}

// 3. DOPIERO TERAZ ZAPISZ NOWY PLIK
fs.writeFileSync(newHtmlPath, finalHtml);
console.log('✅ Zapisano poprawnie dist/Index.html');

// 4. BEZPIECZNE KOPIOWANIE BACKENDU DO DIST
if (!fs.existsSync('Code.gs')) {
  console.error('❌ BŁĄD: Nie znaleziono pliku Code.gs w głównym folderze projektu!');
  process.exit(1);
}
fs.copyFileSync('Code.gs', 'dist/Code.gs');

if (!fs.existsSync('appsscript.json')) {
  console.error('❌ BŁĄD: Nie znaleziono pliku appsscript.json w głównym folderze projektu!');
  process.exit(1);
}
fs.copyFileSync('appsscript.json', 'dist/appsscript.json');

console.log('✅ Pliki backendu skopiowane do folderu dist/');

console.log('☁️ 3. Wysyłanie kodu do chmury Google...');
execSync('npx clasp push -f', { stdio: 'inherit' });

console.log('✅ Wdrożenie zakończone sukcesem!');