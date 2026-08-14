# Installazione del laboratorio su una macchina nuova

## Prerequisiti
`gh auth status` ok (account awesomecit, alias SSH `github-antonio`) ·
Docker Desktop attivo · Claude Code aggiornato · Node 22 via nvm (`.nvmrc`)

## Struttura
Il laboratorio è **xp-flow** (metodo + fabbrica + diario `agile/`);
**universal-canvas** è la sua UI (monitor). `~/dev` è solo il contenitore:
tiene le cerimonie personali (`claude-commands/`), il kit git per repo
esterni (`git-toolchain/`) e la config workspace — i repo annidati sono
gitignorati e autonomi (niente submodules).

```bash
git clone git@github-antonio:awesomecit/dev.git ~/dev && cd ~/dev
git clone git@github-antonio:awesomecit/xp-flow.git xp-flow
git clone git@github-antonio:awesomecit/universal-canvas.git universal-canvas
```

In ogni repo applicare l'identity locale (git non legge `.gitconfig` del
workspace da solo):

```bash
git config user.name "Cit" && git config user.email "awesome.cit.dev@gmail.com"
```

Cerimonie personali via symlink:
`ln -s ~/dev/claude-commands/<cmd>.md ~/.claude/commands/<cmd>.md`.
Hook husky condivisi in `~/.claude/shared-hooks/` (delegati da ogni repo via
`.husky/pre-commit` e `.husky/commit-msg`).

## Fiducia dei workspace (Claude Code)
Claude Code lega la fiducia al **path assoluto** della directory: al primo
avvio in un workspace va accettato il trust dialog, altrimenti i comandi di
progetto (`.claude/commands/` — qui `/brainstorm /sprint /pair-review
/retro`) e le regole `permissions.allow` dei settings vengono **ignorati in
silenzio**; i comandi utente in `~/.claude/commands/` restano attivi.
Dopo un clone nuovo o uno **spostamento del repo** il trust va ridato:
lanciare `claude` una volta in ogni workspace (`~/dev` e `~/dev/xp-flow`) e
accettare il dialog. Sintomi tipici: i comandi custom "spariti" e il warning
`Ignoring N permissions.allow entries … has not been trusted` in headless
(successo il 14/08/2026 dopo lo spostamento dei repo da `~/dev/personal/*`).

## Da dove si lavora
- Sessioni quotidiane: da `xp-flow/` (`claude --model opusplan`) — comandi
  `/brainstorm /sprint /pair-review /retro`; la memoria auto di Claude Code
  vive sulla chiave di questa directory.
- UI/monitor: repo `universal-canvas` (bun, vitest, Playwright).
- VS Code: aprire `~/dev/dev.code-workspace` (multi-root).

## Ordine di lavoro
`TODO.md` → `ROADMAP.md` → `.xpflow/events.jsonl` (+ issue GitHub).

> Nota: `tech-citizen/` (citycat.app, common/foundation) è congelato — si
> riprende dopo; il suo kit `.claude/` resta in `~/dev/.claude/`.
