const path = require('path');
const webpack = require('webpack');
const DirectoryNameAsMain = require('@elastic/webpack-directory-name-as-main');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');

const babelExclude = [/[\/\\](webpackShims|node_modules|bower_components)[\/\\]/];

module.exports = {
  node: {
    fs: 'empty'
  },
  context: path.resolve(__dirname, '.'),
  entry: {
    kibana: path.resolve(__dirname, 'src/core_plugins/kibana/public/kibana'),
    // timelion: path.resolve(__dirname, 'src/core_plugins/timelion'),
    status_page: path.resolve(__dirname, 'src/core_plugins/status_page/public/status_page')
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
    new webpack.NoErrorsPlugin(),
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
        loader: 'less-loader', options: {
          strictMath: true,
          noIeCompat: true
        }
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
      loader: 'babel-loader',
      query: {
        plugins: require.resolve('babel-plugin-add-module-exports')
      }
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
      'ui': path.resolve(__dirname, 'src/ui/public/'),
      'test_harness': 'src/test_harness/public',
      querystring: 'querystring-browser',
      'plugins/console': 'src/core_plugins/console/public',
      'plugins/dev_mode': 'src/core_plugins/dev_mode/public',
      'plugins/elasticsearch': 'src/core_plugins/elasticsearch/public',
      'plugins/kbn_doc_views': 'src/core_plugins/kbn_doc_views/public',
      'plugins/kbn_vislib_vis_types': 'src/core_plugins/kbn_vislib_vis_types/public',
      'plugins/kibana': path.resolve(__dirname, 'src/core_plugins/kibana/public'),
      'plugins/markdown_vis': 'src/core_plugins/markdown_vis/public',
      'plugins/metric_vis': 'src/core_plugins/metric_vis/public',
      'plugins/metrics': 'src/core_plugins/metrics/public',
      'plugins/spy_modes': 'src/core_plugins/spy_modes/public',
      'plugins/status_page': path.resolve(__dirname, 'src/core_plugins/status_page/public/'),
      'plugins/table_vis': 'src/core_plugins/table_vis/public',
      'plugins/tagcloud': 'src/core_plugins/tagcloud/public',
      'plugins/tests_bundle': 'src/core_plugins/tests_bundle/public',
      ng_mock$: 'src/core_plugins/dev_mode/public/ng_mock',
      'angular-mocks$': 'src/core_plugins/tests_bundle/webpackShims/angular-mocks.js',
      fixtures: 'src/fixtures',
      test_utils: 'src/test_utils',
      'plugins/timelion': 'src/core_plugins/timelion/public'
    },
    unsafeCache:true
  },
  resolveLoader:{
    alias:{
      'autoprefixer-loader': path.resolve(__dirname, 'node_modules/autoprefixer-loader/index.js'),
      'babel-loader': path.resolve(__dirname, 'node_modules/babel-loader/lib/index.js'),
      'css-loader': path.resolve(__dirname, 'node_modules/css-loader/index.js'),
      'exports-loader': path.resolve(__dirname, 'node_modules/exports-loader/index.js'),
      'expose-loader': path.resolve(__dirname, 'node_modules/expose-loader/index.js'),
      'file-loader': path.resolve(__dirname, 'node_modules/file-loader/index.js'),
      'imports-loader': path.resolve(__dirname, 'node_modules/imports-loader/index.js'),
      'jade-loader': path.resolve(__dirname, 'node_modules/jade-loader/index.js'),
      'json-loader': path.resolve(__dirname, 'node_modules/json-loader/index.js'),
      'less-loader': path.resolve(__dirname, 'node_modules/less-loader/index.js'),
      'postcss-loader': path.resolve(__dirname, 'node_modules/postcss-loader/index.js'),
      'raw-loader': path.resolve(__dirname, 'node_modules/raw-loader/index.js'),
      'rjs-repack-loader': path.resolve(__dirname, 'node_modules/rjs-repack-loader/index.js'),
      'script-loader': path.resolve(__dirname, 'node_modules/script-loader/index.js'),
      'style-loader': path.resolve(__dirname, 'node_modules/style-loader/index.js'),
      'url-loader': path.resolve(__dirname, 'node_modules/url-loader/index.js')
    }
  }
};
