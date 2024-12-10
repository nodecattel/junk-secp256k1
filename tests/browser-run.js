const puppeteer = require('puppeteer');
const browserify = require('browserify');
const path = require('path');
const fs = require('fs');

// Bundle browser tests
(async () => {
  try {
    console.log('Creating browser test bundle...');
    const b = browserify({
      entries: [path.join(__dirname, 'index.js')],
      paths: [path.join(__dirname, '..')],
      builtins: true,
      browserField: true,
      debug: true,
    });

    const outputDir = path.join(__dirname, 'browser');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const bundleStream = fs.createWriteStream(path.join(outputDir, 'tests.js'));
    b.bundle().pipe(bundleStream);

    // Wait for bundle to finish
    await new Promise((resolve) => bundleStream.on('finish', resolve));

    console.log('Browser test bundle created');

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const filePath = 'file://' + path.join(outputDir, 'index.html');

    console.log(`Loading test file: ${filePath}`);
    await page.goto(filePath, { waitUntil: 'load' });

    console.log('Running tests...');
    const results = await page.evaluate(() => document.body.innerText);

    console.log('Test results:');
    console.log(results);

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during browser tests:', error);
    process.exit(1);
  }
})();
