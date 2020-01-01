const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: '../src/index.ts',
  output: {
    filename: "[name]-[hash:7].js",
    path: path.resolve(__dirname, "../dist"),
    chunkFilename: "[chunkhash].js",
    publicPath: "/",
  },
  context: path.resolve(__dirname, "../src"),
  devtool: "nosources-source-map",
  bail: true,
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true
          }
        }
      },
    ]
  },
  resolve: {
    alias: {
      "@root": path.resolve(__dirname, "../src"),
    },
    extensions: [".ts", ".js", ".json"],
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
      tsconfig: path.resolve(__dirname, "../tsconfig.json"),
      tslint: path.resolve(__dirname, "../tslint.json"),
    }),
    new CleanWebpackPlugin(),
    new HTMLWebpackPlugin({
      template: "../src/app.html",
      filename: "index.html",
    }),
  ]
}
