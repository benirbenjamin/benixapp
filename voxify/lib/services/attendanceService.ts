import { createClient } from '../supabase/client';
import { Rehearsal, AttendanceRecord, AttendanceStatus } from '../types/database.types';

export interface AttendanceStats {
  rehearsalsCount: number;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
}

export const attendanceService = {
  async getRehearsals(choirId: string): Promise<Rehearsal[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('rehearsals')
      .select('*')
      .eq('choir_id', choirId)
      .order('date', { ascending: false });

    return (data as Rehearsal[]) || [];
  },

  async createRehearsal(payload: {
    choir_id: string;
    title: string;
    date: string;
    start_time: string;
    end_time?: string;
    location?: string;
    description?: string;
  }): Promise<Rehearsal | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('rehearsals')
      .insert({
        ...payload,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error || !data) return null;
    return data as Rehearsal;
  },

  async recordAttendance(records: Array<{
    rehearsal_id?: string;
    event_id?: string;
    member_id: string;
    status: AttendanceStatus;
    notes?: string;
  }>): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = records.map(r => ({
      ...r,
      recorded_by: user?.id || null,
      recorded_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(payload);

    return !error;
  },

  async getRehearsalAttendance(rehearsalId: string): Promise<AttendanceRecord[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('attendance')
      .select('*, member:choir_members(*, profile:profiles(*))')
      .eq('rehearsal_id', rehearsalId);

    return (data as AttendanceRecord[]) || [];
  },

  async getMemberAttendanceHistory(memberId: string): Promise<any[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('attendance')
      .select('*, rehearsal:rehearsals(*), event:events(*)')
      .eq('member_id', memberId)
      .order('recorded_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async getChoirAttendanceStats(choirId: string): Promise<AttendanceStats> {
    const supabase = createClient();

    // Fetch all rehearsals for choir
    const { data: rehearsals } = await supabase
      .from('rehearsals')
      .select('id')
      .eq('choir_id', choirId);

    const rehearsalIds = (rehearsals || []).map(r => r.id);
    const rehearsalsCount = rehearsalIds.length;

    if (rehearsalIds.length === 0) {
      return {
        rehearsalsCount: 0,
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendancePercentage: 100,
      };
    }

    // Fetch all attendance records for these rehearsals
    const { data: records } = await supabase
      .from('attendance')
      .select('status')
      .in('rehearsal_id', rehearsalIds);

    const totalRecords = records?.length || 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    (records || []).forEach(r => {
      if (r.status === 'present') presentCount++;
      else if (r.status === 'absent') absentCount++;
      else if (r.status === 'late') lateCount++;
      else if (r.status === 'excused') excusedCount++;
    });

    const attended = presentCount + lateCount + excusedCount;
    const attendancePercentage = totalRecords > 0 ? Math.round((attended / totalRecords) * 100) : 100;

    return {
      rehearsalsCount,
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendancePercentage,
    };
  },

  async getMemberAttendanceStats(memberId: string): Promise<AttendanceStats> {
    const supabase = createClient();

    const { data: records } = await supabase
      .from('attendance')
      .select('status')
      .eq('member_id', memberId);

    const totalRecords = records?.length || 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    (records || []).forEach(r => {
      if (r.status === 'present') presentCount++;
      else if (r.status === 'absent') absentCount++;
      else if (r.status === 'late') lateCount++;
      else if (r.status === 'excused') excusedCount++;
    });

    const attended = presentCount + lateCount + excusedCount;
    const attendancePercentage = totalRecords > 0 ? Math.round((attended / totalRecords) * 100) : 100;

    return {
      rehearsalsCount: totalRecords,
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendancePercentage,
    };
  }
};
