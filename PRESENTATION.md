# OpenRewrite for JavaScript/TypeScript: Presentation Outline
## 30-Minute Developer Introduction

**Target Audience**: JavaScript/TypeScript developers familiar with codemods but new to OpenRewrite

---

## 1. Introduction (3 minutes)

### What is OpenRewrite?
- **Automated refactoring ecosystem** for source code transformations
- Think of it as "codemods with superpowers"
- Open-source project maintained by Moderne

### Key Differences from Traditional Codemods
- **Lossless transformations**: Preserves all formatting, comments, and whitespace
- **Type-aware**: Full type attribution for semantic matching
- **Cross-file**: Can analyze and modify multiple files atomically
- **Recipe ecosystem**: Composable, reusable transformations

### Why This Matters
- **Zero manual cleanup**: Generated code looks like you wrote it
- **Semantic precision**: Match by meaning, not just syntax
- **Scale**: Works on entire codebases and organizations (via Moderne platform), not just single files
- **Trust**: Predictable, testable, production-ready

---

## 2. The LST: Lossless Semantic Tree (5 minutes)

### From AST to LST
- Traditional AST: Loses whitespace, comments, formatting
- OpenRewrite LST: **Preserves everything** about your source code

### What Gets Preserved?
```javascript
// Before transformation
function  oldName ( x )  {  // Legacy function
  return x * 2;
}

// After OpenRewrite transformation
function  newName ( x )  {  // Legacy function
  return x * 2;
}
```
- Exact spacing preserved
- Comments preserved
- Formatting maintained

### Why This Matters for Production
- No reformatting wars in code reviews
- Preserve team's existing style
- Minimal diff noise = clearer PRs

### Architecture: Java + Node.js via RPC
OpenRewrite for JS/TS uses a hybrid architecture:
- **Java host process**: Orchestrates recipes, manages LST storage
- **Node.js process**: Handles parsing (via TypeScript compiler) and recipe execution
- **RPC mechanism**: Transfers LSTs and LST deltas between processes

**What goes over RPC:**
- Parse TypeScript/JavaScript → LST
- Print LST → source code
- Apply recipes (LST transformations)
- Transfer LST changes (deltas) for efficiency

**Why this architecture:**
- Leverage TypeScript's own parser for accurate JS/TS parsing
- Reuse OpenRewrite's mature Java infrastructure
- Efficient delta transfer keeps performance fast
- Seamless integration with existing OpenRewrite ecosystem

---

## 2.1. The Power of Type Attribution (1-2 minutes)

### The Challenge
Your codebase uses `React.forwardRef()` in many different ways:

```typescript
// Named import
import { forwardRef } from 'react';
forwardRef(MyComponent);

// Namespace import
import * as React from 'react';
React.forwardRef(MyComponent);

// Default import
import React from 'react';
React.forwardRef(MyComponent);

// Aliased import
import { forwardRef as reactForwardRef } from 'react';
reactForwardRef(MyComponent);
```

### What OpenRewrite Does

**One pattern matches all four styles** - even the aliased import where `reactForwardRef` gets resolved to `react.forwardRef` using TypeScript's type system.

**All four transform correctly with the SAME recipe.**

**We'll see how to write recipes that use this in Section 5.**

---

## 3. Your First Recipe (7 minutes)

### Recipe Structure
```typescript
export class RenameMethod extends Recipe {
    name = "org.example.RenameMethod";
    displayName = "Rename method calls";
    description = "Updates method calls from one name to another";

    @Option({
        displayName: "Old method name",
        description: "The method name to replace"
    })
    oldName!: string;

    @Option({
        displayName: "New method name",
        description: "The method name to replace with"
    })
    newName!: string;

    constructor(options: { oldName: string; newName: string }) {
        super(options);
    }

    async editor(): Promise<TreeVisitor<any, ExecutionContext>> {
        const oldName = this.oldName;
        const newName = this.newName;

        return new class extends JavaScriptVisitor<ExecutionContext> {
            protected async visitMethodInvocation(
                method: J.MethodInvocation,
                ctx: ExecutionContext
            ): Promise<J | undefined> {
                // Visit children first (bottom-up traversal)
                // This ensures nested calls like foo(bar()) transform bar() first
                method = (await super.visitMethodInvocation(method, ctx)) as J.MethodInvocation;

                // Transform if this is our target method
                if (method.name.simpleName === oldName) {
                    return create(method, draft => {
                        draft.name.simpleName = newName;
                    });
                }

                return method;
            }
        }
    }
}
```

