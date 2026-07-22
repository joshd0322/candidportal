import { NextResponse } from 'next/server';
import { getMyRole } from '@/lib/auth/roles';
import {
  updateCustomerReminder,
  updateCustomerReminderStatus,
} from '@/lib/services/customer-reminders';
import type {
  CustomerReminderKind,
  CustomerReminderStatus,
  UpdateCustomerReminderInput,
} from '@/lib/customer-reminders/types';

const KINDS: CustomerReminderKind[] = ['task', 'reminder', 'calendar'];
const STATUSES: CustomerReminderStatus[] = ['open', 'completed', 'cancelled'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getMyRole()) !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as UpdateCustomerReminderInput & {
    status?: CustomerReminderStatus;
  };

  const keys = Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined);
  const statusOnly = keys.length === 1 && keys[0] === 'status';

  if (statusOnly) {
    if (!body.status || !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Valid status required' }, { status: 400 });
    }
    try {
      await updateCustomerReminderStatus(id, body.status);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (body.kind !== undefined && !KINDS.includes(body.kind)) {
    return NextResponse.json({ error: 'Valid kind required' }, { status: 400 });
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Valid status required' }, { status: 400 });
  }
  if (body.title !== undefined && !String(body.title).trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const reminder = await updateCustomerReminder(id, body);
    return NextResponse.json({ ok: true, reminder });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
