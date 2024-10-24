const path = require('path');
module.exports = {
  mode: 'development',    
  entry: './src/main.ts',  // Entry point of TypeScript file
  module: {
    rules: [
      {
        test: /\.tsx?$/, 
        use: 'ts-loader',    // Use the ts-loader to transpile TypeScript
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'], 
  },
  output: {
    filename: 'bundle.js',   // Output file
    path: path.resolve(__dirname, 'dist/js')  // Output directory
  },
};
