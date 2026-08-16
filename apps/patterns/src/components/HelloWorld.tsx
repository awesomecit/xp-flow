/**
 * Intestazione della landing del catalogo pattern (issue #6).
 * Componente puro: titolo e sottotitolo vengono dal modulo i18n, locale
 * di default `it`. Nessuna logica oltre alla presentazione.
 */
import { DEFAULT_LOCALE, messages } from "../i18n/messages";

export function HelloWorld() {
  const t = messages[DEFAULT_LOCALE].landing;

  return (
    <header>
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
    </header>
  );
}
