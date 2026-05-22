import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../../src/state/store';

describe('designer store', () => {
  beforeEach(() => {
    useStore.getState().newProject();
  });

  it('adds an element', () => {
    useStore.getState().addElement('text');
    expect(useStore.getState().project.label.elements).toHaveLength(1);
  });

  it('undo and redo an add', () => {
    useStore.getState().addElement('box');
    expect(useStore.getState().project.label.elements).toHaveLength(1);
    useStore.getState().undo();
    expect(useStore.getState().project.label.elements).toHaveLength(0);
    useStore.getState().redo();
    expect(useStore.getState().project.label.elements).toHaveLength(1);
  });

  it('duplicates the selection', () => {
    useStore.getState().addElement('circle');
    useStore.getState().duplicateSelected();
    expect(useStore.getState().project.label.elements).toHaveLength(2);
  });

  it('copies and pastes', () => {
    useStore.getState().addElement('line');
    useStore.getState().copySelected();
    useStore.getState().pasteClipboard();
    expect(useStore.getState().project.label.elements).toHaveLength(2);
  });

  it('deletes the selection', () => {
    useStore.getState().addElement('text');
    useStore.getState().deleteSelected();
    expect(useStore.getState().project.label.elements).toHaveLength(0);
  });
});
