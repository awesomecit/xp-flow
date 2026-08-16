import { test as base, createBdd } from "playwright-bdd";

/**
 * World condiviso dagli step: qui si aggiungono page object, seed dati,
 * login programmatico, override di tenant/locale.
 */
export type TestWorld = {
  /** Ultimo errore/console error catturato: usato dagli scenari negativi. */
  consoleErrors: string[];
  /** Dataset demo selezionato dagli step "Dato ..." (deterministico, niente flaky). */
  demo: { scenario: string | null };
};

export const test = base.extend<TestWorld>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await use(errors);
  },
  demo: async ({}, use) => {
    await use({ scenario: null });
  },
});

export const { Given, When, Then, Step, Before, After } = createBdd(test);
