const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });
  await page.goto("http://localhost:3000/connexion", { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', "fofana@gmail.com", { delay: 20 });
  await page.type('input[type="password"]', "fofana@gmail.com", { delay: 20 });
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => null),
  ]);

  await page.goto("http://localhost:3000/pages/serviceaccueil/guide", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: "public/guide/_svc-preview-accueil.png" });

  // Expand first point
  await page.evaluate(() => {
    const btn = document.querySelector("button.accordion-button");
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: "public/guide/_svc-preview-accueil-expanded.png", fullPage: true });

  await browser.close();
})();
