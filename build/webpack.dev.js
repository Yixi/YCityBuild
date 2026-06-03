const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

const PORT = 4233
const HOST = '0.0.0.0'

module.exports = {
  entry: path.resolve(__dirname, '../src/index.ts'),
  output: {
    filename: 'app.js',
    path: path.join(__dirname, '../dist'),
    publicPath: '/',
    clean: true,
  },
  context: path.resolve(__dirname, '../src'),
  devtool: 'cheap-module-source-map',
  mode: 'development',
  devServer: {
    hot: true,
    compress: true,
    host: HOST,
    port: PORT,
    historyApiFallback: true,
    static: {
      directory: path.resolve(__dirname, '../src'),
    },
    client: {
      logging: 'warn',
      overlay: true,
    },
  },
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
