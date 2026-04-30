# Passport Game

Iframe-ready демо быстрой игры `Паспорт` на React/Vite.

## Что изменено по ТЗ

- Приведен игровой цикл к формату быстрых игр:
  - 20 секунд на выбор ставки и исхода;
  - около 3 секунд ожидания результата;
  - автоматический переход к следующему раунду.
- В демо-режиме установлен виртуальный баланс `1 000 000 ₽`.
- Обновлены пресеты ставок по ТЗ:
  `100`, `500`, `1000`, `5000`, `10000`, `50000`, `150000`.
- Реализована бинарная математика:
  - пользователь выбирает один из двух исходов;
  - система генерирует один из двух результатов;
  - совпадение выбора и результата дает выигрыш.
- Коэффициенты выставлены `x2` для нейтральной 50/50 демо-модели.
- На фазах ожидания и результата все игровые интеракции блокируются.
- Таймер отображается только в фазе ставки.
- Добавлен onboarding первого входа:
  - краткое описание лора;
  - выбор суммы;
  - выбор исхода;
  - автоприем ставки по окончании таймера.
- Добавлена поддержка запуска внутри iframe через query-параметры:
  - `sessionToken`;
  - `cid`;
  - `playerId`;
  - `productId`;
  - `currency`;
  - `customPayload`;
  - `providerApiBaseUrl`.
- Добавлен frontend-интеграционный слой:
  - запрос `/api/player/info`;
  - отправка `/api/bet/create`;
  - отправка `/api/bet/settle`.
- Добавлен backend adapter без новых npm-зависимостей:
  - проксирует вызовы в Platform API;
  - формирует `X-Auth-Signature`;
  - хранит секрет подписи только на серверной стороне;
  - отдает собранный frontend из `dist`.
- Добавлены endpoints расписания:
  - `/getschedule`;
  - `/api/getschedule`.
- В расписании указаны 5 игр из ТЗ:
  - `Опционы`;
  - `Паспорт`;
  - `Звонок`;
  - `Саркофаг`;
  - `Ракета`.

## Важное замечание

Текущий playable UI реализован для игры `Паспорт`.
Остальные игры из ТЗ добавлены в API расписания как интеграционные элементы. Отдельные визуальные UI-версии для `Опционы`, `Звонок`, `Саркофаг`, `Ракета` в этой доработке не создавались.

Алгоритм подписи в ТЗ описан без точной формулы. В adapter используется `HMAC-SHA256` от JSON body через `PLATFORM_API_SECRET`. Если платформа утвердит другой алгоритм, менять нужно только серверный adapter.

## Запуск

```bash
npm install
npm run build
npm run serve:adapter
```

Локальный адрес:

```text
http://127.0.0.1:3001
```

Пример iframe URL:

```text
http://127.0.0.1:3001/?sessionToken=test&cid=ourPlatform&playerId=user123&productId=passport&currency=RUB
```

## Переменные окружения

См. `.env.example`.

```text
VITE_PROVIDER_API_BASE_URL=http://localhost:3001
PORT=3001
PLATFORM_API_BASE_URL=https://platform.example.com
PLATFORM_API_SECRET=change-me
CORS_ORIGIN=*
```

Если `PLATFORM_API_BASE_URL` не задан, adapter работает в mock-режиме и возвращает демо-ответы.

## Проверка

Выполнено:

```bash
npm run typecheck
npm run build
node --check server/provider-adapter.mjs
```

Проверены endpoints:

```bash
curl http://127.0.0.1:3001/api/getschedule
curl -X POST http://127.0.0.1:3001/api/player/info \
  -H 'Content-Type: application/json' \
  -d '{"sessionToken":"test"}'
```
