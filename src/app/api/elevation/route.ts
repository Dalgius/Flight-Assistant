
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OPENTOPODATA_API_BASE = 'https://api.opentopodata.org/v1/srtm90m';

// Switch from GET to POST to handle long location strings
export async function POST(request: NextRequest) {
    let locationsString: string;
    try {
        const body = await request.json();
        // Expecting the body to be { locations: "lat1,lng1|lat2,lng2|..." }
        if (!body.locations || typeof body.locations !== 'string') {
             return NextResponse.json({ error: 'Missing or invalid "locations" in request body.' }, { status: 400 });
        }
        locationsString = body.locations;
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    if (!locationsString) {
        return NextResponse.json({ error: 'Empty "locations" value in request body.' }, { status: 400 });
    }

    // The external API still expects a GET request, so we construct the URL with the locations.
    const targetUrl = `${OPENTOPODATA_API_BASE}?locations=${locationsString}&interpolation=cubic`;

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

        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 's-maxage=86400, stale-while-revalidate',
            },
        });

    } catch (error: any) {
        console.error(`Elevation API Proxy Error: ${error.message}`);
        return NextResponse.json({ error: 'Internal Server Error while proxying elevation request' }, { status: 500 });
    }
}
