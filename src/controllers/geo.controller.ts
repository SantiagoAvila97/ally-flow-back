import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { isCiudadBogotaArea } from '../data/ciudades.seed';

export interface GeoResult {
  displayName: string;
  lat: number | null;
  lon: number | null;
  mapEmbedUrl: string;
  mapLink: string;
  aproximada?: boolean;
}

const VIA_RE =
  /\b(calle|cl\.?|carrera|cra\.?|kr\.?|cr\.?|avenida|av\.?|ak\.?|ac\.?|diagonal|diag\.?|transversal|transv\.?|tv\.?|tr\.?|trans\.?|autopista)\b/i;

function googleUrls(query: string, lat?: number | null, lon?: number | null): {
  mapEmbedUrl: string;
  mapLink: string;
} {
  if (typeof lat === 'number' && typeof lon === 'number') {
    return {
      mapEmbedUrl: `https://www.google.com/maps?q=${lat},${lon}&z=17&hl=es&output=embed`,
      mapLink: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    };
  }
  const encoded = encodeURIComponent(query);
  return {
    mapEmbedUrl: `https://www.google.com/maps?q=${encoded}&z=17&hl=es&output=embed`,
    mapLink: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
  };
}

async function googleGeocode(
  address: string,
): Promise<{ lat: number; lon: number; formatted: string } | null> {
  if (!env.googleMapsApiKey) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('region', 'co');
  url.searchParams.set('language', 'es');
  url.searchParams.set('key', env.googleMapsApiKey);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const data = (await response.json()) as {
    status: string;
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };

  if (data.status !== 'OK' || !data.results?.length) return null;

  const hit = data.results[0];
  return {
    lat: hit.geometry.location.lat,
    lon: hit.geometry.location.lng,
    formatted: hit.formatted_address,
  };
}

/**
 * Valida formato colombiano y resuelve el mapa con Google Maps.
 * No se altera ni se filtra la dirección escrita por el usuario.
 */
export async function searchAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const direccion = String(req.query.direccion ?? '').trim();
    const ciudad = String(req.query.ciudad ?? '').trim();

    if (direccion.length < 5) {
      res.status(400).json({
        message: 'Indica una dirección más completa. Ejemplo: Calle 100 #19-50',
      });
      return;
    }

    if (!ciudad || !isCiudadBogotaArea(ciudad)) {
      res.status(400).json({ message: 'Selecciona una ciudad válida del área de Bogotá' });
      return;
    }

    if (!VIA_RE.test(direccion) || !/\d/.test(direccion) || !/#/.test(direccion)) {
      res.status(400).json({
        message:
          'Formato: Vía + número + # placa. Ejemplos: Calle 100 #19-50 · Cra 15 #85-20 · Av Boyacá #80-20',
      });
      return;
    }

    // Se usa tal cual la escribió el usuario (sin filtrar / recortar)
    const query = `${direccion}, ${ciudad}, Colombia`;
    const geocoded = await googleGeocode(query);
    const urls = googleUrls(query, geocoded?.lat, geocoded?.lon);

    const result: GeoResult = {
      displayName: geocoded?.formatted ?? query,
      lat: geocoded?.lat ?? null,
      lon: geocoded?.lon ?? null,
      mapEmbedUrl: urls.mapEmbedUrl,
      mapLink: urls.mapLink,
      aproximada: !geocoded,
    };

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
