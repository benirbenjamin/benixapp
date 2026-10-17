import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getPlatformStorageOverview,
  addDriveAccount,
  updateDriveAccount,
  deleteDriveAccount,
  resetFullAccounts,
  testDriveConnection,
  updateBucketQuota,
} from '@/lib/services/googleDriveService';

async function verifySuperAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  if (user.user_metadata?.is_super_admin === true) return true;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.is_super_admin === true;
}

export async function GET() {
  try {
    const isAdmin = await verifySuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const overview = await getPlatformStorageOverview();
    return NextResponse.json(overview);
  } catch (err: any) {
    console.error('Storage API GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load storage overview' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifySuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Test OAuth credentials before adding or test existing account by ID
    if (action === 'test_connection') {
      const { id, credentials_json } = body;
      let credsToTest = credentials_json;
      if (!credsToTest && id) {
        const { getDriveAccounts } = await import('@/lib/services/googleDriveService');
        const accounts = await getDriveAccounts();
        const acc = accounts.find((a) => a.id === id);
        if (acc) {
          credsToTest = acc.credentials_json;
        }
      }
      const result = await testDriveConnection(credsToTest);
      return NextResponse.json(result);
    }

    // Add Google Drive account with OAuth refresh token
    if (action === 'add_account') {
      const { account_email, folder_id, credentials_json, max_storage_mb } = body;
      const result = await addDriveAccount({
        account_email,
        folder_id,
        credentials_json,
        max_storage_mb,
      });
      return NextResponse.json(result);
    }

    // Update Bucket Quota limit (MB)
    if (action === 'update_bucket_quota') {
      const { quota_mb } = body;
      const result = await updateBucketQuota(Number(quota_mb) || 1000);
      return NextResponse.json(result);
    }

    // Update existing Drive account
    if (action === 'update_account') {
      const { id, updates } = body;
      const result = await updateDriveAccount(id, updates);
      return NextResponse.json(result);
    }

    // Delete Drive account from pool
    if (action === 'delete_account') {
      const { id } = body;
      const result = await deleteDriveAccount(id);
      return NextResponse.json(result);
    }

    // Reset full accounts back to active
    if (action === 'reset_full_accounts') {
      const result = await resetFullAccounts();
      const overview = await getPlatformStorageOverview();
      return NextResponse.json({ ...result, ...overview });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Storage API POST error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
