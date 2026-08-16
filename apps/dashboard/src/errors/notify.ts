import { toast } from "sonner";

import { normalizeError, type AppError } from "./AppError";

type Notifier = (error: AppError) => void;

/**
 * Notifica utente disaccoppiata dal renderer.
 * Default: toast (sonner). In test / Android nativo si può sostituire con
 * `setNotifier` senza toccare i call site.
 */
let notifier: Notifier = (error) => {
  toast.error(userMessage(error), { description: error.code });
};

export function setNotifier(next: Notifier): void {
  notifier = next;
}

/** Messaggio human-readable, neutro rispetto ai dettagli tecnici. */
export function userMessage(error: AppError): string {
  switch (error.kind) {
    case "network":
      return "Connessione non disponibile.";
    case "timeout":
      return "La richiesta ha impiegato troppo tempo.";
    case "auth":
      return "Non hai i permessi per questa operazione.";
    case "notFound":
      return "Risorsa non trovata.";
    case "validation":
      return "Dati non validi.";
    case "server":
      return "Errore del servizio, riprova più tardi.";
    default:
      return "Si è verificato un errore imprevisto.";
  }
}

export function notifyError(error: unknown): AppError {
  const app = normalizeError(error);
  notifier(app);
  return app;
}
