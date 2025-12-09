import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/worker.ts', // Your entry file
  output: {
    file: 'dist/worker.ts', // Output as a .ts file
    format: 'es'
  },
  plugins: [
    typescript({
      declaration: true, // Generate .d.ts files
      outDir: 'dist',
      emitDeclarationOnly: false,
    })
  ]
};
