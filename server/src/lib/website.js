import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { config } from '../config.js';
import { isHttpUrl } from './sanitize.js';

/**
 * Fetches page HTML. Demo businesses ship with bundled offline snapshots so the
 * analyzer performs genuine HTML parsing without depending on live networks.
 * Returned `source` always states honestly where the HTML came from.
 */
export async function fetchWebsite(business) {
  const url = business?.website;
  const snapshot = business?.website_snapshot;

  if (snapshot) {
    const file = path.join(config.paths.snapshots, path.basename(snapshot));
    try {
      const html = await fs.readFile(file, 'utf8');
      return { ok: true, html, source: 'demo_snapshot', url: url || null, fetched_at: new Date().toISOString() };
    } catch {
      return { ok: false, source: 'demo_snapshot', url: url || null, error: 'Bundled demo snapshot could not be read.' };
    }
  }

  if (!isHttpUrl(url)) {
    return { ok: false, source: 'none', url: url || null, error: 'No usable website URL on record.' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.websiteFetchTimeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'FirmScoutAI/1.0 (+sales-intelligence-research)', Accept: 'text/html,*/*' },
    });
    if (!res.ok) {
      return { ok: false, source: 'live_fetch', url, error: `Website responded with HTTP ${res.status}.` };
    }
    const ct = res.headers.get('content-type') || '';
    if (ct && !ct.includes('html') && !ct.includes('text')) {
      return { ok: false, source: 'live_fetch', url, error: `Website returned unsupported content type (${ct.split(';')[0]}).` };
    }
    const html = (await res.text()).slice(0, 400_000);
    return { ok: true, html, source: 'live_fetch', url, fetched_at: new Date().toISOString() };
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'Website did not respond in time.' : 'Website could not be reached.';
    return { ok: false, source: 'live_fetch', url, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

const KEYWORDS = {
  booking: ['book now', 'book online', 'book an appointment', 'schedule appointment', 'request appointment', 'reserve', 'booking'],
  chat: ['live chat', 'chat with us', 'chatbot', 'whatsapp us', 'messenger', 'tawk.to', 'intercom', 'crisp.chat'],
  newsletter: ['newsletter', 'subscribe', 'join our mailing list', 'email updates'],
  ecommerce: ['add to cart', 'checkout', 'shopping cart', 'buy now', 'my basket'],
  crm: ['hubspot', 'salesforce', 'zoho', 'pipedrive', 'freshsales'],
  analytics: ['googletagmanager', 'google-analytics', 'gtag(', 'fbq(', 'hotjar', 'clarity.ms', 'plausible', 'matomo'],
  payments: ['stripe', 'paypal', 'razorpay', 'easypaisa', 'jazzcash', 'payfast'],
  pricing: ['pricing', 'our prices', 'packages', 'fee schedule', 'rates'],
  testimonials: ['testimonial', 'what our clients say', 'reviews', 'success stories'],
  blog: ['blog', 'articles', 'insights', 'news'],
};

function countMatches(haystack, needles) {
  return needles.filter((n) => haystack.includes(n));
}

/**
 * Rule-based structural analysis of real HTML. Every signal carries the evidence
 * that produced it, so nothing downstream is asserted without an observable reason.
 */
export function analyzeHtml(html, { url } = {}) {
  const $ = cheerio.load(html);
  $('script, style, noscript, template').each((_, el) => {
    if (el.tagName === 'script' || el.tagName === 'style') return; // keep for raw scan
  });

  const rawLower = html.toLowerCase();
  const title = ($('title').first().text() || '').trim().slice(0, 200);
  const metaDescription = ($('meta[name="description"]').attr('content') || '').trim().slice(0, 400);
  const h1s = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 5);

  const textNodes = cheerio.load(html);
  textNodes('script, style, noscript').remove();
  const visibleText = textNodes('body').text().replace(/\s+/g, ' ').trim();
  const textLower = visibleText.toLowerCase();

  const forms = $('form').length;
  const inputs = $('input, textarea, select').length;
  const images = $('img').length;
  const imagesWithoutAlt = $('img').filter((_, el) => !($(el).attr('alt') || '').trim()).length;
  const links = $('a[href]').length;
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;
  const hasFavicon = $('link[rel*="icon"]').length > 0;
  const scriptCount = $('script').length;

  const telLinks = $('a[href^="tel:"]').length;
  const mailLinks = $('a[href^="mailto:"]').length;
  const waLinks = $('a[href*="wa.me"], a[href*="api.whatsapp.com"]').length;
  const socialLinks = $('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="x.com"], a[href*="youtube.com"]').length;

  const bookingHits = countMatches(textLower, KEYWORDS.booking);
  const chatHits = countMatches(rawLower, KEYWORDS.chat);
  const newsletterHits = countMatches(textLower, KEYWORDS.newsletter);
  const ecommerceHits = countMatches(textLower, KEYWORDS.ecommerce);
  const crmHits = countMatches(rawLower, KEYWORDS.crm);
  const analyticsHits = countMatches(rawLower, KEYWORDS.analytics);
  const paymentHits = countMatches(rawLower, KEYWORDS.payments);
  const pricingHits = countMatches(textLower, KEYWORDS.pricing);
  const testimonialHits = countMatches(textLower, KEYWORDS.testimonials);
  const blogHits = countMatches(textLower, KEYWORDS.blog);

  const isHttps = typeof url === 'string' && url.startsWith('https://');

  const signals = {
    presence: {
      has_website: true,
      https: isHttps,
      has_title: Boolean(title),
      has_meta_description: Boolean(metaDescription),
      mobile_viewport: hasViewportMeta,
      has_favicon: hasFavicon,
      social_links: socialLinks,
      word_count: visibleText.split(' ').filter(Boolean).length,
    },
    conversion: {
      contact_form: forms > 0,
      form_count: forms,
      input_count: inputs,
      online_booking: bookingHits.length > 0,
      phone_click_to_call: telLinks > 0,
      email_link: mailLinks > 0,
      whatsapp_link: waLinks > 0,
      pricing_visible: pricingHits.length > 0,
      testimonials: testimonialHits.length > 0,
      ecommerce_checkout: ecommerceHits.length > 0,
      payment_provider: paymentHits.length > 0,
    },
    automation: {
      live_chat_or_bot: chatHits.length > 0,
      newsletter_capture: newsletterHits.length > 0,
      crm_detected: crmHits.length > 0,
      analytics_detected: analyticsHits.length > 0,
      content_engine: blogHits.length > 0,
    },
    quality: {
      images: images,
      images_missing_alt: imagesWithoutAlt,
      internal_links: links,
      script_tags: scriptCount,
      thin_content: visibleText.length < 800,
      heading_structure_ok: h1s.length >= 1 && h1s.length <= 3,
    },
  };

  const evidence = [];
  const note = (key, text) => evidence.push({ signal: key, evidence: text });

  note('title', title ? `<title> is "${title}"` : 'Page has no <title> element');
  if (!metaDescription) note('meta_description', 'No <meta name="description"> found in the HTML head');
  if (!hasViewportMeta) note('mobile_viewport', 'No <meta name="viewport"> tag — page is not configured for mobile scaling');
  note('forms', forms > 0 ? `${forms} <form> element(s) with ${inputs} input field(s)` : 'No <form> elements found anywhere on the page');
  if (bookingHits.length) note('online_booking', `Booking language present: ${bookingHits.slice(0, 3).join(', ')}`);
  else note('online_booking', 'No online booking or appointment-scheduling language found in page text');
  if (chatHits.length) note('live_chat_or_bot', `Chat/bot markers found in markup: ${chatHits.slice(0, 3).join(', ')}`);
  else note('live_chat_or_bot', 'No live chat, chatbot or messaging widget markers found in the markup');
  if (analyticsHits.length) note('analytics', `Analytics/tag markers found: ${analyticsHits.slice(0, 3).join(', ')}`);
  else note('analytics', 'No analytics or tag-manager scripts detected in the markup');
  if (crmHits.length) note('crm', `CRM markers found: ${crmHits.join(', ')}`);
  if (newsletterHits.length) note('newsletter_capture', `Email capture language found: ${newsletterHits.slice(0, 2).join(', ')}`);
  else note('newsletter_capture', 'No newsletter or email-capture language found');
  if (telLinks) note('click_to_call', `${telLinks} tel: link(s) present`);
  else note('click_to_call', 'No tel: click-to-call links found');
  if (waLinks) note('whatsapp', `${waLinks} WhatsApp deep link(s) present`);
  if (paymentHits.length) note('payments', `Payment provider markers: ${paymentHits.join(', ')}`);
  if (ecommerceHits.length) note('ecommerce', `Cart/checkout language: ${ecommerceHits.slice(0, 3).join(', ')}`);
  if (pricingHits.length) note('pricing', `Pricing language present: ${pricingHits.slice(0, 2).join(', ')}`);
  else note('pricing', 'No pricing, packages or rates language found on the page');
  if (imagesWithoutAlt) note('accessibility', `${imagesWithoutAlt} of ${images} <img> tags have no alt text`);
  if (signals.quality.thin_content) note('content_depth', `Visible text is only ${visibleText.length} characters — very thin content`);

  const scores = scoreWebsite(signals);

  return {
    url: url || null,
    title,
    meta_description: metaDescription,
    h1: h1s,
    signals,
    evidence,
    scores,
    extracted_text: visibleText.slice(0, config.websiteTextLimit),
    parsed_at: new Date().toISOString(),
  };
}