### Key Concepts Demonstrated
1. **Visitor Pattern**: Override specific node types you want to transform
2. **Bottom-Up Traversal**: Call `super` first to visit children (handles nested calls correctly)
3. **Immutable Updates**: Use `mutative`'s `create()` for safe modifications
4. **Recipe Options**: Use `@Option` decorator with metadata for configurable parameters
5. **Constructor Pattern**: Accept options object and pass to `super(options)`
6. **Type Safety**: TypeScript ensures correct AST manipulation

### Testing Your Recipe
```typescript
test("renames method calls", () => {
    const spec = new RecipeSpec();
    spec.recipe = new RenameMethod({ oldName: 'oldMethod', newName: 'newMethod' });

    return spec.rewriteRun(
        javascript(
            `obj.oldMethod();`,      // before
            `obj.newMethod();`       // after
        ),
        javascript(`obj.otherMethod();`)  // no change (single arg)
    );
});

test("handles nested calls (bottom-up traversal)", () => {
    const spec = new RecipeSpec();
    spec.recipe = new RenameMethod({ oldName: 'oldMethod', newName: 'newMethod' });

    return spec.rewriteRun(
        javascript(
            `obj.oldMethod(inner.oldMethod(data));`,    // before
            `obj.newMethod(inner.newMethod(data));`     // after - both transformed!
        )
    );
});

test("supports custom method names via options", () => {
    const spec = new RecipeSpec();
    spec.recipe = new RenameMethod({ oldName: 'foo', newName: 'bar' });

    return spec.rewriteRun(
        javascript(`obj.foo();`, `obj.bar();`)
    );
});
```

---

## 3.1. Data Tables & Search Recipes (3 minutes)

### What are Data Tables?
Data tables let recipes collect structured data (like CSV) during execution:
- **Search recipes**: Find patterns without making changes
- **Impact analysis**: Understand migration scope before committing
- **Reporting**: Generate usage reports, inventories, metrics

### Example: Finding Method Calls
```typescript
// Define the data table row structure
export class MethodCallRecord {
    @Column({
        displayName: "Source file",
        description: "The source file containing the method call"
    })
    readonly sourceFile: string;

    @Column({
        displayName: "Method name",
        description: "The name of the method being called"
    })
    readonly methodName: string;

    @Column({
        displayName: "Code snippet",
        description: "The code snippet of the method call"
    })
    readonly code: string;

    constructor(sourceFile: string, methodName: string, code: string) {
        this.sourceFile = sourceFile;
        this.methodName = methodName;
        this.code = code;
    }

    // Create the data table definition
    static dataTable = new DataTable<MethodCallRecord>(
        "org.example.method-calls",
        "Method call findings",
        "All occurrences of the target method call",
        MethodCallRecord
    );
}
```

### Using Data Tables in Recipes
```typescript
export class FindMethodCalls extends Recipe {
    @Option({
        displayName: "Method name",
        description: "The method name to search for"
    })
    methodName!: string;

    constructor(options: { methodName: string }) {
        super(options);
    }

    // Reference the data table
    @Transient
    findings = MethodCallRecord.dataTable;

    async editor(): Promise<TreeVisitor<any, ExecutionContext>> {
        const methodName = this.methodName;
        const findings = this.findings;

        return new class extends JavaScriptVisitor<ExecutionContext> {
            protected async visitMethodInvocation(
                method: J.MethodInvocation,
                ctx: ExecutionContext
            ): Promise<J | undefined> {
                method = (await super.visitMethodInvocation(method, ctx)) as J.MethodInvocation;

                if (method.name.simpleName === methodName) {
                    // Record finding in data table
                    const sourceFile = this.cursor.firstEnclosing((t): t is any =>
                        t !== null && typeof t === 'object' && 'sourcePath' in t
                    )?.sourcePath ?? "unknown";
                    const code = `${methodName}(...)`;

                    findings.insertRow(ctx, new MethodCallRecord(
                        sourceFile,
                        methodName,
                        code
                    ));

                    // Mark as search result (highlights in UI)
                    return foundSearchResult(method);
                }

                return method;
            }
        }
    }
}
```

