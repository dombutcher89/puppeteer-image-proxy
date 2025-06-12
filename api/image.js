export default async function handler(req, res) {
  const img = req.query.img;
  if (!img) return res.status(400).send("Missing 'img' query param");

  const response = await fetch("https://proxy.scrapeops.io/v1/", {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "11d03ff8-2cb5-4f1e-99cf-62d83886d4e4"
    },
    method: "POST",
    body: JSON.stringify({ url: img, bypass: "cloudflare_level_1" })
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(502).send(`ScrapeOps error: ${text}`);
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "image/jpeg";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(Buffer.from(buffer));
}
