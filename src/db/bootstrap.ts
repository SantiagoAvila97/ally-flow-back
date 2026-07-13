import { hydrateEmpresas } from '../data/empresas.seed';
import { hydrateUsers } from '../data/users.seed';
import { casoRepository } from '../repositories/caso.repository';
import { catalogoRepository } from '../repositories/catalogo.repository';
import { costoRepository } from '../repositories/costo.repository';
import { plantillaPdfRepository } from '../repositories/plantilla-pdf.repository';
import { env } from '../config/env';
import { hasDatabase } from './pool';
import { migrate } from './migrate';
import { seedIfEmpty } from './seed';
import { loadAllFromDb } from './hydrate';
import { enablePersistence } from './persist';

/**
 * Si hay DATABASE_URL: migra, seed (si vacío), hidrata repos en memoria y activa write-through.
 * Sin DATABASE_URL: modo demo in-memory (local).
 */
export async function bootstrapDatabase(): Promise<void> {
  if (!hasDatabase()) {
    console.log(`[db] no DATABASE_URL — in-memory (${env.appEnv})`);
    return;
  }

  console.log(`[db] connecting (${env.appEnv})…`);
  await migrate();
  await seedIfEmpty();

  const data = await loadAllFromDb();
  hydrateEmpresas(data.empresas);
  hydrateUsers(data.users);
  catalogoRepository.hydrate(data.aseguradoras, data.ciudades);
  costoRepository.hydrate(data.categorias, data.items);
  plantillaPdfRepository.hydrate(data.plantillas);
  casoRepository.hydrate(data.casos);

  enablePersistence(true);
  console.log(
    `[db] ready — empresas=${data.empresas.length} users=${data.users.length} casos=${data.casos.length}`,
  );
}
