import { parseHttpRequest } from '@/helpers/parseHttpRequest';

describe('parseHttpRequest', () => {
  it('Сохраняет повторяющиеся заголовки в массив', () => {
    const rawRequest = [
      'GET / HTTP/1.1',
      'Host: example.com',
      'Cookie: a=1',
      'Cookie: b=2',
      'User-Agent: test',
      '',
      'body content',
    ].join('\n');

    const result = parseHttpRequest(rawRequest);

    expect(result.headers['Cookie']).toEqual(['a=1', 'b=2']);
    expect(result.headers['Host']).toBe('example.com');
    expect(result.headers['User-Agent']).toBe('test');
  });

  it('Не модифицирует body запроса', () => {
    const bodyContent = ['line1', 'line2', 'line3'].join('\r\n');
    const rawRequest = [
      'POST /submit HTTP/1.1',
      'Host: example.com',
      'Content-Type: text/plain',
      '',
      bodyContent,
    ].join('\n');

    const result = parseHttpRequest(rawRequest);

    expect(result.body).toBe(bodyContent);
  });

  it('Корректно обрабатывает websocket upgrade', () => {
    const rawRequest = [
      'GET /ws HTTP/1.1',
      'Host: example.com',
      'Upgrade: websocket',
      'Connection: Upgrade',
      '',
      '',
    ].join('\n');

    const result = parseHttpRequest(rawRequest);

    expect(result.method).toBe('GET');
    expect(result.uri).toBe('/ws');
    expect(result.headers['Upgrade']).toBe('websocket');
    expect(result.headers['Connection']).toBe('Upgrade');
  });

  it('поддерживает разные разделители CRLF и LF', () => {
    const rawRequestCRLF = 'GET / CRLF/1.1\r\nHost: test\r\n\r\nbody';
    const rawRequestLF = 'GET / LF/1.1\nHost: test\n\nbody';

    const resultCRLF = parseHttpRequest(rawRequestCRLF);
    const resultLF = parseHttpRequest(rawRequestLF);

    expect(resultCRLF.body).toBe('body');
    expect(resultLF.body).toBe('body');
  });
});
