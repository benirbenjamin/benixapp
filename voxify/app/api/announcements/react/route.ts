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

    const { announcementId, reactionType } = await req.json();

    if (!announcementId || !reactionType) {
      return NextResponse.json({ error: 'Announcement ID and reaction type are required' }, { status: 400 });
    }

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
    const existingIdx = meta.reactions.findIndex(
      (r: any) => r.user_id === user.id && r.reaction_type === reactionType
    );

    if (existingIdx >= 0) {
      meta.reactions.splice(existingIdx, 1);
    } else {
      meta.reactions.push({ user_id: user.id, reaction_type: reactionType });
    }

    const updatedMeta = stringifyMetadata(meta);

    const { error: updateErr } = await supabase
      .from('announcements')
      .update({ attachment_url: updatedMeta })
      .eq('id', announcementId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reactions: meta.reactions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
