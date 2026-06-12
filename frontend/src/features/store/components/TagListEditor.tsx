import { useId, useState, type KeyboardEvent } from 'react';

import { Button, InputField, Modal, Tag } from '@shared/ui';

import { SHOP_TAG_MAX_LENGTH, shopTagSchema } from '../lib/shopSchemas';

interface TagListEditorProps {
  label: string;
  tags: string[];
  disabled?: boolean;
  onAdd: (tag: string) => void | Promise<void>;
  onRemove: (tag: string) => void | Promise<void>;
  onValidateBeforeAdd?: (tag: string) => string | null;
}

export function TagListEditor({
  label,
  tags,
  disabled = false,
  onAdd,
  onRemove,
  onValidateBeforeAdd,
}: TagListEditorProps) {
  const baseId = useId();
  const inputId = `${baseId}-tag-input`;
  const [input, setInput] = useState('');
  const [tagToConfirm, setTagToConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (disabled || busy) return;
    setError(null);

    const parsed = shopTagSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Valeur invalide.');
      return;
    }

    const duplicateMessage = onValidateBeforeAdd?.(parsed.data) ?? null;
    if (duplicateMessage) {
      setError(duplicateMessage);
      return;
    }

    setBusy(true);
    try {
      await onAdd(parsed.data);
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
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Tag
            key={tag}
            variant="primary"
            onDismiss={locked ? undefined : () => void setTagToConfirm(tag)}
            dismissLabel={`Retirer ${tag}`}
          >
            {tag}
          </Tag>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <InputField
          id={inputId}
          label={`Ajouter une nouvelle ${label.slice(0, -1)}`}
          value={input}
          onChange={(e) => {
            setError(null);
            setInput(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder="Ajouter…"
          disabled={locked}
          maxLength={SHOP_TAG_MAX_LENGTH}
          showCharacterCount
          error={error ?? undefined}
          errorId={`${inputId}-error`}
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
            onClick={() => void setTagToConfirm(null)}
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
