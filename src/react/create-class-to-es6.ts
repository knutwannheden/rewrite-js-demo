import {ExecutionContext, Recipe, TreeVisitor} from "@openrewrite/rewrite";
import {JavaScriptVisitor, capture, pattern, template, maybeAddImport} from "@openrewrite/rewrite/javascript";
import {J, isMethodInvocation} from "@openrewrite/rewrite/java";
import {JS} from "@openrewrite/rewrite/javascript";

/**
 * Example from Section 6: Real-World Example
 *
 * Migrates React.createClass to ES6 class syntax
 *
 * Before:
 *   const MyComponent = React.createClass({
 *     render() { return <div>Hello</div>; }
 *   });
 *
 * After:
 *   class MyComponent extends React.Component {
 *     render() { return <div>Hello</div>; }
 *   }
 *
 * Note: This is a simplified version for demonstration.
 * A production version would handle:
 * - getInitialState -> constructor with this.state
 * - Mixins (warn or error)
 * - propTypes, defaultProps (move to static properties)
 * - Lifecycle methods (map old to new)
 * - Autobind methods (arrow functions or manual binding)
 */
export class CreateClassToES6 extends Recipe {
    name = "org.example.react.CreateClassToES6";
    displayName = "Migrate React.createClass to ES6 classes";
    description = "Converts React.createClass() to ES6 class syntax (simplified demo version)";

    async editor(): Promise<TreeVisitor<any, ExecutionContext>> {
        // Simplified pattern: match createClass with a render method
        let reactOptions = {
            context: [`import React from 'react'`],
            dependencies: { '@types/react': '^18.0.0' }
        };

        const name = capture('name');
        const renderBody = capture('renderBody');

        const pat = pattern`const ${name} = React.createClass({ render() { return ${renderBody}; } })`
            .configure(reactOptions);

        const tmpl = template`class ${name} extends React.Component { render() { return ${renderBody}; } }`
            .configure(reactOptions);

        return new class extends JavaScriptVisitor<ExecutionContext> {
            protected async visitVariableDeclarations(
                varDecls: J.VariableDeclarations,
                ctx: ExecutionContext
            ): Promise<J | undefined> {
                varDecls = (await super.visitVariableDeclarations(varDecls, ctx)) as J.VariableDeclarations;

                const match = await pat.match(varDecls, this.cursor);
                if (match) {
                    // We matched! Transform to ES6 class
                    // Note: This simplified version only handles a render method
                    // A production version would need to:
                    // 1. Handle multiple methods (componentDidMount, etc.)
                    // 2. Transform getInitialState to constructor
                    // 3. Handle propTypes and defaultProps as static properties
                    // 4. Handle mixins (warn or error)
                    return await tmpl.apply(varDecls, this.cursor, {values: match});
                }

                return varDecls;
            }
        }
    }
}

/**
 * More realistic example showing pattern-based approach for simple cases
 */
export class WrapForwardRefInMemo extends Recipe {
    name = "org.example.react.WrapForwardRefInMemo";
    displayName = "Wrap forwardRef components in memo";
    description = "Wraps React.forwardRef() calls with React.memo() for better performance";

    async editor(): Promise<TreeVisitor<any, ExecutionContext>> {
        let reactOptions = {
            context: [`import { forwardRef, memo } from 'react'`],
            dependencies: { '@types/react': '^18.0.0' }
        };
        const comp = capture('comp');
        const pat = pattern`forwardRef(${comp})`.configure(reactOptions);
        const tmpl = template`memo(forwardRef(${comp}))`.configure(reactOptions);

        return new class extends JavaScriptVisitor<ExecutionContext> {
            protected async visitMethodInvocation(
                method: J.MethodInvocation,
                ctx: ExecutionContext
            ): Promise<J | undefined> {
                method = (await super.visitMethodInvocation(method, ctx)) as J.MethodInvocation;

                const match = await pat.match(method, this.cursor);
                if (match) {
                    // We're making a transformation, ensure memo is imported
                    maybeAddImport(this, { module: 'react', member: 'memo' });
                    return await tmpl.apply(method, this.cursor, {values: match}) || method;
                }

                return method;
            }
        }
    }
}
