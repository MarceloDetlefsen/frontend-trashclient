import { NextResponse } from 'next/server';

interface RouteGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    properties?: Record<string, unknown>;
  }>;
}

/**
 * GET /api/routes/optimized
 * Returns optimized collection route as GeoJSON (MVP: stub).
 * Future: input vehicle capacity, depot; run TSP/VRP and return route.
 */
export async function GET() {
  try {
    const geojson: RouteGeoJSON = {
      type: 'FeatureCollection',
      features: [],
    };
    return NextResponse.json(geojson);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get route';
    return NextResponse.json(
      { error: message, code: 'ROUTES_ERROR' },
      { status: 500 }
    );
  }
}
