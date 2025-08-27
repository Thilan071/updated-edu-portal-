import { NextResponse } from 'next/server';
import { ResourceService } from '@/lib/resourceService';

// GET /api/resources - Get all books and online resources
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module');
    const studentId = searchParams.get('studentId');
    const modules = searchParams.get('modules')?.split(',') || [];
    const difficultyLevel = searchParams.get('difficultyLevel') || 'intermediate';

    let result;

    if (studentId && modules.length > 0) {
      // Get personalized recommendations
      result = await ResourceService.getPersonalizedRecommendations(
        studentId, 
        modules, 
        difficultyLevel
      );
    } else if (module) {
      // Get resources for specific module
      const books = await ResourceService.getBooksByModule(module);
      const onlineResources = await ResourceService.getOnlineResourcesByModule(module);
      result = {
        books,
        online_resources: onlineResources
      };
    } else {
      // Get all resources
      const books = await ResourceService.getAllBooks();
      const onlineResources = await ResourceService.getAllOnlineResources();
      result = {
        books,
        online_resources: onlineResources
      };
    }

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch resources',
      details: error.message
    }, { status: 500 });
  }
}

// POST /api/resources - Add new resource (book or online resource)
export async function POST(request) {
  try {
    const resourceData = await request.json();
    const { resource_type } = resourceData;

    let result;
    if (resource_type === 'book') {
      result = await ResourceService.addBook(resourceData);
    } else if (resource_type === 'online') {
      result = await ResourceService.addOnlineResource(resourceData);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid resource type. Must be "book" or "online"'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Resource added successfully',
      data: result
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding resource:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add resource',
      details: error.message
    }, { status: 500 });
  }
}