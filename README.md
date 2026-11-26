# ilianrvd.github.io

Общ вход към личните прогностични проекти: https://ilianrvd.github.io/

**Личен проект, не е официален продукт на сертифициран доставчик.** Автор: Илиан Манафов, ilianm@mail.bg.

## Проекти

| Проект | Адрес | Какво публикува |
|---|---|---|
| [nowcasting-public](https://github.com/ilianrvd/nowcasting-public) | /nowcasting-public/ | радар, мълнии, конвекция 0–6 ч |
| [airport-nowcast](https://github.com/ilianrvd/airport-nowcast) | /airport-nowcast/ | таблица 0–12 ч за петте летища |
| [MultiConvect](https://github.com/ilianrvd/multiconvect) | /multiconvect/ | конвекция от ICON-EU, GFS, IFS |
| [fog-model-bulgaria](https://github.com/ilianrvd/fog-model-bulgaria) | /fog-model-bulgaria/ | 1D модел на мъгла |
| [fogNowcast](https://github.com/ilianrvd/fogNowcast) | /fogNowcast/ | пътни станции на НТУ (засега) |

## Как работи

- `site/` се публикува в Pages при всеки push в `main` (`.github/workflows/pages.yml`).
- `site/registry.json` е списъкът на проектите. Това е единствената ръчна настройка.
- `site/assets/v1/portal.js` чете в браузъра `manifest.json` на всеки проект. Докато проектът няма манифест, чете времето от файла в `fallback` на регистъра.
- Ако проектът има няколко страници (напр. airport-nowcast: летищната таблица и `route.html`), те се описват в `views` на регистъра: `id`, `path` (спрямо `embed`), `short`, `description`, `sources`, `files`, и `live: true`, когато страницата смята в браузъра. Порталът вижда коя страница е отворена във вградения изглед и показва нейните подробности; адресът става `#p=<проект>&v=<изглед>`.
- Свежестта е по `cadence_min` (вж. [`site/about.html`](site/about.html)).
- Ключовете в `localStorage` започват с `portal.`, защото всички проекти са на един адрес и делят хранилището.

## Нов проект

Добавя се запис в `site/registry.json`. Полетата са описани в [`docs/`](docs/).
