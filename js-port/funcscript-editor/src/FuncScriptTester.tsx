import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react';
import FuncScriptEditor from './FuncScriptEditor.js';
import {
  Engine,
  FSDataType,
  type DefaultFsDataProvider,
  type TypedValue
} from '@tewelde/funcscript/browser';
import type { FuncScriptEditorProps } from './FuncScriptEditor.js';

type VariableState = {
  name: string;
  key: string;
  expression: string;
  typedValue: TypedValue | null;
  error: string | null;
};

class TesterDataProvider extends Engine.FsDataProvider {
  private readonly defaultProvider: DefaultFsDataProvider;
  private onDiscovered: (name: string) => void = () => undefined;
  private resolveValue: (name: string) => TypedValue | null = () => null;

  constructor(provider?: DefaultFsDataProvider) {
    const defaultProvider = provider ?? new Engine.DefaultFsDataProvider();
    super(defaultProvider);
    this.defaultProvider = defaultProvider;
  }

  public setCallbacks(
    discovered: (name: string) => void,
    resolver: (name: string) => TypedValue | null
  ) {
    this.onDiscovered = discovered;
    this.resolveValue = resolver;
  }

  public getDefaultProvider() {
    return this.defaultProvider;
  }

  public override get(name: string): TypedValue | null {
    if (this.defaultProvider.isDefined(name)) {
      return this.defaultProvider.get(name);
    }

    if (name) {
      this.onDiscovered(name);
    }

    const resolved = this.resolveValue(name);
    return resolved ?? null;
  }

  public override isDefined(name: string): boolean {
    if (this.defaultProvider.isDefined(name)) {
      return true;
    }
    return this.resolveValue(name) !== null;
  }
}

type EvaluationState = {
  value: TypedValue | null;
  error: string | null;
};

const typedValueToPlain = (typedValue: TypedValue): unknown => {
  const valueType = Engine.typeOf(typedValue);
  const rawValue = Engine.valueOf(typedValue as TypedValue<unknown>);

  switch (valueType) {
    case FSDataType.Null:
    case FSDataType.Boolean:
    case FSDataType.Integer:
    case FSDataType.BigInteger:
    case FSDataType.Float:
    case FSDataType.String:
    case FSDataType.Guid:
      return rawValue;
    case FSDataType.List: {
      if (rawValue && typeof (rawValue as { toArray?: () => TypedValue[] }).toArray === 'function') {
        return (rawValue as { toArray: () => TypedValue[] }).toArray().map(typedValueToPlain);
      }
      return rawValue;
    }
    case FSDataType.KeyValueCollection: {
      if (rawValue && typeof (rawValue as { getAll?: () => Array<readonly [string, TypedValue]> }).getAll === 'function') {
        const entries = (rawValue as {
          getAll: () => Array<readonly [string, TypedValue]>;
        }).getAll();
        const result: Record<string, unknown> = {};
        for (const [key, value] of entries) {
          result[key] = typedValueToPlain(value);
        }
        return result;
      }
      return rawValue;
    }
    default:
      return rawValue;
  }
};

const formatTypedValue = (typedValue: TypedValue): string => {
  const plain = typedValueToPlain(typedValue);
  if (plain === null || plain === undefined) {
    return 'null';
  }
  if (typeof plain === 'string') {
    return plain;
  }
  if (typeof plain === 'number' || typeof plain === 'boolean' || typeof plain === 'bigint') {
    return String(plain);
  }
  try {
    return JSON.stringify(plain, null, 2);
  } catch {
    if (typeof plain === 'object' && plain && 'toString' in plain) {
      return String((plain as { toString: () => string }).toString());
    }
    return String(plain);
  }
};

export type FuncScriptTesterProps = FuncScriptEditorProps;

const containerStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'stretch',
  height: '100%',
  overflow: 'hidden'
};

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden'
};

const resultPanelStyle: CSSProperties = {
  border: '1px solid #d0d7de',
  borderRadius: 6,
  padding: '0.75rem',
  minHeight: 120,
  maxHeight: 240,
  overflow: 'auto',
  background: '#f6f8fa'
};

