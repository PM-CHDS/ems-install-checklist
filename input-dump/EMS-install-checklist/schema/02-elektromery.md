# 2. Elektroměry

*(Electricity meters)*

> **_notes** (maintainer flags, not shown to the installer):
> - FN4 in the source is a stray/incomplete footnote (its body is just the letter "I") —
>   `mtn_installed`'s help below falls back to the Legend paragraph instead.
> - The table header's "Způsob komunikace" column had a stray leading "A" in the source
>   XML (likely a copy artifact); shown here corrected.
> - The Legend (§8.2) describes a few extra items ("Připojeno k rozvaděči", "Ověřena
>   korektnost zapojení") that don't correspond to actual columns in the printed table —
>   their explanatory text was folded into the closest matching column's help instead of
>   invented as new columns.

```yaml
fields:
  - id: meter_main_heading
    type: group
    label_cs: "Elektroměr v EMS/DŘ rozvaděči (SML133) pro měření na předacím místě"
    label_en: "Meter in the EMS/DŘ switchboard (SML133) for metering at the delivery point"

  - id: mtp_installed
    label_cs: "Osazení a připojení MTP k EMS/DŘ rozvaděči"
    label_en: "Mounting and connection of the current transformer (MTP) to the EMS/DŘ switchboard"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Jedná se o montáž měřicích transformátorů proudu (MTP). Trafa se montují na místa dle dokumentace o příslušném převodovém poměru. U montáže je nutné zkontrolovat správný převodový poměr, případně třídu přesnosti."
    help_en: "Mounting of current transformers (MTP) at the locations specified in the documentation, with the correct ratio. Verify the correct transformation ratio and accuracy class during mounting."

  - id: mtn_installed
    label_cs: "Osazení a připojení MTN k EMS/DŘ rozvaděči"
    label_en: "Mounting and connection of the voltage transformer (MTN) to the EMS/DŘ switchboard"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "[FN4 in source is incomplete/stray] Jedná se o montáž měřicích transformátorů napětí (MTN). Trafa se montují na místa dle dokumentace o příslušné velikosti. U montáže je nutné zkontrolovat správný převodový poměr, případně třídu přesnosti."
    help_en: "Mounting of voltage transformers (MTN) at the locations specified in the documentation, matching the correct size. Verify the correct transformation ratio and accuracy class during mounting."

  - id: current_direction_check
    label_cs: "Kontrola správnosti směru toku proudu na MTP"
    label_en: "Check of correct current-flow direction on the MTP"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Trafa je potřeba montovat v příslušném směru toku proudu, kdy správný směr je od distribuční sítě do odběrného místa, případně k výrobně."
    help_en: "Transformers must be mounted in the correct current-flow direction: from the distribution grid toward the offtake point, or toward the generation source."

  - id: phase_sequence_check
    label_cs: "Kontrola sledu fází"
    label_en: "Phase-sequence check"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Je nutné dodržet správný sled fází L1-L2-L3."
    help_en: "The correct phase sequence L1-L2-L3 must be maintained."

  - id: voltage_current_correspondence_check
    label_cs: "Kontrola příslušnosti napětí vs. proud (I1→U1; I2→U2; I3→U3)"
    label_en: "Check of voltage-vs-current correspondence (I1→U1; I2→U2; I3→U3)"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Je nutné dodržet vazbu mezi proudovými a napěťovými vstupy, tak aby měřený proud z fáze např. L1 odpovídal na napěťových svorkách elektroměru fázi L1 (viz schéma, příklad elektroměr SML133)."
    help_en: "The current and voltage inputs must correspond, so the measured current from e.g. phase L1 matches phase L1 on the meter's voltage terminals (see wiring diagram, example meter SML133)."
    images:
      - file: assets/02-fig1-semi-direct-metering-wiring.png
        caption_cs: "Obrázek 1 - zapojení polopřímého měření (použití MTP)"
        caption_en: "Figure 1 - semi-direct metering wiring (current transformer only)"
      - file: assets/02-fig2-indirect-metering-wiring.png
        caption_cs: "Obrázek 2 - zapojení nepřímého měření (použití MTP a MTN)"
        caption_en: "Figure 2 - indirect metering wiring (current + voltage transformer)"

  - id: meter_settings_heading
    type: group
    label_cs: "Nastavení elektroměru v EMS/DŘ rozvaděči (pro měření předacího místa)"
    label_en: "Meter settings in the EMS/DŘ switchboard (for delivery-point metering)"
    help_cs: "Elektroměr je potřeba nastavit dle místních parametrů a připojených MTP/MTN."
    help_en: "The meter must be configured per local parameters and the connected MTP/MTN."
    images:
      - file: assets/02-mtp-setting-example.png
        caption_cs: "Příklad nastavení MTP"
        caption_en: "Example MTP setting (display screenshot)"
      - file: assets/02-parameter-overview-p01-p05.png
        caption_cs: "Přehled parametrů k nastavení (01-05 je na displeji zastoupen P01-P05)"
        caption_en: "Overview of parameters to set (01-05 is shown on the display as P01-P05)"

  - id: mtp_ratio_set
    label_cs: "nastavení převodového poměru MTP"
    label_en: "MTP transformation ratio configured"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: mtp_value
    label_cs: "hodnota MTP"
    label_en: "MTP ratio value"
    type: text

  - id: voltage_level_measured_set
    label_cs: "nastavena měřená napěťová hladina"
    label_en: "Measured voltage level configured"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: voltage_level_value
    label_cs: "hodnota napěťové hladiny"
    label_en: "Voltage level value"
    type: text

  - id: mtn_ratio_set
    label_cs: "nastaven převodový poměr MTN"
    label_en: "MTN transformation ratio configured"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "[FN5] Vyplňuje se pouze v případě, že elektroměr bude měřit na hladině VN."
    help_en: "[FN5] Fill in only if the meter measures at the VN (medium/high-voltage) level."

  - id: mtn_value
    label_cs: "hodnota MTN"
    label_en: "MTN ratio value"
    type: text
    conditional_on: {field: mtn_ratio_set, equals: true}

  - id: additional_meters_count
    label_cs: "Počet dalších instalovaných elektroměrů, např. pro měření FVE, podružné elměry"
    label_en: "Count of other installed meters, e.g. for PV metering, sub-meters"
    type: number
    help_cs: "Uveďte počet dále instalovaných elektroměrů, např. dílčí měření jednotlivých výrobních modulů."
    help_en: "State the number of additionally installed meters, e.g. sub-metering of individual generation modules."

  - id: additional_meters_table
    label_cs: "Informace k dalším instalovaných podružným elektroměrům"
    label_en: "Information on additional installed sub-meters"
    type: table
    repeatable: true
    suggested_rows: 4
    help_cs: "[FN6] Pokud je instalováno více elektroměrů, využijte pole pro poznámky."
    help_en: "[FN6] If more meters are installed than fit here, use the Notes field (§7)."
    columns:
      - id: jps_label
        label_cs: "Označení elektroměru dle JPS"
        label_en: "Meter designation per JPS"
        type: text
        help_cs: "Uveďte označení tak, jak je uvedeno v JPS."
        help_en: "Enter the designation exactly as it appears in the single-line diagram (JPS)."
      - id: meter_type
        label_cs: "Typ elektroměru"
        label_en: "Meter type"
        type: text
        help_cs: "Uveďte přesný typ elektroměru (celý název)."
        help_en: "State the exact meter type (full name)."
      - id: comm_method
        label_cs: "Způsob komunikace (Modbus RTU/TCP)"
        label_en: "Communication method (Modbus RTU/TCP)"
        type: select
        options:
          - {value: rtu, label_cs: "Modbus RTU", label_en: "Modbus RTU"}
          - {value: tcp, label_cs: "Modbus TCP", label_en: "Modbus TCP"}
        help_cs: "Modbus RTU využívá RS-485, Modbus TCP využívá datové sítě a elektroměr musí mít přidělenou IP adresu."
        help_en: "Modbus RTU uses RS-485; Modbus TCP uses the data network and the meter must have an assigned IP address."
      - id: ip_or_modbus_id
        label_cs: "IP adresa + Modbus ID nebo jen Modbus ID (RTU)"
        label_en: "IP address + Modbus ID, or just Modbus ID (RTU)"
        type: text
        help_cs: "Uveďte příslušnou nastavenou adresu: buď ID adresu (RTU), nebo IP adresu (TCP)."
        help_en: "Enter the configured address: either the ID address (RTU) or the IP address (TCP)."
      - id: mtp_ratio
        label_cs: "Převodový poměr MTP"
        label_en: "MTP transformation ratio"
        type: text
        help_cs: "Uveďte hodnotu MTP a potvrďte nastavení hodnoty v elektroměru."
        help_en: "State the MTP value and confirm it's configured in the meter."
      - id: terminal_block
        label_cs: "Svorkovnice X1 nebo X2"
        label_en: "Terminal block X1 or X2"
        type: text
        help_cs: "[FN7] Kam je v rámci rozvaděče EMS Full připojena Modbus RTU komunikace."
        help_en: "[FN7] Which terminal block within the EMS Full switchboard the Modbus RTU communication is wired to."

  - id: meters_notes
    label_cs: "Poznámky k elektroměrům"
    label_en: "Notes on meters"
    type: text
    multiline: true
    required: false
```
