import { chromium } from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const img = req.query.img;
  if (!img) return res.status(400).send("Missing 'img' query parameter");

  try {
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args || [],
      executablePath,
      headless: chromium.headless,
      defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.goto(img, { waitUntil: "networkidle2", timeout: 20000 });

    const imageURL = await page.evaluate(() => {
      const imgTag = document.querySelector("img");
      return imgTag ? imgTag.src : null;
    });

    if (!imageURL) {
      await browser.close();
      return res.status(404).send("No image found");
    }

    const response = await page.goto(imageURL);
    const buffer = await response.buffer();
    const contentType = response.headers()["content-type"] || "image/jpeg";

    await browser.close();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).send("Error loading image: " + err.message);
  }
}
