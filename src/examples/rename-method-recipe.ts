import {ExecutionContext, Recipe, TreeVisitor} from "@openrewrite/rewrite";
import {JavaScriptVisitor} from "@openrewrite/rewrite/javascript";
import {J} from "@openrewrite/rewrite/java";
import {produce} from "immer";

/**
 * Example from Section 3: Your First Recipe
 *
 * Renames method calls from oldMethod to newMethod, demonstrating:
 * - Basic visitor pattern
 * - Bottom-up traversal (calling super first)
 * - Immutable updates with immer's produce()
 */
export class RenameMethodRecipe extends Recipe {
    name = "org.example.RenameMethod";
    displayName = "Rename old method to new method";
    description = "Updates method calls from oldMethod to newMethod";

    async editor(): Promise<TreeVisitor<any, ExecutionContext>> {
        return new class extends JavaScriptVisitor<ExecutionContext> {
            protected async visitMethodInvocation(
                method: J.MethodInvocation,
                ctx: ExecutionContext
            ): Promise<J | undefined> {
                // Visit children first (bottom-up traversal)
                method = (await super.visitMethodInvocation(method, ctx)) as J.MethodInvocation;

                // Transform if this is our target method
                if (method.name.simpleName === 'oldMethod') {
                    return produce(method, draft => {
                        draft.name.simpleName = 'newMethod';
                    });
                }

                return method;
            }
        }
    }
}
