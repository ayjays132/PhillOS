import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import fs from 'fs';
import puppeteer from 'puppeteer';

const distDir = path.resolve(__dirname, '../../dist');
let server: http.Server;
let browser: Awaited<ReturnType<typeof puppeteer.launch>>;

function serveStatic(root: string) {
  return http.createServer((req, res) => {
    const filePath = path.join(root, req?.url === '/' ? '/index.html' : req!.url!);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('not found');
      } else {
        res.end(data);
      }
    });
  });
}

describe('service worker caching', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      const build = spawn('npx', ['vite', 'build'], { stdio: 'inherit' });
      build.on('exit', code => (code === 0 ? resolve() : reject(new Error('build'))));
    });
    server = serveStatic(distDir).listen(3000);
    browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  }, 60000);

  afterAll(async () => {
    await browser.close();
    server.close();
  });

  it('loads app while offline after first visit', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => navigator.serviceWorker.controller); // sw ready
    await page.setOfflineMode(true);
    await page.reload({ waitUntil: 'networkidle0' });
    const title = await page.title();
    expect(title).toMatch(/PhillOS/);
  }, 30000);
});
