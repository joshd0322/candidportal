'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { OutreachTagInput } from '@/components/admin/OutreachTagInput';
import {
  addOutreachAccounts,
  listOutreachAccounts,
  listOutreachTagCatalog,
  OUTREACH_ASSIGN_LABELS,
  OUTREACH_ASSIGN_PRESETS,
  type OutreachAssignPreset,
  type OutreachOwnerOption,
  type OutreachTagCatalogItem,
} from '@/lib/outreach';

type Props = {
  customerId: string;
  companyName: string;
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  onDone: (message: string, ok: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
};

const POPOVER_W = 320;

export function AddToOutreachTagPopover({
  customerId,
  companyName,
  anchorRef,
  open,
  onClose,
  onDone,
  onBusyChange,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<OutreachTagCatalogItem[]>([]);
  const [owners, setOwners] = useState<OutreachOwnerOption[]>([]);
  const [assignPreset, setAssignPreset] = useState<OutreachAssignPreset>('me');
  const [otherUserId, setOtherUserId] = useState('');
  const [busy, setBusy] = useState(false);

  const reposition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - POPOVER_W, window.innerWidth - POPOVER_W - 8));
    let top = rect.bottom + 6;
    const estimatedHeight = 340;
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - estimatedHeight - 4);
    }
    setPos({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    setTagNames([]);
    setAssignPreset('me');
    setOtherUserId('');
    void listOutreachTagCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]));
    void listOutreachAccounts('me')
      .then((data) => setOwners(data.owners))
      .catch(() => setOwners([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  const submit = async () => {
    if (busy) return;
    if (assignPreset === 'other' && !otherUserId) {
      onDone('Pick who to assign', false);
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    try {
      await addOutreachAccounts([customerId], {
        tagNames: tagNames.length ? tagNames : undefined,
        assignPreset,
        otherUserId: assignPreset === 'other' ? otherUserId : undefined,
      });
      const assignLabel =
        assignPreset === 'other'
          ? owners.find((o) => o.id === otherUserId)?.displayName || 'assigned'
          : OUTREACH_ASSIGN_LABELS[assignPreset];
      const parts = [
        tagNames.length ? `tags: ${tagNames.join(', ')}` : null,
        assignPreset !== 'me' ? `assigned: ${assignLabel}` : null,
      ].filter(Boolean);
      onDone(
        parts.length ? `Added to outreach (${parts.join(' · ')})` : 'Added to outreach',
        true,
      );
      onClose();
    } catch (err) {
      onDone(err instanceof Error ? err.message : 'Could not add to outreach', false);
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const suggestions = catalog.map((t) => ({ name: t.name, accountCount: t.accountCount }));

  return createPortal(
    <div
      ref={panelRef}
      className="crm-outreach-add-popover"
      role="dialog"
      aria-label={`Add ${companyName} to outreach`}
      style={{ top: pos.top, left: pos.left, width: POPOVER_W }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="crm-outreach-add-popover-head">
        <strong>Add to outreach</strong>
        <span className="crm-outreach-add-popover-sub">{companyName}</span>
      </div>
      <OutreachTagInput
        label="Tags (optional)"
        value={tagNames}
        onChange={setTagNames}
        suggestions={suggestions}
        disabled={busy}
        placeholder="Select or create a tag"
      />
      <label className="crm-outreach-add-popover-field">
        <span>Assign to</span>
        <select
          className="outreach-select"
          value={assignPreset}
          disabled={busy}
          onChange={(e) => setAssignPreset(e.target.value as OutreachAssignPreset)}
        >
          {OUTREACH_ASSIGN_PRESETS.map((p) => (
            <option key={p} value={p}>
              {OUTREACH_ASSIGN_LABELS[p]}
            </option>
          ))}
        </select>
      </label>
      {assignPreset === 'other' ? (
        <label className="crm-outreach-add-popover-field">
          <span>Team member</span>
          <select
            className="outreach-select"
            value={otherUserId}
            disabled={busy}
            onChange={(e) => setOtherUserId(e.target.value)}
          >
            <option value="">Pick user…</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.displayName}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="crm-outreach-add-popover-hint">
        Assignment sets the Outreach Owner on the new row. The account still stays on your list.
      </p>
      <div className="crm-outreach-add-popover-actions">
        <button type="button" className="admin-ticket-btn" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || (assignPreset === 'other' && !otherUserId)}
          onClick={() => void submit()}
        >
          {busy ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
