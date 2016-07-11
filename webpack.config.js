var ExtractTextPlugin = require('extract-text-webpack-plugin');
var DirectoryNameAsMain = require('webpack-directory-name-as-main'); // TODO: remove this
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
var webpack = require('webpack');
var defaults = require('lodash/object/defaults');

var path = require('path');
var babelExclude = [/[\/\\](webpackShims|node_modules|bower_components)[\/\\]/];

module.exports = {
  devtool: 'source-map',

  entry: {
    'kibana': './src/core_plugins/kibana/public/kibana.js',
    'console': './src/core_plugins/console/public/console.js',
    'status_page': './src/core_plugins/status_page/public/status_page.js'
  },

  output: {
    path: path.resolve(__dirname, 'optimize/bundles'),
    filename: '[name].bundle.js',
  },

  resolve: {
    modulesDirectories: [
      'webpackShims',
      'node_modules'
    ],

    fallback: [
      path.resolve(__dirname, 'webpackShims'),
      path.resolve(__dirname, 'node_modules'),
    ],

    root: [
      path.resolve('./src')
    ],

    alias: {
      'ui': path.resolve(__dirname, './src/ui/public'),
      'test_harness': path.resolve(__dirname, './src/test_harness/public'),
      'plugins/console': path.resolve(__dirname, './src/core_plugins/console/public'),
      'plugins/dev_mode': path.resolve(__dirname, './src/core_plugins/dev_mode/public'),
      'plugins/elasticsearch': path.resolve(__dirname, './src/core_plugins/elasticsearch/public'),
      'plugins/kbn_doc_views': path.resolve(__dirname, './src/core_plugins/kbn_doc_views/public'),
      'plugins/kbn_vislib_vis_types': path.resolve(__dirname, './src/core_plugins/kbn_vislib_vis_types/public'),
      'plugins/kibana': path.resolve(__dirname, './src/core_plugins/kibana/public'),
      'plugins/markdown_vis': path.resolve(__dirname, './src/core_plugins/markdown_vis/public'),
      'plugins/metric_vis': path.resolve(__dirname, './src/core_plugins/metric_vis/public'),
      'plugins/spy_modes': path.resolve(__dirname, './src/core_plugins/spy_modes/public'),
      'plugins/status_page': path.resolve(__dirname, './src/core_plugins/status_page/public'),
      'plugins/table_vis': path.resolve(__dirname, './src/core_plugins/table_vis/public'),
      'plugins/tests_bundle': path.resolve(__dirname, './src/core_plugins/tests_bundle/public'),
      'ng_mock$': path.resolve(__dirname, './src/core_plugins/dev_mode/public/ng_mock'),
      'fixtures': path.resolve(__dirname, './src/fixtures'),
      'test_utils': path.resolve(__dirname, './src/test_utils'),
      'angular-mocks': path.resolve(__dirname, './node_modules/angular-mocks/angular-mocks.js')
    }
  },

  plugins: [
    new webpack.ResolverPlugin([
      new DirectoryNameAsMain()
    ]),
    new webpack.NoErrorsPlugin(),
    new CommonsChunkPlugin({
      name: 'commons',
      filename: 'commons.bundle.js'
    })
  ],

  module: {
    loaders: [{
      test: /\.less$/,
      loaders: [
        'style',
        'css',
        'less?sourceMap&dumpLineNumbers=comments'
      ]
    }, {
      test: /\.css$/,
      loaders: ['style', 'css']
    }, {
      test: /\.jade$/,
      loader: 'jade'
    }, {
      test: /\.json$/,
      loader: 'json'
    }, {
      test: /\.(html|tmpl)$/,
      loader: 'raw'
    }, {
      test: /\.png$/,
      loader: 'url?limit=10000&name=[path][name].[ext]'
    }, {
      test: /\.(woff|woff2|ttf|eot|svg|ico)(\?|$)/,
      loader: 'file?name=[path][name].[ext]'
    }, {
      test: /[\/\\]src[\/\\](core_plugins|ui)[\/\\].+\.js$/,
      loader: `rjs-repack?sourceMap`
    }, {
      test: /\.js$/,
      loaders: ['babel'],
      exclude: /node_modules/
    }]
  }
};
