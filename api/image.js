import { chromium } from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const img = req.query.img;

  if (!img) {
    return res.status(400).send("Missing 'img' query parameter");
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.goto(img, { waitUntil: 'networkidle2', timeout: 15000 });

    // Try to extract the first image on the page
    const imageUrl = await page.evaluate(() => {
      const imgTag = document.querySelector('img');
      return imgTag ? imgTag.src : null;
    });

    if (!imageUrl) {
      await browser.close();
      return res.status(404).send("No image found on page.");
    }

    const imageResp = await page.goto(imageUrl);
    const buffer = await imageResp.buffer();
    const contentType = imageResp.headers()['content-type'] || 'image/jpeg';

    await browser.close();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).send("Error loading image: " + err.message);
  }
}