### Key Points
- `@Column` decorators define data table columns with metadata
- `static dataTable` creates the table definition
- `@Transient` prevents serialization of the data table reference
- `insertRow()` adds data during execution
- `foundSearchResult()` marks nodes for UI highlighting
- In production, data tables export to CSV files for analysis

---

## 4. Pattern Matching & Templates (8 minutes)

### The Power of Declarative Transformations

#### Old Way (Manual AST Manipulation)
```typescript
protected async visitMethodInvocation(method, ctx) {
    method = await super.visitMethodInvocation(method, ctx);

    // Check if select is 'oldApi'
    const select = method.select?.element;
    if (!isIdentifier(select)) return method;
    if (select.simpleName !== 'oldApi') return method;

    // Check if method name is 'method'
    if (method.name.simpleName !== 'method') return method;

    // Extract arguments...
    // Build new method invocation...
    // Lots of boilerplate!
}
```

#### New Way (Pattern + Template)
```typescript
import {rewrite, capture, pattern, template} from "@openrewrite/rewrite/javascript";

const rule = rewrite(() => {
    const args = capture({ variadic: true });
    return {
        before: pattern`oldApi.method(${args})`,
        after: template`newApi.methodAsync(${args})`
    };
});

protected async visitMethodInvocation(method, ctx) {
    return await rule.tryOn(this.cursor, method) || method;
}
```

### Variadic Captures
```typescript
// Match any number of arguments
const args = capture({ variadic: true });
pattern`foo(${args})`  // Matches: foo(), foo(1), foo(1,2), foo(1,2,3)

// Match first + rest
const first = capture('first');
const rest = capture({ variadic: true });
pattern`bar(${first}, ${rest})`  // Matches: bar(1), bar(1,2), bar(1,2,3)
template`baz(${first}, "new", ${rest})`  // Insert argument in middle
```

### Capture Constraints
```typescript
import {isLiteral} from "@openrewrite/rewrite/java";

// Only match numeric literals
const num = capture<J.Literal>({
    constraint: (node) => isLiteral(node) && typeof node.value === 'number'
});
pattern`process(${num})`  // Matches: process(42), Rejects: process("text")

// Compose constraints
const evenNum = capture<J.Literal>({
    constraint: and(
        (node) => typeof node.value === 'number',
        (node) => (node.value as number) % 2 === 0
    )
});
```

### Property Access on Captures
```typescript
const method = capture<J.MethodInvocation>('method');
const pat = pattern`api.foo(${method})`;

// Access captured properties directly - no manual extraction needed!
const firstArg = method.arguments.elements[0].element;
const restArgs = method.arguments.elements.slice(1);
const tmpl = template`newApi('newParam', ${restArgs})`;
// Insert new parameter while preserving rest of arguments
```

---

## 5. Type Attribution & Semantic Matching (4 minutes)

### Beyond Syntax: Understanding Code Semantics

#### Syntax-Only Matching (Codemods)
```javascript
// Pattern: import { foo } from 'lib'
// Only matches exact import style
```

#### Semantic Matching (OpenRewrite)
```typescript
const pat = pattern`forwardRef(${capture('comp')})`
    .configure({
        context: [`import { forwardRef } from 'react'`],
        dependencies: { '@types/react': '*' }
    });
```

**This ONE pattern automatically matches ALL equivalent forms:**

```typescript
// File 1: Named import
import { forwardRef } from 'react';
forwardRef(MyComponent);  // ✅ Matches

// File 2: Namespace import
import * as React from 'react';
React.forwardRef(MyComponent);  // ✅ Also matches!

// File 3: Default import with member access
import React from 'react';
React.forwardRef(MyComponent);  // ✅ Matches too!

// File 4: Aliased import (THE REAL MAGIC!)
import { forwardRef as reactForwardRef } from 'react';
reactForwardRef(MyComponent);  // ✅ Still matches! 🎩✨
```

**How it works:**
- Pattern is parsed with type context from `react`
- Comparator resolves types for both pattern and target code
- Match succeeds if both resolve to the same `forwardRef` function
- Import style differences are abstracted away

