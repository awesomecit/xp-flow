/**
 * Radice dell'app: compone la landing (HelloWorld) con la lista filtrabile
 * del catalogo pattern reale (issue #6). Nessuna logica qui, solo wiring.
 */
import { CatalogList } from "./components/CatalogList";
import { HelloWorld } from "./components/HelloWorld";
import { catalog } from "./catalog/catalog";

export function App() {
  return (
    <main>
      <HelloWorld />
      <CatalogList patterns={catalog} />
    </main>
  );
}
