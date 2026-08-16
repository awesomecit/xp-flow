/**
 * Server MSW per i test unitari (ambiente node/jsdom di vitest).
 * Gli handler sono gli stessi del browser: un solo contratto mockato.
 */
import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);
