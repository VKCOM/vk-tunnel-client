import chalk from 'chalk';

export function showSuccessLog() {
  console.log(
    '\n' +
      chalk.blue(
        ' _____ _____    _____ _____ _____ _____ _____ __    \n' +
          '|  |  |  |  |  |_   _|  |  |   | |   | |   __|  |   \n' +
          '|  |  |    -|    | | |  |  | | | | | | |   __|  |__ \n' +
          ' \\___/|__|__|    |_| |_____|_|___|_|___|_____|_____|\n' +
          '\n',
      ),
  );
}