/** 0-100 sub-scores derived only from observed signals. */
function scoreWebsite(s) {
  const presence =
    (s.presence.has_title ? 15 : 0) +
    (s.presence.has_meta_description ? 15 : 0) +
    (s.presence.https ? 15 : 0) +
    (s.presence.mobile_viewport ? 20 : 0) +
    (s.presence.has_favicon ? 5 : 0) +
    Math.min(s.presence.social_links * 5, 15) +
    (s.presence.word_count > 300 ? 15 : s.presence.word_count > 120 ? 8 : 0);

  const conversion =
    (s.conversion.contact_form ? 20 : 0) +
    (s.conversion.online_booking ? 20 : 0) +
    (s.conversion.phone_click_to_call ? 12 : 0) +
    (s.conversion.whatsapp_link ? 10 : 0) +
    (s.conversion.email_link ? 6 : 0) +
    (s.conversion.pricing_visible ? 10 : 0) +
    (s.conversion.testimonials ? 10 : 0) +
    (s.conversion.ecommerce_checkout ? 6 : 0) +
    (s.conversion.payment_provider ? 6 : 0);

  const automation =
    (s.automation.live_chat_or_bot ? 30 : 0) +
    (s.automation.newsletter_capture ? 20 : 0) +
    (s.automation.crm_detected ? 25 : 0) +
    (s.automation.analytics_detected ? 15 : 0) +
    (s.automation.content_engine ? 10 : 0);

  const quality =
    (s.quality.heading_structure_ok ? 25 : 0) +
    (s.quality.thin_content ? 0 : 30) +
    (s.quality.images > 0 && s.quality.images_missing_alt === 0 ? 20 : s.quality.images_missing_alt > 0 ? 5 : 10) +
    (s.quality.internal_links >= 8 ? 25 : s.quality.internal_links >= 3 ? 12 : 0);

  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
  return {
    presence: clamp(presence),
    conversion: clamp(conversion),
    automation: clamp(automation),
    quality: clamp(quality),
    overall: clamp((presence + conversion + automation + quality) / 4),
  };
}
