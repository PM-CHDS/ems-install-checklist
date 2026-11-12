# 5. Nastavení systému

*(System settings)*

> Pro potřeby nastavení EMS/DŘ je potřeba vyplnit několik základních parametrů samotné
> služby "řízení energií", obsluhovaných "zařízení" (střídač, bateriové úložiště) a
> řízených "spotřebičů". Na základě uvedených hodnot bude nastaven a předán řídící systém
> EMS. Některé hodnoty jsou potřeba i pro DŘ — tam, kde je uvedeno EMS/DŘ, vyplňte i v
> případě, kdy máte objednáno pouze dispečerské řízení.
>
> *(A handful of core parameters are needed to configure the EMS / dispatching control
> (DSO RTU) "energy management" service, the "devices" it operates (inverter, battery
> storage) and the "loads" it controls. The EMS control system is configured and handed
> over based on these values. Some values are needed for dispatching control (DSO RTU)
> too — where a field says EMS/DSO RTU, fill it in even if only dispatching control was
> ordered.)*

> **_notes**: source is `checklist-ems-full.pdf` §2 with help text from
> `checklist-ems-full-navod.pdf`. The source labels regulation stages 2–5 all as
> "vypnutí zařízení 1" with only a max. power value; here each stage is a yes/no that
> unfolds its max. power, labelled without the device number.

