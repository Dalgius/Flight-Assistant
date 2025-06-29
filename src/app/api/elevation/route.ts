
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OPENTOPODATA_API_BASE = 'https://api.opentopodata.org/v1/srtm90m';

export async function GET(request: NextRequest) {
    // Use the standard URL object to parse search parameters for maximum compatibility.
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
                'Accept': 'application/json',
            },
            // Rely on the platform's default timeout
        });

        // Get the raw text first to handle both success and error cases robustly
        const responseText = await res.text();

        if (!res.ok) {
            console.error(`Upstream API error: ${res.status}`, responseText);
            // Attempt to parse the error text as JSON, but have a fallback
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

        // Re-parsing the JSON from text ensures it's valid before sending.
        const data = JSON.parse(responseText);

        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 's-maxage=86400, stale-while-revalidate', // Cache for 1 day
            },
        });

    } catch (error: any) {
        console.error(`Elevation API Proxy Error: ${error.message}`);
        return NextResponse.json({ error: 'Internal Server Error while proxying elevation request' }, { status: 500 });
    }
}
