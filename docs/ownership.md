# Кой какво тегли

Един източник има един собственик. Източник = доставчик плюс достъп: GRIB от DWD и точки от Open-Meteo са различни източници, дори за един модел.

| Източник | Собственик | Бележка |
|---|---|---|
| ICON-EU, GFS, IFS: GRIB мрежи | MultiConvect | Решено 25.11.2026. nowcasting-public и airport-nowcast още теглят ICON-EU от DWD сами. Преминават към MultiConvect, когато той публикува нужните полета на всеки рън. |
| IFS, GFS, ALADIN: точки от Open-Meteo | airport-nowcast | ALADIN и ICON се кешират, IFS и GFS се теглят при всяко пускане. |
| ICON-EU: профили от Open-Meteo | fog-model-bulgaria | |
| METAR | **за уточняване** | На 25.11 решихме airport-nowcast. Вечерта на 25.11 nowcasting-public започна да публикува `obs/metar_latest.json`. |
| SYNOP | **за уточняване** | nowcasting-public публикува `obs/synop_latest.json` от 25.11. |
| Сателит: H40B, MTG LI | nowcasting-public | |
| Сателит: маска на мъглата | fogNowcast | Още не се публикува. |
| Радар | nowcasting-public | |
| Пътни станции на НТУ | fogNowcast | Най-много 1 заявка на 15 мин. |
| Общ списък на точките | **за уточняване** | На 25.11 решихме airport-nowcast. Публикува се в `nowcasting-public/static/points.json` (версия 3, летища по AIP). |

## Координати на летищата (AIP, ARP)

| ICAO | lat | lon | elev_m |
|---|---|---|---|
| LBSF | 42.6967 | 23.4114 | 531 |
| LBWN | 43.2322 | 27.8250 | 70 |
| LBBG | 42.5697 | 27.5153 | 41 |
| LBPD | 42.0678 | 24.8508 | 182 |
| LBGO | 43.1514 | 25.7128 | 87 |

airport-nowcast, nowcasting-public (в `AIRPORTS_EXPORT`) и MultiConvect още имат LBSF на 42.6952, 23.4064. fog-model-bulgaria има други височини за LBBG, LBWN и LBPD.