const variablesListStyle: CSSProperties = {
  border: '1px solid #d0d7de',
  borderRadius: 6,
  padding: '0.5rem',
  minHeight: 0,
  overflowY: 'auto',
  flex: 1,
  background: '#fff'
};

const listItemStyle: CSSProperties = {
  border: '1px solid transparent',
  borderRadius: 4,
  padding: '0.5rem',
  textAlign: 'left',
  width: '100%',
  background: 'transparent',
  cursor: 'pointer'
};

const selectedListItemStyle: CSSProperties = {
  ...listItemStyle,
  borderColor: '#0969da',
  background: '#dbe9ff'
};

const unsetTokenStyle: CSSProperties = {
  color: '#57606a',
  fontStyle: 'italic'
};

const errorTextStyle: CSSProperties = {
  color: '#d1242f',
  marginTop: '0.25rem',
  whiteSpace: 'pre-wrap'
};

const FuncScriptTester = ({
  value,
  onChange,
  onSegmentsChange,
  onError,
  minHeight,
  style,
  saveKey
}: FuncScriptTesterProps) => {
  const [variables, setVariables] = useState<Map<string, VariableState>>(() => new Map());
  const variablesRef = useRef<Map<string, VariableState>>(variables);
  const [selectedVariableKey, setSelectedVariableKey] = useState<string | null>(null);
  const [variableEditorValue, setVariableEditorValue] = useState('');
  const [resultState, setResultState] = useState<EvaluationState>({ value: null, error: null });

  const providerRef = useRef<TesterDataProvider | null>(null);
  if (!providerRef.current) {
    providerRef.current = new TesterDataProvider();
  }

  const evaluateExpression = useCallback((expression: string): {
    typedValue: TypedValue | null;
    error: string | null;
  } => {
    const trimmed = expression.trim();
    if (trimmed.length === 0) {
      return { typedValue: null, error: null };
    }

    try {
      const typedValue = Engine.evaluate(trimmed, new Engine.DefaultFsDataProvider());
      return { typedValue, error: null };
    } catch (err) {
      return {
        typedValue: null,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }, []);

  const evaluateVariableExpression = useCallback(
    (key: string, expression: string) => {
      setVariables((prev) => {
        const current = prev.get(key);
        if (!current) {
          return prev;
        }
        const { typedValue, error } = evaluateExpression(expression);
        const next = new Map(prev);
        next.set(key, {
          ...current,
          expression,
          typedValue,
          error
        });
        variablesRef.current = next;
        return next;
      });
    },
    [evaluateExpression]
  );

  useEffect(() => {
    variablesRef.current = variables;
  }, [variables]);

  const handleVariableDiscovered = useCallback((name: string) => {
    const key = name.toLowerCase();
    let added = false;
    setVariables((prev) => {
      if (prev.has(key)) {
        return prev;
      }
      added = true;
      const next = new Map(prev);
      next.set(key, {
        name,
        key,
        expression: '',
        typedValue: null,
        error: null
      });
      return next;
    });
    if (added) {
      setSelectedVariableKey((current) => current ?? key);
    }
  }, []);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) {
      return;
    }
    provider.setCallbacks(handleVariableDiscovered, (name) => {
      const key = name.toLowerCase();
      const entry = variablesRef.current.get(key);
      return entry?.typedValue ?? null;
    });
  }, [handleVariableDiscovered]);

  const variableEntries = useMemo(() => Array.from(variables.values()), [variables]);

  useEffect(() => {
    if (!selectedVariableKey && variableEntries.length > 0) {
      setSelectedVariableKey(variableEntries[0].key);
    }
  }, [selectedVariableKey, variableEntries]);

  useEffect(() => {
    if (!selectedVariableKey) {
      setVariableEditorValue('');
      return;
    }
    const entry = variables.get(selectedVariableKey);
    const nextValue = entry?.expression ?? '';
    setVariableEditorValue((current) => (current === nextValue ? current : nextValue));
  }, [selectedVariableKey, variables]);

  const handleVariableEditorChange = useCallback(
    (value: string) => {
      setVariableEditorValue(value);
      if (!selectedVariableKey) {
        return;
      }
      setVariables((prev) => {
        const current = prev.get(selectedVariableKey);
        if (!current) {
          return prev;
        }
        const next = new Map(prev);
        next.set(selectedVariableKey, {
          ...current,
          expression: value
        });
        return next;
      });
    },
    [selectedVariableKey]
  );

  const handleVariableEditorBlur = useCallback(() => {
    if (!selectedVariableKey) {
      return;
    }
    evaluateVariableExpression(selectedVariableKey, variableEditorValue);
  }, [evaluateVariableExpression, selectedVariableKey, variableEditorValue]);

  const handleSelectVariable = useCallback((key: string) => {
    setSelectedVariableKey(key);
  }, []);

  const runTest = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) {
      return;
    }

    const nextVariables = new Map<string, VariableState>();
    for (const [key, entry] of variablesRef.current.entries()) {
      const { typedValue, error } = evaluateExpression(entry.expression);

      nextVariables.set(key, {
        ...entry,
        typedValue,
        error
      });
    }

    variablesRef.current = nextVariables;
    setVariables(nextVariables);

    try {
      const evaluated = Engine.evaluate(value, provider);
      setResultState({ value: evaluated, error: null });
    } catch (err) {
      setResultState({
        value: null,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [evaluateExpression, value]);

  const resultTypeName = useMemo(() => {
    if (!resultState.value) {
      return null;
    }
    return Engine.getTypeName(Engine.typeOf(resultState.value));
  }, [resultState.value]);

  const formattedResult = useMemo(() => {
    if (!resultState.value) {
      return '';
    }
    return formatTypedValue(resultState.value);
  }, [resultState.value]);

  let resultContent: ReactNode;
  if (resultState.error) {
    resultContent = <div style={errorTextStyle}>{resultState.error}</div>;
  } else if (resultState.value) {
    resultContent = (
      <>
        <div>
          <strong>Type:</strong> {resultTypeName}
        </div>
        <pre
          style={{
            marginTop: '0.5rem',
            marginBottom: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {formattedResult}
        </pre>
      </>
    );
  } else {
    resultContent = (
      <div style={unsetTokenStyle}>No result yet. Enter a script and run the test.</div>
    );
  }

  return (
    <div className="funcscript-tester" style={containerStyle}>
      <div style={{ ...columnStyle, flex: 2 }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <FuncScriptEditor
            value={value}
            onChange={onChange}
            onSegmentsChange={onSegmentsChange}
            onError={onError}
            minHeight={minHeight ?? 280}
            style={style}
            saveKey={saveKey}
          />
        </div>
        <div>
          <button type="button" onClick={runTest}>
            Test
          </button>
        </div>
        <div style={resultPanelStyle}>{resultContent}</div>
      </div>
      <div style={{ ...columnStyle, flex: 1 }}>
        <div style={variablesListStyle}>
          {variableEntries.length === 0 ? (
            <div style={unsetTokenStyle}>Variables will appear here when referenced.</div>
          ) : (
            variableEntries.map((entry) => {
              const isSelected = entry.key === selectedVariableKey;
              const hasValue = entry.typedValue !== null && !entry.error;
              const summaryText = entry.error
                ? 'Error'
                : hasValue
                ? Engine.getTypeName(Engine.typeOf(entry.typedValue as TypedValue))
                : 'Unset';
              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => handleSelectVariable(entry.key)}
                  style={isSelected ? selectedListItemStyle : listItemStyle}
                >
                  <div>
                    <strong>{entry.name}</strong>
                  </div>
                  <div style={hasValue ? undefined : unsetTokenStyle}>{summaryText}</div>
                  {entry.error ? <div style={errorTextStyle}>{entry.error}</div> : null}
                </button>
              );
            })
          )}
        </div>
        <div>
          <div onBlur={handleVariableEditorBlur}>
            <FuncScriptEditor
              key={selectedVariableKey ?? 'variable-editor'}
              value={variableEditorValue}
              onChange={handleVariableEditorChange}
              minHeight={160}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuncScriptTester;
