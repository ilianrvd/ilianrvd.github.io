# Кой какво тегли

Един източник има един собственик. Източник = доставчик плюс достъп: GRIB от DWD и точки от Open-Meteo са различни източници, дори за един модел.

| Източник | Собственик | Бележка |
|---|---|---|
| ICON-EU, GFS, IFS: GRIB мрежи | MultiConvect | Решено 25.11.2026. `latest_points.json`: ICON-EU по 26 точки (5 летища и 21 станции на НТУ), f000–f030, на всеки рън 00/06/12/18; публикуването на живо още не е потвърдено. Архив в клон `archive-points`. nowcasting-public и airport-nowcast още теглят ICON-EU от DWD сами. Преминават към MultiConvect, когато той публикува нужните полета на всеки рън. |
| IFS, GFS, ALADIN: точки от Open-Meteo | airport-nowcast | ALADIN и ICON се кешират, IFS и GFS се теглят при всяко пускане. |
| ICON-EU: профили от Open-Meteo | fog-model-bulgaria | |
| METAR | nowcasting-public | Решено 26.11.2026. `obs/metar_latest.json`, последните 3 ч, 5 летища. Изключение: airport-nowcast тегли METAR от AWC сам (`src/fetch/metar.py`) и така остава, защото заявката е малка (решено 26.11.2026). |
| SYNOP | nowcasting-public | `obs/synop_latest.json`, последните 12 ч, 15614, 15655, 15552, 15625, 15530. Най-много 1 заявка на 50 мин. |
| Сателит: H40B, MTG LI | nowcasting-public | |
| Сателит: маска на мъглата | fogNowcast | Още не се публикува. |
| Радар | nowcasting-public | |
| Пътни станции на НТУ | fogNowcast | Най-много 1 заявка на 15 мин. |
| Общ списък на точките | nowcasting-public | Решено 26.11.2026. `static/points.json` (летища по AIP, `SYNOP:<WMO>`). airport-nowcast го чете и не поддържа свой списък. |

## Координати на летищата (AIP, ARP)

| ICAO | lat | lon | elev_m |
|---|---|---|---|
| LBSF | 42.6967 | 23.4114 | 531 |
| LBWN | 43.2322 | 27.8250 | 70 |
| LBBG | 42.5697 | 27.5153 | 41 |
| LBPD | 42.0678 | 24.8508 | 182 |
| LBGO | 43.1514 | 25.7128 | 87 |

airport-nowcast, nowcasting-public (в `AIRPORTS_EXPORT`) и MultiConvect още имат LBSF на 42.6952, 23.4064. fog-model-bulgaria има други височини за LBBG, LBWN и LBPD.
