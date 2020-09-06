const { promises: dns } = require('dns');
const axios = require('axios');

// Промис сохраняется для того, чтобы при дальнейших вызовах request
// не создавались отдельные таймеры, а использовался уже созданный
let waitConnectionPromise;

async function waitConnection() {
  while (true) {
    try {
      await dns.lookup('api.vk.com');
      waitConnectionPromise = null;
      break;
    } catch {
      // Ждем 5 секунд
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

module.exports = async function(...data) {
  while (true) {
    try {
      return await axios(...data);
    } catch (err) {
      // Ошибки, которые связаны с проблемами с подключением к сетью
      if (!['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ENETUNREACH'].includes(err.code)) {
        throw err;
      }

      if (!waitConnectionPromise) {
        waitConnectionPromise = waitConnection();
      }

      await waitConnectionPromise;
    }
  }
}
