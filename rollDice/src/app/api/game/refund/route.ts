import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbQuery, dbExecute } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let roomIdToCancel: string | null = null;
    try {
      const body = await req.json();
      roomIdToCancel = body?.roomId || null;
    } catch {}

    // Security: Only allow refunding unplayed rooms to prevent abandoning losing games
    let querySql = `
      SELECT * FROM game_rooms 
      WHERE (player1_id = ? OR player2_id = ?) 
      AND status IN ('ACTIVE', 'WAITING')
      AND p1_score = 0 AND p2_score = 0 AND current_accumulated = 0
    `;
    let queryParams: any[] = [user.id, user.id];

    if (roomIdToCancel) {
      querySql += ` AND id = ?`;
      queryParams.push(roomIdToCancel);
    }

    const activeRooms = await dbQuery(querySql, queryParams);

    let totalRefunded = 0;

    for (const room of activeRooms) {
      const stake = Number(room.stake || 0);

      if (stake > 0) {
        // Atomic status update to CANCELLED before crediting wallet
        const cancelResult = await dbExecute(
          `UPDATE game_rooms SET status = 'CANCELLED' WHERE id = ? AND status IN ('ACTIVE', 'WAITING') AND p1_score = 0 AND p2_score = 0 AND current_accumulated = 0`,
          [room.id]
        );

        if ((cancelResult as any)?.affectedRows > 0) {
          // Refund stake to user wallet
          await dbExecute(`UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`, [stake, user.id]);
          totalRefunded += stake;

          // Record refund transaction
          await dbExecute(
            `INSERT INTO transactions (id, user_id, type, amount, status, metadata)
             VALUES (?, ?, 'REFUND', ?, 'COMPLETED', ?)`,
            [
              'tx_ref_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              user.id,
              stake,
              JSON.stringify({ roomId: room.id, mode: room.mode, reason: 'Game Exited / Cancelled' }),
            ]
          );
        }
      }
    }

    const updatedUser = await dbQuery(`SELECT wallet_balance FROM users WHERE id = ?`, [user.id]);
    const newBalance = Number(updatedUser[0]?.wallet_balance || 0);

    return NextResponse.json({
      success: true,
      refundedAmount: totalRefunded,
      newBalance,
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: error.message || 'Refund failed' }, { status: 500 });
  }
}
