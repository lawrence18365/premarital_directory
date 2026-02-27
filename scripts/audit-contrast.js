/**
 * Automated WCAG contrast audit across all CSS files.
 * Resolves CSS custom properties, finds every color + background-color pair,
 * and flags combinations that fail WCAG AA (< 4.5:1 for normal text, < 3:1 for large text).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_DIR = path.join(__dirname, '..', 'client', 'src');

// ── Color parsing ─────────────────────────────────────────────────────

// Resolved CSS custom properties (from enterprise-theme.css + main.css)
const CSS_VARS = {
  '--ds-accent': '#0e5e5e',
  '--ds-accent-strong': '#0b4949',
  '--ds-accent-soft': 'rgba(14, 94, 94, 0.08)',
  '--ds-bg': '#eef6f6',
  '--ds-bg-soft': '#f6fbfb',
  '--ds-surface': '#ffffff',
  '--ds-surface-muted': '#f4f9f9',
  '--ds-ink': '#0b3e3e',
  '--ds-ink-muted': 'rgba(11, 62, 62, 0.78)',
  '--ds-border': 'rgba(14, 94, 94, 0.16)',
  '--ds-border-strong': 'rgba(14, 94, 94, 0.24)',
  '--primary': '#0e5e5e',
  '--primary-light': '#16706f',
  '--primary-dark': '#0b4949',
  '--secondary': '#4d7e77',
  '--secondary-light': '#6f9e97',
  '--secondary-dark': '#0e5e5e',
  '--accent': '#0e5e5e',
  '--accent-light': '#1a7373',
  '--accent-dark': '#0b4949',
  '--neutral-light': '#f6fbfb',
  '--neutral': '#ffffff',
  '--neutral-mid': '#d7e6e6',
  '--neutral-dark': '#0b3e3e',
  '--slate': 'rgba(11, 62, 62, 0.72)',
  '--mist': '#d9e7e7',
  '--gray-light': '#edf3f3',
  '--gray-medium': '#4a6464',
  '--gray-dark': '#0b3e3e',
  '--gray-25': '#fbfdfd',
  '--gray-50': '#f6fbfb',
  '--gray-100': '#edf5f5',
  '--gray-200': '#dbe9e9',
  '--gray-300': '#b0cbcb',
  '--gray-400': '#7a9999',
  '--gray-500': '#527070',
  '--gray-600': '#3d5c5c',
  '--gray-700': '#2d4747',
  '--gray-800': '#1c3636',
  '--gray-900': '#0f2d2d',
  '--text-primary': '#0b3e3e',
  '--text-secondary': 'rgba(11, 62, 62, 0.72)',
  '--text-muted': '#4a6464',
  '--text-tertiary': '#4a6464',
  '--color-primary': '#0e5e5e',
  '--color-teal': '#0e5e5e',
  '--white': '#ffffff',
  '--bg-primary': '#ffffff',
  '--bg-secondary': '#f4f9f9',
  '--background': '#ffffff',
  '--background-secondary': '#f4f9f9',
  '--background-highlight': 'rgba(14, 94, 94, 0.1)',
  '--card-color': '#ffffff',
  '--success': '#0a7a5a',
  '--warning': '#92600a',
  '--error': '#b91c1c',
  '--danger': '#b91c1c',
  '--coral': '#0e5e5e',
  '--coral-light': 'rgba(14, 94, 94, 0.1)',
  '--coral-dark': '#0b4949',
  '--teal': '#0e5e5e',
  '--teal-light': '#16706f',
  '--teal-dark': '#0b4949',
  '--blue': '#0e5e5e',
  '--gold': '#0e5e5e',
  '--gold-light': '#8ab1ab',
  '--specialty-color': '#0e5e5e',
  '--border': '#d7e6e6',
  '--border-color': 'rgba(14, 94, 94, 0.16)',
  '--charcoal': '#0b3e3e',
  '--navy': '#0e5e5e',
};

function resolveVar(value) {
  if (!value) return null;
  let resolved = value.trim();
  let depth = 0;
  while (resolved.includes('var(') && depth < 10) {
    resolved = resolved.replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]+))?\)/gi, (_, name, fallback) => {
      return CSS_VARS[name] || fallback || '';
    });
    depth++;
  }
  return resolved;
}

function parseHex(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length === 8) hex = hex.slice(0, 6); // strip alpha
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: 1
  };
}

function parseRgba(str) {
  const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

function parseColor(raw) {
  if (!raw) return null;
  const s = resolveVar(raw);
  if (!s) return null;
  
  // Named colors
  const named = {
    'white': '#ffffff', 'black': '#000000', 'transparent': null,
    'red': '#ff0000', 'green': '#008000', 'blue': '#0000ff',
    'gray': '#808080', 'grey': '#808080', 'inherit': null, 'currentcolor': null,
    'initial': null, 'unset': null, 'none': null,
  };
  const lower = s.toLowerCase().trim();
  if (named[lower] !== undefined) {
    return named[lower] ? parseHex(named[lower]) : null;
  }

  if (s.startsWith('#')) return parseHex(s);
  if (s.startsWith('rgb')) return parseRgba(s);
  
  // Try to find a hex or rgb inside
  const hexMatch = s.match(/#[0-9a-fA-F]{3,8}/);
  if (hexMatch) return parseHex(hexMatch[0]);
  const rgbMatch = s.match(/rgba?\([^)]+\)/);
  if (rgbMatch) return parseRgba(rgbMatch[0]);
  
  return null;
}

// Blend semi-transparent foreground onto background
function blendOnto(fg, bg) {
  if (!fg || !bg) return fg;
  if (fg.a >= 1) return fg;
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    a: 1
  };
}

// ── WCAG luminance & contrast ─────────────────────────────────────────

function luminance(rgb) {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(c1, c2) {
  const l1 = luminance(c1);
  const l2 = luminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function colorToStr(c) {
  if (!c) return '?';
  if (c.a < 1) return `rgba(${c.r},${c.g},${c.b},${c.a})`;
  return `#${c.r.toString(16).padStart(2,'0')}${c.g.toString(16).padStart(2,'0')}${c.b.toString(16).padStart(2,'0')}`;
}

// ── CSS parsing ───────────────────────────────────────────────────────

function extractRules(css) {
  // Strip comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  const results = [];
  // Match rule blocks: selector { ... }
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match;
  while ((match = ruleRegex.exec(css))) {
    const selector = match[1].trim();
    const body = match[2];
    
    const props = {};
    const declRegex = /([\w-]+)\s*:\s*([^;]+)/g;
    let dm;
    while ((dm = declRegex.exec(body))) {
      props[dm[1].trim().toLowerCase()] = dm[2].trim().replace(/\s*!important\s*$/, '');
    }
    results.push({ selector, props });
  }
  return results;
}

// ── Inline styles in JSX ──────────────────────────────────────────────

function extractInlineStyles(jsx) {
  const results = [];
  // Match style={{ ... }} patterns
  const styleRegex = /style=\{\{([^}]+)\}\}/g;
  let match;
  while ((match = styleRegex.exec(jsx))) {
    const block = match[1];
    const props = {};
    // Parse JS object: key: 'value' or key: "value"
    const propRegex = /(\w+)\s*:\s*['"]([^'"]+)['"]/g;
    let pm;
    while ((pm = propRegex.exec(block))) {
      const cssProp = pm[1].replace(/([A-Z])/g, '-$1').toLowerCase();
      props[cssProp] = pm[2];
    }
    if (Object.keys(props).length > 0) {
      results.push({ selector: '(inline JSX)', props });
    }
  }
  return results;
}

// ── Main audit ────────────────────────────────────────────────────────

function findAllFiles(dir, exts) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(findAllFiles(full, exts));
    } else if (exts.some(e => entry.name.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

const DEFAULT_BG = parseHex('#ffffff'); // assume white bg when not specified

// Common background contexts: selectors that typically have colored backgrounds
const BG_CONTEXTS = {};

function audit() {
  const cssFiles = findAllFiles(CSS_DIR, ['.css']);
  const jsxFiles = findAllFiles(CSS_DIR, ['.js', '.jsx']);
  
  let allRules = [];
  
  // Parse CSS
  for (const file of cssFiles) {
    const css = fs.readFileSync(file, 'utf-8');
    const rules = extractRules(css);
    rules.forEach(r => {
      r.file = path.relative(CSS_DIR, file);
    });
    allRules = allRules.concat(rules);
  }
  
  // Parse inline JSX styles
  for (const file of jsxFiles) {
    const jsx = fs.readFileSync(file, 'utf-8');
    const rules = extractInlineStyles(jsx);
    rules.forEach(r => {
      r.file = path.relative(CSS_DIR, file);
    });
    allRules = allRules.concat(rules);
  }

  // Build a map of selectors to their background-colors
  const bgMap = {};
  allRules.forEach(r => {
    const bg = r.props['background-color'] || r.props['background'];
    if (bg) {
      bgMap[r.selector] = { raw: bg, file: r.file };
    }
  });

  const issues = [];

  // For each rule with a color property, check contrast
  for (const rule of allRules) {
    const colorProps = ['color'];
    
    for (const prop of colorProps) {
      const rawFg = rule.props[prop];
      if (!rawFg) continue;
      
      const fg = parseColor(rawFg);
      if (!fg) continue;

      // Determine background: from same rule, or infer
      let bg = null;
      let bgSource = '';
      
      const rawBg = rule.props['background-color'] || rule.props['background'];
      if (rawBg) {
        bg = parseColor(rawBg);
        bgSource = 'same rule';
      }
      
      if (!bg) {
        // Check common parent backgrounds
        // Hero sections, cards, badges, etc.
        const sel = rule.selector.toLowerCase();
        if (sel.includes('hero') || sel.includes('.discount-hero') || sel.includes('.specialty-hero')) {
          bg = parseColor('#0e5e5e'); // primary dark bg
          bgSource = 'hero (assumed --primary)';
        } else if (sel.includes('badge') || sel.includes('chip') || sel.includes('tag')) {
          // badges often on primary or accent bg
        } else if (sel.includes('.btn-primary') || sel.includes('.btn-cta')) {
          bg = parseColor('#0e5e5e');
          bgSource = 'button (assumed --primary)';
        }
      }

      if (!bg) {
        // Default: white or ds-bg-soft
        bg = DEFAULT_BG;
        bgSource = 'default (white)';
      }
      
      // Blend alpha
      const effectiveFg = blendOnto(fg, bg);
      const ratio = contrastRatio(effectiveFg, bg);
      
      // WCAG AA: 4.5:1 for normal text, 3:1 for large text
      const aaFail = ratio < 4.5;
      const aaaFail = ratio < 7;
      const largeFail = ratio < 3;
      
      if (aaFail) {
        issues.push({
          severity: ratio < 3 ? 'CRITICAL' : 'FAIL',
          ratio: Math.round(ratio * 100) / 100,
          fg: colorToStr(effectiveFg),
          rawFg,
          bg: colorToStr(bg),
          bgSource,
          selector: rule.selector,
          file: rule.file,
        });
      }
    }
  }

  // Also check specific known problem combos
  const knownCombos = [
    { fg: '--text-muted', bg: '--ds-bg', context: 'muted text on page bg' },
    { fg: '--text-muted', bg: '--bg-secondary', context: 'muted text on cards' },
    { fg: '--text-secondary', bg: '--ds-bg', context: 'secondary text on page bg' },
    { fg: '--text-secondary', bg: '--bg-secondary', context: 'secondary text on cards' },
    { fg: '--text-muted', bg: '--ds-accent-soft', context: 'muted text on accent bg' },
    { fg: '--gray-400', bg: '--ds-surface', context: 'gray-400 on white' },
    { fg: '--gray-500', bg: '--ds-surface', context: 'gray-500 on white' },
    { fg: '--gray-400', bg: '--ds-bg', context: 'gray-400 on page bg' },
    { fg: '--gray-500', bg: '--ds-bg', context: 'gray-500 on page bg' },
    { fg: '--gray-medium', bg: '--ds-bg', context: 'gray-medium on page bg' },
    { fg: '--gray-medium', bg: '--ds-surface', context: 'gray-medium on white' },
    { fg: '--secondary', bg: '--ds-surface', context: 'secondary green on white' },
    { fg: '--secondary-light', bg: '--ds-surface', context: 'secondary-light on white' },
    { fg: '--primary', bg: '--ds-accent-soft', context: 'primary on accent-soft bg' },
    { fg: '--ds-ink-muted', bg: '--ds-accent-soft', context: 'ink-muted on accent-soft bg' },
    { fg: '--white', bg: '--primary', context: 'white on primary (buttons, heroes)' },
    { fg: '--white', bg: '--primary-light', context: 'white on primary-light' },
    { fg: '--white', bg: '--secondary', context: 'white on secondary green' },
    { fg: '--white', bg: '--secondary-light', context: 'white on secondary-light' },
    { fg: '--white', bg: '--accent-light', context: 'white on accent-light' },
    { fg: '--gray-400', bg: '--primary', context: 'gray-400 on primary (hero text)' },
    { fg: '--gray-300', bg: '--primary', context: 'gray-300 on primary (hero text)' },
    { fg: '--ds-ink-muted', bg: '--ds-bg', context: 'ink-muted on page bg' },
    { fg: '--ds-ink-muted', bg: '--ds-surface-muted', context: 'ink-muted on surface-muted' },
    { fg: '--text-muted', bg: '--ds-surface-muted', context: 'muted text on muted surface' },
  ];
  
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  WCAG CONTRAST AUDIT — Wedding Counselors CSS');
  console.log('══════════════════════════════════════════════════════════\n');
  
  console.log('── KNOWN COLOR COMBINATION CHECK ──\n');
  const comboIssues = [];
  for (const combo of knownCombos) {
    const fg = parseColor(`var(${combo.fg})`);
    const bgColor = parseColor(`var(${combo.bg})`);
    if (!fg || !bgColor) continue;
    
    const effectiveFg = blendOnto(fg, bgColor);
    const ratio = contrastRatio(effectiveFg, bgColor);
    const pass = ratio >= 4.5;
    const icon = pass ? 'PASS' : (ratio >= 3 ? 'WARN' : 'FAIL');
    
    const line = `  ${icon}  ${ratio.toFixed(2)}:1  ${combo.fg} on ${combo.bg}  (${combo.context})`;
    console.log(line);
    if (!pass) {
      comboIssues.push({
        ...combo,
        ratio: Math.round(ratio * 100) / 100,
        fg: colorToStr(effectiveFg),
        bgHex: colorToStr(bgColor),
      });
    }
  }
  
  console.log('\n── CSS RULES WITH CONTRAST ISSUES ──\n');
  
  // Sort by severity then ratio
  issues.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'CRITICAL' ? -1 : 1;
    return a.ratio - b.ratio;
  });
  
  // Deduplicate by fg+bg+selector pattern
  const seen = new Set();
  const unique = issues.filter(i => {
    const key = `${i.fg}|${i.bg}|${i.rawFg}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  if (unique.length === 0) {
    console.log('  No issues found in CSS rules.\n');
  } else {
    unique.forEach(i => {
      console.log(`  ${i.severity}  ${i.ratio.toFixed(2)}:1  ${i.rawFg} → ${i.fg} on ${i.bg} (${i.bgSource})`);
      console.log(`         ${i.file} → ${i.selector.slice(0, 80)}`);
      console.log('');
    });
  }
  
  // Summary
  console.log('══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('══════════════════════════════════════════════════════════\n');
  console.log(`  Known combos checked: ${knownCombos.length}`);
  console.log(`  Known combos failing: ${comboIssues.length}`);
  console.log(`  CSS rules scanned: ${allRules.length}`);
  console.log(`  CSS rules with contrast issues: ${unique.length}`);
  console.log(`  Critical (< 3:1): ${unique.filter(i => i.severity === 'CRITICAL').length}`);
  console.log(`  Failing AA (< 4.5:1): ${unique.filter(i => i.severity === 'FAIL').length}`);
  
  if (comboIssues.length > 0) {
    console.log('\n── RECOMMENDED FIXES ──\n');
    comboIssues.forEach(c => {
      // Suggest a darker color that would pass
      const bgColor = parseColor(`var(${c.bg})`);
      const targetRatio = 4.5;
      const bgLum = luminance(bgColor);
      // Required fg luminance for 4.5:1
      const reqLum = (bgLum + 0.05) / targetRatio - 0.05;
      const reqLumDark = targetRatio * (bgLum + 0.05) - 0.05; // if fg is lighter than bg
      
      console.log(`  ${c.fg} on ${c.bg} (${c.ratio}:1 → need 4.5:1)`);
      console.log(`    Current: fg=${c.fg} bg=${c.bgHex}`);
      console.log(`    Context: ${c.context}`);
      console.log('');
    });
  }
}

audit();
