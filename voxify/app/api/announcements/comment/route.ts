import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function parseMetadata(ann: any) {
  let realAttachment: string | null = null;
  let comments: any[] = [];
  let reactions: any[] = [];

  if (!ann || !ann.attachment_url) {
    return { realAttachment, comments, reactions };
  }

  const str = ann.attachment_url;
  if (str.startsWith('__META_V2__:')) {
    try {
      const parsed = JSON.parse(str.replace('__META_V2__:', ''));
      realAttachment = parsed.realAttachment || null;
      comments = parsed.comments || [];
      reactions = parsed.reactions || [];
    } catch (e) {
      // ignore
    }
  } else if (!str.startsWith('__VOXIFY_META__:')) {
    realAttachment = str;
  }

  return { realAttachment, comments, reactions };
}

function stringifyMetadata(meta: any) {
  return '__META_V2__:' + JSON.stringify(meta);
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { announcementId, content } = await req.json();

    if (!announcementId || !content || !content.trim()) {
      return NextResponse.json({ error: 'Announcement ID and content are required' }, { status: 400 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const userProfile = profile || {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Choir Member',
      email: user.email!,
    };

    // Fetch current announcement
    const { data: ann, error: annErr } = await supabase
      .from('announcements')
      .select('attachment_url')
      .eq('id', announcementId)
      .single();

    if (annErr || !ann) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const meta = parseMetadata(ann);

    const newComment = {
      id: Math.random().toString(36).substring(2, 11),
      announcement_id: announcementId,
      user_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_profile: userProfile,
    };

    meta.comments.push(newComment);
    const updatedMeta = stringifyMetadata(meta);

    const { error: updateErr } = await supabase
      .from('announcements')
      .update({ attachment_url: updatedMeta })
      .eq('id', announcementId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const { data: list } = await supabase
      .from('announcements')
      .select('id, attachment_url');

    if (list) {
      for (const ann of list) {
        const meta = parseMetadata(ann);
        const commentIdx = meta.comments.findIndex((c: any) => c.id === commentId);
        if (commentIdx >= 0) {
          meta.comments.splice(commentIdx, 1);
          const updatedMeta = stringifyMetadata(meta);
          await supabase
            .from('announcements')
            .update({ attachment_url: updatedMeta })
            .eq('id', ann.id);
          break;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
