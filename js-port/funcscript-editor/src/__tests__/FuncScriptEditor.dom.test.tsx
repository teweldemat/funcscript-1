import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorView } from '@codemirror/view';
import FuncScriptEditor from '../FuncScriptEditor.js';

type TreeEditorHarnessProps = {
  initialValue?: string;
  saveKey?: string;
};

const TreeEditorHarness = ({ initialValue = 'sin(x)', saveKey }: TreeEditorHarnessProps) => {
  const [value, setValue] = useState(initialValue);
  return (
    <FuncScriptEditor
      value={value}
      onChange={setValue}
      minHeight={160}
      style={{ height: 240 }}
      saveKey={saveKey}
    />
  );
};

beforeEach(() => {
  window.localStorage.clear();
});

describe('FuncScriptEditor tree workflow', () => {
  it('shows the edited node expression after applying changes', async () => {
    const user = userEvent.setup();
    const { container } = render(<TreeEditorHarness />);

    const treeModeButton = (await screen.findAllByTestId('tree-mode-toggle'))[0];
    await user.click(treeModeButton);

    const nodeButton = await screen.findByRole('button', { name: /^x$/ });
    await user.click(nodeButton);

    const treeEditorContainer = await screen.findByTestId('tree-mode-editor');
    const getAllNodeEditors = () => within(treeEditorContainer).getAllByRole('textbox');
    const getNodeEditor = () => {
      const editors = getAllNodeEditors();
      expect(editors.length).toBeGreaterThan(0);
      return editors[editors.length - 1];
    };
    const nodeEditorContent = getNodeEditor();
    await user.click(nodeEditorContent);

    const getNodeEditorView = () => EditorView.findFromDOM(getNodeEditor());
    const initialView = getNodeEditorView();
    expect(initialView).not.toBeNull();

    initialView!.dispatch({
      changes: {
        from: 0,
        to: initialView!.state.doc.length,
        insert: 'abc'
      }
    });

    await waitFor(() => {
      const view = getNodeEditorView();
      expect(view).not.toBeNull();
      expect(view!.state.doc.toString()).toBe('abc');
      expect(getNodeEditor().textContent?.trim()).toBe('abc');
    });

    const applyButton = await screen.findByTitle('Apply changes to selected node');
    await user.click(applyButton);

    const getStandardEditorView = () => {
      const container = screen.getByTestId('standard-mode-editor');
      const editorElement = container.querySelector('.cm-editor');
      return editorElement ? EditorView.findFromDOM(editorElement as HTMLElement) : null;
    };

    await waitFor(() => {
      const standardView = getStandardEditorView();
      expect(standardView).not.toBeNull();
      expect(standardView!.state.doc.toString()).toBe('sin(abc)');
      expect(getNodeEditor().textContent?.trim()).toBe('abc');
    });

    const previewContainer = container.querySelector('[style*="white-space: pre-wrap"]');
    expect(previewContainer).not.toBeNull();

    const selectionSpan = await within(previewContainer as HTMLElement).findByText('abc');
    expect(selectionSpan).toHaveStyle({ textDecoration: 'underline' });
  });

  it('does not display a syntax error after applying changes', async () => {
    const user = userEvent.setup();
    render(<TreeEditorHarness initialValue="sin(abc)" />);

    const treeModeButton = (await screen.findAllByTestId('tree-mode-toggle'))[0];
    await user.click(treeModeButton);

    const nodeButton = await screen.findByRole('button', { name: /^abc$/ });
    await user.click(nodeButton);

    const treeEditorContainer = await screen.findByTestId('tree-mode-editor');
    const getAllNodeEditors = () => within(treeEditorContainer).getAllByRole('textbox');
    const getNodeEditor = () => {
      const editors = getAllNodeEditors();
      expect(editors.length).toBeGreaterThan(0);
      return editors[editors.length - 1];
    };
    const nodeEditorContent = getNodeEditor();
    await user.click(nodeEditorContent);

    const getNodeEditorView = () => EditorView.findFromDOM(getNodeEditor());
    const initialView = getNodeEditorView();
    expect(initialView).not.toBeNull();

    initialView!.dispatch({
      changes: {
        from: 0,
        to: initialView!.state.doc.length,
        insert: 'x'
      }
    });

    await waitFor(() => {
      const view = getNodeEditorView();
      expect(view).not.toBeNull();
      expect(view!.state.doc.toString()).toBe('x');
      expect(getNodeEditor().textContent?.trim()).toBe('x');
    });

    expect(screen.queryByTestId('tree-node-error')).toBeNull();

    const applyButton = await screen.findByTitle('Apply changes to selected node');
    await user.click(applyButton);

    await screen.findByRole('button', { name: /^sin\(x\)$/ });

    await waitFor(() => {
      expect(screen.queryByTestId('tree-node-error')).toBeNull();
    });
  });

  it('allows collapsing and expanding tree nodes', async () => {
    const user = userEvent.setup();
    render(<TreeEditorHarness />);

    const treeModeButton = (await screen.findAllByTestId('tree-mode-toggle'))[0];
    await user.click(treeModeButton);

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

  it('persists tree mode and collapsed nodes when saveKey is provided', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<TreeEditorHarness saveKey="persist-test" />);

    const treeModeButton = (await screen.findAllByTestId('tree-mode-toggle'))[0];
    await user.click(treeModeButton);

    const collapseToggle = await screen.findByRole('button', {
      name: /^Collapse node sin\(x\)$/
    });
    await user.click(collapseToggle);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^x$/ })).toBeNull();
    });

    unmount();

    render(<TreeEditorHarness saveKey="persist-test" />);

    await screen.findByTestId('tree-mode-editor');
    expect(screen.queryByRole('button', { name: /^x$/ })).toBeNull();

    const expandToggle = await screen.findByRole('button', {
      name: /^Expand node sin\(x\)$/
    });
    await user.click(expandToggle);

    await screen.findByRole('button', { name: /^x$/ });
  });
});
