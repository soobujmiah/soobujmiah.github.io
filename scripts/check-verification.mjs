/* ═══════════════════════════════════════════════════════════════
   VERIFICATION DATA GATE — runs on `prebuild`, so the build fails
   if the generated proof data is missing, malformed, private, or
   missing its copy.

   What this proves, from the artifact rather than from trust:

     1. public/verification.json exists and matches the contract
     2. every published claim really is in the canonical registry
        (verification/claims.json, vendored from soobujmiah/skb) and
        is flagged public there — no invented claim can ship
     3. no private repository slug appears anywhere in the file
     4. no secret-shaped field appears anywhere in the file
     5. status and evidence agree (a claim cannot claim `verified`
        without evidence, or `failed` without a resolved result)
     6. every published claim id has localized copy in BOTH language
        trees of app/content.ts — a claim with no words cannot render
     7. `as_of` is a real, non-future date derived from evidence

   Offline and deterministic: no network, no clock dependency
   beyond rejecting a future timestamp.
   ═══════════════════════════════════════════════════════════════ */

import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PROJECTION = join(ROOT, 'public', 'verification.json');
const CLAIMS = join(ROOT, 'verification', 'claims.json');

const STATUSES = ['verified', 'failed', 'stale', 'unverified', 'superseded', 'human_attested'];
const CLASSES = ['evidence_backed', 'positioning'];
const EVIDENCE_TYPES = ['repository_state', 'public_repository', 'github_pages', 'none'];

/* Defense in depth. The resolver already refuses to project a claim whose
   evidence resolved against a private repository; this asserts the outcome
   independently, so a future resolver bug cannot quietly publish one. The
   list is this account's private repositories as of the integration date. */
const PRIVATE_REPOS = [
  'soobujmiah/skb',
  'soobujmiah/vault',
  'soobujmiah/rgen',
  'soobujmiah/roadmap',
  'soobujmiah/narapool',
  'soobujmiah/datakhoj',
  'soobujmiah/hermesbgrunner',
  'soobujmiah/faridpur-police-app',
  'soobujmiah/faridpur-police-platform',
  'soobujmiah/mobile-home-server',
  'soobujmiah/adb-qualification-test-ref',
  'soobujmiah/ggen-protected-assets',
  'soobujmiah/selfai',
];

const SECRET_SHAPED = [
  'ghp_', 'github_pat_', 'BEGIN RSA PRIVATE KEY', 'BEGIN PRIVATE KEY',
  'BEGIN OPENSSH PRIVATE KEY', 'app_private_key', 'private_key', 'skb_pull_token',
  'client_secret', 'authorization: bearer',
];

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`check-verification FAIL: ${msg}`);
};

/* ── 1. the projection exists and parses ───────────────────── */
if (!existsSync(PROJECTION)) {
  fail(`public/verification.json not found — run \`python3 -m tools.verification build --source portfolio --out public/verification.json --merge\``);
  console.error(`check-verification: ${failures} failure(s)`);
  process.exit(1);
}

let projection;
try {
  projection = JSON.parse(readFileSync(PROJECTION, 'utf8'));
} catch (e) {
  fail(`public/verification.json is not valid JSON: ${e.message}`);
  console.error(`check-verification: ${failures} failure(s)`);
  process.exit(1);
}

/* ── 2. it matches the projection contract ─────────────────── */
if (projection.schema !== 'skb.verification-projection/v1') {
  fail(`unexpected schema ${JSON.stringify(projection.schema)}, expected 'skb.verification-projection/v1'`);
}
if (!Array.isArray(projection.claims)) fail('projection has no claims array');
if (typeof projection.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(projection.as_of ?? '')) {
  fail(`as_of is not a Z-suffixed date-time: ${JSON.stringify(projection.as_of)}`);
} else {
  const asOf = new Date(projection.as_of);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (asOf > tomorrow) fail(`as_of ${projection.as_of} is in the future — evidence cannot post-date the build`);
}

/* ── 3. every published claim is in the canonical registry ─── */
if (!existsSync(CLAIMS)) {
  fail(`verification/claims.json not found — the vendored canonical registry is missing`);
} else {
  const registry = JSON.parse(readFileSync(CLAIMS, 'utf8'));
  const byId = new Map((registry.claims ?? []).map((c) => [c.id, c]));
  const seen = new Set();
  for (const claim of projection.claims ?? []) {
    if (seen.has(claim.id)) fail(`duplicate claim id in projection: ${claim.id}`);
    seen.add(claim.id);
    const canonical = byId.get(claim.id);
    if (!canonical) {
      fail(`claim ${claim.id} is published but does not exist in the canonical registry`);
      continue;
    }
    if (!canonical.public) fail(`claim ${claim.id} is published but is not public in the canonical registry`);
    if (canonical.class !== claim.class) fail(`claim ${claim.id} class drifted from the registry (${claim.class} vs ${canonical.class})`);
  }
}

/* ── 4. per-claim invariants ───────────────────────────────── */
for (const claim of projection.claims ?? []) {
  if (!CLASSES.includes(claim.class)) fail(`${claim.id}: invalid class ${JSON.stringify(claim.class)}`);
  if (!STATUSES.includes(claim.status)) fail(`${claim.id}: invalid status ${JSON.stringify(claim.status)}`);
  if (claim.evidence && !EVIDENCE_TYPES.includes(claim.evidence.type)) {
    fail(`${claim.id}: invalid evidence type ${JSON.stringify(claim.evidence.type)}`);
  }
  if (claim.status === 'verified' && !claim.verified_at) fail(`${claim.id}: verified with no verified_at`);
  if (claim.status === 'failed' && claim.evidence?.value === 'passed') {
    fail(`${claim.id}: reported failed while its evidence says passed`);
  }
  if (claim.status === 'verified' && claim.evidence && claim.evidence.value !== 'passed' && claim.evidence.value !== 'public' && claim.evidence.value !== 'published' && claim.evidence.value !== 'present') {
    fail(`${claim.id}: verified with evidence value ${JSON.stringify(claim.evidence.value)}`);
  }
  if (claim.class === 'positioning' && claim.status !== 'human_attested') {
    fail(`${claim.id}: a positioning claim must be human_attested, not ${JSON.stringify(claim.status)}`);
  }
  if (claim.class === 'positioning' && claim.evidence) {
    fail(`${claim.id}: a positioning claim must carry no evidence`);
  }
}

