# 5. Nastavení systému

*(System settings)*

> Pro potřeby nastavení EMS/DŘ je potřeba vyplnit několik základních parametrů samotné
> služby "řízení energií", obsluhovaných "zařízení" (střídač, bateriové úložiště) a
> řízených "spotřebičů". Na základě uvedených hodnot bude nastaven a předán řídící systém
> EMS. Některé hodnoty jsou potřeba i pro DŘ — tam, kde je uvedeno EMS/DŘ, vyplňte i v
> případě, kdy máte objednáno pouze dispečerské řízení.
>
> *(A handful of core parameters are needed to configure the EMS/DŘ "energy management"
> service, the "devices" it operates (inverter, battery storage) and the "loads" it
> controls. The EMS control system is configured and handed over based on these values.
> Some values are needed for dispatch-control (DŘ) too — where a field says EMS/DŘ, fill
> it in even if only dispatch control was ordered.)*

> **_notes**: `battery_mode` and the SPOT-price sub-blocks below are each rendered in the
> source as multiple separate `ANO/NE` lines; where they're genuinely mutually exclusive
> choices they're modeled here as a single `select`/`conditional_on` instead — see
> `README.md`. Regulation stages 4 and 5 are both labeled "vypnutí zařízení 2" in the
> source (stage 2 and 3 are already "zařízení 1" and "zařízení 2") — likely a copy-paste
> typo that should read "zařízení 3" / "zařízení 4"; kept as literally written.

