import {
  LEGACY_OWNER_EMAILS,
  USERS_SEED,
  findUserByEmail,
  findUserById,
  upsertUserInStore,
} from '../data/users.seed';
import { upsertUser } from './persist';
import { hasDatabase } from './pool';

/**
 * Asegura OWNER (esOwner) de DEMO / Full.
 * Migra emails legacy superadmin@… → owner@… (conserva id existente).
 */
export async function ensureTenantOwners(): Promise<void> {
  const owners = USERS_SEED.filter((u) => u.esOwner);

  for (const owner of owners) {
    const legacyEmail = LEGACY_OWNER_EMAILS[owner.email];
    const byNew = findUserByEmail(owner.email);
    const byLegacy = legacyEmail ? findUserByEmail(legacyEmail) : undefined;
    const byId = findUserById(owner.id);

    if (byNew) {
      const needsOwner = !byNew.esOwner || byNew.role !== 'ADMIN';
      const needsNombre = byNew.nombre !== owner.nombre;
      if (needsOwner || needsNombre) {
        const patched = {
          ...byNew,
          nombre: owner.nombre,
          esOwner: true,
          role: 'ADMIN' as const,
        };
        upsertUserInStore(patched);
        if (hasDatabase()) await upsertUser(patched);
        if (needsNombre) {
          console.log(`[db] tenant OWNER nombre sync ${owner.email} → ${owner.nombre}`);
        }
      }
      continue;
    }

    if (byLegacy) {
      const patched = {
        ...byLegacy,
        email: owner.email,
        nombre: owner.nombre,
        esOwner: true,
        role: 'ADMIN' as const,
      };
      upsertUserInStore(patched);
      if (hasDatabase()) await upsertUser(patched);
      console.log(`[db] tenant OWNER migrated ${legacyEmail} → ${owner.email}`);
      continue;
    }

    if (byId) {
      const patched = {
        ...byId,
        email: owner.email,
        esOwner: true,
        role: 'ADMIN' as const,
      };
      upsertUserInStore(patched);
      if (hasDatabase()) await upsertUser(patched);
      continue;
    }

    upsertUserInStore(owner);
    if (hasDatabase()) await upsertUser(owner);
    console.log(`[db] tenant OWNER upserted (${owner.email})`);
  }
}
