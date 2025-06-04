import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Create a server-side Supabase client with the user's access token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { tripId } = await context.params;
    const userId = user.id;

    // First, test basic trip access
    const { data: basicTrip, error: basicError } = await supabase
      .from('trips')
      .select('id, user_id, name')
      .eq('id', tripId)
      .single();

    console.log('Basic trip query result:', { basicTrip, basicError });

    // Verify user has permission to share this trip (must be owner or existing collaborator)
    const { data: tripAccess, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, 
        user_id,
        name,
        trip_collaborators(user_id, role)
      `)
      .eq('id', tripId)
      .single();

    if (tripError) {
      console.error('Trip query error:', tripError);
      console.error('Trip ID:', tripId);
      console.error('User ID:', userId);
      return NextResponse.json({ 
        error: 'Trip not found', 
        details: tripError.message,
        tripId: tripId,
        userId: userId 
      }, { status: 404 });
    }

    // Check if user is owner or collaborator
    const isOwner = tripAccess.user_id === userId;
    const isCollaborator = tripAccess.trip_collaborators?.some(
      (collab: any) => collab.user_id === userId
    );

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Generate unique invitation token
    const invitationToken = crypto.randomUUID();
    
    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Insert invitation into database
    const { data: invitation, error: invitationError } = await supabase
      .from('trip_invitations')
      .insert({
        trip_id: tripId,
        invited_by: userId,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    return NextResponse.json({ 
      invitationToken,
      expiresAt: expiresAt.toISOString(),
      tripName: tripAccess.name 
    });

  } catch (error) {
    console.error('Error in invitation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 