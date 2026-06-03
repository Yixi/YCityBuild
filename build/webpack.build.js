const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = {
  entry: path.resolve(__dirname, '../src/index.ts'),
  output: {
    filename: '[name]-[contenthash:7].js',
    path: path.resolve(__dirname, '../dist'),
    chunkFilename: '[contenthash].js',
    publicPath: '',
    clean: true,
  },
  context: path.resolve(__dirname, '../src'),
  devtool: 'hidden-source-map',
  bail: true,
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.(glb|gltf)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    alias: {
      '@root': path.resolve(__dirname, '../src'),
    },
    extensions: ['.ts', '.js', '.json'],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      maxSize: 300000,
    },
  },
  stats: {
    cached: true,
    chunks: false,
    chunkModules: false,
    colors: true,
    modules: false,
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, '../tsconfig.json'),
      },
    }),
    new HTMLWebpackPlugin({
      template: path.resolve(__dirname, '../src/app.html'),
      filename: 'index.html',
    }),
  ],
}
