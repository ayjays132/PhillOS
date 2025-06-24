#!/usr/bin/env node
const fs = require('fs');
const { pipeline } = require('@xenova/transformers');

async function main() {
  const file = process.argv[2];
  if (!file) { console.log('[]'); return; }
  const text = fs.readFileSync(file, 'utf8');
  const classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');
  const labels = ['notes','code','media','docs','todo','other'];
  const result = await classifier(text.slice(0, 1000), { candidate_labels: labels });
  console.log(JSON.stringify(result.labels.slice(0, 3)));
}
main();
