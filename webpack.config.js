const { HotModuleReplacementPlugin } = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/**
 * @incstr lib to create unique id from pattern
 */
const incstr = require('incstr');


/**
 * @createUniqueIdGenerator a function to create uniqueId
 */
function createUniqueIdGenerator() {
  const index = {};
  const generateNextId = incstr.idGenerator({
    prefix: 'pp_',
    alphabet: '0123456789'
  });

  return (name) => {
    if (index[name]) {
      return index[name];
    }
    index[name] = generateNextId();
    return index[name];
  };
};

const uniqueIdGenerator = createUniqueIdGenerator();

/**
 * generate css class name
 */
function generateScopedName(localName) {
  return uniqueIdGenerator(localName);
}

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: path.join(__dirname, 'src/app.js'),
  context: path.resolve(__dirname, 'src'),
  output: {
    filename: '[name].[hash].js',
    path: path.join(__dirname, 'build')
  },
  devServer: {
    open: false,
    port: 8088,
    hot: true,
    historyApiFallback: true
  },
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              ['react-css-modules', {
                context: path.resolve(__dirname, 'src'),
                filetypes: {
                  '.scss': {
                    syntax: 'postcss-scss',
                    plugins: [
                      ["postcss-import-sync2",
                        {
                          resolve: function(id, basedir, importOptions) {
                            let nextId = id;

                            if (id.substr(0, 2) === "./") {
                              nextId = id.replace("./", "");
                            }

                            // if (nextId[0] !== "_") {
                            //   nextId = `_${nextId}`;
                            // }

                            // if (nextId.indexOf(".scss") === -1) {
                            //   nextId = `${nextId}.scss`;
                            // }
                            return path.resolve(basedir, nextId);
                          }
                        }
                      ]
                    ]
                  }
                },
                generateScopedName
              }]
            ]
          }
        }
      },
      {
        test: /\.html$/,
        use: ['html-loader']
      },
      {
        test: /\.(scss|sass|css)$/,
        use: [{
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: process.env.NODE_ENV === 'development',
              reloadAll: true,
            },
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                getLocalIdent: (context, localIdentName, localName) => {
                  return generateScopedName(localName);
                }
              }
            }
          },
          {
            loader: 'sass-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src/index.html'),
      cache: true,
      showError: true
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ]
};