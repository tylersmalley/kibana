const path = require('path');
const webpack = require('webpack');
const DirectoryNameAsMain = require('@elastic/webpack-directory-name-as-main');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const babelOptions = require('./src/optimize/babel/options');
const babelExclude = [/[\/\\](webpackShims|node_modules|bower_components)[\/\\]/];

module.exports = {
  node: {
    fs: 'empty'
  },
  context: __dirname,
  entry: {
    kibana: path.resolve(__dirname, 'src/core_plugins/kibana/public/kibana'),
    // timelion: path.resolve(__dirname, 'src/core_plugins/timelion'),
    // status_page: path.resolve(__dirname, 'src/core_plugins/status_page/public/status_page')
  },
  devtool: '#cheap-source-map',
  output: {
    path: path.resolve(__dirname, 'optimize/bundles'),
    filename: '[name].bundle.js',
    sourceMapFilename: '[file].map',
    publicPath: '/bundles/',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new CommonsChunkPlugin({
      name: 'commons',
      filename: 'commons.bundle.js'
    }),
  ],
  module: {
    rules: [{
      test: /\.less$/,
      use: [{
        loader: 'style-loader'
      }, {
        loader: 'css-loader'
      }, {
        loader: 'less-loader'
      }]
    }, {
      test: /\.css$/,
      use: [{
        loader: 'style-loader'
      }, {
        loader: 'css-loader'
      }]
    }, {
      test: /\.jade$/,
      loader: 'jade-loader'
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }, {
      test: /\.(html|tmpl)$/,
      loader: 'raw-loader'
    }, {
      test: /\.png$/,
      loader: 'url-loader'
    }, {
      test: /\.(woff|woff2|ttf|eot|svg|ico)(\?|$)/,
      loader: 'file-loader'
    }, {
    //   test: /[\/\\]src[\/\\](core_plugins|ui)[\/\\].+\.js$/,
    //   loader: 'rjs-repack-loader'
    // }, {
      test: /\.jsx?$/,
      exclude: babelExclude,
      loader: 'babel-loader',
      query: babelOptions.webpack
    }]
  },
  resolve:{
    extensions:[
      '.js',
      '.json',
      '.jsx',
      '.less',
    ],
    modules:[
      'webpackShims',
      'node_modules'
    ],
    alias:{
      ng_mock$: 'src/core_plugins/dev_mode/public/ng_mock',
      querystring: 'querystring-browser',
      'ui': path.resolve(__dirname, 'src/ui/public/'),
      'test_harness': path.resolve(__dirname, 'src/test_harness/public/'),
      'plugins/console': path.resolve(__dirname, 'src/core_plugins/console/public/'),
      'plugins/dev_mode': path.resolve(__dirname, 'src/core_plugins/dev_mode/public/'),
      'plugins/elasticsearch': path.resolve(__dirname, 'src/core_plugins/elasticsearch/public/'),
      'plugins/kbn_doc_views': path.resolve(__dirname, 'src/core_plugins/kbn_doc_views/public/'),
      'plugins/kbn_vislib_vis_types': path.resolve(__dirname, 'src/core_plugins/kbn_vislib_vis_types/public/'),
      'plugins/kibana': path.resolve(__dirname, 'src/core_plugins/kibana/public/'),
      'plugins/markdown_vis': path.resolve(__dirname, 'src/core_plugins/markdown_vis/public/'),
      'plugins/metric_vis': path.resolve(__dirname, 'src/core_plugins/metric_vis/public/'),
      'plugins/metrics': path.resolve(__dirname, 'src/core_plugins/metrics/public/'),
      'plugins/spy_modes': path.resolve(__dirname, 'src/core_plugins/spy_modes/public/'),
      'plugins/status_page': path.resolve(__dirname, 'src/core_plugins/status_page/public/'),
      'plugins/table_vis': path.resolve(__dirname, 'src/core_plugins/table_vis/public/'),
      'plugins/tagcloud': path.resolve(__dirname, 'src/core_plugins/tagcloud/public/'),
      'plugins/tests_bundle': path.resolve(__dirname, 'src/core_plugins/tests_bundle/public/'),
      'angular-mocks$': path.resolve(__dirname, 'src/core_plugins/tests_bundle/webpackShims/angular-mocks.js'),
      fixtures: path.resolve(__dirname, 'src/fixtures/'),
      test_utils: path.resolve(__dirname, 'src/test_utils/'),
      'plugins/timelion': path.resolve(__dirname, 'src/core_plugins/timelion/public/')
    },
    unsafeCache: true
  }
};
