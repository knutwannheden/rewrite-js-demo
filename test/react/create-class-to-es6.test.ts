// noinspection TypeScriptCheckImport

import {RecipeSpec} from "@openrewrite/rewrite/test";
import {npm, packageJson, tsx, typescript} from "@openrewrite/rewrite/javascript";
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
                        import { forwardRef } from 'react';
                        const MyComponent = forwardRef((props, ref) => <div ref={ref}>Hello</div>);
                        `,
                        `
                        import { forwardRef , memo} from 'react';
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

    test('does not transform if pattern does not match', async () => {
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
                    ),
                    packageJson(REACT_PACKAGE_JSON)
                )
            );
        }, {unsafeCleanup: true});
    });
});
