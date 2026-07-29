import { describe, expect, it } from 'vitest';

import {
  addChildNode,
  countCategoryNodes,
  createCategoryNode,
  findSiblingDuplicateName,
  removeCategoryNode,
  updateNodeName,
} from './categoryTreeSchemas';

describe('categoryTreeSchemas helpers', () => {
  it('createCategoryNode crée un nœud avec id et children vides', () => {
    const node = createCategoryNode('  Glisse  ');
    expect(node.name).toBe('Glisse');
    expect(node.children).toEqual([]);
    expect(node.id.length).toBeGreaterThan(0);
  });

  it('addChildNode ajoute à la racine ou sous un parent', () => {
    const root = createCategoryNode('Sport');
    const child = createCategoryNode('Vélo');
    const withRoot = addChildNode([], null, root);
    const withChild = addChildNode(withRoot, root.id, child);
    expect(withChild[0]?.children).toHaveLength(1);
    expect(withChild[0]?.children[0]?.name).toBe('Vélo');
  });

  it('updateNodeName et removeCategoryNode fonctionnent en profondeur', () => {
    const root = createCategoryNode('A');
    const child = createCategoryNode('B');
    let tree = addChildNode([root], root.id, child);
    tree = updateNodeName(tree, child.id, 'B2');
    expect(tree[0]?.children[0]?.name).toBe('B2');
    tree = removeCategoryNode(tree, root.id);
    expect(tree).toEqual([]);
  });

  it('countCategoryNodes et findSiblingDuplicateName', () => {
    const a = createCategoryNode('Sport');
    const b = createCategoryNode('Mode');
    const tree = [a, b];
    expect(countCategoryNodes(tree)).toBe(2);
    expect(findSiblingDuplicateName(tree, 'sport')).toBe('Sport');
    expect(findSiblingDuplicateName(tree, 'Autre')).toBeUndefined();
  });
});
