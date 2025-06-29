
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OPENTOPODATA_API_BASE = 'https://api.opentopodata.org/v1/srtm90m';

export async function GET(request: NextRequest) {
    // A more robust way to get search params on different platforms
    const locations = request.nextUrl.searchParams.get('locations');

    if (!locations) {
        return NextResponse.json({ error: 'Missing "locations" query parameter.' }, { status: 400 });
    }

    const targetUrl = `${OPENTOPODATA_API_BASE}?locations=${locations}&interpolation=cubic`;

    try {
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json', // Use Accept header for GET requests
            },
            signal: AbortSignal.timeout(15000), // Increased timeout to 15 seconds
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: "Failed to parse error response" }));
             return NextResponse.json(
                { error: 'Error from upstream API', details: errorData },
                { status: res.status }
            );
        }

        const data = await res.json();

        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 's-maxage=86400, stale-while-revalidate', // Cache for 1 day
            },
        });

    } catch (error: any) {
        console.error(`Elevation API Error: ${error.name === 'TimeoutError' ? 'Request timed out' : error.message}`);
         if (error.name === 'AbortError' || error.name === 'TimeoutError') {
             return NextResponse.json({ error: 'Request to upstream API timed out' }, { status: 504 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
