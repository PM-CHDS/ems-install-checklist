# 4. Technologie

*(Technology — PV inverters, battery storage, meteo station, compensation)*

> **_notes**: source is `checklist-ems-full.pdf` §1.4–1.6 with help text from
> `checklist-ems-full-navod.pdf`. The guide has no entries for the three "Kompenzace"
> sub-items, only a one-line note on the heading.

```yaml
fields:
  - id: pv_heading
    type: group
    label_cs: "Fotovoltaika (FVE)"
    label_en: "Photovoltaics (PV)"

  - id: pv_present
    label_cs: "Je součástí projektu fotovoltaika (FVE)?"
    label_en: "Is photovoltaics (PV) part of the project?"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Pokud NE, otázky ke střídačům FVE se nezobrazí a nevyplňují se."
    help_en: "If No, the PV inverter questions are not shown and need not be filled in."

  - id: pv_control_method
    label_cs: "Ovládání střídačů FVE"
    label_en: "How the PV inverters are controlled"
    type: select
    conditional_on: {field: pv_present, equals: true}
    options:
      - {value: modbus, label_cs: "Přímé přes Modbus", label_en: "Directly via Modbus"}
      - {value: logger, label_cs: "Přes Logger (Smart Logger, Data Hub apod.)", label_en: "Via a Logger (Smart Logger, Data Hub, etc.)"}

  - id: logger_heading
    type: group
    label_cs: "Střídače připojené přes Logger"
    label_en: "Inverters connected via a Logger"
    conditional_on: {field: pv_control_method, equals: logger}

  - id: datalogger_connected_to_network
    label_cs: "Připojení do datové sítě s viditelností na EMS/DŘ"
    label_en: "Connected to the data network with visibility to the EMS/DSO RTU"
    type: boolean
    blocking: true
    conditional_on: {field: pv_control_method, equals: logger}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Tyto typy zařízení komunikují pomocí Modbus TCP a je nutno jim nastavit správné parametry sítě a ověřit jejich viditelnost v síti."
    help_en: "These devices communicate via Modbus TCP; they need correct network parameters and verified network visibility."

  - id: logger_control_enabled
    label_cs: "Povoleno řízení loggeru nadřazeným systémem"
    label_en: "Control of the logger by the parent system is enabled"
    type: boolean
    blocking: true
    conditional_on: {field: pv_control_method, equals: logger}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Loggery často vyžadují aktivaci povolení řízení tohoto zařízení nadřazeným systémem nebo 3. stranou."
    help_en: "Loggers often need control by a parent system or third party to be explicitly enabled."

  - id: inverters_connected_to_datalogger
    label_cs: "Připojení všech řízených střídačů"
    label_en: "All controlled inverters connected"
    type: boolean
    blocking: true
    conditional_on: {field: pv_control_method, equals: logger}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Kontrola, zda jsou k Smart loggeru, Data Hubu apod. připojeny všechny střídače a komunikují s ním."
    help_en: "Check that every inverter is connected to the Smart Logger, Data Hub, etc. and communicating with it."

  - id: datalogger_table
    label_cs: "Informace o Data loggeru"
    label_en: "Data Logger information"
    type: table
    repeatable: true
    suggested_rows: 2
    conditional_on: {field: pv_control_method, equals: logger}
    columns:
      - id: logger_type
        label_cs: "Typ loggeru"
        label_en: "Logger type"
        type: text
        help_cs: "Uveďte co nejpřesněji typové označení Data loggeru + přiložte foto štítku."
        help_en: "State the Data Logger model as precisely as possible + attach a nameplate photo."
      - id: total_inverter_power_kw
        label_cs: "Sumární výkon střídačů [kW]"
        label_en: "Total inverter power [kW]"
        type: number
        unit: kW
        help_cs: "Součet výkonů všech střídačů připojených do Data loggeru."
        help_en: "Sum of the power of all inverters connected to the Data Logger."
      - id: installed_pv_power_kwp
        label_cs: "Výkon FVE [kWp]"
        label_en: "PV power [kWp]"
        type: number
        unit: kWp
        help_cs: "Celkový výkon instalovaných panelů pod loggerem."
        help_en: "Total power of the installed panels behind the logger."
      - id: ip_tcp_address_port
        label_cs: "IP adresa + port"
        label_en: "IP address + port"
        type: text
        help_cs: "IP adresa v rámci sítě včetně portu, na kterém běží na daném zařízení Modbus server."
        help_en: "The device's IP address on the network, including the port its Modbus server listens on."
      - id: modbus_id
        label_cs: "Modbus ID"
        label_en: "Modbus ID"
        type: text
        help_cs: "ID zařízení v rámci Modbus sběrnice."
        help_en: "The device's ID on the Modbus bus."
      - id: fw_version
        label_cs: "Verze firmware"
        label_en: "Firmware version"
        type: text

  - id: pv_modbus_protocol
    label_cs: "Připojení střídačů přes Modbus"
    label_en: "Modbus connection of the inverters"
    type: select
    conditional_on: {field: pv_control_method, equals: modbus}
    options:
      - {value: tcp, label_cs: "Modbus TCP", label_en: "Modbus TCP"}
      - {value: rtu, label_cs: "Modbus RTU (RS-485)", label_en: "Modbus RTU (RS-485)"}

  - id: modbus_rtu_heading
    type: group
    label_cs: "Střídače připojené přes Modbus RTU"
    label_en: "Inverters connected via Modbus RTU"
    conditional_on: {field: pv_modbus_protocol, equals: rtu}

  - id: rs485_termination_resistors
    label_cs: "Osazení zakončovacích odporů 120 Ω na koncích každé komunikační linky"
    label_en: "120 Ω termination resistors fitted at the ends of every communication line"
    type: boolean
    blocking: true
    conditional_on: {field: pv_modbus_protocol, equals: rtu}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Na sběrnici RS-485 je potřeba, aby poslední zařízení na konci větve mělo na svorkách RS-485 zakončovací odpor 120 Ω. Některá zařízení mají vnitřní terminaci (ověřte v dokumentaci výrobce); pokud ne, je nutné instalovat zakončovací odpor na svorky RS-485 A/B."
    help_en: "The last device at each end of an RS-485 bus needs a 120 Ω termination resistor across its RS-485 terminals. Some devices support internal termination (check manufacturer docs); if not, fit an external resistor across the RS-485 A/B terminals."

  - id: rs485_polarity_verified
    label_cs: "Ověření polarity linek RS-485 (A, B, GND)"
    label_en: "RS-485 line polarity (A, B, GND) verified"
    type: boolean
    blocking: true
    conditional_on: {field: pv_modbus_protocol, equals: rtu}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "V rámci instalace je nutné prověřit správnost polarity linky RS-485. Záleží na výrobci, jak má svorky RS-485 řazeny za sebou, ne vždy je řazení A, B, GND. Pokud nebude dodržena polarita, komunikace nebude fungovat."
    help_en: "RS-485 line polarity must be verified during installation. Terminal ordering varies by manufacturer and isn't always A, B, GND. Communication will fail if polarity isn't correct."

  - id: modbus_tcp_heading
    type: group
    label_cs: "Střídače připojené přes Modbus TCP"
    label_en: "Inverters connected via Modbus TCP"
    conditional_on: {field: pv_modbus_protocol, equals: tcp}

  - id: inverters_tcp_network_visibility
    label_cs: "Připojení do datové sítě s viditelností na EMS/DŘ"
    label_en: "Connected to the data network with visibility to the EMS/DSO RTU"
    type: boolean
    blocking: true
    conditional_on: {field: pv_modbus_protocol, equals: tcp}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Střídače komunikují pomocí Modbus TCP a je nutno jim nastavit správné parametry sítě a ověřit jejich viditelnost v síti, např. příkazem \"ping\" na řídící jednotku."
    help_en: "The inverters communicate via Modbus TCP; they need correct network parameters and verified visibility, e.g. by pinging the controller unit."

  - id: modbus_enabled_on_devices
    label_cs: "Povoleno ovládání střídačů přes Modbus"
    label_en: "Inverter control via Modbus enabled"
    type: boolean
    blocking: true
    conditional_on: {field: pv_control_method, equals: modbus}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Střídače často vyžadují aktivaci povolení řízení tohoto zařízení nadřazeným systémem nebo 3. stranou."
    help_en: "Inverters often need control by a parent system or third party to be explicitly enabled."

  - id: inverters_connected_to_controllers
    label_cs: "Připojení všech řízených střídačů"
    label_en: "All controlled inverters connected"
    type: boolean
    blocking: true
    conditional_on: {field: pv_control_method, equals: modbus}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "U Modbus RTU ověřte, zda jsou všechny střídače připojeny k příslušné sběrnici RS-485. U Modbus TCP mějte na střídačích nastaveny příslušné parametry sítě a ověřte např. příkazem \"ping\" viditelnost na řídící jednotku."
    help_en: "For Modbus RTU, verify every inverter is on the correct RS-485 bus. For Modbus TCP, the inverters need the correct network parameters and visibility to the controller unit, verified e.g. by \"ping\"."

  - id: inverters_rtu_table
    label_cs: "Střídače připojené přes Modbus RTU"
    label_en: "Inverters connected via Modbus RTU"
    type: table
    repeatable: true
    suggested_rows: 4
    conditional_on: {field: pv_modbus_protocol, equals: rtu}
    columns:
      - id: jps_label
        label_cs: "Značení dle JPS"
        label_en: "Designation per JPS"
        type: text
      - id: inverter_type
        label_cs: "Výrobce a typ"
        label_en: "Manufacturer and type"
        type: text
        help_cs: "Uveďte co nejpřesněji typové označení střídače + přiložte foto štítku."
        help_en: "State the inverter model as precisely as possible + attach a nameplate photo."
      - id: inverter_power_kw
        label_cs: "Výkon [kW]"
        label_en: "Power [kW]"
        type: number
        unit: kW
      - id: installed_pv_power_kwp
        label_cs: "Výkon FVE [kWp]"
        label_en: "PV power [kWp]"
        type: number
        unit: kWp
      - id: modbus_id
        label_cs: "Modbus ID"
        label_en: "Modbus ID"
        type: text
      - id: baud_rate
        label_cs: "Rychlost linky [bps]"
        label_en: "Line speed [bps]"
        type: number
        unit: bps

  - id: inverters_tcp_table
    label_cs: "Střídače připojené přes Modbus TCP"
    label_en: "Inverters connected via Modbus TCP"
    type: table
    repeatable: true
    suggested_rows: 4
    conditional_on: {field: pv_modbus_protocol, equals: tcp}
    columns:
      - id: jps_label
        label_cs: "Značení dle JPS"
        label_en: "Designation per JPS"
        type: text
      - id: inverter_type
        label_cs: "Výrobce a typ"
        label_en: "Manufacturer and type"
        type: text
        help_cs: "Uveďte co nejpřesněji typové označení střídače + přiložte foto štítku."
        help_en: "State the inverter model as precisely as possible + attach a nameplate photo."
      - id: inverter_power_kw
        label_cs: "Výkon [kW]"
        label_en: "Power [kW]"
        type: number
        unit: kW
      - id: installed_pv_power_kwp
        label_cs: "Výkon FVE [kWp]"
        label_en: "PV power [kWp]"
        type: number
        unit: kWp
      - id: ip_tcp_address_port
        label_cs: "IP adresa + port"
        label_en: "IP address + port"
        type: text
      - id: modbus_id
        label_cs: "Modbus ID"
        label_en: "Modbus ID"
        type: text

  - id: bess_heading
    type: group
    label_cs: "Bateriové úložiště (BESS)"
    label_en: "Battery storage (BESS)"

  - id: bess_present
    label_cs: "Je součástí projektu bateriové úložiště (BESS)?"
    label_en: "Is battery storage (BESS) part of the project?"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Pokud NE, otázky k bateriovému úložišti se nezobrazí a nevyplňují se — ani nastavení baterie v §5."
    help_en: "If No, the battery-storage questions are not shown and need not be filled in — nor the battery settings in §5."

  - id: battery_components_connected
    label_cs: "Jsou všechny prvky bateriového úložiště (střídače, BMS, atd.) připojeny k řídícím jednotkám"
    label_en: "Are all battery-storage components (inverters, BMS, etc.) connected to the controller units"
    type: boolean
    conditional_on: {field: bess_present, equals: true}
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Kontrola, zda jsou všechny bateriové technologie připojeny do stejné datové sítě jako řídící jednotky a je ověřena jejich viditelnost, např. pomocí příkazu ping na IP adresu hlavní řídící jednotky."
    help_en: "Check that all battery-storage technology is on the same data network as the controller units, with verified visibility, e.g. via ping to the main controller unit's IP address."

  - id: battery_info_heading
    type: group
    conditional_on: {field: bess_present, equals: true}
    label_cs: "Informace o bateriovém uložišti a adresace komponent"
    label_en: "Battery storage information and component addressing"

  - id: battery_type
    label_cs: "Typ / model bateriového úložiště"
    label_en: "Battery storage type / model"
    type: text
    conditional_on: {field: bess_present, equals: true}
    photo: true
    help_cs: "Uveďte typ bateriového uložiště co nejpřesněji + doplňte fotografií štítku. Pokud je BÚ složeno z více komponent, rozepište níže do tabulky a pořiďte foto z každé komponenty."
    help_en: "State the battery storage type as precisely as possible + attach a nameplate photo. If the storage consists of multiple components, list them in the table below with a photo of each."

  - id: battery_capacity_kwh
    label_cs: "Kapacita úložiště"
    label_en: "Storage capacity"
    type: number
    conditional_on: {field: bess_present, equals: true}
    unit: kWh
    help_cs: "Celková kapacita úložiště udávaná výrobcem."
    help_en: "The storage's total capacity as stated by the manufacturer."

  - id: battery_max_soc
    label_cs: "Max. SoC pro nabíjení"
    label_en: "Max. SoC for charging"
    type: number
    conditional_on: {field: bess_present, equals: true}
    unit: "%"
    help_cs: "Jedná se o provozní maximální kapacitu, která většinou odpovídá 90–95 % celkové kapacity. Nad tuto hranici se nesmí baterie nabít."
    help_en: "The operational maximum, usually 90–95 % of total capacity. The battery must not be charged above this."

  - id: battery_min_soc
    label_cs: "Min. SoC pro vybíjení"
    label_en: "Min. SoC for discharging"
    type: number
    conditional_on: {field: bess_present, equals: true}
    unit: "%"
    help_cs: "Jedná se o provozní minimální kapacitu, která většinou odpovídá 5–12 % celkové kapacity. Pod tuto hranici se nesmí baterie vybít."
    help_en: "The operational minimum, usually 5–12 % of total capacity. The battery must not be discharged below this."

  - id: battery_components_table
    label_cs: "Doplňující informace k bateriovému úložišti"
    label_en: "Additional battery-storage information"
    type: table
    conditional_on: {field: bess_present, equals: true}
    repeatable: true
    suggested_rows: 4
    columns:
      - id: component
        label_cs: "Komponenta INV / BMS / MBMS"
        label_en: "Component INV / BMS / MBMS"
        type: text
        help_cs: "Jedná se o střídač, BMS, master BMS nebo jinou část BÚ; uveďte přesné typové označení + foto výrobního štítku."
        help_en: "The inverter, BMS, master BMS or other storage part; state the exact model + nameplate photo."
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
        label_cs: "Modbus ID / IP adresa :: ID"
        label_en: "Modbus ID / IP address :: ID"
        type: text
        help_cs: "Pokud je komponenta připojena na Modbus RTU, uveďte ID adresu. Pokud na Modbus TCP, uveďte IP adresu a ID."
        help_en: "If the component uses Modbus RTU, state the ID address. If Modbus TCP, state the IP address and ID."
      - id: mbms_order
        label_cs: "ID úložiště (v případě MBMS)"
        label_en: "Storage ID (if an MBMS is used)"
        type: text
        help_cs: "Bateriové úložiště může být připojené přímo, nebo začleněné do clusteru pod BMS — v takovém případě je identifikováno pomocí ID úložiště v rámci clusteru."
        help_en: "A battery can be connected directly or as part of a cluster under a BMS — in that case it is identified by its storage ID within the cluster."

  - id: battery_notes
    label_cs: "Poznámky k bateriím"
    label_en: "Notes on battery storage"
    type: text
    conditional_on: {field: bess_present, equals: true}
    multiline: true
    required: false

  - id: meteo_station_installed
    label_cs: "Je instalována METEO stanice"
    label_en: "Is a METEO station installed"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Instaluje se na vyvýšené místo (např. střecha) a připojuje na datovou síť; datový kabel musí disponovat napájením (PoE)."
    help_en: "Installed at an elevated location (e.g. roof) and connected to the data network; the data cable must supply power (PoE)."

  - id: meteo_station_irradiance_placement
    label_cs: "METEO stanice nainstalována s ohledem na měření osvitu elektrárny"
    label_en: "METEO station installed so that it measures the plant's irradiance"
    type: boolean
    blocking: true
    conditional_on: {field: meteo_station_installed, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Hodnoty z měření METEO stanice se předávají na dispečink. Je proto nutné, aby odpovídaly skutečnému osvitu, rychlosti větru, atp."
    help_en: "The METEO station's readings are passed on to the dispatch centre, so they must reflect the actual irradiance, wind speed, etc."

  - id: meteo_station_correct_subnet
    label_cs: "IP adresa METEO stanice je ve stejné síti jako EMS/DŘ (vzájemně dostupné přes PING)"
    label_en: "The METEO station's IP address is on the same network as the EMS/DSO RTU (reachable by PING)"
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
    help_cs: "Kompenzace a její ovládání bývá řešeno obvykle pouze tehdy, je-li to podmínka distributora nebo zákazníka."
    help_en: "Compensation and its control are usually only dealt with when the DSO or the customer requires it."

  - id: compensation_installed
    label_cs: "Instalována kompenzace?"
    label_en: "Is compensation installed"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: compensation_affects_fve_control
    label_cs: "Bude ovlivňovat řízení FVE a povely z DŘ?"
    label_en: "Will it affect PV control and dispatching-control (DSO RTU) commands"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    conditional_on: {field: compensation_installed, equals: true}

  - id: compensation_blocking_enabled
    label_cs: "Umožňuje kompenzace blokování pomocí kontaktu?"
    label_en: "Can it be blocked via a blocking contact"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    conditional_on: {field: compensation_installed, equals: true}
```
