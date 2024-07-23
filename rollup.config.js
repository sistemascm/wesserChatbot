import typescript from 'rollup-plugin-typescript2'

export default {
    input: 'index.ts',
    output: {
        file: 'index.js',
        format: 'esm',
    },
    onwarn: (warning) => {
        if (warning.code === 'UNRESOLVED_IMPORT') return
    },
    plugins: [typescript()],
}
