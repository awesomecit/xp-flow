import { expect } from "@playwright/test";

import { Given, Then, When } from "../fixtures";

/** Step comuni riusabili: navigazione, contenuto, viewport, errori. */

Given("l'utente apre la pagina {string}", async ({ page, demo }, path: string) => {
  const url = demo.scenario
    ? `${path}${path.includes("?") ? "&" : "?"}demo=${demo.scenario}`
    : path;
  await page.goto(url, { waitUntil: "domcontentloaded" });
});

/** Selettori di dataset demo: rendono gli scenari deterministici. */
Given("non esiste uno sprint in corso", async ({ demo }) => {
  demo.scenario = "no-sprint";
});

Given("non ci sono eventi bloccati o in escalation", async ({ demo }) => {
  demo.scenario = "healthy";
});

Given("non ci sono eventi in escalation", async ({ demo }) => {
  demo.scenario = "healthy";
});

/** Scenari di trasporto serviti da MSW: 500, payload fuori contratto, lentezza. */
Given("il backend risponde con {string}", async ({ demo }, scenario: string) => {
  demo.scenario = scenario;
});

Given("il dataset demo è {string}", async ({ demo }, scenario: string) => {
  demo.scenario = scenario;
});

Then("il pulsante {string} è disabilitato", async ({ page }, name: string) => {
  await expect(page.getByRole("button", { name }).first()).toBeDisabled();
});

When("ricarica la pagina", async ({ page }) => {
  await page.reload({ waitUntil: "domcontentloaded" });
});

When("seleziona {string} nel filtro {string}", async ({ page }, value: string, label: string) => {
  await page.getByLabel(label).selectOption(value);
});

Then("non vede un messaggio di errore", async ({ page }) => {
  await expect(page.getByRole("alert")).toHaveCount(0);
});

Then("la navigazione primaria contiene {int} voci", async ({ page }, count: number) => {
  const nav = page.getByRole("navigation", { name: "Navigazione principale" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(count);
});

Given("la viewport è {int}x{int}", async ({ page }, width: number, height: number) => {
  await page.setViewportSize({ width, height });
});

When("clicca sul link {string}", async ({ page }, name: string) => {
  await page.getByRole("link", { name }).click();
});

When("clicca sul pulsante {string}", async ({ page }, name: string) => {
  await page.getByRole("button", { name }).click();
});

/** Click disambiguato quando in pagina esistono più pager (es. dashboard). */
When(
  "clicca sul pulsante {string} della paginazione {string}",
  async ({ page }, name: string, list: string) => {
    await page
      .getByRole("navigation", { name: `Paginazione ${list}` })
      .getByRole("button", { name })
      .click();
  },
);

/** Match case-insensitive: molte etichette sono maiuscole solo via CSS. */
function textRe(text: string): RegExp {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

Then("vede il testo {string}", async ({ page }, text: string) => {
  // Si considera solo il primo match VISIBILE: le viste responsive tengono in
  // DOM anche i nodi nascosti (sidebar/bottom-nav), che renderebbero il test flaky.
  const visible = page.getByText(textRe(text)).locator("visible=true").first();
  await expect(visible).toBeVisible();
});

Then("non vede il testo {string}", async ({ page }, text: string) => {
  await expect(page.getByText(textRe(text))).toHaveCount(0);
});

Then("il titolo della pagina contiene {string}", async ({ page }, text: string) => {
  await expect(page).toHaveTitle(new RegExp(text, "i"));
});

Then("l'url è {string}", async ({ page }, path: string) => {
  await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, "\\/")}$`));
});

Then("non ci sono errori in console", async ({ consoleErrors }) => {
  expect(consoleErrors).toEqual([]);
});
