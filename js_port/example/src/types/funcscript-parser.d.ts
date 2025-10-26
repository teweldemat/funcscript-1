declare module 'funcscript/parser' {
  export const FuncScriptParser: {
    parse: (context: unknown, expression: string) => any;
  };
}
