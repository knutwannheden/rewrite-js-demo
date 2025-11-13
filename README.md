# OpenRewrite JavaScript/TypeScript Demo

This project contains working examples of all the recipes from the presentation:
**"OpenRewrite for JavaScript/TypeScript: 30-Minute Developer Introduction"**

## Getting Started

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Watch mode for development
npm run dev
```

## Project Structure

```shell
src/
  examples/
    rename-method-recipe.ts        # Section 3: Your First Recipe
    pattern-based-migration.ts     # Section 4: Pattern Matching & Templates
    semantic-matching.ts           # Section 5: Semantic Matching
  react/
    create-class-to-es6.ts        # Section 6: Real-World Example
  index.ts                         # Exports all recipes

test/
  examples/                        # Tests for each example recipe
  react/                           # Tests for React recipes
```

## Examples

### Section 3: Your First Recipe

**`RenameMethodRecipe`** - Basic visitor pattern demonstration
- Renames `oldMethod` to `newMethod`
- Shows bottom-up traversal
- Uses immer for immutable updates

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
- Uses type context and dependencies

### Section 6: Real-World Examples

**`WrapForwardRefInMemo`** - Production-ready React migration
- Wraps `forwardRef` components with `memo`
- Demonstrates semantic matching in practice

**`CreateClassToES6`** - Simplified demo (concept only)
- Shows structure for React.createClass → ES6 class migration
- Production version would need significant enhancement

## Key Concepts Demonstrated

1. **Visitor Pattern**: Override specific AST node types
2. **Bottom-Up Traversal**: Call `super` first to visit children
3. **Immutable Updates**: Use `produce()` from immer
4. **Pattern Matching**: Declarative `pattern` and `template`
5. **Variadic Captures**: Match any number of arguments
6. **Capture Constraints**: Runtime validation of matched nodes
7. **Semantic Matching**: Type-based matching with context
8. **Property Access**: Access captured node properties directly

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
- [Presentation Outline](../../doc/javascript-presentation-outline.md)
- [Claude Skill](../../.claude/skills/openrewrite-recipe-authoring-js/)

## Notes

- All recipes use `@openrewrite/rewrite@next` for latest features
- Tests use `tmp-promise` for isolated test environments
- Recipes demonstrate concepts - production versions would need more error handling
- The `CreateClassToES6` recipe is simplified for demonstration purposes

## License

Apache-2.0
