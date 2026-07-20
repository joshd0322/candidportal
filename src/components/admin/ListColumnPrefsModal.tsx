'use client';

import { AppIcon } from '@/components/AppIcon';

type ColumnOption = {
  id: string;
  label: string;
  locked?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  columns: ColumnOption[];
  visibleIds: string[];
  onToggle: (id: string) => void;
  onRestoreDefaults: () => void;
  onClose: () => void;
};

export function ListColumnPrefsModal({
  title,
  subtitle = 'Choose which columns appear in your table.',
  columns,
  visibleIds,
  onToggle,
  onRestoreDefaults,
  onClose,
}: Props) {
  const visible = new Set(visibleIds);

  return (
    <div className="outreach-modal-backdrop" onClick={onClose}>
      <div
        className="outreach-modal"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="outreach-modal-head">
          <strong>{title}</strong>
          <button type="button" className="admin-ticket-btn" onClick={onClose} aria-label="Close">
            <AppIcon name="close" size={12} />
          </button>
        </div>
        <p className="outreach-muted" style={{ margin: '0 0 10px' }}>
          {subtitle}
        </p>
        <div className="outreach-picker-list">
          {columns.map((col) => {
            const checked = visible.has(col.id) || Boolean(col.locked);
            return (
              <div key={col.id} className="outreach-picker-row outreach-column-row">
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={col.locked}
                    onChange={() => {
                      if (!col.locked) onToggle(col.id);
                    }}
                  />
                  <span>{col.label}</span>
                </label>
              </div>
            );
          })}
        </div>
        <div className="outreach-modal-actions">
          <button type="button" className="admin-ticket-btn" onClick={onRestoreDefaults}>
            Restore defaults
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
