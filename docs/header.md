# Общ заглавен блок

Всеки публикуван JSON започва с тези полета на горното ниво. Те се добавят до сегашните полета. Старите се махат чак когато никой не ги чете, с нов major на `schema`.

```json
{
  "schema": "fog-model-bulgaria.fog/1.0",
  "generated_at": "2026-11-25T18:15:54Z",
  "source": "fog-model-bulgaria; METAR (AWC); ICON-EU (Open-Meteo)",
  "run": "2026-11-25T12:00:00Z",
  "cadence_min": 1440
}
```

| Поле | Тип | Правило |
|---|---|---|
| `schema` | string | `<project>.<product>/<major>.<minor>`. Major се вдига само при промяна, която чупи четящите. |
| `generated_at` | string | Кога е записан файлът. ISO 8601, със секунди и `Z`. |
| `source` | string или list | Откъде са данните. |
| `run` | string, object или null | Init на моделния рън. При няколко модела е обект: `{"icon_eu": "…Z", "ifs": "…Z"}`. `null`, когато няма модел или рънът не се знае (обяснява се в `docs/` на проекта). |
| `cadence_min` | int | Очакваният интервал между пусканията, в минути. |

Картинки, `npz` и `xlsx` нямат заглавие. За тях полетата са в `products[]` на манифеста или в съседен `*_meta.json`.

## Сегашни файлове

| Файл | Има днес | Добавя се |
|---|---|---|
| `fog-model-bulgaria/data/fog.json` | `created`, `init`, `icon_run: null` | всичките пет |
| `nowcasting-public/embed/data/airports.json` | `created`, `radar_time` | всичките пет |
| `nowcasting-public/embed/data/frames.json` | `generated_utc` | всичките пет |
| `nowcasting-public/obs/*.json` | `generated_at`, `fetched_at`, `source` | `schema`, `cadence_min` |
| `multiconvect/airports.json` | `created_utc`, `run_init_utc`, `run` = `"25.11 06z"` | `generated_at`, `schema`, `cadence_min`. Сегашното `run` не е ISO, затова смяната му иска major 2.0 и проверка в airport-nowcast. |
| `airport-nowcast/table.json` | `created` (с микросекунди и `+00:00`) | всичките пет |
| `fogNowcast/obs/ntu_latest.json` | `generated_at`, `source` | `schema`, `cadence_min` |
