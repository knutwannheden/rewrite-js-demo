import {ExecutionContext, Recipe, TreeVisitor} from "@openrewrite/rewrite";
import {JavaScriptVisitor, rewrite, capture, pattern, template} from "@openrewrite/rewrite/javascript";
import {J, isLiteral} from "@openrewrite/rewrite/java";

/**
 * Example from Section 4: Pattern Matching & Templates
 *
 * Migrates oldApi.method() to newApi.methodAsync() using declarative patterns,
 * demonstrating:
 * - Declarative pattern matching with template literals
 * - Variadic captures (matching any number of arguments)
 * - The rewrite() helper for simple transformations
 */
export class PatternBasedMigration extends Recipe {
    name = "org.example.PatternBasedMigration";
    displayName = "Migrate oldApi to newApi";
    description = "Updates oldApi.method() calls to newApi.methodAsync()";

    async editor(): Promise<TreeVisitor<any, ExecutionContext>> {
        const rule = rewrite(() => {
            const args = capture({ variadic: true });
            return {
                before: pattern`oldApi.method(${args})`,
                after: template`newApi.methodAsync(${args})`
            };
        });

        return new class extends JavaScriptVisitor<ExecutionContext> {
            protected async visitMethodInvocation(
                method: J.MethodInvocation,
                ctx: ExecutionContext
            ): Promise<J | undefined> {
                return await rule.tryOn(this.cursor, method) || method;
            }
        }
    }
}

/**
 * Example demonstrating variadic captures with first argument + rest
 */
export class AddArgumentMigration extends Recipe {
    name = "org.example.AddArgumentMigration";
    displayName = "Add new parameter to function call";
    description = "Adds a new parameter while preserving existing arguments";

    async editor(): Promise<TreeVisitor<any, ExecutionContext>> {
        const rule = rewrite(() => {
            const first = capture('first');
            const rest = capture({ variadic: true });
            return {
                before: pattern`bar(${first}, ${rest})`,
                after: template`baz(${first}, "new", ${rest})`
            };
        });

        return new class extends JavaScriptVisitor<ExecutionContext> {
            protected async visitMethodInvocation(
                method: J.MethodInvocation,
                ctx: ExecutionContext
            ): Promise<J | undefined> {
                return await rule.tryOn(this.cursor, method) || method;
            }
        }
    }
}

/**
 * Example demonstrating capture constraints
 */
export class ConstrainedCaptureMigration extends Recipe {
    name = "org.example.ConstrainedCaptureMigration";
    displayName = "Process only numeric arguments";
    description = "Transforms process() calls but only with numeric literal arguments";

    async editor(): Promise<TreeVisitor<any, ExecutionContext>> {
        const rule = rewrite(() => {
            const num = capture<J.Literal>({
                constraint: (node) => isLiteral(node) && typeof node.value === 'number'
            });
            return {
                before: pattern`process(${num})`,
                after: template`processNumber(${num})`
            };
        });

        return new class extends JavaScriptVisitor<ExecutionContext> {
            protected async visitMethodInvocation(
                method: J.MethodInvocation,
                ctx: ExecutionContext
            ): Promise<J | undefined> {
                return await rule.tryOn(this.cursor, method) || method;
            }
        }
    }
}
