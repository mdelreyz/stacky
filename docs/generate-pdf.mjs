import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
await page.goto(`file://${join(__dirname, "instructions.html")}`, {
  waitUntil: "networkidle0",
});
await page.pdf({
  path: join(__dirname, "instructions.pdf"),
  format: "A4",
  printBackground: true,
  margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
});
await browser.close();
console.log("PDF generated: docs/instructions.pdf");
