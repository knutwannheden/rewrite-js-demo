// noinspection TypeScriptCheckImport

import {RecipeSpec} from "@openrewrite/rewrite/test";
import {javascript} from "@openrewrite/rewrite/javascript";
import {RenameMethod} from "../../src/examples/rename-method-recipe";

describe('RenameMethod (Section 3: Your First Recipe)', () => {
    test('renames oldMethod to newMethod', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethod({ oldName: 'oldMethod', newName: 'newMethod' });

        await spec.rewriteRun(
            javascript(
                `obj.oldMethod();`,
                `obj.newMethod();`
            )
        );
    });

    test('renames multiple occurrences', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethod({ oldName: 'oldMethod', newName: 'newMethod' });

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

    test('renames nested calls (bottom-up traversal)', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethod({ oldName: 'oldMethod', newName: 'newMethod' });

        await spec.rewriteRun(
            javascript(
                `obj.oldMethod(inner.oldMethod(data));`,
                `obj.newMethod(inner.newMethod(data));`
            )
        );
    });

    test('does not rename other methods', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethod({ oldName: 'oldMethod', newName: 'newMethod' });

        await spec.rewriteRun(
            javascript(
                `
                obj.otherMethod();
                obj.differentMethod(1, 2);
                `
                // No change expected
            )
        );
    });

    test('preserves arguments and formatting', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethod({ oldName: 'oldMethod', newName: 'newMethod' });

        await spec.rewriteRun(
            javascript(
                `obj.oldMethod(  arg1,  arg2  );`,
                `obj.newMethod(  arg1,  arg2  );`
            )
        );
    });

    test('supports custom method names via options', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new RenameMethod({ oldName: 'foo', newName: 'bar' });

        await spec.rewriteRun(
            javascript(
                `obj.foo();`,
                `obj.bar();`
            )
        );
    });
});
