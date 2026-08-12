# 2026-08-12 — Prompt Google Stitch (budget: 10)

> Compagno di `2026-08-12-brief-dashboard-stitch.md`. Un prompt = uno schermo.
> Ordine = priorità: se il budget finisce, ciò che resta fuori è derivabile.
> Base di riferimento: gli schermi Dark già generati ("XP Flow Dashboard
> (Desktop/Mobile) - Fixed"). Spunta i prompt man mano che li usi.

## Piano schermi (10 prompt + 2 già esistenti)

| # | Vista | Tema | Device |
|---|---|---|---|
| — | Dashboard sprint attivo (GIÀ FATTI, fuori budget) | Dark | D + M |
| 1 | Dashboard "Serve da te" popolato | Dark | Desktop |
| 2 | Empty state "nessuno sprint attivo" | Dark | Desktop |
| 3 | "Serve da te" mobile (A+B impilate) | Dark | Mobile |
| 4 | Empty state mobile | Dark | Mobile |
| 5 | Pipeline dettagliata con obiezione bloccante | Dark | Desktop |
| 6 | Timeline filtrabile + badge righe corrotte | Dark | Desktop |
| 7 | Retro & metodo | Dark | Desktop |
| 8 | Light canonico: dashboard sprint attivo | Light | Desktop |
| 9 | Light canonico: dashboard sprint attivo | Light | Mobile |
| 10 | Light "Serve da te" | Light | Desktop |

Light di pipeline/retro/empty: NON si mockuppano — si derivano dai token dei canonici 8-10.

---

## PROMPT 1 — Dashboard "Serve da te" (Dark, Desktop)

```text
Using the existing Dark desktop dashboard "XP Flow Dashboard (Desktop) - Fixed" as the exact base (same layout, same 5 zones, same styling), create the variant where the user's attention is required.

Changes from the base:
- Zone B "SERVE DA TE" becomes the visually dominant zone: red/alert accent, badge "2 pendenti". It contains 2 cards, each with: precise instruction, source command, and "pending since" duration:
  1. "Configurare secret TELEGRAM_TOKEN nel repo" — da /sprint — in attesa da 3h
  2. "Eseguire git push dei commit locali (7)" — da /stato — in attesa da 1g
  Each card has a small checkbox-style action "segna come fatto (manual_done)".
- Zone C "PIPELINE" shows pair-review in a BLOCKED state: step "pair-review" highlighted in amber with label "obiezione bloccante: test dipende dall'ordine di esecuzione" and a counter "1 obiezione aperta".
- Zone A stays as active sprint (issue #1, 2/4 scenari, 2/3 SP) but visually secondary to Zone B.
- Zone E timeline: latest event at top is the azione_manuale event, marked with the same red accent.
Keep all UI copy in Italian. Dense, sober, data-first, no decoration. Dark theme identical to base.
```

## PROMPT 2 — Empty state (Dark, Desktop)

```text
Using the existing Dark desktop dashboard "XP Flow Dashboard (Desktop) - Fixed" as the exact base (same layout grid, same styling), create the EMPTY STATE variant: no active sprint.

Changes from the base:
- Zone A (hero): replaces sprint data with a calm empty state: icon + title "Nessuno sprint attivo", subtitle "L'ultimo sprint si è chiuso con la issue #1 · 3/3 SP", and a single suggested action shown as a terminal-style snippet: "/brainstorm <prossima idea>". No red/alert colors anywhere — this state is neutral/green, not an error.
- Zone B "SERVE DA TE": green/ok state, text "Nessun gate pendente ✓".
- Zone C "PIPELINE": all 4 steps (brainstorm → sprint → pair-review → retro) shown as idle/neutral, with the last completed cycle timestamp under each step.
- Zone D "NORTH-STAR" stays fully populated (this zone never empties): 1 incremento spedito questa settimana, streak 1, countdown al 30/09.
- Zone E "TIMELINE": still shows the last 5 historical events (closing events of issue #1), demonstrating the feed persists across sprints.
Keep all UI copy in Italian. Same dark theme, dense and sober. The overall feeling: "tutto fermo, tutto sano, ecco come ripartire".
```

## PROMPT 3 — "Serve da te" mobile (Dark, Mobile)

```text
Using the existing Dark mobile dashboard "XP Flow Dashboard (Mobile) - Fixed" as the exact base, create the mobile variant where the user's attention is required. Mobile shows ONLY two stacked zones (per design constraint): Zone A "SPRINT ATTIVO" on top, Zone B "SERVE DA TE" below — no pipeline, no north-star, no timeline on mobile.

Changes:
- Zone B "SERVE DA TE" dominates: red accent, badge "2 pendenti", 2 full-width cards with precise instruction + source command + pending duration ("Configurare secret TELEGRAM_TOKEN nel repo — da /sprint — 3h" and "Eseguire git push dei commit locali (7) — da /stato — 1g"). Each card has a tap action "segna come fatto".
- Zone A compact: issue #1, scenari 2/4, SP 2/3, small blocked indicator "pair-review bloccata".
Keep all UI copy in Italian. Same dark theme. Thumb-friendly targets, single column.
```

## PROMPT 4 — Empty state mobile (Dark, Mobile)

```text
Using the existing Dark mobile dashboard "XP Flow Dashboard (Mobile) - Fixed" as the exact base, create the mobile EMPTY STATE: no active sprint. Mobile shows only stacked Zone A and Zone B.

Changes:
- Zone A: calm empty state — title "Nessuno sprint attivo", subtitle "Ultimo sprint chiuso: issue #1 · 3/3 SP", suggested action as terminal snippet "/brainstorm <prossima idea>". Neutral/green mood, no alerts.
- Zone B: green/ok, "Nessun gate pendente ✓".
Keep all UI copy in Italian. Same dark theme, minimal and calm.
```

## PROMPT 5 — Pipeline dettagliata con blocco (Dark, Desktop)

```text
Create a new Dark desktop screen "Pipeline" for the same XP Flow design system (same header/nav and dark theme as "XP Flow Dashboard (Desktop) - Fixed"). This is a drill-down view of the development flow for issue #1.

Layout:
- Horizontal stepper at top: brainstorm → sprint → pair-review → retro. brainstorm = done (with timestamp and outcome "4 scenari Gherkin, stima 3 SP"), sprint = done for scenario 2, pair-review = BLOCKED (amber, dominant), retro = idle.
- Main panel under the stepper: the pair-review block detail — card "Obiezione bloccante #1: il test dello scenario 2 dipende dall'ordine di esecuzione", with severity tag "bloccante", reviewer "adversarial-reviewer (opus)", implementer response area "in attesa di correzione dall'implementatore", and resolution criteria "chiusura solo senza obiezioni bloccanti".
- Side panel: scenario list for issue #1 (4 scenari: 1 chiuso ✓, 1 in review ⚠, 2 da fare) each with SP badge.
- Bottom strip: related events from the log (pair-review events only), timestamped.
Keep all UI copy in Italian. Dense, sober, engineering-tool aesthetic.
```

## PROMPT 6 — Timeline filtrabile (Dark, Desktop)

```text
Create a new Dark desktop screen "Timeline eventi" for the same XP Flow design system (same header/nav and dark theme as the existing dashboard). Full-page event feed reading from an append-only JSONL log.

Layout:
- Filter bar at top: chip filters by cmd (brainstorm, sprint, pair-review, retro, metodo_feedback) and by esito (in_corso, chiuso, azione_manuale, escalation, bloccato), plus a date range. Show the state with chips "sprint" + "escalation" ACTIVE and a result count "3 eventi".
- Event rows (newest first): timestamp, cmd badge, issue ref, SP, esito with semantic color (chiuso=green, bloccato=amber, azione_manuale=red, escalation=purple), note text.
- One special row type: a WARNING row "riga 47 non valida — ignorata (JSON malformato)" with a subtle warning badge, demonstrating corrupted lines are skipped gracefully, not hidden.
- Right side mini-summary: eventi per cmd (bar counts), eventi oggi, ultima scrittura.
Keep all UI copy in Italian. Monospace accents for raw values, engineering-log aesthetic, dark theme.
```

## PROMPT 7 — Retro & metodo (Dark, Desktop)

```text
Create a new Dark desktop screen "Retro & metodo" for the same XP Flow design system (same header/nav and dark theme). This is the weekly retrospective and method-improvement view.

Layout, three sections:
1. "Metodo feedback accumulati" (top): counter badge "3 in attesa della prossima retro" + list of feedback items with date and source command (e.g. "markdownlint in conflitto coi doc del kit — 12/08 — da /sprint"). Caption: "il metodo si modifica SOLO in retro".
2. "Accuratezza stime" (left): small table per issue chiusa: issue, SP stimati, SP effettivi, scostamento % with up/down indicator; one-line insight "sottostima ricorrente sui task di integrazione".
3. "Escalation modelli" (right): list of logged escalations: rule number, task, from→to model (sonnet→opus), esito (risolto/no); mini counter "2 escalation questa settimana".
Footer strip: north-star recap "1 incremento di prodotto spedito · streak 1 settimana".
Keep all UI copy in Italian. Analytical, sober, data-first, dark theme.
```

## PROMPT 8 — Light canonico dashboard (Light, Desktop)

```text
Take the existing Dark desktop dashboard "XP Flow Dashboard (Desktop) - Fixed" (active sprint state) and produce the exact same screen in a LIGHT theme. Do not change layout, content, data or typography scale — only translate the color system: light neutral background, dark text, same semantic accent colors (green=ok, amber=blocked, red=action required) adjusted for light-background contrast (WCAG AA). This screen defines the canonical Light token set for the whole suite, so keep it strictly consistent and reusable.
```

## PROMPT 9 — Light canonico dashboard (Light, Mobile)

```text
Take the existing Dark mobile dashboard "XP Flow Dashboard (Mobile) - Fixed" (active sprint state) and produce the exact same screen in the LIGHT theme defined by the Light desktop canonical screen. Same layout and content, only the color translation, consistent tokens, WCAG AA contrast on light background.
```

## PROMPT 10 — Light "Serve da te" (Light, Desktop)

```text
Take the Dark desktop screen with Zone B "SERVE DA TE" populated (2 pending manual actions, blocked pair-review) and produce it in the LIGHT theme defined by the canonical Light screens. Same layout and content. Verify that the red "action required" accent and the amber "blocked" accent remain clearly dominant and readable on the light background — this screen is the stress test of the Light semantic palette.
```
