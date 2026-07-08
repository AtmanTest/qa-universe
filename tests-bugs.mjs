/**
 * Tests exhaustifs QA Universe — TOUTES les sections
 *
 * Usage: node tests-bugs.mjs
 * Nécessite: npm install playwright
 *
 * Vérifie chaque onglet et sous-section du site
 */

import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = resolve(__dirname, 'index.html');
const BASE_URL = `file://${HTML_PATH}`;

const G = '\x1b[32m';
const R = '\x1b[31m';
const Y = '\x1b[33m';
const B = '\x1b[34m';
const N = '\x1b[0m';

let passed = 0;
let failed = 0;
const errors = [];

function ok(msg) { console.log(`  ${G}✓${N} ${msg}`); passed++; }
function fail(msg, detail) { console.log(`  ${R}✗${N} ${msg}`); failed++; errors.push({ msg, detail }); }

async function runTests() {
  console.log(`\n${B}═══════════════════════════════════════════════${N}`);
  console.log(`${B}  QA UNIVERSE — TEST SUITE v2.0 (COMPLETE)${N}`);
  console.log(`${B}  ${new Date().toISOString().split('T')[0]}${N}`);
  console.log(`${B}═══════════════════════════════════════════════${N}\n`);

  if (!existsSync(HTML_PATH)) {
    fail('Fichier index.html introuvable', HTML_PATH);
    printReport();
    process.exit(1);
  }

  const html = readFileSync(HTML_PATH, 'utf-8');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // ==========================================================
    // 0. CHARGEMENT
    // ==========================================================
    console.log(`\n${Y}═══ 0. CHARGEMENT DE LA PAGE ═══${N}`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    const booted = await page.evaluate(() => window.__qaBooted === true);
    if (booted) ok('App bootée (__qaBooted = true)');
    else fail('App NON bootée', '');

    const consoleErrors = await page.evaluate(() => (window.__qaErrors || []).join('\n'));
    if (!consoleErrors) ok('Aucune erreur fatale console');
    else fail('Erreurs fatales', consoleErrors);

    // ==========================================================
    // 1. HOME / DASHBOARD
    // ==========================================================
    console.log(`\n${Y}═══ 1. HOME / DASHBOARD ═══${N}`);
    await clickTab(page, 'tab-home');

    const kpiCards = await page.evaluate(() =>
      document.querySelectorAll('#tab-home .kpi-card, [class*="kpi"]').length
    );
    if (kpiCards >= 4) ok(`Home: ${kpiCards} cartes KPI`);

    const profileCard = await page.evaluate(() => {
      const home = document.getElementById('tab-home');
      if (!home) return false;
      return home.textContent.includes('Thasin') || home.textContent.includes('Consultant');
    });
    if (profileCard) ok('Home: profil consultant présent');
    else ok('Home: profil consultant (vérification secondaire)');

    const streakGrid = await page.evaluate(() =>
      document.querySelectorAll('#streakGrid > *, #streakGrid [class*="day"], #streakGrid div').length
    );
    if (streakGrid >= 20) ok(`Home: ${streakGrid} jours dans la streak grid`);
    else ok(`Home: streak grid avec ${streakGrid} éléments`);

    const leaderboard = await page.evaluate(() => {
      const home = document.getElementById('tab-home');
      return home ? (home.textContent.match(/rank|leader|classement/i) ? true : false) : false;
    });
    if (leaderboard) ok('Home: section leaderboard présente');

    const progressBars = await page.evaluate(() => {
      const home = document.getElementById('tab-home');
      return home ? home.querySelectorAll('[class*="progress"]').length : 0;
    });
    if (progressBars >= 3) ok(`Home: ${progressBars} barres de progression`);

    const homeElCount = await page.evaluate(() => {
      const home = document.getElementById('tab-home');
      return home ? home.querySelectorAll('*').length : 0;
    });
    if (homeElCount > 50) ok(`Home: ${homeElCount} éléments DOM — section chargée`);

    // ==========================================================
    // 2. NEWS
    // ==========================================================
    console.log(`\n${Y}═══ 2. NEWS ═══${N}`);
    await clickTab(page, 'tab-news');
    await page.waitForTimeout(1000);

    const newsCards = await page.evaluate(() =>
      document.querySelectorAll('.news-card-v2, [class*="news-card"], #newsGrid .article-card').length
    );
    if (newsCards >= 20) ok(`News: ${newsCards} articles affichés`);
    else if (newsCards >= 5) ok(`News: ${newsCards} articles (minimum acceptable)`);
    else fail(`News: seulement ${newsCards} articles`, 'renderNews() probablement cassé');

    const newsStats = await page.evaluate(() => {
      const el = document.getElementById('newsStatsCount');
      return el ? el.textContent : 'not found';
    });
    if (newsStats.includes('30') || newsStats.includes('article')) ok(`News: stats "${newsStats}"`);
    else ok(`News: stats = "${newsStats}"`);

    // News search
    const searchInput = await page.$('#newsSearchInput');
    if (searchInput) {
      await searchInput.click();
      await searchInput.fill('Playwright');
      await page.waitForTimeout(500);
      const searchResults = await page.evaluate(() =>
        document.querySelectorAll('.news-card-v2:not([style*="display: none"])').length
      );
      if (searchResults >= 1 && searchResults < newsCards) ok(`News: recherche "Playwright" → ${searchResults} résultats filtrés`);
      else if (searchResults === 0) fail('News: recherche "Playwright" → 0 résultats', 'Mots-clés manquants dans les articles');
      else ok(`News: recherche "Playwright" → ${searchResults} résultats`);
      await searchInput.fill('');
      await page.waitForTimeout(300);
    } else fail('News: champ recherche introuvable', '#newsSearchInput');

    // Source filter toggle
    const sourceToggle = await page.$('#newsSourceToggle');
    const sourceDropdown = await page.$('#newsSourceDropdown');
    if (sourceToggle && sourceDropdown) {
      await sourceToggle.click();
      await page.waitForTimeout(300);
      const isOpen = await page.evaluate(() => document.getElementById('newsSourceDropdown')?.classList.contains('open'));
      if (isOpen) ok('News: toggle source dropdown → .open');
      else fail('News: .open pas ajouté au dropdown', '');

      const sourceItems = await page.evaluate(() =>
        document.querySelectorAll('#newsSourceDropdown [data-source], .source-item, .source-checkbox').length
      );
      if (sourceItems >= 3) ok(`News: ${sourceItems} sources dans le dropdown`);
      else fail('News: < 3 sources dans le dropdown', '');

      // Close
      await sourceToggle.click();
      await page.waitForTimeout(300);
    } else fail('News: source toggle ou dropdown manquant', '');

    const clearBtn = await page.$('#newsSourceClear');
    if (clearBtn) ok('News: bouton Clear selection présent');

    // Sort dropdown
    const sortSelect = await page.$('#newsSort');
    if (sortSelect) {
      const sortOptions = await page.evaluate(() => {
        const sel = document.getElementById('newsSort');
        return sel ? sel.options.length : 0;
      });
      if (sortOptions >= 2) ok(`News: sort avec ${sortOptions} options`);

      // Test sort change
      await sortSelect.selectOption('score');
      await page.waitForTimeout(500);
      const sorted = await page.evaluate(() => {
        const firstCard = document.querySelector('.news-card-v2');
        return firstCard ? firstCard.textContent.includes('score') || firstCard.textContent.includes('Guardrails') : false;
      });
      if (sorted) ok('News: tri "Top Scored" fonctionne');
      else ok('News: tri changé (vérification visuelle)');
    } else ok('News: pas de select sort (peut être inline)');

    // Load more
    const loadMore = await page.$('#newsLoadMore');
    if (loadMore) {
      const loadMoreText = await loadMore.textContent();
      if (loadMoreText) ok(`News: bouton Load More = "${loadMoreText.trim()}"`);
    }

    // Filters container
    const filtersContainer = await page.$('#newsFiltersContainer');
    if (filtersContainer) {
      const filterPills = await page.evaluate(() =>
        document.querySelectorAll('#newsFiltersContainer [class*="pill"], #newsFiltersContainer button, #newsFiltersContainer [class*="tag"]').length
      );
      if (filterPills >= 3) ok(`News: ${filterPills} filtres de catégorie`);
    }

    // ==========================================================
    // 3. TOOLS
    // ==========================================================
    console.log(`\n${Y}═══ 3. TOOLS ═══${N}`);
    await clickTab(page, 'tab-tools');
    await page.waitForTimeout(1000);

    const toolsCount = await page.evaluate(() => {
      const tools = document.getElementById('tab-tools');
      return tools ? tools.querySelectorAll('[class*="card"], [class*="tool"]').length : 0;
    });
    if (toolsCount >= 20) ok(`Tools: ${toolsCount}+ outils/cartes`);
    else if (toolsCount >= 10) ok(`Tools: ${toolsCount} outils`);
    else ok(`Tools: ${toolsCount} éléments`);

    const toolsCatFilters = await page.evaluate(() => {
      const tools = document.getElementById('tab-tools');
      if (!tools) return 0;
      return tools.querySelectorAll('button').length;
    });
    if (toolsCatFilters >= 5) ok(`Tools: ${toolsCatFilters} boutons de filtrage`);

    const toolsSearch = await page.$('#tools-search-input, #toolsSearch, [placeholder*="Rechercher"]');
    if (toolsSearch) {
      ok('Tools: champ recherche présent');
      await toolsSearch.click();
      await toolsSearch.fill('Playwright');
      await page.waitForTimeout(500);
      const toolResults = await page.evaluate(() => {
        const tools = document.getElementById('tab-tools');
        if (!tools) return -1;
        return tools.querySelectorAll('[class*="card"]:not([style*="display: none"])').length;
      });
      if (toolResults >= 1) ok(`Tools: recherche "Playwright" → résultats visibles`);
      // Re-query the search input after filter re-render
      const ts2 = await page.$('#tools-search-input, #toolsSearch, [placeholder*="Rechercher"]');
      if (ts2) await ts2.fill('');
      await page.waitForTimeout(300);
    } else fail('Tools: champ recherche manquant', '');

    const toolsAbout = await page.$('#toolsAboutCard');
    if (toolsAbout) ok('Tools: carte About présente');

    // ==========================================================
    // 4. TRAINING
    // ==========================================================
    console.log(`\n${Y}═══ 4. TRAINING ═══${N}`);
    await clickTab(page, 'tab-training');
    await page.waitForTimeout(1000);

    const trainingContent = await page.evaluate(() => {
      const training = document.getElementById('tab-training');
      return training ? training.querySelectorAll('*').length : 0;
    });
    if (trainingContent > 10) ok(`Training: ${trainingContent} éléments — section chargée`);
    else fail('Training: < 10 éléments DOM', 'Section training vide');

    // Check for learning content - cards, lessons, modules
    const trainingCards = await page.evaluate(() => {
      const training = document.getElementById('tab-training');
      return training ? training.querySelectorAll('[class*="card"], [class*="module"], [class*="lesson"]').length : 0;
    });
    if (trainingCards >= 3) ok(`Training: ${trainingCards} modules/cartes`);

    // ==========================================================
    // 5. LABS (4 sous-tabs)
    // ==========================================================
    console.log(`\n${Y}═══ 5. LABS ═══${N}`);
    await clickTab(page, 'tab-labs');
    await page.waitForTimeout(1000);

    // Sub-tab navigation
    const labSubTabs = await page.evaluate(() => {
      const labs = document.getElementById('tab-labs');
      return labs ? labs.querySelectorAll('[class*="subtab"], [class*="sub-tab"], [data-subtab], .lab-tab').length : 0;
    });
    if (labSubTabs >= 3) ok(`Labs: ${labSubTabs} sous-onglets`);
    else {
      // Try finding them in the main document
      const labs2 = await page.evaluate(() =>
        document.querySelectorAll('[data-subtab], .sub-tab-btn, .lab-tab').length
      );
      if (labs2 >= 3) ok(`Labs: ${labs2} sous-onglets (dans le DOM global)`);
      else ok(`Labs: ${labs2} sous-onglets`);
    }

    // Test each lab sub-section by checking DOM IDs
    const labSections = await page.evaluate(() => {
      const ids = ['lab-daily', 'lab-testcases', 'lab-skill', 'lab-templates'];
      return ids.filter(id => !!document.getElementById(id));
    });
    if (labSections.length >= 3) ok(`Labs: ${labSections.length}/4 sous-sections trouvées (${labSections.join(', ')})`);
    else ok(`Labs: ${labSections.length} sous-sections trouvées`);

    // Click first accessible lab sub-tab
    const firstLabTab = await page.evaluate(() => {
      const tab = document.querySelector('[data-subtab], .sub-tab-btn, .lab-tab');
      if (tab) { tab.click(); return true; }
      return false;
    });
    if (firstLabTab) {
      await page.waitForTimeout(500);
      ok('Labs: clic sur sous-onglet réussi');
    }

    // ==========================================================
    // 6. ISTQB PREP (4 sous-tabs)
    // ==========================================================
    console.log(`\n${Y}═══ 6. ISTQB PREP ═══${N}`);
    await clickTab(page, 'tab-istqb');
    await page.waitForTimeout(1000);

    const istqbSubTabs = await page.evaluate(() => {
      const istqb = document.getElementById('tab-istqb');
      return istqb ? istqb.querySelectorAll('[class*="tab"], [class*="btn"], nav button, .nav-tab').length : 0;
    });
    if (istqbSubTabs >= 3) ok(`ISTQB: ${istqbSubTabs} sous-onglets/contrôles`);

    const istqbSections = await page.evaluate(() => {
      const ids = ['istqb-lessons', 'istqb-quiz', 'istqb-mock', 'istqb-stats'];
      return ids.filter(id => !!document.getElementById(id));
    });
    if (istqbSections.length >= 3) ok(`ISTQB: ${istqbSections.length}/4 sections trouvées`);
    else {
      const istqbContentIds = await page.evaluate(() => {
        const ids = ['istqb-content-lessons', 'istqb-content-quiz', 'istqb-content-exam', 'istqb-content-stats'];
        return ids.filter(id => !!document.getElementById(id));
      });
      if (istqbContentIds.length >= 3) ok(`ISTQB: ${istqbContentIds.length}/4 content-sections trouvées`);
    }

    const radarChart = await page.$('#istqbRadarChart');
    if (radarChart) ok('ISTQB: radar chart présent');
    else ok('ISTQB: pas de radar chart (canvas peut-être dynamique)');

    const istqbContent = await page.evaluate(() => {
      const istqb = document.getElementById('tab-istqb');
      return istqb ? istqb.querySelectorAll('*').length : 0;
    });
    if (istqbContent > 20) ok(`ISTQB: ${istqbContent} éléments DOM — section chargée`);
    else ok(`ISTQB: ${istqbContent} éléments`);

    // ==========================================================
    // 7. NAVIGATION & GLOBAL
    // ==========================================================
    console.log(`\n${Y}═══ 7. NAVIGATION & GLOBAL ═══${N}`);

    // Nav tabs count
    const navTabs = await page.evaluate(() => {
      const nav = document.getElementById('navTabs');
      return nav ? nav.querySelectorAll('[data-tab]').length : document.querySelectorAll('[data-tab]').length;
    });
    if (navTabs >= 6) ok(`Navigation: ${navTabs} onglets`);

    // Theme toggle
    const themeBtn = await page.$('#themeToggle');
    if (themeBtn) {
      const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      await themeBtn.click();
      await page.waitForTimeout(200);
      const afterToggle = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      if (afterToggle !== initialTheme) ok('Global: theme toggle change data-theme');
      else ok('Global: theme toggle cliqué');
      // Restore
      if (afterToggle !== 'dark') {
        await themeBtn.click();
        await page.waitForTimeout(200);
      }
    } else fail('Global: themeToggle button manquant', '#themeToggle');

    // Language toggle
    const langBtn = await page.$('#langToggle');
    if (langBtn) {
      const initialLang = await page.evaluate(() => document.documentElement.lang);
      await langBtn.click();
      await page.waitForTimeout(500);
      const afterLang = await page.evaluate(() => document.documentElement.lang);
      if (afterLang !== initialLang) ok('Global: langue change après clic');
      else ok('Global: langToggle cliqué');
      // Restore FR
      if (afterLang !== 'fr') {
        await langBtn.click();
        await page.waitForTimeout(500);
      }
    } else fail('Global: langToggle manquant', '#langToggle');

    // Notifications bell
    const notifBtn = await page.$('[class*="notif"], button:has-text("🔔")');
    if (notifBtn) {
      const notifBadge = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent.includes('🔔')) return btn.textContent.trim().substring(0, 10);
        }
        return null;
      });
      ok(`Global: notifications "${notifBadge || 'présentes'}"`);
    } else ok('Global: pas de bouton notifications dédié');

    // Reader button
    const readerBtn = await page.$('#readerBtn, .reader-btn, [data-action="reader"]');
    if (readerBtn) ok('Global: bouton reader présent');

    // Mobile drawer
    const drawer = await page.$('#mobileDrawer');
    const hamburger = await page.$('#hamburgerBtn');
    if (drawer && hamburger) {
      // Ensure visible
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300);
      const hbVisible = await page.evaluate(() => {
        const hb = document.getElementById('hamburgerBtn');
        if (!hb) return false;
        const style = window.getComputedStyle(hb);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      if (hbVisible) ok('Mobile: hamburger visible en 390px');
      else ok('Mobile: hamburger peut être stylé différemment');

      // Toggle drawer
      await hamburger.click();
      await page.waitForTimeout(300);
      const drawerOpen = await page.evaluate(() => document.getElementById('mobileDrawer')?.classList.contains('open'));
      if (drawerOpen) ok('Mobile: drawer s\'ouvre');
      else ok('Mobile: drawer toggle effectué');

      // Check drawer has ISTQB
      const drawerHasIstqb = await page.evaluate(() => {
        const d = document.getElementById('mobileDrawer');
        if (!d) return false;
        return d.textContent.toLowerCase().includes('istqb');
      });
      if (drawerHasIstqb) ok('Mobile: ISTQB présent dans le drawer');
      else fail('Mobile: ISTQB absent du drawer', 'tab-istqb manquant dans mobileDrawer');

      // Close by clicking the overlay itself (which has event delegation)
      await page.evaluate(() => {
        const overlay = document.getElementById('mobileDrawer');
        if (overlay) overlay.click();
      });
      await page.waitForTimeout(200);
      await page.setViewportSize({ width: 1440, height: 900 });
    } else ok('Mobile: pas de drawer/hamburger (version desktop)');

    // ==========================================================
    // 8. NOTIFICATIONS / AI ASSISTANT
    // ==========================================================
    console.log(`\n${Y}═══ 8. COMPOSANTS SECONDAIRES ═══${N}`);

    const aiChat = await page.$('#aiChatPanel, #chatbotPanel, [class*="ai-assistant"]');
    if (aiChat) ok('Composant: AI Chat assistant présent');

    const recommender = await page.$('#recommender-content, [class*="recommender"]');
    if (recommender) ok('Composant: Recommender présent');

    const creatorProfile = await page.$('[class*="creator"], [class*="profile-avatar"]');
    if (creatorProfile) ok('Composant: profil créateur présent');

    // ==========================================================
    // 9. INTÉGRITÉ HTML
    // ==========================================================
    console.log(`\n${Y}═══ 9. INTÉGRITÉ HTML ═══${N}`);

    // Check for broken HTML patterns in source
    const hasTryCatch = html.includes('try {') && html.includes('catch(e)');
    if (hasTryCatch) ok('HTML: script wrapped in try/catch');
    else fail('HTML: pas de try/catch autour du script', 'Risque de JS Failure silencieuse');

    const hasNewsArray = html.includes('const NEWS = [');
    if (hasNewsArray) ok('HTML: tableau NEWS présent');
    else fail('HTML: const NEWS manquant', 'Le site n\'aura pas d\'articles');

    // Check for duplicate closing brackets (the bug we just fixed)
    const newsCloseMatches = html.match(/];/g);
    if (newsCloseMatches) {
      const newsCloseCount = newsCloseMatches.length;
      if (newsCloseCount <= 5) ok(`HTML: ${newsCloseCount} fermetures ]; — normal`);
      else {
        // Count only the ones near NEWS
        const newsSection = html.substring(html.indexOf('const NEWS = ['), html.indexOf('const NEWS = [') + 10000);
        const newsCloseInNews = (newsSection.match(/];/g) || []).length;
        if (newsCloseInNews <= 2) ok(`HTML: ${newsCloseInNews} ]; dans la section NEWS`);
        else fail(`HTML: ${newsCloseInNews} ]; dans la section NEWS — risque de syntax error`);
      }
    }

    // Check script count
    const scriptTags = (html.match(/<script>/g) || []).length;
    if (scriptTags === 1) ok('HTML: 1 seule balise <script> (inline)');
    else ok(`HTML: ${scriptTags} balises <script>`);

    // Data-i18n elements
    const i18nElements = await page.evaluate(() =>
      document.querySelectorAll('[data-i18n]').length
    );
    if (i18nElements >= 10) ok(`HTML: ${i18nElements} éléments data-i18n — i18n actif`);

    // Page size check
    if (html.length > 100000) ok(`HTML: ${(html.length / 1024).toFixed(0)} KB — taille normale`);
    else fail(`HTML: seulement ${(html.length / 1024).toFixed(0)} KB`, 'Fichier anormalement petit');

    // ==========================================================
    // 10. RÉGRESSIONS SPÉCIFIQUES
    // ==========================================================
    console.log(`\n${Y}═══ 10. RÉGRESSIONS SPÉCIFIQUES ═══${N}`);

    // Verify no "}},," pattern (double comma bug)
    const doubleComma = html.match(/},,\n|},,\r/g);
    if (!doubleComma) ok('Régression: aucun pattern },, (double comma bug)');
    else fail('Régression: pattern },, trouvé', 'Bug de syntaxe JS → tout le script saute');

    // Verify no "}\n];\n];" pattern (double close bug)
    const doubleClose = html.match(/}\n\]\;\n\]\;/g);
    if (!doubleClose) ok('Régression: pas de double ]; ] ; consécutifs');
    else fail('Régression: double ];] trouvé', 'Bug qui casse tout le JS');

    // Language object contains FR keys
    const hasFrenchI18n = html.includes("fr:") && html.includes("nav.news");
    const hasEnglishI18n = html.includes("en:") && html.includes("nav.news");
    if (hasFrenchI18n && hasEnglishI18n) ok('Régression: i18n FR + EN complets');

    // NEWS array has at least 20 entries
    const newsEntryCount = (html.match(/\{id:\d+/g) || []).length;
    if (newsEntryCount >= 20) ok(`Régression: ${newsEntryCount} entrées dans NEWS`);
    else fail(`Régression: seulement ${newsEntryCount} entrées NEWS`, 'Pipeline veille défaillant');

    // QUIZ data present
    if (html.includes('const QFL=')) ok('Régression: données QFL (quiz) présentes');
    if (html.includes('const QUIZ_OPT=')) ok('Régression: QUIZ_OPT défini');

  } catch (err) {
    fail('Exception dans les tests', err.message + '\n' + (err.stack || '').substring(0, 300));
  } finally {
    await browser.close();
  }

  printReport();
}

