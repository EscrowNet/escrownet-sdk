const typescript = require("rollup-plugin-typescript2");
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const pkg = require("./package.json");

module.exports = {
    input: "src/index.ts",
    output: [
        {
            file: pkg.main,
            format: "cjs",
            sourcemap: true,
        },
        {
            file: pkg.module,
            format: "es",
            sourcemap: true,
        },
    ],
    external: [...Object.keys(pkg.dependencies || {})],
    plugins: [
        resolve(),
        commonjs(),
        json(),
        typescript({
            tsconfig: "./tsconfig.json",
            useTsconfigDeclarationDir: true,
        }),
    ],
};
