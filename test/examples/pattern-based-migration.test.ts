// noinspection TypeScriptCheckImport

import {RecipeSpec} from "@openrewrite/rewrite/test";
import {javascript} from "@openrewrite/rewrite/javascript";
import {
    PatternBasedMigration,
    AddArgumentMigration,
    ConstrainedCaptureMigration
} from "../../src/examples/pattern-based-migration";

describe('PatternBasedMigration (Section 4: Pattern Matching)', () => {
    test('migrates oldApi.method() to newApi.methodAsync()', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new PatternBasedMigration();

        await spec.rewriteRun(
            javascript(
                `oldApi.method();`,
                `newApi.methodAsync();`
            )
        );
    });

    test('preserves arguments with variadic capture', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new PatternBasedMigration();

        await spec.rewriteRun(
            javascript(
                `oldApi.method(1, 2, 3);`,
                `newApi.methodAsync(1, 2, 3);`
            )
        );
    });

    test('does not modify other API calls', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new PatternBasedMigration();

        await spec.rewriteRun(
            javascript(
                `
                otherApi.method();
                oldApi.differentMethod();
                `
            )
        );
    });
});

describe('AddArgumentMigration (Variadic with first + rest)', () => {
    test('adds new parameter while preserving existing ones', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new AddArgumentMigration();

        await spec.rewriteRun(
            javascript(
                `bar(1);`,
                `baz(1, "new");`
            )
        );
    });

    test('handles multiple trailing arguments', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new AddArgumentMigration();

        await spec.rewriteRun(
            javascript(
                `bar(1, 2, 3);`,
                `baz(1, "new", 2, 3);`
            )
        );
    });
});

describe('ConstrainedCaptureMigration (Capture Constraints)', () => {
    test('transforms calls with numeric literals', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new ConstrainedCaptureMigration();

        await spec.rewriteRun(
            javascript(
                `process(42);`,
                `processNumber(42);`
            )
        );
    });

    test('does not transform calls with string literals', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new ConstrainedCaptureMigration();

        await spec.rewriteRun(
            javascript(
                `process("text");`
                // No change - constraint rejects non-numeric literals
            )
        );
    });

    test('does not transform calls with variables', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new ConstrainedCaptureMigration();

        await spec.rewriteRun(
            javascript(
                `
                const x = 42;
                process(x);
                `
                // No change - constraint only matches literals
            )
        );
    });
});
