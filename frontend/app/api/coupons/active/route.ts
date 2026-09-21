import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:3027/api';

    const response = await fetch(`${baseUrl}/coupons/active`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ data: data?.data ?? [] });
  } catch (error) {
    console.error('Failed to fetch active coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch active coupons' }, { status: 500 });
  }
}

