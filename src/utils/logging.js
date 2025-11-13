const util = require('node:util');
const chalk = require('chalk');

/**
 * Logger class for logging messages with different levels and colors.
 * Provides static methods for logging with timestamps and optional prefixes.
 */
class Logger {
    /**
     * Get the current minimum log level from environment
     * @static
     * @returns {string} The minimum log level
     */
    static getMinLevel() {
        return process.env.LOG_LEVEL;
    }

    /**
     * Check if a log level should be printed based on minimum level
     * @static
     * @param {string} level - The level to check
     * @returns {boolean} Whether the level should be logged
     */
    static shouldLog(level) {
        const levels = ['debug', 'info', 'success', 'warn', 'error', 'command', 'reply'];
        const minLevel = this.getMinLevel();
        const minIndex = levels.indexOf(minLevel);
        const currentIndex = levels.indexOf(level);

        if (minIndex === -1 || currentIndex === -1) return true; // Fallback to show all if invalid level

        return currentIndex >= minIndex;
    }
    /**
     * Log a message with specific logging level.
     *
     *  Supported logging levels:
     * - "debug"
     * - "info"
     * - "success"
     * - "warn"
     * -  "error"
     * - "command"
     * - "reply"
     *
     * @static
     * @method
     * @param {("debug" | "info" | "success" | "warn" | "error" | "command" | "reply")?} level
     *        The logging level.
     * @param {string} message - Log message string.
     * @param {string} [prefix] - Optional prefix to use for the log message.
     */
    static log(level, message, prefix) {
        if (!level) level = 'debug';

        // Check if this level should be logged based on minimum level
        if (!this.shouldLog(level)) return;

        const timestamp = new Date().toLocaleTimeString();  // This will always update for each call function
        const levelUpper = level.toUpperCase();
        // Declare first message template to be used later, note the `%s` template
        const msgTemplate = `[${timestamp}] [${levelUpper}]${prefix ? ` ${prefix}:` : ''} %s`;
        let msg;  // Dump variable to store the formatted message

        switch (level) {
            case 'success':
                msg = util.format(msgTemplate, message);  // Format the message
                console.log(chalk.green(msg));
                break;
            case 'info':
                msg = util.format(msgTemplate, message);  // Format the message
                console.log(chalk.blue(msg));
                break;
            case 'warn':
                msg = util.format(msgTemplate, message);  // Format the message
                // make sure to write to standard error (stderr)
                console.error(chalk.yellow(msg));
                break;
            case 'error':
                msg = util.format(msgTemplate, message);  // Format the message
                // make sure to write to standard error (stderr)
                console.error(chalk.red(msg));
                break;
            case 'command':
                msg = util.format(msgTemplate, `Command: ${message}`);  // Format the message
                console.log(chalk.magenta(msg));
                break;
            case 'reply':
                msg = util.format(msgTemplate, `Reply: ${message}`);  // Format the message
                console.log(chalk.cyan(msg));
                break;
            default:  // 'debug' level
                msg = util.format(msgTemplate, message);  // Format the message
                console.log(chalk.gray(msg));
        }
    }

    /** Alias for `Logger.log('success', ...)` */
    static success(message, prefix) {
        Logger.log('success', message, prefix);
    }

    /** Alias for `Logger.log('info', ...)` */
    static info(message, prefix) {
        Logger.log('info', message, prefix);
    }

    /** Alias for `Logger.log('warn', ...)` */
    static warn(message, prefix) {
        Logger.log('warn', message, prefix);
    }

    /** Alias for `Logger.log('error', ...)` */
    static error(message, prefix) {
        Logger.log('error', message, prefix);
    }

    /** Alias for `Logger.log('command', ...)` */
    static command(message, prefix) {
        Logger.log('command', message, prefix);
    }

    /** Alias for `Logger.log('reply', ...)` */
    static reply(message, prefix) {
        Logger.log('reply', message, prefix);
    }

    /** Alias for `Logger.log('debug', ...)` */
    static debug(message, prefix) {
        Logger.log('debug', message, prefix);
    }
}

module.exports = {
    Logger,
    log: Logger,  // Alias
};
