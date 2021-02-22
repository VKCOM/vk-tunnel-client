# VK Tunnel

Очень часто в веб-разработке требуется показать своё приложение другим пользователям. В случае боевой версии сайта беспокоиться не о чем, но если во время разработки вы пользуетесь локальным сервером, то показать промежуточные результаты на нём — нетривиальная задача. 

Ещё сложнее становится в том случае, когда вам нужно проверить взаимодействие приложения с внешними инструментами, к примеру, с VK Bridge внутри мобильных приложений. 

VK Tunnel — это утилита, которая позволит сделать сервер на вашем локальном компьютере публичным
После запуска VK Tunnel Вы можете отслеживать в терминале информацию о состоянии и показателях соединений, установленных через ваш туннель. 


## 1. Использование

Использование в VK Mini Apps
Установите пакет:

    npm install @vkontakte/vk-tunnel -g

Создайте приложение из шаблона:

    npx @vkontakte/create-vk-mini-app <foldername>

Перейдите к папке проекта при помощи команды:

    cd <foldername>

Запустите проект командой:

    npm start

И сделайте вызов в консоли проекта:

    env NODE_TLS_REJECT_UNAUTHORIZED=0 \ 
    PROXY_HTTP_PROTO=https \ 
    PROXY_WS_PROTO=wss \ 
    PROXY_HOST=localhost \ 
    PROXY_PORT=10888 \ 
    PROXY_TIMEOUT=5000 \ 

Или, используя опции:    
    
    vk-tunnel --insecure=1 --http-protocol=https --ws-protocol=wss --host=localhost --port=10888 --timeout=5000

В терминале будет предложено перейти по адресу в формате 
`https://oauth.vk.com/code_auth?stage=check&code=2a2aaaa` для авторизации. Откройте ссылку в браузере, вернитесь в терминал и нажмите enter 

После успешной авторизации в терминале появится ссылка вида

    https://user12345-jv7zlzzz.wormhole.vk-apps.com

Укажите её в поле URL в управлении Вашим мини-приложением для дальнейшей работы. Если приложение ещё не создано -- воспользуйтесь инструкцией

## 2. Переменные окружения

При запуске утилиты вы можете настроить переменные окружения:

| Переменная | Опция | Описание       |
| ---------------------------- | -----|---------------------------------------------------------------------------------------------------------------------------------------------------- |
| NODE_TLS_REJECT_UNAUTHORIZED | --insecure | флаг, позволяет пропустить проверку самоподписанных сертификатов <br>Возможные значения: <br>0 — пропустить проверку<br>1 — проверить сертификат (в случае, если передается через опцию, логика обратная)         |
| PROXY_HTTP_PROTO             | --http-protocol |Схема для HTTP протокола<br>Возможные значения: <br>http — нешифрованное соединение <br>https — шифрованное соединение<br><br>Значение по умолчанию: http |
| PROXY_WS_PROTO               | --ws-protocol | Схема для Web Socket-протокола<br>Возможные значения: <br>*ws* — нешифрованное соединение <br>*wss* — шифрованное соединение<br><br>Значение по умолчанию: *ws* |
| PROXY_HOST                   | --host | хост, на котором запущен проект<br>Значение по умолчанию: *localhost*                                                                                       |
| PROXY_PORT                   | --port | порт, на котором запущен Ваш проект<br>Значение по умолчанию: *10888*                                                                                      |
| PROXY_TIMEOUT                | --timeout | таймаут запросов к вашему приложению<br>Значение по умолчанию: *5000*  
| app_id                       | нет       | id приложения
| endpoints                    | нет       | массив с указанием платформ для которых нужно автоматически заменять адрес в настройках приложения. <br>Возможные значения: *mobile*, *mvk*, *web*

## 3. Опции

Для удобной настройки `vk-tunnel` создайте файл `vk-tunnel-config.json`

``` JSON
{
  "app_id": "...",
  "endpoints": ["mobile", "mvk", "web"]
}
```
