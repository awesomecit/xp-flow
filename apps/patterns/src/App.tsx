/**
 * Radice dell'app: compone la landing (HelloWorld) con la lista filtrabile
 * del catalogo pattern reale (issue #6). Nessuna logica qui, solo wiring.
 */
import { CatalogList } from "./components/CatalogList";
import { HelloWorld } from "./components/HelloWorld";
import { catalog } from "./catalog/catalog";

export function App() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
      <HelloWorld />
      <CatalogList patterns={catalog} />
    </main>
  );
}