```yaml
fields:
  - id: om_parameters_heading
    type: group
    label_cs: "Parametry OM (EMS/DŘ)"
    label_en: "Metering-point (OM) parameters (EMS/DŘ)"

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
    label_en: "Reserved input capacity per the connection agreement (SoP)"
    type: number
    unit: kW
    help_cs: "Uveďte hodnotu rezervovaného příkonu z aktuální SoP."
    help_en: "State the reserved-capacity value from the current connection agreement (SoP)."

  - id: reserved_power_plant_capacity_sop
    label_cs: "hodnota rezervovaného výkonu výrobny dle SoP"
    label_en: "Reserved generation-plant output per the connection agreement (SoP)"
    type: number
    unit: kW
    help_cs: "Uveďte hodnotu rezervovaného výkonu z aktuální SoP — jedná se o povolené přetoky do distribuční sítě."
    help_en: "State the reserved output from the current connection agreement (SoP) — this is the permitted feed-in to the distribution grid."

  - id: total_installed_power_sop
    label_cs: "celkový instalovaný výkon dle SoP"
    label_en: "Total installed power per the connection agreement (SoP)"
    type: number
    unit: kWp
    help_cs: "Uveďte hodnotu celkového instalovaného výkonu z aktuální SoP."
    help_en: "State the total installed power from the current connection agreement (SoP)."

  - id: reserved_capacity_quarter_hour_max
    label_cs: "rezervovaná kapacita (¼ hodinové maximum)"
    label_en: "Reserved capacity (¼-hour maximum)"
    type: number
    unit: kW
    help_cs: "V případě, že má odběrné místo sjednáno ¼hodinové maximum, uveďte nasmlouvanou hodnotu s dodavatelem elektřiny."
    help_en: "If the offtake point has a contracted ¼-hour maximum, state the value agreed with the electricity supplier."

  - id: quarter_hour_billing_warning
    type: note
    severity: warning
    label_cs: "Upozornění k fakturaci ¼h rezervované kapacity"
    label_en: "Warning: ¼-hour reserved-capacity billing"
    help_cs: >
      DŮLEŽITÉ: pokud se bude nabíjet baterie ze SPOTu a OPM je fakturováno dle ¼h
      rezervované kapacity (RK), je nutné řešit sledování a řízení ¼h výkonu přímo z
      fakturačního elektroměru. Pokud nebude použito řízení ¼h rezervované kapacity z
      fakturačního elektroměru, je možné, že se limit RK překročí a OPM může být
      fakturováno za překročení limitu RK.
    help_en: >
      IMPORTANT: if the battery is charged from SPOT prices and the offtake point is
      billed on a ¼-hour reserved-capacity (RK) basis, ¼-hour power must be monitored
      and controlled directly from the billing meter. Without ¼-hour RK control from the
      billing meter, the RK limit may be exceeded and billed as an overage.

  - id: test_operation_overflow_allowed
    label_cs: "povolení přetoků do sítě během zkušebního provozu"
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

  - id: electricity_purchase_contract_type
    label_cs: "Smlouva o dodávce elektřiny – nákup je (EMS)"
    label_en: "Electricity supply contract – purchase is (EMS)"
    type: select
    options:
      - {value: spot, label_cs: "SPOT", label_en: "SPOT (market price)"}
      - {value: fix, label_cs: "FIX", label_en: "Fixed price"}
    help_cs: "Jaký obchodní vztah je na odběrném místě smluven — řídí se odběrné místo SPOTem, nebo má fixní cenu elektřiny."
    help_en: "What commercial arrangement applies at the offtake point — SPOT-priced or fixed-price electricity."

  - id: electricity_sale_contract_type
    label_cs: "Smlouva o výkupu elektřiny – prodej je (EMS)"
    label_en: "Electricity purchase (feed-in) contract – sale is (EMS)"
    type: select
    options:
      - {value: spot, label_cs: "SPOT", label_en: "SPOT (market price)"}
      - {value: fix, label_cs: "FIX", label_en: "Fixed price"}
    help_cs: "Jaký obchodní vztah je na odběrném místě smluven — řídí se odběrné místo SPOTem, nebo má fixní cenu elektřiny."
    help_en: "What commercial arrangement applies at the offtake point — SPOT-priced or fixed-price electricity."

  - id: spot_purchase_group_heading
    type: group
    label_cs: "v případě nákupu na SPOTu – návod viz Legenda 8.4.a)"
    label_en: "If purchasing on SPOT — see Legend 8.4.a for the calculation guide"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}
    help_cs: "Návod na výpočet: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"
    help_en: "Calculation guide: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"

  - id: spot_purchase_vt_cost
    label_cs: "Náklady na VT"
    label_en: "VT (high-tariff) cost"
    type: number
    unit: EUR/MWh
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}

  - id: spot_purchase_nt_cost
    label_cs: "Náklady na NT"
    label_en: "NT (low-tariff) cost"
    type: number
    unit: EUR/MWh
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}

  - id: spot_purchase_daily_cost
    label_cs: "Denní náklady (rozpočítané trvalé platby)"
    label_en: "Daily cost (amortized fixed charges)"
    type: number
    unit: EUR/MWh
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}

  - id: spot_purchase_vat
    label_cs: "DPH"
    label_en: "VAT"
    type: number
    unit: "%"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}

  - id: spot_purchase_trader_margin
    label_cs: "Marže obchodníka"
    label_en: "Trader margin"
    type: number
    unit: EUR/MWh
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}

  - id: spot_sale_group_heading
    type: group
    label_cs: "v případě prodeje na SPOTu"
    label_en: "If selling on SPOT"
    conditional_on: {field: electricity_sale_contract_type, equals: spot}

  - id: spot_sale_grid_fee
    label_cs: "cena za přenosovou soustavu"
    label_en: "Transmission-grid fee"
    type: number
    unit: EUR/MWh
    conditional_on: {field: electricity_sale_contract_type, equals: spot}

  - id: spot_sale_vat
    label_cs: "DPH"
    label_en: "VAT"
    type: number
    unit: "%"
    conditional_on: {field: electricity_sale_contract_type, equals: spot}

  - id: spot_sale_min_profit
    label_cs: "Minimální zisk"
    label_en: "Minimum profit"
    type: number
    unit: "%"
    conditional_on: {field: electricity_sale_contract_type, equals: spot}

  - id: spot_sale_trader_margin
    label_cs: "Marže obchodníka"
    label_en: "Trader margin"
    type: number
    unit: EUR/MWh
    conditional_on: {field: electricity_sale_contract_type, equals: spot}

  - id: block_negative_spot_price_export
    label_cs: "zakázat dodávku FVE do sítě při záporných SPOT cenách (EMS)"
    label_en: "Block PV feed-in to the grid at negative SPOT prices (EMS)"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "V případě SPOTového smluvního vztahu: má systém EMS blokovat dodávku do distribuční sítě při záporných cenách na SPOTu?"
    help_en: "For SPOT-priced contracts: should the EMS block grid feed-in during negative SPOT prices?"

  - id: sources_heading
    type: group
    label_cs: "FVE, Bateriové úložiště a jiné zdroje (EMS)"
    label_en: "PV, battery storage and other sources (EMS)"

  - id: spot_control_enabled
    label_cs: "Povolit/povolení řízení SPOT"
    label_en: "Allow SPOT-based control"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Definujte, zda se mají technologie řídit SPOTem."
    help_en: "Define whether the technology should be controlled based on SPOT prices."

  - id: battery_discharge_to_grid_spot
    label_cs: "povolit vybíjení baterie do sítě (SPOT)"
    label_en: "Allow battery discharge to the grid (SPOT)"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Definujte, zda se má BÚ nabíjet a vybíjet dle SPOTu z/do sítě."
    help_en: "Define whether the battery storage should charge/discharge to/from the grid based on SPOT prices."

  - id: battery_amortization_spot
    label_cs: "Amortizace baterie (SPOT)"
    label_en: "Battery amortization (SPOT)"
    type: number
    required: false
    unit: EUR/MWh

  - id: battery_losses
    label_cs: "ztráty bateriového úložiště"
    label_en: "Battery storage losses"
    type: number
    unit: "%"
    help_cs: "Výrobcem definovaná procentuální vlastní ztráta BÚ."
    help_en: "Manufacturer-specified percentage self-loss of the battery storage."

  - id: additional_sources_installed
    label_cs: "jsou instalovány další zdroje (EMS/DŘ)"
    label_en: "Are other sources installed (EMS/DŘ)"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "[FN12] Pokud jsou instalovány další zdroje jako např. KGJ (kogenerační jednotka), uveďte jejich seznam a informace dle bodu \"3.m\" do Poznámek (§7)."
    help_en: "[FN12] If other sources are installed (e.g. a CHP/cogeneration unit), list them and their details per point \"3.m\" in the Notes section (§7)."

  - id: battery_mode
    label_cs: "Režim bateriového uložiště (vyberte jednu možnost, kombinace je pouze po vzájemné domluvě a ověření, že daná technologie kombinaci podporuje)"
    label_en: "Battery storage mode (select one; combinations only by mutual agreement and after verifying the technology supports the combination)"
    type: select
    options:
      - value: self_consumption
        label_cs: "Self-consumption – nabíjení z přetoků fve a kompenzace spotřeby"
        label_en: "Self-consumption – charging from PV surplus and consumption offsetting"
      - value: peak_shaving
        label_cs: "Peak-shaving – ořezávání/vyrovnání výkonových špiček (standardní spotřeba není kompenzována)"
        label_en: "Peak-shaving – clipping/smoothing power peaks (standard consumption is not offset)"
      - value: spot_control
        label_cs: "SPOT řízení – nabíjení a kompenzace na základě SPOTových cen (neřeší vyrovnávání výkonových špiček)"
        label_en: "SPOT control – charging and offsetting based on SPOT prices (does not address peak shaving)"
    help_cs: "Zdroj vykresluje tyto tři možnosti jako samostatné ANO/NE řádky; protože jde o vzájemně se vylučující volby (viz nadpis), zde je to sloučeno do jednoho výběru."
    help_en: "The source renders these three options as separate ANO/NE lines; since the heading says to pick one, they're modeled here as a single-choice field."

  - id: quarter_hour_max_heading
    type: group
    label_cs: "¼ hod. maximum (vyplňte, pokud je součástí projektu)"
    label_en: "¼-hour maximum (fill in only if part of the project)"

  - id: opto_isolator_installed_billing_meter
    label_cs: "instalován a připojen galvanický optooddělovač pro sběr pulsů k fakturačnímu elektroměru"
    label_en: "Galvanic opto-isolator installed and connected for pulse collection at the billing meter"
    type: boolean
    required: false
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Zařízení je instalováno co nejblíže fakturačního elektroměru. Jeho připojení k fakturačnímu elektroměru zajišťuje PDS (provozovatel distribuční soustavy) a řídí se místními připojovacími podmínkami."
    help_en: "The device is installed as close as possible to the billing meter. Its connection to the billing meter is done by the DSO (distribution system operator) per local connection conditions."

  - id: opto_isolator_connected_switchboard
    label_cs: "připojen galvanický optooddělovač k rozvaděči 1/4h maxima"
    label_en: "Opto-isolator connected to the ¼h-maximum switchboard"
    type: boolean
    required: false
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Pro správnou funkčnost je nutné zajistit propojení mezi optooddělovačem a rozvaděčem ¼hodinového maxima. Impulsy se připojují na vstupy prvku C-AM-0006I."
    help_en: "For correct operation, the opto-isolator must be wired to the ¼-hour-maximum switchboard. Pulses connect to the inputs of the C-AM-0006I element."

  - id: quarter_hour_switchboard_connected_ems
    label_cs: "připojen rozvaděč ¼ hod. maxima k EMS/DŘ rozvaděči"
    label_en: "¼-hour-maximum switchboard connected to the EMS/DŘ switchboard"
    type: boolean
    required: false
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Jedná se o komunikační připojení k EMS/DŘ rozvaděči pomocí CIB sběrnice, případně pomocí datové sítě."
    help_en: "This is the communication link to the EMS/DŘ switchboard, via the CIB bus or the data network."

  - id: cib_address_ak_puls
    label_cs: "CIB adresa prvku AK.PULS (C-AM-0006I)"
    label_en: "CIB address of the AK.PULS element (C-AM-0006I)"
    type: text
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
    label_cs: "popis pulsů"
    label_en: "Pulse description"
    help_cs: "Uveďte, jaký typ pulsu byl připojen kam. Musí odpovídat výstupu z fakturačního elektroměru přes vstup do optooddělovače a následně jeho výstup. Většinou se připojuje synchronizační puls, A+, A-, případně jalový výkon."
    help_en: "State which pulse type was connected where. It must correspond to the billing meter's output, through the opto-isolator's input and then its output. Usually a sync pulse, A+, A-, or reactive-power pulse is connected."

  - id: imp1
    label_cs: "imp1 (AK.PULS/AI1)"
    label_en: "imp1 (AK.PULS/AI1)"
    type: text
    required: false

  - id: imp2
    label_cs: "imp2 (AK.PULS/AI2)"
    label_en: "imp2 (AK.PULS/AI2)"
    type: text
    required: false

  - id: imp3
    label_cs: "imp3 (AK.PULS/AI3)"
    label_en: "imp3 (AK.PULS/AI3)"
    type: text
    required: false

  - id: regulation_stages_heading
    type: group
    label_cs: "regulační stupně"
    label_en: "Regulation stages"
    help_cs: "Jedná se o definování technologií a pořadí, v jakém se mají odpojovat či připojovat. Ovládání technologií může vyvolat dodatečné požadavky na HW a elektroinstalační práce."
    help_en: "Defines the devices and the order in which they should be disconnected or reconnected. Controlling these devices may require additional hardware and electrical-installation work."

  - id: stage1_battery_compensation
    label_cs: "Stupeň 1 – kompenzace baterií"
    label_en: "Stage 1 – battery compensation"
    type: boolean
    required: false
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: stage2_device1_shutdown
    label_cs: "Stupeň 2 – vypnutí zařízení 1"
    label_en: "Stage 2 – shut down device 1"
    type: boolean
    required: false
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: stage2_device1_max_power
    label_cs: "max. příkon (Stupeň 2)"
    label_en: "Max. power draw (Stage 2)"
    type: number
    unit: kW
    conditional_on: {field: stage2_device1_shutdown, equals: true}

  - id: stage3_device2_shutdown
    label_cs: "Stupeň 3 – vypnutí zařízení 2"
    label_en: "Stage 3 – shut down device 2"
    type: boolean
    required: false
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: stage3_device2_max_power
    label_cs: "max. příkon (Stupeň 3)"
    label_en: "Max. power draw (Stage 3)"
    type: number
    unit: kW
    conditional_on: {field: stage3_device2_shutdown, equals: true}

  - id: stage4_device_shutdown
    label_cs: "Stupeň 4 – vypnutí zařízení 2"
    label_en: "Stage 4 – shut down device 2"
    type: boolean
    required: false
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Zdroj takto opakuje \"zařízení 2\" i pro stupeň 4 — pravděpodobně překlep, mělo by být \"zařízení 3\"."
    help_en: "The source repeats \"device 2\" for stage 4 too — likely a typo, probably should read \"device 3\"."

  - id: stage4_device_max_power
    label_cs: "max. příkon (Stupeň 4)"
    label_en: "Max. power draw (Stage 4)"
    type: number
    unit: kW
    conditional_on: {field: stage4_device_shutdown, equals: true}

  - id: stage5_device_shutdown
    label_cs: "Stupeň 5 – vypnutí zařízení 2"
    label_en: "Stage 5 – shut down device 2"
    type: boolean
    required: false
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Zdroj takto opakuje \"zařízení 2\" i pro stupeň 5 — pravděpodobně překlep, mělo by být \"zařízení 4\"."
    help_en: "The source repeats \"device 2\" for stage 5 too — likely a typo, probably should read \"device 4\"."

  - id: stage5_device_max_power
    label_cs: "max. příkon (Stupeň 5)"
    label_en: "Max. power draw (Stage 5)"
    type: number
    unit: kW
    conditional_on: {field: stage5_device_shutdown, equals: true}

  - id: additional_stages_note
    type: note
    label_cs: "další stupně je nutno řešit individuálně"
    label_en: "Additional stages must be handled on a custom/individual basis"
```
