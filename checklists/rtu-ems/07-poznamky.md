# 7. Poznámky

*(Notes)*

A single open free-text area in the source (two blank paragraphs under the heading, no
further structure). Referenced from elsewhere in the checklist as the overflow/catch-all
field when a table runs out of rows, or when something isn't covered by an explicit
field:

- `02-elektromery.md`: `switchboard_jps_labels` overflow (FN3), `additional_meters_table` overflow (FN6)
- `04-technologie.md`: `inverters_rtu_table` / `inverters_tcp_table` overflow (FN10)
- `05-nastaveni-systemu.md`: `additional_sources_installed` — list of extra sources like a CHP/cogeneration unit (FN12)

```yaml
fields:
  - id: general_notes
    label_cs: "Poznámky"
    label_en: "Notes"
    type: text
    multiline: true
    required: false
```