```yaml
fields:
  - id: om_parameters_heading
    type: group
    label_cs: "Parametry OM (EMS/DŘ)"
    label_en: "Point of connection (POC) parameters (EMS/DSO RTU)"

  - id: main_breaker_current
    label_cs: "jmenovitá hodnota proudu hlavního jističe (IN)"
    label_en: "Rated current of the main breaker (IN)"
    type: number
    unit: A
    help_cs: "Uveďte hodnotu hlavního jističe na předacím místě mezi odběrným místem a distribuční soustavou."
    help_en: "State the main breaker rating at the delivery point between the offtake point and the distribution grid."

  - id: main_breaker_current_vn_equivalent
    label_cs: "v případě VN přepočtěte na ekvivalent (IN-VN)"
    label_en: "If VN (medium/high voltage), convert to the equivalent (IN-VN)"
    type: number
    unit: A
    required: false
    help_cs: "Vyplňte pouze pokud je odběrné místo na hladině VN."
    help_en: "Fill in only if the offtake point is at the VN (medium/high-voltage) level."

  - id: reserved_capacity_sop
    label_cs: "hodnota rezervovaného příkonu dle SoP"
    label_en: "Reserved input capacity(grid import) per the connection agreement (CA)"
    type: number
    unit: kW
    help_cs: "Uveďte hodnotu rezervovaného příkonu z aktuální SoP."
    help_en: "State the reserved-capacity(grid import) value from the current connection agreement (CA)."

  - id: reserved_power_plant_capacity_sop
    label_cs: "hodnota rezervovaného výkonu výrobny dle SoP"
    label_en: "Reserved generation-plant output(grid export) per the connection agreement (CA)"
    type: number
    unit: kW
    help_cs: "Uveďte hodnotu rezervovaného výkonu z aktuální SoP — jedná se o povolené přetoky do distribuční sítě."
    help_en: "State the reserved output(grid export) from the current connection agreement — this is the permitted feed-in to the distribution network."

  - id: total_installed_power_sop
    label_cs: "celkový instalovaný výkon dle SoP"
    label_en: "Total installed power per the connection agreement (SoP)"
    type: number
    unit: kWp
    help_cs: "Uveďte hodnotu celkového instalovaného výkonu z aktuální SoP."
    help_en: "State the total installed power from the current connection agreement (SoP)."

  - id: test_operation_overflow_allowed
    label_cs: "povolení přetoků do sítě během zkušebního provozu (UPOS)"
    label_en: "Grid feed-in permitted during test operation"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "V případě, že na odběrném místě je již z minulosti instalovaný zdroj, je možné, že dle původní SoP jsou povoleny přetoky."
    help_en: "If the offtake point already has a previously installed source, feed-in may already be permitted under the original connection agreement."

  - id: allowed_overflow_value
    label_cs: "hodnota povoleného přetoku"
    label_en: "Permitted feed-in value"
    type: number
    unit: kW
    conditional_on: {field: test_operation_overflow_allowed, equals: true}
    help_cs: "Uveďte hodnotu povoleného přetoku."
    help_en: "State the permitted feed-in value."

  - id: quarter_hour_max_heading
    type: group
    label_cs: "Parametry rezervované kapacity ¼h maxima"
    label_en: "¼-hour maximum reserved-capacity parameters"

  - id: quarter_hour_max_control
    label_cs: "Je součástí projektu řízení ¼h maxima?"
    label_en: "Is ¼-hour maximum control part of the project?"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Pokud NE, parametry ¼h maxima, popis pulsů a regulační stupně se nezobrazí a nevyplňují se."
    help_en: "If No, the ¼-hour maximum parameters, pulse description and regulation stages are not shown and need not be filled in."

  - id: reserved_capacity_quarter_hour_max
    label_cs: "Rezervovaná kapacita ¼h maximum"
    label_en: "Reserved capacity (¼-hour maximum)"
    type: number
    conditional_on: {field: quarter_hour_max_control, equals: true}
    unit: kW
    help_cs: "V případě, že má odběrné místo sjednáno ¼hodinové maximum, uveďte nasmlouvanou hodnotu s dodavatelem elektřiny."
    help_en: "If the offtake point has a contracted ¼-hour maximum, state the value agreed with the electricity supplier."

  - id: opto_isolator_installed_billing_meter
    label_cs: "instalován a připojen galvanický optooddělovač pro sběr pulsů k fakturačnímu elektroměru"
    label_en: "Galvanic opto-isolator installed and connected for pulse collection at the billing meter"
    type: boolean
    conditional_on: {field: quarter_hour_max_control, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Zařízení je instalováno co nejblíže fakturačního elektroměru. Jeho připojení k fakturačnímu elektroměru zajišťuje PDS (provozovatel distribuční soustavy) a řídí se místními připojovacími podmínkami."
    help_en: "The device is installed as close as possible to the billing meter. Its connection to the billing meter is done by the DSO (distribution system operator) per local connection conditions."

  - id: opto_isolator_connected_switchboard
    label_cs: "připojen galvanický optooddělovač k rozvaděči 1/4h maxima"
    label_en: "Opto-isolator connected to the ¼h-maximum switchboard"
    type: boolean
    conditional_on: {field: quarter_hour_max_control, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Pro správnou funkčnost je nutné zajistit propojení mezi optooddělovačem a rozvaděčem ¼hodinového maxima. Impulsy se připojují na vstupy prvku C-AM-0006I."
    help_en: "For correct operation, the opto-isolator must be wired to the ¼-hour-maximum switchboard. Pulses connect to the inputs of the C-AM-0006I element."

  - id: quarter_hour_switchboard_connected_ems
    label_cs: "připojen rozvaděč ¼ hod. maxima k EMS/DŘ rozvaděči"
    label_en: "¼-hour-maximum switchboard connected to the EMS/DSO RTU switchboard"
    type: boolean
    conditional_on: {field: quarter_hour_max_control, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Jedná se o komunikační připojení k EMS/DŘ rozvaděči pomocí CIB sběrnice, případně pomocí datové sítě."
    help_en: "This is the communication link to the EMS/DSO RTU switchboard, via the CIB bus or the data network."

  - id: cib_address_ak_puls
    label_cs: "CIB adresa prvku AK.PULS (C-AM-0006I)"
    label_en: "CIB address of the AK.PULS element (C-AM-0006I)"
    type: text
    conditional_on: {field: quarter_hour_max_control, equals: true}
    required: false
    photo: true
    help_cs: "Pokud se jedná o variantu s CIB propojením, je potřeba uvést CIB adresu prvku, kterou naleznete na samotném prvku."
    help_en: "For the CIB-linked variant, state the element's CIB address, found on the element itself."
    images:
      - file: assets/05-ak-puls-cib-address-label.png
        caption_cs: "Umístění CIB adresy (HW ADDRESS) na prvku AK.PULS"
        caption_en: "Location of the CIB address (HW ADDRESS) on the AK.PULS element"

  - id: pulse_description_heading
    type: group
    conditional_on: {field: quarter_hour_max_control, equals: true}
    label_cs: "popis pulsů"
    label_en: "Pulse description"
    help_cs: "Uveďte, jaký typ pulsu byl připojen kam. Musí odpovídat výstupu z fakturačního elektroměru přes vstup do optooddělovače a následně jeho výstup. Většinou se připojuje synchronizační puls, A+, A-, případně jalový výkon."
    help_en: "State which pulse type was connected where. It must correspond to the billing meter's output, through the opto-isolator's input and then its output. Usually a sync pulse, A+, A-, or reactive-power pulse is connected."

  - id: imp1
    label_cs: "imp1 (AK.PULS/AI1)"
    label_en: "imp1 (AK.PULS/AI1)"
    type: text
    conditional_on: {field: quarter_hour_max_control, equals: true}

  - id: imp2
    label_cs: "imp2 (AK.PULS/AI2)"
    label_en: "imp2 (AK.PULS/AI2)"
    type: text
    conditional_on: {field: quarter_hour_max_control, equals: true}

  - id: imp3
    label_cs: "imp3 (AK.PULS/AI3)"
    label_en: "imp3 (AK.PULS/AI3)"
    type: text
    required: false
    conditional_on: {field: quarter_hour_max_control, equals: true}

  - id: regulation_stages_heading
    type: group
    conditional_on: {field: quarter_hour_max_control, equals: true}
    label_cs: "regulační stupně"
    label_en: "Regulation stages"
    help_cs: "Jedná se o definování technologií a pořadí, v jakém se mají odpojovat či připojovat. Ovládání technologií může vyvolat dodatečné požadavky na HW a elektroinstalační práce."
    help_en: "Defines the devices and the order in which they should be disconnected or reconnected. Controlling these devices may require additional hardware and electrical-installation work."

  - id: stage1_battery_compensation
    label_cs: "Stupeň 1 – kompenzace baterií"
    label_en: "Stage 1 – battery compensation"
    type: boolean
    conditional_on:
      - {field: quarter_hour_max_control, equals: true}
      - {field: bess_present, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: stage2_device1_shutdown
    label_cs: "Stupeň 2 – vypnutí zařízení"
    label_en: "Stage 2 – device shutdown"
    type: boolean
    conditional_on: {field: quarter_hour_max_control, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: stage2_device1_max_power
    label_cs: "max. příkon (Stupeň 2)"
    label_en: "Max. power draw (Stage 2)"
    type: number
    unit: kW
    conditional_on: {field: stage2_device1_shutdown, equals: true}

  - id: stage3_device2_shutdown
    label_cs: "Stupeň 3 – vypnutí zařízení"
    label_en: "Stage 3 – device shutdown"
    type: boolean
    conditional_on: {field: quarter_hour_max_control, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: stage3_device2_max_power
    label_cs: "max. příkon (Stupeň 3)"
    label_en: "Max. power draw (Stage 3)"
    type: number
    unit: kW
    conditional_on: {field: stage3_device2_shutdown, equals: true}

  - id: stage4_device_shutdown
    label_cs: "Stupeň 4 – vypnutí zařízení"
    label_en: "Stage 4 – device shutdown"
    type: boolean
    conditional_on: {field: quarter_hour_max_control, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: stage4_device_max_power
    label_cs: "max. příkon (Stupeň 4)"
    label_en: "Max. power draw (Stage 4)"
    type: number
    unit: kW
    conditional_on: {field: stage4_device_shutdown, equals: true}

  - id: stage5_device_shutdown
    label_cs: "Stupeň 5 – vypnutí zařízení"
    label_en: "Stage 5 – device shutdown"
    type: boolean
    conditional_on: {field: quarter_hour_max_control, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: stage5_device_max_power
    label_cs: "max. příkon (Stupeň 5)"
    label_en: "Max. power draw (Stage 5)"
    type: number
    unit: kW
    conditional_on: {field: stage5_device_shutdown, equals: true}

  - id: additional_stages_note
    type: note
    conditional_on: {field: quarter_hour_max_control, equals: true}
    label_cs: "další stupně je nutno řešit individuálně"
    label_en: "Additional stages must be handled on a custom/individual basis"

  - id: flexibility_heading
    type: group
    label_cs: "Nastavení řízení flexibility"
    label_en: "Flexibility control settings"

  - id: aggregator_device_connected
    label_cs: "Zařízení pro komunikaci s agregátorem je připojené k EMS"
    label_en: "The device for communicating with the aggregator is connected to the EMS"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Vyplňte NE, pokud řízení flexibility není součástí projektu."
    help_en: "Answer No if flexibility control is not part of the project."

  - id: aggregator_name
    label_cs: "Zvolený agregátor"
    label_en: "Selected aggregator"
    type: text
    conditional_on: {field: aggregator_device_connected, equals: true}
```
