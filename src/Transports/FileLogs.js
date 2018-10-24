import {cfg} from 'sm-utils';
import moment from 'moment';
import rotatingFileStream from 'rotating-file-stream';
import BasicLogs from './BasicLogs';

// Oak is not used in this file, because oak itself uses this

function fileNameGenerator() {
	const currentDate = moment().format('YYYY-MM-DD');
	return `${currentDate}-${this}.json`;
}

class FileLogs extends BasicLogs {
	static logStreams = {};

	/**
	 * @param {object} opts
	 * @param {string} opts.table
	 * @param {string} opts.dir
	 * @param {string} opts.level
	 * @param {boolean} opts.filter
	 * @param {}
	 */
	constructor({table, level = 'silly', dir = '/default', filter = false} = {}) {
		super({level});
		this.dir = dir;
		this.table = table;
		this.filter = filter;
		FileLogs._getStream(this);
	}

	/**
	 * @param {object} info
	 * @returns {string}
	 */
	static formatter(info) {
		return `${JSON.stringify(info, null, 0)}\n`;
	}

	/**
	 * @param {object} info
	 * @returns {void}
	 */
	log(info) {
		const stream = FileLogs._getStream(this);
		if (!stream) return;
		if (this.filter && FileLogs.filterLogs(info, this.level)) return;
		try {
			stream.write(FileLogs.formatter(info));
		}
		catch (err) {
			// eslint-disable-next-line no-console
			console.error(`${new Date().toLocaleString()} [FileStream] Could not write to stream`, err);
		}
	}

	/**
	 * @param {object} param0
	 * @param {string} param0.dir
	 * @param {string} param0.table
	 * @param {boolean} param0.regenerate
	 * @returns {import('fs').WriteStream}
	 */
	static _getStream({dir, table, regenerate = false}) {
		const key = `${dir}-${table}`;
		if (!regenerate && (key in this.logStreams)) return this.logStreams[key];
		let newStream;

		try {
			newStream = rotatingFileStream(fileNameGenerator.bind(table), {
				interval: '1d',
				maxFiles: 10,
				path: `${cfg('logstashDir')}/${dir}`,
				immutable: true,
			});
		}
		catch (err) {
			// eslint-disable-next-line no-console
			console.error(`${new Date().toLocaleString()} [FileStream] error: Could not start file stream`, err);
			return null;
		}

		// eslint-disable-next-line no-console
		console.log(`${new Date().toLocaleString()} [FileStream] silly: New File Write Stream: ${dir}/${table}.json`);

		newStream.on('error', (err) => {
			// eslint-disable-next-line no-console
			console.error(`${new Date().toLocaleString()} [FileStream] error: Error in file stream ${key},`, err);
			// reopen stream
			setImmediate(() => this._getStream({table, regenerate: true, dir}));
		});
		this.logStreams[key] = newStream;
		return newStream;
	}
}

export default FileLogs;