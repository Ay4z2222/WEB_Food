import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  console.log('Launching Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Customer View
  console.log('Capturing Customer View...');
  await page.setViewport({ width: 420, height: 920, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3001/?table=table-2&token=U1JG3F&view=customer', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(__dirname, 'shot_customer.png') });

  // 2. Kitchen View
  console.log('Capturing Kitchen View...');
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3001/?view=kitchen', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(__dirname, 'shot_kitchen.png') });

  // 3. Cashier View
  console.log('Capturing Cashier View...');
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3001/?view=cashier', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(__dirname, 'shot_cashier.png') });

  // 4. QR Modal
  console.log('Capturing QR Modal...');
  // Click the QR button on Table 2
  try {
    const qrBtn = await page.waitForSelector('button[title="ดู QR Code"]', { timeout: 3000 });
    if (qrBtn) {
      await qrBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      await page.screenshot({ path: path.join(__dirname, 'shot_qr_modal.png') });
    }
  } catch (e) {
    console.log('QR button click error:', e.message);
  }

  await browser.close();
  console.log('Screenshots captured successfully!');
}

run().catch((e) => console.error(e));
