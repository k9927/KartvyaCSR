import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // MCA company search page
  await page.goto("https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do");

  // Fill CIN
  await page.type("#companyID", "L17110MH1973PLC019786");

  // Click submit
  await page.click("#submitBtn");

  // Wait for the results to appear
  await page.waitForSelector(".table.table-striped.table-bordered"); // The result table

  // Extract company name
  const companyName = await page.$eval("table.table.table-striped.table-bordered td:nth-child(2)", el => el.innerText.trim());

  console.log("Official company name from MCA:", companyName);

  await browser.close();
})();
