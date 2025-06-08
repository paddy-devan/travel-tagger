import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { token } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate the invitation token
    const { data: invitation, error: invitationError } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('invitation_token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Ensure user exists in database (for new signups)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      // Get user details from auth to create user record
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser.user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email,
        });

      if (userError && userError.code !== '23505') {
        console.error('Error creating user record:', userError);
        return NextResponse.json(
          { error: `Failed to create user record: ${userError.message}` },
          { status: 500 }
        );
      }
    }

    // Check if user is already a collaborator
    const { data: existingCollaborator } = await supabase
      .from('trip_collaborators')
      .select('id')
      .eq('trip_id', invitation.trip_id)
      .eq('user_id', userId)
      .single();

    if (existingCollaborator) {
      return NextResponse.json(
        { error: 'User is already a collaborator on this trip' },
        { status: 400 }
      );
    }

    // Add user as collaborator WITH invitation tracking
    const { error: collaboratorError } = await supabase
      .from('trip_collaborators')
      .insert({
        trip_id: invitation.trip_id,
        user_id: userId,
        role: 'editor',
        created_by: invitation.invited_by,
        invitation_id: invitation.id
      });

    if (collaboratorError) {
      console.error('Error adding collaborator:', collaboratorError);
      return NextResponse.json(
        { error: 'Failed to add collaborator' },
        { status: 500 }
      );
    }

    console.log('Successfully added collaborator:', {
      trip_id: invitation.trip_id,
      user_id: userId,
      invitation_id: invitation.id
    });

    // Verify the collaborator was added
    const { data: verifyCollaborator } = await supabase
      .from('trip_collaborators')
      .select('*')
      .eq('trip_id', invitation.trip_id)
      .eq('user_id', userId)
      .single();

    console.log('Collaborator verification:', verifyCollaborator);

    return NextResponse.json({
      success: true,
      tripId: invitation.trip_id
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 