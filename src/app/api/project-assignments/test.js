import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ message: 'Project assignments API is working!' }, { status: 200 });
}

export async function POST(request) {
  try {
    console.log('Project assignments POST route hit');
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json({ 
      message: 'POST endpoint working',
      receivedData: body
    }, { status: 200 });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ error: 'Test error' }, { status: 500 });
  }
}
