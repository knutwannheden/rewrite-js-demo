# OpenRewrite JavaScript/TypeScript Demo

This project contains working examples of all the recipes from the presentation:
**"OpenRewrite for JavaScript/TypeScript: 30-Minute Developer Introduction"**

📖 **See [PRESENTATION.md](./PRESENTATION.md) for the complete presentation outline.**

## Getting Started

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests (27 tests, all passing)
npm test

# Watch mode for development
npm run dev
```

## Project Structure

```shell
src/
  examples/
    rename-method-recipe.ts        # Section 3: Your First Recipe
    find-method-calls.ts           # Section 3.1: Data Tables & Search
    pattern-based-migration.ts     # Section 4: Pattern Matching & Templates
    semantic-matching.ts           # Section 5: Semantic Matching
  react/
    create-class-to-es6.ts        # Section 6: Real-World Example
  index.ts                         # Exports all recipes

test/
  examples/                        # Tests for each example recipe
  react/                           # Tests for React recipes

PRESENTATION.md                    # Complete presentation outline
```

## Examples

### Section 3: Your First Recipe

**`RenameMethod`** - Basic visitor pattern demonstration
- Renames method calls from one name to another
- Shows bottom-up traversal (handles nested calls)
- Uses `@Option` decorator for configurable parameters
- Uses Mutative for immutable updates

### Section 3.1: Data Tables & Search Recipes

**`FindMethodCalls`** - Search recipe with data tables
- Finds all calls to a specific method
- Records findings in a data table (CSV export)
- Uses `@Column` decorators to define table structure
- Demonstrates `foundSearchResult()` for UI highlighting
- Perfect for impact analysis before migrations

### Section 4: Pattern Matching & Templates

**`PatternBasedMigration`** - Declarative transformations
- Migrates `oldApi.method()` to `newApi.methodAsync()`
- Uses `rewrite()` helper
- Demonstrates variadic captures

**`AddArgumentMigration`** - Variadic with first + rest
- Adds new parameter while preserving existing arguments
- Shows `capture('first')` + `capture({ variadic: true })`

**`ConstrainedCaptureMigration`** - Capture constraints
- Only matches numeric literals
- Demonstrates runtime validation with constraints

### Section 5: Type Attribution & Semantic Matching

**`SemanticForwardRefMigration`** - Semantic matching across import styles
- One pattern matches:
  - `forwardRef(Component)` (named import)
  - `React.forwardRef(Component)` (namespace import)
  - `React.forwardRef(Component)` (default import)
  - `reactForwardRef(Component)` (aliased import!)
- Uses type context and dependencies
- Type attribution prevents false positives (won't match custom `forwardRef` functions)

### Section 6: Real-World Examples

**`WrapForwardRefInMemo`** - Production-ready React migration
- Wraps `forwardRef` components with `memo`
- Demonstrates semantic matching in practice

**`CreateClassToES6`** - React.createClass → ES6 class migration
- Uses pattern matching and templates together
- Extracts component name and render method
- Simplified demo (production would handle lifecycle, state, etc.)
- Includes pattern debugging example showing why non-matching cases fail

## Key Concepts Demonstrated

1. **Visitor Pattern**: Override specific AST node types
2. **Bottom-Up Traversal**: Call `super` first to visit children
3. **Immutable Updates**: Use `create()` from Mutative
4. **Recipe Options**: `@Option` decorator for configurable parameters
5. **Data Tables**: Collect structured data for analysis (`@Column`, `@Transient`)
6. **Pattern Matching**: Declarative `pattern` and `template`
7. **Variadic Captures**: Match any number of arguments
8. **Capture Constraints**: Runtime validation of matched nodes
9. **Semantic Matching**: Type-based matching with context
10. **Type Attribution**: Resolve aliases and imports to actual types
11. **Pattern Debugging**: `PATTERN_DEBUG=true` to see why patterns don't match

## Running Individual Tests

```bash
# Run specific test file
npm test -- rename-method-recipe.test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Using the Claude Skill

This project pairs with the `openrewrite-recipe-authoring-js` Claude Code skill:

```bash
# In Claude Code
@skill openrewrite-recipe-authoring-js
```

The skill provides:
- Templates for creating new recipes
- Interactive guidance and troubleshooting
- Common patterns and examples
- Testing strategies

## Learn More

- [OpenRewrite Documentation](https://docs.openrewrite.org)
- [Presentation Outline](./PRESENTATION.md) (in this repo)
- Claude Code skill: `openrewrite-recipe-authoring-js`

## Notes

- All recipes use `@openrewrite/rewrite` ^8.70.4
- Tests use `tmp-promise` for isolated test environments
- Recipes demonstrate concepts - production versions would need more error handling
- The `CreateClassToES6` recipe is simplified for demonstration purposes

## License

Apache-2.0
