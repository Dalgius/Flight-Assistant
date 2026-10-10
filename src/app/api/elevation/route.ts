
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OPENTOPODATA_API_BASE = 'https://api.opentopodata.org/v1/srtm90m';
// OpenTopoData accepts at most 100 locations per request.
const MAX_LOCATIONS = 100;
const COORDINATE_PAIR = /^(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/;

// Returns the normalized "lat,lng|lat,lng" string, or null if any pair is invalid.
function parseLocations(value: string): string | null {
    const pairs = value.split('|');
    if (pairs.length === 0 || pairs.length > MAX_LOCATIONS) return null;
    for (const pair of pairs) {
        const match = COORDINATE_PAIR.exec(pair);
        if (!match) return null;
        const lat = Number(match[1]);
        const lng = Number(match[2]);
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    }
    return pairs.join('|');
}

// Switch from GET to POST to handle long location strings
export async function POST(request: NextRequest) {
    let locationsString: string | null;
    try {
        const body = await request.json();
        // Expecting the body to be { locations: "lat1,lng1|lat2,lng2|..." }
        if (!body || typeof body.locations !== 'string') {
             return NextResponse.json({ error: 'Missing or invalid "locations" in request body.' }, { status: 400 });
        }
        locationsString = parseLocations(body.locations);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    if (!locationsString) {
        return NextResponse.json({ error: `"locations" must be 1-${MAX_LOCATIONS} "lat,lng" pairs separated by "|".` }, { status: 400 });
    }

    // The external API still expects a GET request, so we construct the URL with the locations.
    const targetUrl = `${OPENTOPODATA_API_BASE}?locations=${encodeURIComponent(locationsString)}&interpolation=cubic`;

    try {
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        const responseText = await res.text();

        if (!res.ok) {
            console.error(`Upstream API error: ${res.status}`, responseText);
            let errorDetails;
            try {
                errorDetails = JSON.parse(responseText);
            } catch {
                errorDetails = { error: "Failed to parse error from upstream API", raw: responseText };
            }
            return NextResponse.json(
                { error: 'Error from upstream API', details: errorDetails },
                { status: res.status }
            );
        }

        const data = JSON.parse(responseText);

        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error(`Elevation API Proxy Error: ${error.message}`);
        return NextResponse.json({ error: 'Internal Server Error while proxying elevation request' }, { status: 500 });
    }
}