### Real-World Impact
- **Write once, match everywhere**: One pattern handles all import styles
- **Refactoring-proof**: Works even after import reorganization
- **Team flexibility**: Doesn't enforce specific import conventions

### When to Use Semantic vs Structural Matching
- **Lenient (default)**: Quick prototyping, structural matching
- **Semantic (with context)**: Production recipes, precise matching
- **Trade-off**: Precision vs setup complexity

---

## 6. Real-World Example: React Migration (2 minutes)

### Scenario: Migrate React.createClass to ES6 Classes
```typescript
// Before
const MyComponent = React.createClass({
    render() { return <div>Hello</div>; }
});

// After
class MyComponent extends React.Component {
    render() { return <div>Hello</div>; }
}
```

### Recipe Demonstrates
- Pattern matching React.createClass calls
- Extracting object properties (methods, lifecycle hooks)
- Template construction of ES6 class syntax
- Handling edge cases (mixins, statics, etc.)
- **Full example available in docs/examples**

---

## 7. Recipe Development Workflow (1 minute)

### Recommended Steps
1. ✅ **Plan**: Use TodoWrite to break down the transformation
2. ✅ **Write failing test**: Define expected before/after
3. ✅ **Implement recipe**: Start with pattern/template if possible
4. ✅ **Add edge case tests**: No-change cases, complex scenarios
5. ✅ **Add type attribution tests**: Use `npm()` helper for dependencies
6. ✅ **Document**: Clear description with examples

### Available Tools
- **Claude Code skill**: Interactive AI assistant with templates, examples, and troubleshooting
- `javascript()`, `typescript()`, `jsx()`, `tsx()` - Test source types
- `npm()` + `packageJson()` - Test with dependencies
- `rewriteRun()` - Execute recipe and verify transformations
- Pattern debugging tools (coming soon)

### Performance: Using Preconditions
Skip files that don't need transformation with `check()`:

```typescript
import {check} from "@openrewrite/rewrite";
import {UsesType, UsesMethod} from "@openrewrite/rewrite/javascript";

async editor(): Promise<TreeVisitor<any, ExecutionContext>> {
    return check(
        new UsesType("react.ForwardRefExoticComponent"),  // Only visit files using this type
        new MyReactMigrationVisitor()
    );
}
```

**Built-in precondition visitors:**
- `UsesType`: Skip files that don't reference a specific type
- `UsesMethod`: Skip files that don't call a specific method
- **Custom preconditions**: Easy to create - just return modified tree if condition met

**Why preconditions matter:**
- Dramatically faster on large codebases (skip irrelevant files)
- Reduce unnecessary parsing and tree traversal
- Can chain multiple preconditions for AND logic

---

## 8. Comparison: Codemods vs OpenRewrite (Closing Summary)

| Feature | Traditional Codemods | OpenRewrite for JS/TS |
|---------|---------------------|----------------------|
| **Formatting** | Often reformats entire files | Preserves original formatting |
| **Comments** | Frequently lost | Always preserved |
| **Type Awareness** | None (syntax only) | Full type attribution |
| **Multi-file** | Manual orchestration | Built-in support |
| **Reusability** | Copy-paste patterns | Composable recipes |
| **Testing** | DIY | Built-in test framework |
| **Semantic Matching** | Not available | Pattern + context |
| **Variadic Patterns** | Manual loops | Built-in `variadic: true` |
| **Learning Curve** | Low (just JS) | Medium (LST concepts) |
| **Maturity** | Well-established | New (active development) |

---

## 9. Getting Started (Quick Demo)

### Installation
```bash
npm install @openrewrite/rewrite
npm install --save-dev typescript @types/node mutative @jest/globals jest
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "es2016",
    "module": "Node16",
    "strict": true,
    "experimentalDecorators": true
  }
}
```

### Next Steps
- 🤖 **Use Claude Code skill**: We have a comprehensive Claude skill for recipe authoring that provides templates, guides, and interactive help (`openrewrite-recipe-authoring-js`)
- 📖 **Read the documentation**: Check out implementation guides and examples in `doc/`
- 🔍 **Explore the codebase**: Look at test files for real recipe examples
- 💬 **Join community**: Slack / Discord for questions and support
- 🎥 **Watch tutorials**: YouTube channel for video guides

---

## Q&A and Discussion
