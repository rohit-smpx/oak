import util from 'util';
import _ from 'lodash';

import {getGlobalOptions} from './helpers';

const levelColors = {
	error: 'red',
	warn: 'yellow',
	info: 'green',
	verbose: 'cyan',
	debug: 'blue',
	silly: 'reset',
};

const terminalColors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',

	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',

	bgBlack: '\x1b[40m',
	bgRed: '\x1b[41m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',
	bgCyan: '\x1b[46m',
	bgWhite: '\x1b[47m',
};

const colorFns = {};

/**
 * @param {string} level
 */
function getColorItFn(level) {
	const levelColor = levelColors[level] || 'white';
	if (colorFns[levelColor]) return colorFns[levelColor];

	colorFns[levelColor] = (txt, {white = false, bright = false, filter = false} = {}) => {
		const terminalColor = white ? terminalColors.white : terminalColors[levelColor];
		if (!txt || filter) return '';
		return `${terminalColor}${bright ? terminalColors.bright : ''}${txt}${terminalColors.reset}`;
	};
	return colorFns[levelColor];
}

/**
 * @param {object} info
 * @returns {string}
 */
function formatter(info) {
	const colorIt = getColorItFn(info.level);
	const stack = _.get(info, 'error.stack', '');

	const omitFromRest = [...Object.keys(getGlobalOptions()), 'label', 'message', 'level', 'error', 'duration', 'createdAt'];
	const rest = _.omit(info, omitFromRest);
	const restStringified = `\n${util.format(rest)}`;

	const colored = {
		time: colorIt(new Date(info.createdAt).toLocaleString()),
		level: colorIt(info.level, {bright: true}),
		label: colorIt(`[${info.label}] `, {bright: true, filter: !info.label}),
		stack: colorIt(stack),
		message: colorIt(`${info.message}${info.message && stack ? '\n' : ''}`, {filter: !info.message}),
		duration: colorIt(`${info.duration}ms `, {bright: true, filter: _.isNil(info.duration)}),
		rest: colorIt(restStringified, {white: true, bright: true, filter: _.isEmpty(rest)}),
	};

	return `${colored.time} ${colored.label}${colored.level}: ${colored.duration}${colored.message}${colored.stack}${colored.rest}`;
}

export {
	formatter, // eslint-disable-line
};