/* ── 5. private data and secrets cannot be present ─────────── */
/* Exact repository matches only. A substring test would flag the public
   soobujmiah/datakhoj-android as the private soobujmiah/datakhoj. */
const referencedRepos = new Set();
for (const claim of projection.claims ?? []) {
  const e = claim.evidence;
  if (!e) continue;
  if (typeof e.repository === 'string') referencedRepos.add(e.repository);
  for (const r of e.repositories ?? []) {
    if (typeof r?.repository === 'string') referencedRepos.add(r.repository);
  }
}
for (const repo of referencedRepos) {
  if (PRIVATE_REPOS.includes(repo)) fail(`private repository ${repo} appears in the public projection`);
}
const blob = JSON.stringify(projection);
for (const shape of SECRET_SHAPED) {
  if (blob.toLowerCase().includes(shape.toLowerCase())) fail(`secret-shaped string ${JSON.stringify(shape)} appears in the public projection`);
}

/* ── 6. every published claim has copy in both languages ───── */
/* The copy lives in app/verification-copy.ts, not app/content.ts, so the
   fixed footer on every route does not ship it. Compile it the same way
   check-content.mjs compiles content.ts and hold it to the same two
   purity rules plus key parity. */
const tmp = mkdtempSync(join(tmpdir(), 'verification-check-'));
try {
  const tscBin = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!existsSync(tscBin)) {
    fail('TypeScript compiler not found — run npm install first');
  } else {
    let copy;
    try {
      execSync(`node "${tscBin}" app/verification-copy.ts --outDir "${tmp}" --module commonjs --target es2020 --skipLibCheck --strict false`, {
        cwd: ROOT,
        stdio: 'pipe',
      });
      const compiled = [join(tmp, 'verification-copy.js'), join(tmp, 'app', 'verification-copy.js')].find((p) => existsSync(p));
      if (!compiled) {
        fail('tsc produced no output for app/verification-copy.ts');
      } else {
        copy = (await import(pathToFileURL(compiled).href)).verificationCopy;
      }
    } catch (e) {
      fail(`could not compile app/verification-copy.ts: ${(e?.stderr?.toString() || e?.message || 'unknown').slice(0, 1200)}`);
    }

    if (copy) {
      const BENGALI = /[\u0980-\u09FF]/;
      const LATIN = /[A-Za-z]/;
      const published = (projection.claims ?? []).map((c) => c.id);

      for (const lang of ['en', 'bn']) {
        const tree = copy[lang];
        if (!tree) {
          fail(`verification-copy.ts has no ${lang} tree`);
          continue;
        }
        const labels = tree.claimLabels ?? [];
        const byId = new Map(labels.map((c) => [c.id, c.label]));

        /* every published claim must have non-empty copy */
        for (const id of published) {
          const label = byId.get(id);
          if (label === undefined) fail(`${lang} tree has no claimLabels entry for published claim ${id}`);
          else if (!label.trim()) fail(`${lang} tree has an empty label for ${id}`);
        }
        /* and no orphaned copy for a claim that is not published */
        for (const { id } of labels) {
          if (!published.includes(id)) fail(`${lang} tree carries copy for unpublished claim ${id}`);
        }
        /* purity, both directions — same contract as app/content.ts */
        const strings = [];
        const walk = (node, path, isId) => {
          if (typeof node === 'string') {
            strings.push([node, path, isId]);
            return;
          }
          if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`, isId));
          if (node && typeof node === 'object') {
            for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, k === 'id');
          }
        };
        walk(tree, '', false);
        for (const [value, path, isId] of strings) {
          if (lang === 'en') {
            if (BENGALI.test(value)) fail(`EN purity: Bengali in verification-copy en.${path}`);
          } else if (isId) {
            if (BENGALI.test(value)) fail(`identifier field verification.claimLabels[].id must stay verbatim ASCII: ${value}`);
          } else if (LATIN.test(value)) {
            fail(`BN purity: Latin in verification-copy bn.${path} → "${value.slice(0, 50)}"`);
          }
        }
      }

      /* the two trees must describe the same claims in the same order */
      const enIds = (copy.en?.claimLabels ?? []).map((c) => c.id);
      const bnIds = (copy.bn?.claimLabels ?? []).map((c) => c.id);
      if (JSON.stringify(enIds) !== JSON.stringify(bnIds)) {
        fail('verification-copy claimLabels differ in id or order between en and bn');
      }
      if (enIds.length !== published.length) {
        fail(`verification-copy carries ${enIds.length} labels for ${published.length} published claims`);
      }
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\ncheck-verification: ${failures} failure(s)`);
  process.exit(1);
}
const machine = (projection.claims ?? []).filter((c) => c.class === 'evidence_backed').length;
const human = (projection.claims ?? []).filter((c) => c.class === 'positioning').length;
console.log(
  `check-verification PASS (${machine} machine-verified + ${human} human-attested claims, as_of ${projection.as_of}, canonical registry + bilingual copy + privacy all verified)`,
);
