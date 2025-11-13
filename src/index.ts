/**
 * OpenRewrite JavaScript/TypeScript Demo Recipes
 *
 * These recipes demonstrate the concepts from the presentation:
 * "OpenRewrite for JavaScript/TypeScript: 30-Minute Developer Introduction"
 */

// Section 3: Your First Recipe
export {RenameMethod} from './examples/rename-method-recipe.js';

// Section 4: Pattern Matching & Templates
export {
    PatternBasedMigration,
    AddArgumentMigration,
    ConstrainedCaptureMigration
} from './examples/pattern-based-migration.js';

// Section 5: Type Attribution & Semantic Matching
export {SemanticForwardRefMigration} from './examples/semantic-matching.js';

// Section 6: Real-World Example
export {
    CreateClassToES6,
    WrapForwardRefInMemo
} from './react/create-class-to-es6.js';
