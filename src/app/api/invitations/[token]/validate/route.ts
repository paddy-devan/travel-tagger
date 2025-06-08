import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { token } = await params;

    // First check if invitation exists at all
    const { data: invitation, error: invitationError } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single();

    if (invitationError || !invitation) {
      console.error('Invitation lookup failed:', invitationError);
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is still valid
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 404 }
      );
    }

    // Get trip details separately
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, name, start_date, end_date, user_id')
      .eq('id', invitation.trip_id)
      .single();

    if (tripError || !trip) {
      console.error('Trip lookup failed:', tripError);
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Get owner details separately
    const { data: owner } = await supabase
      .from('users')
      .select('email')
      .eq('id', trip.user_id)
      .single();

    // Get pins for the trip (using service role key bypasses RLS)
    const { data: pins } = await supabase
      .from('pins')
      .select('*')
      .eq('trip_id', trip.id)
      .order('order', { ascending: true });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        trip_id: invitation.trip_id,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at
      },
      trip: {
        id: trip.id,
        name: trip.name,
        start_date: trip.start_date,
        end_date: trip.end_date,
        owner: {
          full_name: null,
          email: owner?.email || null
        }
      },
      pins: pins || []
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 