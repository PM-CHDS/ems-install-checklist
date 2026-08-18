# 6. Dodané podklady spolu s checklistem (EMS/DŘ)

*(Documents supplied together with the checklist — EMS/DŘ)*

> **_notes**: `distribution_portal_screenshot` has no `ANO/NE` marker in the source docx
> (every other item in this section does) — modeled as `boolean` for consistency with
> the rest of the section, but flagged as inferred rather than literal.

```yaml
fields:
  - id: photos_control_unit_displays
    label_cs: "Fotodokumentace displejů řídících jednotek (IC čísla)"
    label_en: "Photo documentation of controller-unit displays (IC numbers)"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Ověřte si, zda máte pořízené fotografie displejů všech řídících jednotek a jsou přiloženy k tomuto checklistu."
    help_en: "Verify you have photos of all controller-unit displays and that they're attached to this checklist."

  - id: photos_technology_nameplates
    label_cs: "Fotodokumentace štítků řízených technologií dle výše uvedeného"
    label_en: "Photo documentation of the controlled technologies' nameplates, per the above"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Ověřte si, zda máte pořízené fotografie výrobních štítků všech dotčených technologií a jsou přiloženy k tomuto checklistu."
    help_en: "Verify you have nameplate photos of all relevant technologies and that they're attached to this checklist."

  - id: technical_datasheets
    label_cs: "Technické listy k použitým technologiím, ze kterých bude znám konkrétní instalovaný typ"
    label_en: "Datasheets for the technologies used, identifying the specific installed model"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "K checklistu přiložte datasheety dotčených technologií."
    help_en: "Attach datasheets for the relevant technologies to the checklist."

  - id: modbus_register_table
    label_cs: "Tabulku Modbus registrů dle aktuálně instalovaného fw a typu rozhraní (TCP/RTU)"
    label_en: "Modbus register table matching the currently installed firmware and interface type (TCP/RTU)"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "[FN13] Pouze v případě, že v rámci instalovaných technologií bude zařízení, které není systémem EMS/DŘ podporováno a bude potřeba k němu nový driver. Je nutno dodat tabulku Modbus registrů vč. parametrů pro nastavení komunikace."
    help_en: "[FN13] Only if the installed technology includes a device not supported by EMS/DŘ and a new driver is needed. Supply the Modbus register table including the communication-setup parameters."

  - id: switchboard_documentation_with_signals
    label_cs: "Dokumentaci k rozvaděčům s vyznačenými realizovanými signály a povely, případně zaznamenanými změnami"
    label_en: "Switchboard documentation marked with the implemented signals/commands, and any recorded changes"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Pokud nebudete realizovat všechny povely nebo signály, případně budete dělat změny v typech připojených rozhraní, nebo něco doplňovat či napojovat na rezervní rozhraní, vždy to zaznamenejte do dokumentace a zašlete spolu s checklistem."
    help_en: "If not all commands/signals are implemented, or interface types change, or something is added or wired to a spare interface, record it in the documentation and send it with the checklist."
    images:
      - file: assets/06-switchboard-documentation-example.png
        caption_cs: "Příklad dokumentace rozvaděče se zaznamenanými změnami"
        caption_en: "Example of annotated switchboard documentation"

  - id: as_built_documentation_heading
    type: group
    label_cs: "Realizační projektovou dokumentaci"
    label_en: "As-built project documentation"
    help_cs: "Spolu s checklistem je nutno dodat aktuální realizační dokumentaci, která přesně odpovídá situaci na místě. Bez této dokumentace nelze systém konfigurovat."
    help_en: "Current as-built documentation matching the on-site situation exactly must be supplied with the checklist. The system cannot be configured without it."

  - id: single_line_diagram
    label_cs: "jednopólové schéma se zanesenou kompletní dotčenou technologií a dotčených rozvaděčů (vč. prvků dle telemetrické tabulky)"
    label_en: "Single-line diagram showing all relevant technology and switchboards (incl. elements per the telemetry table)"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Jednopólové schéma zahrnující skutečný stav na místě s vyznačenými dotčenými technologiemi a (pro DŘ) zakreslenými všemi povely a signály. JPS musí obsahovat pojmenování všech dotčených prvků a technologií vč. základních technických parametrů (např. proudové hodnoty)."
    help_en: "Single-line diagram reflecting the actual on-site state, marking the relevant technologies and (for DŘ) all commands/signals. It must name every relevant element/technology and include basic technical parameters (e.g. current ratings)."

  - id: site_layout_diagram
    label_cs: "situační schéma objektů se zakresleným umístěním dotčených technologií a rozvaděčů"
    label_en: "Site layout diagram showing the location of the relevant technology and switchboards"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Schéma s prostorovou situací se zakresleným umístěním dotčených technologií a rozvaděčů."
    help_en: "A spatial layout diagram marking the location of the relevant technology and switchboards."

  - id: connection_agreement
    label_cs: "Smlouvu o připojení v aktuálním znění vč. příloh a dodatků"
    label_en: "Grid connection agreement, current version, incl. appendices and amendments"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Aktuální SoP."
    help_en: "The current connection agreement (SoP)."

  - id: distribution_portal_screenshot
    label_cs: "Screen (foto obrazovky) z distribučního portálu s nasmlouvanými hodnotami rezervovaného příkonu, výkonu a kapacity"
    label_en: "Screenshot from the distribution portal showing the contracted reserved-capacity, output, and capacity values"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Poznámka autora převodu do Markdown: tato položka nemá v původním dokumentu ANO/NE zaškrtávací pole (jediná v této sekci) — doplněno pro konzistenci."
    help_en: "Markdown-conversion note: unlike every other item in this section, this one has no ANO/NE marker in the source document — added here for consistency."

  - id: signoff_declaration
    type: note
    label_cs: "Prohlášení o správnosti údajů"
    label_en: "Declaration of accuracy"
    help_cs: "Svým podpisem potvrzuji správnost uvedených údajů a provedených ověření. Beru na vědomí to, že pokud bude během konfigurace a funkční zkoušky shledán nesoulad, bude řešení tohoto nesouladu řešeno ze strany EnergoStation s.r.o. jako vícepráce dle hodinové sazby z aktuálního ceníku."
    help_en: "By signing, I confirm the accuracy of the stated data and the verifications performed. I acknowledge that if a discrepancy is found during configuration and functional testing, EnergoStation s.r.o. will resolve it as extra work billed at the current hourly rate."

  - id: filled_by_name
    label_cs: "Checklist vyplnil (čitelně)"
    label_en: "Checklist filled in by (legibly)"
    type: text

  - id: filled_by_company
    label_cs: "Společnost"
    label_en: "Company"
    type: text

  - id: filled_date
    label_cs: "Dne"
    label_en: "Date"
    type: date

  - id: signature
    label_cs: "Podpis"
    label_en: "Signature"
    type: signature
```
