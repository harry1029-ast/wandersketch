import { NextRequest, NextResponse } from 'next/server';
import { getCityPack } from '@/data/cityPacks';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    if (!slug) {
        return NextResponse.json({ error: 'Missing destination slug' }, { status: 400 });
    }

    // 1. In-memory City Pack lookup (0ms)
    const pack = getCityPack(slug);
    if (pack) {
        return NextResponse.json(
            {
                destination: {
                    id: pack.id,
                    cityName: pack.cityName,
                    districtName: pack.districtName,
                    country: pack.country,
                    center: pack.center,
                    zoom: pack.zoom,
                    bounds: pack.bounds,
                    userOrigin: pack.userOrigin,
                },
                landmarks: pack.landmarks,
                facilities: pack.facilities,
                source: 'city_pack',
            },
            {
                headers: {
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                },
            }
        );
    }

    // 2. Fallback to Supabase PostGIS if not in static pack
    try {
        const { data: dbDest, error: destError } = await supabase
            .from('destinations')
            .select('*')
            .eq('id', slug)
            .maybeSingle();

        if (destError) {
            console.error('Error querying destination from Supabase:', destError);
        }

        const { data: dbLandmarks, error: lmError } = await supabase
            .from('landmarks')
            .select('*')
            .eq('destination_id', slug);

        if (lmError) {
            console.error('Error querying landmarks from Supabase:', lmError);
        }

        return NextResponse.json({
            destination: dbDest || null,
            landmarks: dbLandmarks || [],
            facilities: [],
            source: 'supabase',
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

