# 3. Parametrizace a komunikace

*(Parametrization and communication)*

> **_notes**: the Legend (§8.3) for the IC/IP table mentions a switchboard-designation
> column ("Označení rozvaděče dle JPS – označení rozvaděče, kde je jednotka umístěna")
> that doesn't actually exist as a column in the printed table (only 3 columns are
> present) — noted in that table's help rather than invented as a column. Cross-reference
> against `01-elektroinstalace.md`'s `switchboard_jps_labels` table by row order instead.

```yaml
fields:
  - id: eth_connected_ems_dr
    label_cs: "Zapojení Eth kabelu (datová síť) do rozvaděče EMS/DŘ"
    label_en: "Ethernet cable (data network) connected to the EMS/DŘ switchboard"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Fyzické připojení datové sítě do rozvaděče dle příslušné dokumentace."
    help_en: "Physical connection of the data network to the switchboard per the documentation."

  - id: eth_connected_mar
    label_cs: "Zapojení Eth kabelu (datová síť) do všech rozvaděčů MaR"
    label_en: "Ethernet cable (data network) connected to all MaR switchboards"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Fyzické připojení datové sítě do rozvaděče dle příslušné dokumentace."
    help_en: "Physical connection of the data network to the switchboard per the documentation."

  - id: data_network_configured
    label_cs: "Je nastavena datová síť pro komunikaci řídících jednotek"
    label_en: "Data network configured for controller-unit communication"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: >
      Pro potřeby komunikace řídících jednotek s nadřazeným systémem je potřeba v rámci
      datové sítě nastavit příslušné parametry. Datová síť s přístupem na internet se
      připojuje na ETH 2 port řídící jednotky (případně na keystone RJ45/DIN). ETH 2 port
      je vyhrazen pro externí komunikaci (VPN k uživatelské aplikaci, externí datové
      zdroje: synchronizace času, predikce solárního osvitu, počasí, ceny denního trhu
      apod.). Doporučujeme připojit řídící jednotky do vyhrazené části sítě s přístupem
      do internetu. Při použití firewallu je nutné povolit komunikaci na tyto adresy:
      vpn.icool.cloud tcp/1194, cz.pool.ntp.org, 8.8.8.8 (DNS), www.pvforecast.cz,
      influx.uceeb.cvut.cz:8086, www.ote-cr.cz.
    help_en: >
      The data network needs the correct parameters set for controller units to
      communicate with the parent system. The internet-facing data network connects to
      the controller unit's ETH 2 port (or a keystone RJ45/DIN). ETH 2 is reserved for
      external communication (VPN to the user app; external data sources: time sync,
      solar-irradiance forecast, weather, day-ahead prices). Recommended: put controller
      units on a dedicated network segment with internet access. If a firewall is used,
      allow traffic to: vpn.icool.cloud tcp/1194, cz.pool.ntp.org, 8.8.8.8 (DNS),
      www.pvforecast.cz, influx.uceeb.cvut.cz:8086, www.ote-cr.cz.

  - id: control_units_ip_ic_table
    label_cs: "IP adresy a IC čísla řídících jednotek"
    label_en: "IP addresses and IC numbers of controller units"
    type: table
    repeatable: true
    suggested_rows: 2
    help_cs: >
      [FN8] Při pořizování fotodokumentace IC čísla nezapomeň fotografii označit
      příslušností k rozvaděči. IC číslo je registrační číslo řídící jednotky v
      nadřazeném systému — k němu se lze dostat stisknutím tlačítka "Mode" (na displeji
      se objeví "RUN"), poté šipkou dolů nalistovat příslušný displej. Řídící jednotka má
      na ETH 2 portu zapnutý DHCP server; po připojení lze na displeji nalistovat
      položku ETH 2 a přečíst přidělenou IP adresu.
    help_en: >
      [FN8] When taking the IC-number photo, remember to label which switchboard it
      belongs to. The IC number is the controller unit's registration number in the
      parent system — reach it by pressing "Mode" (display shows "RUN"), then scroll
      down to the relevant screen. The controller unit runs a DHCP server on its ETH 2
      port; once connected, scroll to the ETH 2 screen to read the assigned IP address.
    images:
      - file: assets/03-plc-display-ic-number.jpeg
        caption_cs: "Displej PLC jednotky s IC číslem"
        caption_en: "PLC unit display showing the IC number"
    columns:
      - id: ic_number
        label_cs: "IC číslo řídící jednotky EMS/RTU (PLC jednotky)"
        label_en: "IC number of the EMS/RTU controller unit (PLC unit)"
        type: text
        help_cs: "IC číslo jednotky opsané z displeje."
        help_en: "IC number copied from the unit's display."
      - id: dhcp_ip
        label_cs: "DHCP přidělená IP adresa"
        label_en: "DHCP-assigned IP address"
        type: text
        help_cs: "IP adresa, kterou řídící jednotka získala od DHCP serveru."
        help_en: "IP address the controller unit received from the DHCP server."
      - id: static_ip_requested
        label_cs: "Požadovaná pevná IP adresa"
        label_en: "Requested static IP address"
        type: text
        help_cs: "IP adresa, která má být v řídící jednotce nastavena jako pevná (požadavek od místního IT)."
        help_en: "IP address to be configured as static on the controller unit (per local IT's request)."

  - id: local_network_params_heading
    type: group
    label_cs: "Parametry místní sítě ve které je technologie připojena"
    label_en: "Parameters of the local network the technology is connected to"
    help_cs: "Slouží pro kontrolu nastavení řídících jednotek."
    help_en: "Used to verify the controller units' network configuration."

  - id: ip_range
    label_cs: "Rozsah IP adresy"
    label_en: "IP address range"
    type: text

  - id: subnet_mask
    label_cs: "Maska sub-sítě"
    label_en: "Subnet mask"
    type: text

  - id: gateway
    label_cs: "Brána"
    label_en: "Gateway"
    type: text

  - id: dns
    label_cs: "DNS"
    label_en: "DNS"
    type: text

  - id: components_correct_subnet
    label_cs: "Jsou všechny dotčené komponenty (střídače, baterie, atd.) nastaveny ve správné sub-síti"
    label_en: "Are all relevant components (inverters, battery, etc.) configured on the correct subnet"
    type: boolean
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: connection_method
    label_cs: "Způsob připojení instalačního místa, resp. EMS/RTU jednotky"
    label_en: "How the installation site / EMS/RTU unit connects to the internet"
    type: select
    options:
      - {value: local_network, label_cs: "Připojení do místní datové sítě", label_en: "Connection to the local data network"}
      - {value: mobile_operator, label_cs: "Připojení pomocí mobilního operátora", label_en: "Connection via mobile operator"}
    help_cs: >
      Slouží pro informaci o způsobu připojení pro případnou diagnostiku s datovou
      konektivitou. Zdroj vykresluje tyto dvě možnosti jako samostatné ANO/NE řádky;
      protože jde o vzájemně se vylučující volby, zde je to sloučeno do jednoho výběru.
    help_en: >
      Used for diagnostics of data connectivity. The source renders these as two
      separate ANO/NE lines; since they're mutually exclusive, they're modeled here as
      one single-choice field.

  - id: cloud_connectivity_note
    type: note
    label_cs: "Zahájení konfigurace je podmíněno funkční datovou konektivitou"
    label_en: "Starting configuration requires working data connectivity"
    help_cs: >
      Přiložte fotografii displeje PLC, kde je vidět potvrzení o správné komunikaci PLC
      do cloudu — nutný je stav [100] registrace PLC (viz Legenda 8.3.g).
    help_en: >
      Attach a photo of the PLC display showing confirmation of correct PLC-to-cloud
      communication — registration status must show [100] (see Legend 8.3.g).
    images:
      - file: assets/03-plc-display-connection-status.png
        caption_cs: "Displej PLC jednotky se stavem připojení"
        caption_en: "PLC unit display showing connection status"
```
