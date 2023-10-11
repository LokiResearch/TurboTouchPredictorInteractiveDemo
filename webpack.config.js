const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [{
  entry: ['./src/main.js', './src/ConstantSpeedPredictor.js'],
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  plugins: [
    new CopyPlugin( {
        patterns: [
              { 
                  context: path.resolve(path.join(__dirname, 'src')),
                  from: '**/*.html', 
                  to: path.resolve(__dirname, 'dist/') 
              },
              { 
                context: path.resolve(path.join(__dirname, 'src')),
                from: '**/*.css', 
                to: path.resolve(__dirname, 'dist/') 
            },
          ],
        }
      ),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000
  }
},

{
  entry: ['./src/mainwebgl.js', './src/ConstantSpeedPredictor.js'],
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'mainwebgl.js',
  },
  plugins: [
    new CopyPlugin( {
        patterns: [
              { 
                  context: path.resolve(path.join(__dirname, 'src')),
                  from: '**/*.html', 
                  to: path.resolve(__dirname, 'dist/') 
              },
              { 
                context: path.resolve(path.join(__dirname, 'src')),
                from: '**/*.css', 
                to: path.resolve(__dirname, 'dist/') 
            },
          ],
        }
      ),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000
  }
}

];