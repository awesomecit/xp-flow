/**
 * Intestazione della landing del catalogo pattern (issue #6).
 * Componente puro: titolo e sottotitolo vengono dal modulo i18n, locale
 * di default `it`. Nessuna logica oltre alla presentazione.
 */
import { DEFAULT_LOCALE, messages } from "../i18n/messages";

export function HelloWorld() {
  const t = messages[DEFAULT_LOCALE].landing;

  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="text-base text-foreground/70">{t.subtitle}</p>
    </header>
  );
}
