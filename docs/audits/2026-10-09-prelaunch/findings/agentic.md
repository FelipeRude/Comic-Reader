# Agent-readiness audit: develop.panelzoom.com (/de/, /en/, /app/)
Date: 2026-10-09. Plugin facts checked 2026-09-23. Staging Disallow/noindex is intentional (not a finding).

## Score: 88/100 (category score, own weighting)
- Lighthouse Agentic Browsing: unavailable. PSI returned HTTP 429 (daily quota, no API key) for mobile and desktop. Not X/N. Re-run after `/seo google setup`.
- Agent-UX heuristic (separate from Lighthouse): 100/100, complete. /de/ 100, /en/ 100, /app/ 100. No unnamed interactive nodes, no div-onclick widgets, 18 landmarks on landing pages.

## Evidence
- Server rendering: pass. 876 words (de) / 915 (en) without JS.
- robots.txt reachable (200). Staging blocks all agents by design. Live dist/robots.txt is `User-agent: * / Allow: /` plus Sitemap, so no AI-crawler blocks at launch.
- llms.txt: pass on staging (200, text/plain, 457 B). llms-full.txt 404 (optional). Live dist/llms.txt lists panelzoom.com/de/, /en/, /app/ (production URLs).
- 404 handling: pass, real 404 status, no catch-all 200.
- Markdown delivery: not offered (Vary: Accept present). WebMCP, ai-catalog.json, api-catalog, agent-card, ucp, oauth well-known: absent.

## Findings
- P0: none.
- P1 (informational, staging only): robots blocks OAI-SearchBot, Claude-SearchBot, PerplexityBot, and user agents via `*` Disallow. Expected for staging. Pre-launch check: confirm the live robots.txt is deployed (not the staging one) when going live. The scan tool cannot see live yet.
- P1 (opportunity, optional): No Content-Signal line. Draft/proposal (Cloudflare Content Signals, checked 2026-09-23); Google does not act on it. One line in live robots.txt, e.g. `Content-Signal: search=yes, ai-input=yes, ai-train=no`, if the owner wants to state a policy. Preference only, not enforcement.
- P1 (note): llms.txt is a community convention; no confirmed consumer agent. Keep it, it is cheap. Make sure staging deploys do not leak production URLs as an issue: acceptable as is.
- P2/P3 (opportunities, not defects): WebMCP (draft, checked 2026-09-23), ai-catalog.json (draft), Markdown negotiation, Web Bot Auth (proposal). Not proportionate for a small static site; the /app/ is a client-side PDF reader with no forms/API to expose. Skip.
- P3: 1 input without aria attribute on landing and /app/ (has a label, so low impact). Optionally add aria-label to the file input.

## Access policy (live config, from dist/robots.txt)
- Training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot): allowed via `*` (no named group). No Content-Signal stated.
- Search crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot): allowed.
- User-triggered agents (ChatGPT-User, Claude-User, Perplexity-User, Google-Agent): allowed; several do not treat robots.txt as binding.
- Staging: all blocked on purpose.
- Privacy note: the app processes PDFs in-browser, so there is nothing private to protect via robots.

## Recommendations (proportionate)
1. Re-run Lighthouse Agentic after PSI key setup, ideally against live URLs after launch.
2. Decide on training policy; if "no training", add named Disallow groups for GPTBot, ClaudeBot, Google-Extended, CCBot or a Content-Signal line to live robots.txt.
3. Skip WebMCP/ai-catalog/Markdown. No ranking, citation or traffic effect is promised by any of these.
