const fs = require('fs');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

const contractsInfoPath = path.resolve(__dirname, './src/contractsInfo.json');
const devContractsInfoPath = path.resolve(__dirname, './src/dev_contractsInfo.json');
const contractsInfoExists =  fs.existsSync(contractsInfoPath);
const devContractsInfoExists =  fs.existsSync(devContractsInfoPath);
const contractsInfo = (prod && contractsInfoExists) ? contractsInfoPath : (devContractsInfoExists ? devContractsInfoPath : contractsInfoPath);

module.exports = {
	entry: {
		bundle: ['./src/main.js']
	},
	resolve: {
		extensions: ['.mjs', '.js', '.svelte'],
		alias: {
			contractsInfo,
		}
	},
	output: {
		path: __dirname + '/public',
		filename: '[name].js',
		chunkFilename: '[name].[id].js'
	},
	module: {
		rules: [
			{
				test: /\.svelte$/,
				exclude: /node_modules/,
				use: {
					loader: 'svelte-loader',
					options: {
						emitCss: true,
						hotReload: true
					}
				}
			},
			{
				test: /\.css$/,
				use: [
					/**
					 * MiniCssExtractPlugin doesn't support HMR.
					 * For developing, use 'style-loader' instead.
					 * */
					prod ? MiniCssExtractPlugin.loader : 'style-loader',
					'css-loader'
				]
			}
		]
	},
	mode,
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css'
		}),
		new Dotenv()
	],
	devtool: prod ? false: 'source-map'
};
