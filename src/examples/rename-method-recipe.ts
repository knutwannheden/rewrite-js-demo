import {ExecutionContext, Option, Recipe, TreeVisitor} from "@openrewrite/rewrite";
import {JavaScriptVisitor} from "@openrewrite/rewrite/javascript";
import {J} from "@openrewrite/rewrite/java";
import {create} from "mutative";

/**
 * Example from Section 3: Your First Recipe
 *
 * Renames method calls from one name to another, demonstrating:
 * - Basic visitor pattern
 * - Bottom-up traversal (calling super first)
 * - Immutable updates with mutative's create()
 * - Recipe options for configurability
 */
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
                // This ensures nested calls are processed before their parents
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
