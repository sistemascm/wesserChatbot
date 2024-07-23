import typescript from 'rollup-plugin-typescript2'

export default {
    input: 'index.ts',
    output: {
        file: 'api/index.js',
        format: 'esm',
    },
    onwarn: (warning) => {
        if (warning.code === 'UNRESOLVED_IMPORT') return
    },
    plugins: [typescript()],
}
