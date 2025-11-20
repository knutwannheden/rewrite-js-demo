// noinspection TypeScriptCheckImport

import {RecipeSpec} from "@openrewrite/rewrite/test";
import {npm, packageJson, tsx} from "@openrewrite/rewrite/javascript";
import {CreateClassToES6, WrapForwardRefInMemo} from "../../src/react/create-class-to-es6";
import {withDir} from "tmp-promise";

//language=json
const REACT_PACKAGE_JSON = `
{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0"
  }
}
`;

describe('WrapForwardRefInMemo (Section 6: React Migration)', () => {
    test('wraps forwardRef with memo - named import (merges into existing import)', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new WrapForwardRefInMemo();

        await withDir(async (repo) => {
            await spec.rewriteRun(
                npm(
                    repo.path,
                    tsx(
                        `
                        import {forwardRef} from 'react';
                        const MyComponent = forwardRef((props, ref) => <div ref={ref}>Hello</div>);
                        `,
                        `
                        import {forwardRef, memo} from 'react';
                        const MyComponent = memo(forwardRef((props, ref) => <div ref={ref}>Hello</div>));
                        `
                    ),
                    packageJson(REACT_PACKAGE_JSON)
                )
            );
        }, {unsafeCleanup: true});
    });

    test('wraps forwardRef with memo - namespace import (normalizes to named import)', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new WrapForwardRefInMemo();

        await withDir(async (repo) => {
            await spec.rewriteRun(
                npm(
                    repo.path,
                    tsx(
                        `
                        import * as React from 'react';
                        const MyComponent = React.forwardRef((props, ref) => <div ref={ref}>Hello</div>);
                        `,
                        `
                        import * as React from 'react';
                        import {memo} from 'react';
                        const MyComponent = memo(forwardRef((props, ref) => <div ref={ref}>Hello</div>));
                        `
                    ),
                    packageJson(REACT_PACKAGE_JSON)
                )
            );
        }, {unsafeCleanup: true});
    });

    test('does not wrap non-forwardRef components', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new WrapForwardRefInMemo();

        await withDir(async (repo) => {
            await spec.rewriteRun(
                npm(
                    repo.path,
                    tsx(
                        `
                        import { memo } from 'react';
                        const MyComponent = memo((props) => <div>Hello</div>);
                        `
                        // No change - not a forwardRef
                    ),
                    packageJson(REACT_PACKAGE_JSON)
                )
            );
        }, {unsafeCleanup: true});
    });
});

describe('CreateClassToES6 (Simplified Demo)', () => {
    test('converts createClass with render to ES6 class', async () => {
        const spec = new RecipeSpec();
        spec.recipe = new CreateClassToES6();

        await withDir(async (repo) => {
            await spec.rewriteRun(
                npm(
                    repo.path,
                    tsx(
                        `
                        const MyComponent = React.createClass({ render() { return <div>Hello</div>; } });
                        `,
                        `
                        class MyComponent extends React.Component {
                            render() {
                                return <div>Hello</div>;
                            }
                        };
                        `
                    ),
                    packageJson(REACT_PACKAGE_JSON)
                )
            );
        }, {unsafeCleanup: true});
    });

    test('does not transform if pattern does not match (shows debug output)', async () => {
        // Spy on console.error to capture pattern debug output
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Enable pattern debugging to see why this doesn't match
        const originalDebug = process.env.PATTERN_DEBUG;
        process.env.PATTERN_DEBUG = 'true';

        try {
            const spec = new RecipeSpec();
            spec.recipe = new CreateClassToES6();

            await withDir(async (repo) => {
                await spec.rewriteRun(
                    npm(
                        repo.path,
                        tsx(
                            `
                            const MyComponent = React.createClass({
                                getInitialState() { return {}; },
                                render() { return <div>Hello</div>; }
                            });
                            `
                            // No change - doesn't match simplified pattern (has getInitialState)
                            //
                            // Expected debug output when PATTERN_DEBUG=true:
                            //
                            // [Pattern #N] const ${name} = React.createClass({ render() { return ${renderBody}; } })
                            // [Pattern #N] ❌ FAILED matching against J$VariableDeclarations:
                            // [Pattern #N]   const MyComponent = React.createClass({
                            // [Pattern #N]       getInitialState() { return {}; },
                            // [Pattern #N]       render() { return <div>Hello</div>; }
                            // [Pattern #N]   })
                            // [Pattern #N]    At path:  [J$VariableDeclarations#variables[0] → J$VariableDeclarations$NamedVariable#initializer → J$MethodInvocation#arguments[0] → J$NewClass#body → J$Block#statements]
                            // [Pattern #N]    Reason:   array-length-mismatch
                            // [Pattern #N]    Expected: 1
                            // [Pattern #N]    Actual:   2
                            //
                            // This shows the pattern expected 1 statement (render) but found 2 (getInitialState + render)
                        ),
                        packageJson(REACT_PACKAGE_JSON)
                    )
                );
            }, {unsafeCleanup: true});

            // Print captured debug output
            const calls = consoleErrorSpy.mock.calls.map(c => c[0]);
            // Use console.log so it's not captured by our spy
            console.log('===== PATTERN DEBUG OUTPUT =====');
            console.log(`Total console.error calls captured: ${calls.length}`);
            if (calls.length > 0) {
                calls.forEach((call, i) => console.log(`${i}: ${call}`));
            } else {
                console.log('No debug output captured - pattern may not have been evaluated');
            }
            console.log('================================');
        } finally {
            // Restore console.error and env var
            consoleErrorSpy.mockRestore();
            if (originalDebug === undefined) {
                delete process.env.PATTERN_DEBUG;
            } else {
                process.env.PATTERN_DEBUG = originalDebug;
            }
        }
    });
});
