# 6. Podmínky nákupu a prodeje elektřiny

*(Electricity buy/sell conditions)*

> Za jakých podmínek se na odběrném místě elektřina prodává a nakupuje, a jak se mají
> zdroje EMS řídit podle SPOT cen.
>
> *(The terms on which the offtake point sells and buys electricity, and how the EMS
> sources should be controlled by SPOT prices.)*

> **_notes**: source is `checklist-ems-full.pdf` §2.2 (SPOT / PRODEJ), §2.3 (SPOT /
> NÁKUP) and §2.6 (Nastavení zdrojů EMS pro SPOT), combined into one section. The
> SPOT region is not in the source.

```yaml
fields:
  - id: price_optimization_enabled
    label_cs: "Využít EMS pro arbitráž / plánování podle cen elektřiny?"
    label_en: "Use the EMS for electricity price arbitrage / planning?"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Podmínkou je smlouva o nákupu elektřiny se SPOT nebo SPOT+FIX cenami. Pokud NE, další otázky v této části se nezobrazí a nevyplňují se."
    help_en: "This requires an electricity purchase agreement with SPOT or SPOT+FIX prices. If No, the rest of this section is not shown and need not be filled in."

  - id: spot_sale_section_heading
    type: group
    conditional_on: {field: price_optimization_enabled, equals: true}
    label_cs: "Prodej (výkup) elektřiny"
    label_en: "Electricity sale (feed-in)"

  - id: electricity_sale_contract_type
    label_cs: "Vybraný režim výkupu elektřiny (EMS)"
    label_en: "Selected electricity sale (feed-in) mode (EMS)"
    type: select
    conditional_on: {field: price_optimization_enabled, equals: true}
    options:
      - {value: spot, label_cs: "SPOT – burzovní ceny", label_en: "SPOT – exchange prices"}
      - {value: fix, label_cs: "FIX – pevná cena domluvená s obchodníkem", label_en: "FIX – fixed price agreed with the trader"}
    help_cs: "Jaký obchodní vztah je na odběrném místě smluven pro výkup elektřiny — podle zvolené možnosti se zobrazí příslušné parametry."
    help_en: "Which commercial arrangement the offtake point has for selling electricity — the matching parameters are shown for the chosen option."

  - id: spot_sale_group_heading
    type: group
    label_cs: "Výkup na SPOTu"
    label_en: "Selling on SPOT"
    conditional_on: {field: electricity_sale_contract_type, equals: spot}
    help_cs: "Návod na výpočet: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"
    help_en: "Calculation guide: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"

  - id: spot_sale_grid_fee
    label_cs: "Cena za použití přenosové soustavy"
    label_en: "Transmission-grid usage fee"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_sale_contract_type, equals: spot}

  - id: spot_sale_vat
    label_cs: "Sazba DPH"
    label_en: "VAT rate"
    type: number
    unit: "%"
    conditional_on: {field: electricity_sale_contract_type, equals: spot}

  - id: spot_sale_min_profit
    label_cs: "Minimální zisk"
    label_en: "Minimum profit"
    type: number
    unit: "%"
    conditional_on: {field: electricity_sale_contract_type, equals: spot}

  - id: block_negative_spot_price_export
    label_cs: "Zakázat dodávku do sítě při záporných SPOT cenách"
    label_en: "Block feed-in to the grid at negative SPOT prices"
    type: boolean
    conditional_on: {field: electricity_sale_contract_type, equals: spot}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Má systém EMS blokovat dodávku do distribuční sítě při záporných cenách na SPOTu?"
    help_en: "Should the EMS block feed-in to the distribution grid while SPOT prices are negative?"

  - id: fix_sale_group_heading
    type: group
    label_cs: "Výkup za fixní cenu"
    label_en: "Selling at a fixed price"
    conditional_on: {field: electricity_sale_contract_type, equals: fix}

  - id: fix_sale_price
    label_cs: "Fixní prodejní cena"
    label_en: "Fixed sale price"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_sale_contract_type, equals: fix}

  - id: fix_sale_grid_fee
    label_cs: "Cena za použití přenosové soustavy"
    label_en: "Transmission-grid usage fee"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_sale_contract_type, equals: fix}

  - id: fix_sale_vat
    label_cs: "Sazba DPH"
    label_en: "VAT rate"
    type: number
    unit: "%"
    conditional_on: {field: electricity_sale_contract_type, equals: fix}

  - id: spot_purchase_section_heading
    type: group
    conditional_on: {field: price_optimization_enabled, equals: true}
    label_cs: "Nákup elektřiny"
    label_en: "Electricity purchase"

  - id: electricity_purchase_contract_type
    label_cs: "Vybraný režim nákupu elektřiny (EMS)"
    label_en: "Selected electricity purchase mode (EMS)"
    type: select
    conditional_on: {field: price_optimization_enabled, equals: true}
    options:
      - {value: spot, label_cs: "SPOT – burzovní ceny", label_en: "SPOT – exchange prices"}
      - {value: fix, label_cs: "FIX – pevná cena domluvená s obchodníkem", label_en: "FIX – fixed price agreed with the trader"}
      - {value: spot_fix, label_cs: "SPOT+FIX – burzovní ceny až do smluveného zastropování cen", label_en: "SPOT+FIX – exchange prices up to an agreed price cap"}
    help_cs: "Jaký obchodní vztah je na odběrném místě smluven pro nákup elektřiny — podle zvolené možnosti se zobrazí příslušné parametry."
    help_en: "Which commercial arrangement the offtake point has for buying electricity — the matching parameters are shown for the chosen option."

  - id: spot_purchase_group_heading
    type: group
    label_cs: "Nákup na SPOTu"
    label_en: "Buying on SPOT"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}
    help_cs: "Návod na výpočet: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"
    help_en: "Calculation guide: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"

  - id: spot_purchase_vt_cost
    label_cs: "Náklady při vysokém tarifu"
    label_en: "Cost at the high tariff (VT)"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}

  - id: spot_purchase_nt_cost
    label_cs: "Náklady při nízkém tarifu"
    label_en: "Cost at the low tariff (NT)"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}

  - id: spot_purchase_daily_cost
    label_cs: "Denní náklady"
    label_en: "Daily costs"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}

  - id: spot_purchase_vat
    label_cs: "Sazba DPH"
    label_en: "VAT rate"
    type: number
    unit: "%"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot}

  - id: fix_purchase_group_heading
    type: group
    label_cs: "Nákup za fixní cenu"
    label_en: "Buying at a fixed price"
    conditional_on: {field: electricity_purchase_contract_type, equals: fix}
    help_cs: "Návod na výpočet: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"
    help_en: "Calculation guide: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"

  - id: fix_purchase_price
    label_cs: "Fixní nákupní cena"
    label_en: "Fixed purchase price"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: fix}

  - id: fix_purchase_vt_cost
    label_cs: "Náklady při vysokém tarifu"
    label_en: "Cost at the high tariff (VT)"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: fix}

  - id: fix_purchase_nt_cost
    label_cs: "Náklady při nízkém tarifu"
    label_en: "Cost at the low tariff (NT)"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: fix}

  - id: fix_purchase_daily_cost
    label_cs: "Denní náklady"
    label_en: "Daily costs"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: fix}

  - id: fix_purchase_vat
    label_cs: "Sazba DPH"
    label_en: "VAT rate"
    type: number
    unit: "%"
    conditional_on: {field: electricity_purchase_contract_type, equals: fix}

  - id: spot_fix_purchase_group_heading
    type: group
    label_cs: "Nákup SPOT+FIX"
    label_en: "Buying SPOT+FIX"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot_fix}
    help_cs: "Návod na výpočet: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"
    help_en: "Calculation guide: https://support.energostation.com/a/solutions/articles/47001247456?lang=cs&portalId=47000082337"

  - id: spot_fix_max_purchase_price
    label_cs: "Maximální nákupní cena"
    label_en: "Maximum purchase price"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot_fix}

  - id: spot_fix_purchase_vt_cost
    label_cs: "Náklady při vysokém tarifu"
    label_en: "Cost at the high tariff (VT)"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot_fix}

  - id: spot_fix_purchase_nt_cost
    label_cs: "Náklady při nízkém tarifu"
    label_en: "Cost at the low tariff (NT)"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot_fix}

  - id: spot_fix_purchase_daily_cost
    label_cs: "Denní náklady"
    label_en: "Daily costs"
    type: number
    unit: "EUR/MWh"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot_fix}

  - id: spot_fix_purchase_vat
    label_cs: "Sazba DPH"
    label_en: "VAT rate"
    type: number
    unit: "%"
    conditional_on: {field: electricity_purchase_contract_type, equals: spot_fix}

  - id: spot_region_heading
    type: group
    label_cs: "Region SPOT cen"
    label_en: "SPOT price region"
    conditional_on:
      any_of:
        - {field: electricity_sale_contract_type, equals: spot}
        - {field: electricity_purchase_contract_type, equals: spot}
        - {field: electricity_purchase_contract_type, equals: spot_fix}

  - id: spot_region
    label_cs: "Region (trh) SPOT cen"
    label_en: "SPOT price region (market)"
    type: select
    conditional_on:
      any_of:
        - {field: electricity_sale_contract_type, equals: spot}
        - {field: electricity_purchase_contract_type, equals: spot}
        - {field: electricity_purchase_contract_type, equals: spot_fix}
    options:
      - {value: cz, label_cs: "CZ – Česko", label_en: "CZ – Czechia"}
      - {value: sk, label_cs: "SK – Slovensko", label_en: "SK – Slovakia"}
      - {value: pl, label_cs: "PL – Polsko", label_en: "PL – Poland"}
      - {value: hu, label_cs: "HU – Maďarsko", label_en: "HU – Hungary"}
      - {value: bg, label_cs: "BG – Bulharsko", label_en: "BG – Bulgaria"}
      - {value: at, label_cs: "AT – Rakousko", label_en: "AT – Austria"}
      - {value: de, label_cs: "DE – Německo", label_en: "DE – Germany"}
    help_cs: "Trh, jehož burzovní ceny se pro odběrné místo použijí — pro výkup i nákup."
    help_en: "The market whose exchange prices apply to the offtake point — for both sale and purchase."

  - id: quarter_hour_billing_warning
    type: note
    conditional_on: {field: price_optimization_enabled, equals: true}
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

  - id: sources_heading
    type: group
    conditional_on: {field: price_optimization_enabled, equals: true}
    label_cs: "Nastavení zdrojů EMS pro SPOT"
    label_en: "EMS source settings for SPOT"
    help_cs: "Řízení zdrojů FVE, bateriová úložiště či jiné zdroje EMS. Pokud zdroj, například baterie, nebude provozován v režimu SPOT, danou část nevyplňujte."
    help_en: "Control of PV, battery storage or other EMS sources. A source that won't run in SPOT mode — a battery, for example — is left out."

  - id: spot_control_enabled
    label_cs: "Povolit řízení EMS dle SPOT"
    label_en: "Allow EMS control based on SPOT"
    type: boolean
    conditional_on: {field: price_optimization_enabled, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Definujte, zda se mají technologie řídit SPOTem."
    help_en: "Define whether the technology should be controlled based on SPOT prices."

  - id: battery_discharge_to_grid_spot
    label_cs: "Povolit vybíjení baterií do sítě dle SPOT"
    label_en: "Allow battery discharge to the grid based on SPOT"
    type: boolean
    conditional_on:
      - {field: bess_present, equals: true}
      - {field: spot_control_enabled, equals: true}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Definujte, zda se má BÚ nabíjet a vybíjet dle SPOTu z/do sítě."
    help_en: "Define whether the battery storage should charge/discharge to/from the grid based on SPOT prices."

  - id: battery_amortization_spot
    label_cs: "Amortizace baterie při využití SPOT"
    label_en: "Battery amortization when using SPOT"
    type: number
    conditional_on:
      - {field: bess_present, equals: true}
      - {field: spot_control_enabled, equals: true}
    required: false
    unit: EUR/MWh

  - id: battery_losses
    label_cs: "Ztráty bateriového úložiště"
    label_en: "Battery storage losses"
    type: number
    conditional_on:
      - {field: bess_present, equals: true}
      - {field: spot_control_enabled, equals: true}
    unit: "%"
    help_cs: "Výrobcem definovaná procentuální vlastní ztráta BÚ."
    help_en: "Manufacturer-specified percentage self-loss of the battery storage."
```
