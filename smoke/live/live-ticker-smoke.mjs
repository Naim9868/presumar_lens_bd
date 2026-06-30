// Live ticker smoke test (polling path)
// Strategy:
//  1. Probe /api/admin/analytics/orders?source=db and capture liveOrdersTicker IDs.
//  2. Pick a real Product._id from /api/admin/analytics/products?source=db.
//  3. POST /api/orders to create a real order using that Product.
//  4. Re-probe /api/admin/analytics/orders?source=db, verify the new orderId
//     appears in liveOrdersTicker (proves DB mode is wired, polling fallback works).
//
// NOTE: socket.io order:new is not wired (no custom server). This test verifies
//       the polling fallback path that AnalyticsContext uses in `live` strategy.

import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const log = (...a) => console.log('[live-ticker]', ...a);

async function getJson(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

async function postJson(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  let json; try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
  return { status: r.status, body: json };
}

function fail(msg) { console.error('[live-ticker][FAIL]', msg); process.exit(1); }
function ok(msg) { console.log('[live-ticker][OK]', msg); }

(async () => {
  // 1. Baseline live ticker (DB mode).
  // Use preset=custom with DATE-ONLY from/to (parseISODate splits on '-' and
  // truncates anything after the day). Pair with the orders route's end-of-day
  // extension so today's freshly-created orders are included.
  const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const rangeQS = `preset=custom&from=${todayIso}&to=${tomorrowIso}`;
  const before = await getJson(`/api/admin/analytics/orders?source=db&${rangeQS}`);
  const beforeIds = new Set((before.liveOrdersTicker || []).map(t => t.id));
  log(`baseline ticker count = ${beforeIds.size}, first 3 ids =`,
      [...beforeIds].slice(0, 3));

  // 2. Pick a real Product._id from products analytics.
  const products = await getJson('/api/admin/analytics/products?source=db&preset=7d');
  const candidate = (products.topSellers || []).find(p => p.id && p.id.length === 24);
  if (!candidate) fail('No 24-char Product._id found in /api/admin/analytics/products');
  const productId = candidate.id;
  log(`using productId = ${productId} (${candidate.name})`);

  // 3. POST /api/orders.
  const stamp = Date.now();
  const payload = {
    guestEmail: `smoke+${stamp}@example.com`,
    items: [{
      productId,
      quantity: 1,
      snapshot: {
        name: candidate.name,
        slug: `smoke-${stamp}`,
      },
      price: { original: 1500, sale: 1500 },
    }],
    pricing: {
      subtotal: 1500,
      itemDiscount: 0,
      couponDiscount: 0,
      campaignDiscount: 0,
      deliveryCharge: 60,
      tax: 0,
      total: 1560,
    },
    shipping: {
      name: 'Smoke Tester',
      phone: `017${String(stamp).slice(-8)}`,
      address: 'Smoke Lane 1',
      area: 'Dhanmondi',
      city: 'Dhaka',
    },
    deliveryType: 'INSIDE_DHAKA',
    paymentMethod: 'COD',
  };
  const post = await postJson('/api/orders', payload);
  if (post.status !== 201 && post.status !== 200) {
    fail(`POST /api/orders -> ${post.status}: ${JSON.stringify(post.body).slice(0, 200)}`);
  }
  const newOrderId = post.body?.data?.order?.orderId
    || post.body?.order?.orderId
    || post.body?.orderId;
  if (!newOrderId) fail(`no orderId in response: ${JSON.stringify(post.body).slice(0, 200)}`);
  ok(`created orderId = ${newOrderId}`);

  // 4. Re-probe orders analytics — expect newOrderId in liveOrdersTicker.
  let after;
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    after = await getJson(`/api/admin/analytics/orders?source=db&${rangeQS}`);
    const afterIds = (after.liveOrdersTicker || []).map(t => t.id);
    if (afterIds.includes(newOrderId)) break;
    attempts++;
    log(`attempt ${attempts}/${maxAttempts}: ticker not yet refreshed, waiting 3s…`);
    await new Promise(r => setTimeout(r, 3000));
  }
  const afterIds = (after.liveOrdersTicker || []).map(t => t.id);
  const tickerEntry = (after.liveOrdersTicker || []).find(t => t.id === newOrderId);

  // 5. Assertions.
  const tickerHasIt = afterIds.includes(newOrderId);
  const cityOk = tickerEntry && tickerEntry.city === 'Dhaka';
  const amountOk = tickerEntry && tickerEntry.amount === 1560;
  const customerOk = tickerEntry && tickerEntry.customer === 'Smoke Tester';

  log('result:');
  log('  tickerHasIt =', tickerHasIt, `(${newOrderId})`);
  log('  cityOk      =', cityOk, `(got ${tickerEntry?.city})`);
  log('  amountOk    =', amountOk, `(got ${tickerEntry?.amount})`);
  log('  customerOk  =', customerOk, `(got ${tickerEntry?.customer})`);

  writeFileSync('smoke/live/last-run.json', JSON.stringify({ before, post, after }, null, 2));

  if (!tickerHasIt) fail('liveOrdersTicker did not include the new orderId');
  if (!cityOk || !amountOk || !customerOk) fail('ticker entry fields mismatch');
  ok('live ticker shows new order with correct customer / city / amount');
})().catch(err => fail(err.stack || err.message));