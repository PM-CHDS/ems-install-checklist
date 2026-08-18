# 1. Elektroinstalační práce

*(Electrical installation works)*

> Jednotlivé položky Checklistu jsou vysvětleny v části Legenda. Pro možnost ověření
> provedení jednotlivých úkonů žádáme o přiložení fotodokumentace nebo technické
> dokumentace.
>
> *(Individual checklist items are explained in the Legend. To allow verification of the
> work performed, please attach photo documentation or technical documentation.)*
> This applies to every section below, not just this one.

```yaml
fields:
  - id: em_dr_switchboard_installed
    label_cs: "Osazení a silové připojení EMS/DŘ rozvaděče"
    label_en: "Mounting and power connection of the EMS/DŘ switchboard"
    type: boolean
    blocking: true
    photo: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Jedná se o stavební montáž rozvaděče na určené místo definované projektovou dokumentací. Dále pak připojení silových a signálních vodičů na svorky dle dokumentace."
    help_en: "Physical mounting of the switchboard at the location defined by the project documentation, plus connecting power and signal conductors to terminals per that documentation."

  - id: mar_switchboard_installed
    label_cs: "Osazení a silové připojení podružného MaR rozvaděče/čů"
    label_en: "Mounting and power connection of the sub MaR (measurement & regulation) switchboard(s)"
    type: boolean
    blocking: true
    photo: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Jedná se o stavební montáž rozvaděče na určené místo definované projektovou dokumentací. Dále pak připojení silových a signálních vodičů na svorky dle dokumentace (řeší se pouze, pokud je obsažen v projektové dokumentaci). Rozvaděče zajišťují komunikaci, případně měření výrobních modulů a mají charakter podružného rozvaděče."
    help_en: "Physical mounting plus power/signal wiring per documentation (only applicable if included in the project documentation). These switchboards handle communication and/or metering of generation modules and are sub-switchboards."

  - id: mar_switchboard_count
    label_cs: "Počet skutečně instalovaných MaR rozvaděčů"
    label_en: "Number of MaR switchboards actually installed"
    type: number
    help_cs: "Uveďte počet skutečně instalovaných rozvaděčů."
    help_en: "State the number of switchboards actually installed."

  - id: remote_metering_switchboard_installed
    label_cs: "Osazení a silové připojení rozvaděče Oddáleného měření"
    label_en: "Mounting and power connection of the Remote-Metering switchboard"
    type: boolean
    blocking: true
    photo: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Jedná se o stavební montáž rozvaděče na určené místo definované projektovou dokumentací. Dále pak připojení silových a signálních vodičů na svorky dle dokumentace (řeší se pouze, pokud je obsažen v projektové dokumentaci). Jedná se o podružný rozvaděč pro ty případy, kdy jsou MTP/MTN vzdálená v kabelové délce od EMS/DŘ rozvaděče dále než 20 m."
    help_en: "Physical mounting plus power/signal wiring per documentation (only applicable if included in the project documentation). This sub-switchboard is used when the current/voltage transformers (MTP/MTN) are more than 20 m of cable length from the EMS/DŘ switchboard. Called \"ELMĚR switchboard\" in the source Legend section."

  - id: ems_full_location
    label_cs: "Umístění rozvaděče EMS Full"
    label_en: "Location of the EMS Full switchboard"
    type: select
    options:
      - {value: inside, label_cs: "uvnitř", label_en: "inside"}
      - {value: outside, label_cs: "venku", label_en: "outside"}
    help_cs: "[FN2] Specifikace umístění, zda je rozvaděč instalován ve venkovním prostředí nebo je umístěn někde v rozvodně."
    help_en: "[FN2] Specify whether the switchboard is installed outdoors or inside a switchroom/electrical room."

  - id: switchboard_jps_labels
    label_cs: "Označení rozvaděčů dle JPS"
    label_en: "Switchboard designation per single-line diagram (JPS)"
    type: table
    repeatable: false
    help_cs: "[FN3] Pokud je instalováno více rozvaděčů, využijte pole pro poznámky. Uveďte názvy instalovaných rozvaděčů tak, jak jsou označeny na místě instalace. Tento název bude pak použit při konfiguraci."
    help_en: "[FN3] If more switchboards are installed than fit here, use the Notes field (§7). Enter the names of the installed switchboards exactly as labeled on site — this name is then used during configuration."
    fixed_rows:
      - {row_id: ems_dr, label_cs: "Rozvaděč EMS/DŘ", label_en: "EMS/DŘ switchboard"}
      - {row_id: mar1, label_cs: "MaR1", label_en: "MaR1"}
      - {row_id: mar2, label_cs: "MaR2", label_en: "MaR2"}
      - {row_id: remote_metering, label_cs: "Oddálené měření", label_en: "Remote metering"}
    columns:
      - id: jps_label
        label_cs: "Označení rozvaděče dle JPS"
        label_en: "Switchboard designation per JPS"
        type: text
```
