import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OPENTOPODATA_API_BASE = 'https://api.opentopodata.org/v1/srtm90m';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const locations = searchParams.get('locations');

    if (!locations) {
        return NextResponse.json({ error: 'Missing "locations" query parameter.' }, { status: 400 });
    }

    const targetUrl = `${OPENTOPODATA_API_BASE}?locations=${locations}&interpolation=cubic`;

    try {
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000), // 10 seconds timeout
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
