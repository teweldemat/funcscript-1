import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorView } from '@codemirror/view';
import FuncScriptTester from '../FuncScriptTester.js';

type TesterHarnessProps = {
  initialValue?: string;
  saveKey?: string;
};

const TesterHarness = ({ initialValue = 'sin(x)', saveKey }: TesterHarnessProps) => {
  const [value, setValue] = useState(initialValue);
  return (
    <FuncScriptTester
      value={value}
      onChange={setValue}
      minHeight={160}
      style={{ height: 240 }}
      saveKey={saveKey}
    />
  );
};

const getEditorViewFromContainer = (container: HTMLElement | null) => {
  if (!container) {
    return null;
  }
  const editorElement = container.querySelector('.cm-editor');
  return editorElement ? EditorView.findFromDOM(editorElement as HTMLElement) : null;
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('FuncScriptTester tree workflow', () => {
  it('applies node edits back to the full expression', async () => {
    const user = userEvent.setup();
    const { container } = render(<TesterHarness />);

    await user.click((await screen.findAllByRole('button', { name: 'Tree' }))[0]);

    const treeEditor = await screen.findByTestId('tester-tree-editor');

    const nodeButton = await within(treeEditor).findByRole('button', { name: /^x$/ });
    await user.click(nodeButton);

    const getNodeEditor = () => {
      const editors = within(treeEditor).getAllByRole('textbox');
      expect(editors.length).toBeGreaterThan(0);
      return editors[editors.length - 1] as HTMLElement;
    };

    const nodeEditorDom = getNodeEditor();
    await user.click(nodeEditorDom);

    const nodeEditorView = EditorView.findFromDOM(nodeEditorDom);
    expect(nodeEditorView).not.toBeNull();

    nodeEditorView!.dispatch({
      changes: {
        from: 0,
        to: nodeEditorView!.state.doc.length,
        insert: 'abc'
      }
    });

    await waitFor(() => {
      const view = EditorView.findFromDOM(getNodeEditor());
      expect(view).not.toBeNull();
      expect(view!.state.doc.toString()).toBe('abc');
    });

    await user.click(await within(treeEditor).findByRole('button', { name: 'Apply Changes' }));

    const standardWrapper = screen.getByTestId('tester-standard-editor');
    await waitFor(() => {
      const standardView = getEditorViewFromContainer(standardWrapper);
      expect(standardView).not.toBeNull();
      expect(standardView!.state.doc.toString()).toBe('sin(abc)');
    });

    const previewContainer = treeEditor.querySelector('[style*="white-space: pre-wrap"]');
    expect(previewContainer).not.toBeNull();
    const selectionSpan = await within(previewContainer as HTMLElement).findByText('abc');
    expect(selectionSpan).toHaveStyle({ textDecoration: 'underline' });
  });

  it('clears node syntax errors after successful apply', async () => {
    const user = userEvent.setup();
    render(<TesterHarness initialValue="sin(abc)" />);

    await user.click((await screen.findAllByRole('button', { name: 'Tree' }))[0]);

    const treeEditor = await screen.findByTestId('tester-tree-editor');
    const nodeButton = await within(treeEditor).findByRole('button', { name: /^abc$/ });
    await user.click(nodeButton);

    const getNodeEditor = () => {
      const editors = within(treeEditor).getAllByRole('textbox');
      expect(editors.length).toBeGreaterThan(0);
      return editors[editors.length - 1] as HTMLElement;
    };

    const nodeEditorView = EditorView.findFromDOM(getNodeEditor());
    expect(nodeEditorView).not.toBeNull();

    nodeEditorView!.dispatch({
      changes: {
        from: 0,
        to: nodeEditorView!.state.doc.length,
        insert: 'x'
      }
    });

    await waitFor(() => {
      const view = EditorView.findFromDOM(getNodeEditor());
      expect(view).not.toBeNull();
      expect(view!.state.doc.toString()).toBe('x');
    });

    expect(screen.queryByTestId('tree-node-error')).toBeNull();

    await user.click(await within(treeEditor).findByRole('button', { name: 'Apply Changes' }));

    await within(treeEditor).findByRole('button', { name: /^sin\(x\)$/ });

    await waitFor(() => {
      expect(screen.queryByTestId('tree-node-error')).toBeNull();
    });
  });

  it('supports collapsing and expanding tree nodes', async () => {
    const user = userEvent.setup();
    render(<TesterHarness />);

    await user.click((await screen.findAllByRole('button', { name: 'Tree' }))[0]);

    const collapseToggle = await screen.findByRole('button', {
      name: /^Collapse node sin\(x\)$/
    });
    await user.click(collapseToggle);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^x$/ })).toBeNull();
    });

    const expandToggle = await screen.findByRole('button', {
      name: /^Expand node sin\(x\)$/
    });
    await user.click(expandToggle);

    await screen.findByRole('button', { name: /^x$/ });
  });

  it('persists tree state when saveKey is provided', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<TesterHarness saveKey="persist-test" />);

    await user.click((await screen.findAllByRole('button', { name: 'Tree' }))[0]);

    const collapseToggle = await screen.findByRole('button', {
      name: /^Collapse node sin\(x\)$/
    });
    await user.click(collapseToggle);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^x$/ })).toBeNull();
    });

    await user.click(screen.getAllByRole('button', { name: 'Show Testing' })[0]);

    unmount();

    render(<TesterHarness saveKey="persist-test" />);

    await screen.findByTestId('tester-tree-editor');
    expect(screen.queryByRole('button', { name: /^x$/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Hide Testing' })[0]).toBeInTheDocument();

    const expandToggle = await screen.findByRole('button', {
      name: /^Expand node sin\(x\)$/
    });
    await user.click(expandToggle);

    await screen.findByRole('button', { name: /^x$/ });
  });

  it('hides testing controls by default and toggles visibility', async () => {
    const user = userEvent.setup();
    render(<TesterHarness />);

    expect(screen.queryByText('Variables will appear here when referenced.')).toBeNull();

    await user.click(screen.getAllByRole('button', { name: 'Show Testing' })[0]);
    expect(await screen.findByText('Variables will appear here when referenced.')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Hide Testing' })[0]);
    await waitFor(() => {
      expect(screen.queryByText('Variables will appear here when referenced.')).toBeNull();
    });
  });
});
