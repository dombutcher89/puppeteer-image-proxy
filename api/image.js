import { chromium } from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const { img } = req.query;

  if (!img) {
    res.status(400).send("Missing 'img' query parameter");
    return;
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: null,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(img, {
      waitUntil: 'networkidle2',
    });

    // Get the image content directly
    const content = await page.evaluate(() => {
      const imgTag = document.querySelector('img');
      return imgTag ? imgTag.src : null;
    });

    if (!content) {
      await browser.close();
      return res.status(404).send("Image not found on page");
    }

    const viewSource = await page.goto(content);
    const buffer = await viewSource.buffer();
    const type = viewSource.headers()['content-type'] || 'image/jpeg';

    await browser.close();

    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).send("Error loading image: " + err.message);
  }
}
