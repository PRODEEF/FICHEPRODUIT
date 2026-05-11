import { useId, useState, type KeyboardEvent } from 'react';

import { Button, InputField, Modal, Tag } from '@shared/ui';

type TagListEditorProps = {
  label: string;
  tags: string[];
  disabled?: boolean;
  onAdd: (tag: string) => void | Promise<void>;
  onRemove: (tag: string) => void | Promise<void>;
};

export function TagListEditor({
  label,
  tags,
  disabled = false,
  onAdd,
  onRemove,
}: TagListEditorProps) {
  const baseId = useId();
  const inputId = `${baseId}-tag-input`;
  const [input, setInput] = useState('');
  const [tagToConfirm, setTagToConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || busy) return;
    setError(null);
    setBusy(true);
    try {
      await onAdd(trimmed);
      setInput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’ajouter.');
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  };

  const confirmRemove = async () => {
    if (!tagToConfirm || busy) return;
    setError(null);
    setBusy(true);
    try {
      await onRemove(tagToConfirm);
      setTagToConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de supprimer.');
    } finally {
      setBusy(false);
    }
  };

  const locked = disabled || busy;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">{label}</h2>
      {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Tag
            key={tag}
            variant="primary"
            onDismiss={locked ? undefined : () => setTagToConfirm(tag)}
            dismissLabel={`Retirer ${tag}`}
          >
            {tag}
          </Tag>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <InputField
          id={inputId}
          label="Ajouter une nouvelle marque"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ajouter…"
          disabled={locked}
        />
        <Button
          type="button"
          variant="neutral-outline"
          size="sm"
          disabled={locked || input.trim() === ''}
          onClick={() => void submit()}
          className="h-[42px]"
        >
          Ajouter
        </Button>
      </div>

      <Modal
        open={tagToConfirm !== null}
        title="Confirmer la suppression"
        onClose={() => {
          if (!busy) setTagToConfirm(null);
        }}
      >
        <h2 className="m-0 text-lg font-semibold text-text-primary">Supprimer cette étiquette ?</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {tagToConfirm ? (
            <>
              L’étiquette <span className="font-medium text-text-primary">« {tagToConfirm} »</span>{' '}
              sera retirée de la liste.
            </>
          ) : null}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="neutral-outline"
            size="sm"
            disabled={busy}
            onClick={() => setTagToConfirm(null)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => void confirmRemove()}
          >
            {busy ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
