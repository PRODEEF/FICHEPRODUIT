interface DepthGuidesProps {
  depth: number;
}

/**
 * Affiche les traits verticaux d'indentation selon la profondeur d'un nœud.
 * Un trait est rendu par niveau ancêtre (depth - 1).
 */
export function DepthGuides({ depth }: DepthGuidesProps) {
  const ancestorCount = Math.max(0, depth - 1);
  if (ancestorCount === 0) return null;
  return (
    <>
      {Array.from({ length: ancestorCount }, (_, index) => (
        <span
          key={index}
          className="h-9 w-5 shrink-0 self-stretch border-l border-gray-200"
          aria-hidden
        />
      ))}
    </>
  );
}
