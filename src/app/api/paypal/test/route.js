// src/app/api/paypal/test/route.js
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ 
        status: 'OK',
        message: 'API PayPal test route working',
        clientId: process.env.PAYPAL_CLIENT_ID ? 'PRESENT' : 'MISSING',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET ? 'PRESENT' : 'MISSING'
    });
}