import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]`, msg.text()));
page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

console.log('Navigating to http://localhost:4200...');
await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(3000);

console.log('\n--- Page title:', await page.title());
console.log('--- URL:', page.url());
console.log('--- Body text:', (await page.textContent('body')).trim().substring(0, 500));

const html = await page.content();
console.log('\n--- HTML length:', html.length);
console.log('--- Has app-root:', html.includes('app-root'));
console.log('--- Has navbar:', html.includes('navbar'));
console.log('--- Has router-outlet:', html.includes('router-outlet'));

// Check if merchant list rendered
const merchants = await page.locator('table tbody tr').count();
console.log('--- Table rows:', merchants);

// Take screenshot
await page.screenshot({ path: '/Users/enriquecordero/Documents/acquirer-lite/screenshot.png', fullPage: true });
console.log('\n--- Screenshot saved to screenshot.png');

await browser.close();