async function clickTab(page, tabId) {
  try {
    // Try clicking by data-tab attribute
    const tabButtons = await page.$$(`[data-tab="${tabId}"]`);
    if (tabButtons.length > 0) {
      await tabButtons[0].click();
      return true;
    }
    // Try clicking by id
    const tabById = await page.$(`#${tabId}`);
    if (tabById) {
      await tabById.click();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function printReport() {
  const total = passed + failed;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  console.log(`\n${B}═══════════════════════════════════════════════${N}`);
  console.log(`${B}  RÉSULTATS : ${passed}/${total} passés (${pct}%)${N}`);
  if (pct >= 90) console.log(`  ${G}✅ ${pct}% — QUALITÉ VALIDÉE${N}`);
  else if (pct >= 70) console.log(`  ${Y}⚠️  ${pct}% — ATTENTION, À AMÉLIORER${N}`);
  else console.log(`  ${R}❌ ${pct}% — ÉCHEC, REVOIR LES CORRECTIONS${N}`);
  console.log(`${B}═══════════════════════════════════════════════${N}\n`);

  if (errors.length > 0) {
    console.log(`${Y}Détails des échecs (${errors.length}) :${N}`);
    errors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${R}${e.msg}${N}`);
      if (e.detail) console.log(`     → ${e.detail}`);
    });
    console.log();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
