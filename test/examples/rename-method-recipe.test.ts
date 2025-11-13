// noinspection TypeScriptCheckImport

import {RecipeSpec} from "@openrewrite/rewrite/test";
import {javascript} from "@openrewrite/rewrite/javascript";
import {RenameMethodRecipe} from "../../src/examples/rename-method-recipe";

describe('RenameMethodRecipe (Section 3: Your First Recipe)', () => {
    test('renames oldMethod to newMethod', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethodRecipe();

        await spec.rewriteRun(
            javascript(
                `obj.oldMethod();`,
                `obj.newMethod();`
            )
        );
    });

    test('renames multiple occurrences', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethodRecipe();

        await spec.rewriteRun(
            javascript(
                `
                obj.oldMethod();
                another.oldMethod(1, 2);
                obj.oldMethod("test");
                `,
                `
                obj.newMethod();
                another.newMethod(1, 2);
                obj.newMethod("test");
                `
            )
        );
    });

    test('does not rename other methods', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethodRecipe();

        await spec.rewriteRun(
            javascript(
                `
                obj.otherMethod();
                obj.differentMethod(1, 2);
                `
                // No change expected - single argument means no transformation
            )
        );
    });

    test('preserves arguments and formatting', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethodRecipe();

        await spec.rewriteRun(
            javascript(
                `obj.oldMethod(  arg1,  arg2  );`,
                `obj.newMethod(  arg1,  arg2  );`
            )
        );
    });
});
