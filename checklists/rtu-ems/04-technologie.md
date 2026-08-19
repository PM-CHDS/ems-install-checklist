# 4. Technologie

*(Technology — PV inverters, battery storage, meteo station, compensation)*

> **_notes**: the source has no Legend entry for "Je na všech připojených zařízeních
> povolena Modbus komunikace" nor for the three "Kompenzace" sub-items — no `help` is
> given for those below (not an omission on this file's part). Also: the checklist uses
> "Max./Min. SOC" wording for the battery fields while the matching Legend paragraphs
> talk about "kapacita" (capacity) — likely the Legend text wasn't updated when the
> checklist item was reworded from capacity-% to SOC-%; the help text below is kept as
> written in the source for faithfulness.

```yaml
fields:
  - id: inverters_connected_to_controllers
    label_cs: "Jsou všechny fotovoltaické střídače připojeny k řídícím jednotkám"
    label_en: "Are all PV inverters connected to the controller units"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Pokud se jedná o připojení pomocí Modbus TCP, je potřeba mít na střídačích nastaveny příslušné parametry sítě a ověřit např. pomocí příkazu \"ping\" viditelnost na řídící jednotku. V případě použití Modbus RTU ověřit, zda jsou všechny střídače připojeny k příslušné sběrnici RS-485."
    help_en: "For Modbus TCP, the inverters need the correct network parameters and visibility to the controller unit should be verified (e.g. via \"ping\"). For Modbus RTU, verify all inverters are connected to the correct RS-485 bus."

  - id: rs485_termination_resistors
    label_cs: "V případě připojení pomocí Modbus RTU (RS-485) jsou na koncích každé komunikační větve osazeny zakončovací odpory (120 Ω)"
    label_en: "For Modbus RTU (RS-485) connections, are 120 Ω termination resistors fitted at both ends of each communication branch"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Na sběrnici RS-485 je potřeba, aby poslední zařízení na konci větve mělo na svorkách RS-485 zakončovací odpor 120 Ω. Některá zařízení mají vnitřní terminaci (ověřte v dokumentaci výrobce); pokud ne, je nutné instalovat zakončovací odpor na svorky RS-485 A/B."
    help_en: "The last device at each end of an RS-485 bus needs a 120 Ω termination resistor across its RS-485 terminals. Some devices support internal termination (check manufacturer docs); if not, fit an external resistor across the RS-485 A/B terminals."

  - id: rs485_polarity_verified
    label_cs: "V případě Modbus RTU je ověřena polarita linky RS-485 (A, B, GND)"
    label_en: "For Modbus RTU, has RS-485 line polarity (A, B, GND) been verified"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "V rámci instalace je nutné prověřit správnost polarity linky RS-485. Záleží na výrobci, jak má svorky RS-485 řazeny za sebou, ne vždy je řazení A, B, GND. Pokud nebude dodržena polarita, komunikace nebude fungovat."
    help_en: "RS-485 line polarity must be verified during installation. Terminal ordering varies by manufacturer and isn't always A, B, GND. Communication will fail if polarity isn't correct."

  - id: inverters_connected_to_datalogger
    label_cs: "Jsou všechny střídače připojeny do Data loggeru"
    label_en: "Are all inverters connected to the Data Logger"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "[FN9] Vyplňte pouze v případě, že jsou střídače napojeny do Smart loggeru, Data Hubu nebo podobného zařízení. Kontrola, zda jsou k němu připojeny všechny střídače a komunikují s ním."
    help_en: "[FN9] Fill in only if the inverters are connected to a Smart Logger, Data Hub, or similar device. Check that all inverters are connected to it and communicating."

  - id: datalogger_connected_to_network
    label_cs: "Je Data logger připojen do datové sítě s viditelností na řídící jednotku"
    label_en: "Is the Data Logger connected to the data network with visibility to the controller unit"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Tyto typy zařízení komunikují pomocí Modbus TCP a je nutno jim nastavit správné parametry sítě a ověřit jejich viditelnost v síti."
    help_en: "These devices communicate via Modbus TCP; they need correct network parameters and verified network visibility."
    conditional_on: {field: inverters_connected_to_datalogger, equals: true}

  - id: modbus_enabled_on_devices
    label_cs: "Je na všech připojených zařízeních povolena Modbus komunikace"
    label_en: "Is Modbus communication enabled on all connected devices"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: datalogger_table
    label_cs: "Informace o Data loggeru"
    label_en: "Data Logger information"
    type: table
    repeatable: true
    suggested_rows: 2
    conditional_on: {field: inverters_connected_to_datalogger, equals: true}
    columns:
      - id: logger_type
        label_cs: "Typ Data loggeru"
        label_en: "Data Logger type"
        type: text
        help_cs: "Uveďte co nejpřesněji typové označení Data loggeru + přiložte foto štítku."
        help_en: "State the Data Logger model as precisely as possible + attach a nameplate photo."
      - id: total_inverter_power_kw
        label_cs: "Sumární výkon [kW] střídačů za loggerem"
        label_en: "Total inverter power [kW] behind the logger"
        type: number
        unit: kW
        help_cs: "Součet výkonů všech střídačů připojených do Data loggeru."
        help_en: "Sum of the power of all inverters connected to the Data Logger."
      - id: installed_pv_power_kwp
        label_cs: "Instalovaný PV výkon za loggerem [kWp]"
        label_en: "Installed PV power [kWp] behind the logger"
        type: number
        unit: kWp
        help_cs: "Celkový výkon instalovaných panelů pod loggerem."
        help_en: "Total power of the installed panels behind the logger."
      - id: ip_tcp_address_port
        label_cs: "IP TCP adresa + port"
        label_en: "IP TCP address + port"
        type: text
      - id: modbus_id
        label_cs: "Modbus ID"
        label_en: "Modbus ID"
        type: text
      - id: fw_version
        label_cs: "Verze FW"
        label_en: "Firmware version"
        type: text

  - id: inverters_info_table
    label_cs: "Informace o střídačích a jejich adresace (vyplňte, pokud není instalován DataLogger)"
    label_en: "Inverter information and addressing (fill in only if no Data Logger is installed)"
    type: table
    repeatable: true
    suggested_rows: 5
    conditional_on: {field: inverters_connected_to_datalogger, equals: false}
    help_cs: "[FN10] V případě přímé komunikace se střídači. Pokud je instalováno více střídačů, využijte pole pro poznámky."
    help_en: "[FN10] For direct communication with the inverters. If more inverters are installed than fit here, use the Notes field (§7)."
    columns:
      - id: jps_label
        label_cs: "Označení střídače dle JPS"
        label_en: "Inverter designation per JPS"
        type: text
        help_cs: "Jmenná příslušnost dle JPS."
        help_en: "Name per the single-line diagram (JPS)."
      - id: inverter_type
        label_cs: "Typ střídače"
        label_en: "Inverter type"
        type: text
        help_cs: "Uveďte co nejpřesněji typové označení střídače + přiložte foto štítku."
        help_en: "State the inverter model as precisely as possible + attach a nameplate photo."
      - id: inverter_power_kw
        label_cs: "Výkon střídače [kW]"
        label_en: "Inverter power [kW]"
        type: number
        unit: kW
        help_cs: "Uveďte maximální výkon střídače."
        help_en: "State the inverter's maximum power."
      - id: installed_pv_power_kwp
        label_cs: "Instalovaný FV výkon za střídačem [kWp]"
        label_en: "Installed PV power [kWp] behind the inverter"
        type: number
        unit: kWp
        help_cs: "Celkový výkon instalovaných panelů za střídačem."
        help_en: "Total power of the installed panels behind the inverter."
      - id: modbus_rtu_or_ip_address
        label_cs: "Modbus RTU adresa / IP TCP adresa + port"
        label_en: "Modbus RTU address / IP TCP address + port"
        type: text
        help_cs: "Pokud je střídač připojen na Modbus RTU, uveďte ID adresu. Pokud na Modbus TCP, uveďte IP adresu."
        help_en: "If the inverter uses Modbus RTU, state the ID address. If Modbus TCP, state the IP address."
      - id: modbus_id
        label_cs: "Modbus ID"
        label_en: "Modbus ID"
        type: text
      - id: master_slave
        label_cs: "Master (M) / Slave (S) / 0"
        label_en: "Master (M) / Slave (S) / 0"
        type: text
        help_cs: "[FN11] Vyplňte pouze pokud se se střídači komunikuje pomocí RS-485 a střídače jsou v režimu Master/Slave; pokud se komunikuje přímo, uveďte 0."
        help_en: "[FN11] Fill in only if the inverters communicate via RS-485 in Master/Slave mode; if communicating directly, enter 0."

  - id: battery_components_connected
    label_cs: "Jsou všechny prvky bateriového úložiště (střídače, BMS, atd.) připojeny k řídícím jednotkám"
    label_en: "Are all battery-storage components (inverters, BMS, etc.) connected to the controller units"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Kontrola, zda jsou všechny bateriové technologie připojeny do stejné datové sítě jako řídící jednotky a je ověřena jejich viditelnost, např. pomocí příkazu ping na IP adresu hlavní řídící jednotky."
    help_en: "Check that all battery-storage technology is on the same data network as the controller units, with verified visibility, e.g. via ping to the main controller unit's IP address."

  - id: battery_info_heading
    type: group
    label_cs: "Informace o bateriovém uložišti a adresace komponent"
    label_en: "Battery storage information and component addressing"

  - id: battery_type
    label_cs: "Typ bateriového uložiště"
    label_en: "Battery storage type"
    type: text
    photo: true
    help_cs: "Uveďte typ bateriového uložiště co nejpřesněji + doplňte fotografií štítku. Pokud je BÚ složeno z více komponent, rozepište níže do tabulky a pořiďte foto z každé komponenty."
    help_en: "State the battery storage type as precisely as possible + attach a nameplate photo. If the storage consists of multiple components, list them in the table below with a photo of each."

  - id: battery_max_soc
    label_cs: "Max. SOC pro nabíjení"
    label_en: "Max. SOC for charging"
    type: number
    unit: "%"
    help_cs: "Legenda (psáno pro starší verzi pojmenování, \"kapacita\"): jedná se o provozní maximální kapacitu, která většinou odpovídá 90–95 % celkové kapacity. Nad tuto hranici se nesmí baterie nabít."
    help_en: "Legend text (written for an older \"capacity\" naming): the operational maximum, usually 90-95% of total capacity. The battery must not be charged above this."

  - id: battery_min_soc
    label_cs: "Min. SOC pro vybíjení"
    label_en: "Min. SOC for discharging"
    type: number
    unit: "%"
    help_cs: "Legenda (psáno pro starší verzi pojmenování, \"kapacita\"): jedná se o provozní minimální kapacitu, která většinou odpovídá 5–12 % celkové kapacity. Pod tuto hranici se nesmí baterie vybít."
    help_en: "Legend text (written for an older \"capacity\" naming): the operational minimum, usually 5-12% of total capacity. The battery must not be discharged below this."

  - id: battery_components_table
    label_cs: "Doplňující informace k bateriovému úložišti"
    label_en: "Additional battery-storage information"
    type: table
    repeatable: true
    suggested_rows: 4
    columns:
      - id: component
        label_cs: "Komponenta BU (INV, BMS, MBMS)"
        label_en: "Storage component (INV, BMS, MBMS)"
        type: text
        help_cs: "Jedná se o střídač, BMS, nebo jinou část BÚ; uveďte přesné typové označení + foto výrobního štítku."
        help_en: "The inverter, BMS, or other storage part; state the exact model + nameplate photo."
      - id: capacity_kwh
        label_cs: "Kapacita BU [kWh]"
        label_en: "Storage capacity [kWh]"
        type: number
        unit: kWh
      - id: inverter_max_power_kw
        label_cs: "Max. výkon střídače [kW]"
        label_en: "Inverter max. power [kW]"
        type: number
        unit: kW
        help_cs: "Jedná se o bateriový střídač; uveďte jeho maximální výkon."
        help_en: "The battery inverter's maximum power."
      - id: modbus_rtu_or_ip_address
        label_cs: "Modbus RTU adresa / IP TCP adresa + Modbus ID"
        label_en: "Modbus RTU address / IP TCP address + Modbus ID"
        type: text
        help_cs: "Pokud je komponenta připojena na Modbus RTU, uveďte ID adresu. Pokud na Modbus TCP, uveďte IP adresu."
        help_en: "If the component uses Modbus RTU, state the ID address. If Modbus TCP, state the IP address."
      - id: mbms_order
        label_cs: "Pořadí uložiště v případě použité MBMS"
        label_en: "Storage order (if MBMS is used)"
        type: text

  - id: battery_notes
    label_cs: "Poznámky k BU"
    label_en: "Notes on battery storage"
    type: text
    multiline: true
    required: false

  - id: meteo_station_installed
    label_cs: "Je instalována METEO stanice"
    label_en: "Is a METEO station installed"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Potvrzení, že METEO stanice byla instalována a připojena na datovou síť. Instaluje se na vyvýšené místo (např. střecha); datový kabel musí disponovat napájením (PoE)."
    help_en: "Confirms the METEO station was installed and connected to the data network. Installed at an elevated location (e.g. roof); the data cable must supply power (PoE)."

  - id: meteo_station_correct_subnet
    label_cs: "Má METEO nastavenou IP adresu ve stejné sub-síti jako řídící jednotky"
    label_en: "Is the METEO station's IP address on the same subnet as the controller units"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    conditional_on: {field: meteo_station_installed, equals: true}
    help_cs: "Nutno nastavit IP adresu dle parametrů LAN sítě, ve které se nacházejí ostatní prvky. Návod: https://support.icool4.cz/a/solutions/articles/47001256155"
    help_en: "The IP address must match the LAN the other components are on. Guide: https://support.icool4.cz/a/solutions/articles/47001256155"

  - id: meteo_station_ip
    label_cs: "IP adresa METEO stanice"
    label_en: "METEO station IP address"
    type: text
    conditional_on: {field: meteo_station_installed, equals: true}
    help_cs: "Uveďte IP adresu, která byla nastavena do METEO stanice."
    help_en: "State the IP address configured on the METEO station."

  - id: compensation_heading
    type: group
    label_cs: "Kompenzace"
    label_en: "Compensation (reactive power)"

  - id: compensation_installed
    label_cs: "je instalováno kompenzace"
    label_en: "Is compensation installed"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: compensation_affects_fve_control
    label_cs: "bude ovlivňovat řízení fve a povely z DŘ"
    label_en: "Will it affect PV control and dispatching-control (DSO RTU) commands"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    conditional_on: {field: compensation_installed, equals: true}

  - id: compensation_blocking_enabled
    label_cs: "je umožněno její blokování blokovacím kontaktem"
    label_en: "Can it be blocked via a blocking contact"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    conditional_on: {field: compensation_installed, equals: true}
```
