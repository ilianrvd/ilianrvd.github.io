# manifest.json

Всеки проект публикува `manifest.json` в корена на сайта си: `https://ilianrvd.github.io/<repo>/manifest.json`. Пише се в края на всяко пускане и влиза в същия deploy. Порталът го чете, за да покаже свежестта.

Докато проектът няма манифест, порталът чете времето от един от файловете му (`fallback` в `site/registry.json`).

```json
{
  "schema": "portal.manifest/1.0",
  "generated_at": "2026-11-26T05:42:05Z",
  "source": "airport-nowcast",
  "id": "airport-nowcast",
  "name": {"bg": "Летищен nowcasting", "en": "Airport nowcasting"},
  "description": {"bg": "Таблица 0–12 ч за петте летища", "en": "0–12 h table for five airports"},
  "url": "https://ilianrvd.github.io/airport-nowcast/",
  "repo": "https://github.com/ilianrvd/airport-nowcast",
  "status": "experimental",
  "cadence_min": 30,
  "run": {"icon_eu": "2026-11-26T00:00:00Z", "ifs": "2026-11-26T00:00:00Z"},
  "embed": {"url": "index.html?embed=1", "min_height_px": 900, "gated": false},
  "products": [
    {
      "id": "table",
      "path": "table.json",
      "format": "json",
      "schema": "airport-nowcast.table/1.0",
      "doc": "https://github.com/ilianrvd/airport-nowcast/blob/main/docs/table.md",
      "cadence_min": 30,
      "generated_at": "2026-11-26T05:42:05Z",
      "data_time": "2026-11-26T05:30:00Z"
    }
  ],
  "consumes": [
    {"project": "nowcasting-public", "path": "embed/data/airports.json", "max_age_min": 30}
  ]
}
```

| Поле | Задължително | Описание |
|---|---|---|
| `schema` | да | `portal.manifest/<major>.<minor>` |
| `generated_at`, `source` | да | Като във всеки публикуван файл. |
| `id` | да | Името на repo с малки букви. |
| `name`, `description` | да | На `bg` и `en`. |
| `url`, `repo` | да | Пълни адреси. |
| `status` | да | `operational`, `experimental` или `draft`. |
| `cadence_min` | да | Интервал между пусканията, в минути. |
| `run` | не | Рънът на моделите, ако има. |
| `daily_at_utc` | не | `"HH:MM"` за пускане веднъж дневно (fog-model-bulgaria). |
| `active_hours_utc` | не | `[от, до]`, ако проектът не работи денонощно. |
| `embed` | не | Адрес за вграждане спрямо `url`, височина, дали има парола. |
| `products[]` | да | Всеки файл, който друг проект или порталът чете. `format`: `json`, `png`, `npz`, `geojson`, `html`, `xlsx`. |
| `consumes[]` | не | Какво чете проектът от другите и колко старо приема. |

## Свежест

Възраст = сега − `generated_at`. Резервът от 15 мин покрива 10 мин кеш на Pages и около 5 мин пускане.

| Знак | Условие |
|---|---|
| зелено | възраст ≤ cadence + 15 мин |
| жълто | възраст ≤ 2 × cadence + 15 мин |
| червено | по-старо, или файлът не се чете |
| сиво | `status: draft` или извън `active_hours_utc` |

При `daily_at_utc` прагът е от следващия очакван рън: зелено до +15 мин, жълто до +2 ч.
