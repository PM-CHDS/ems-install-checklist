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
    label_en: "Ethernet cable (data network) connected to the EMS/DSO RTU switchboard"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Fyzické připojení datové sítě do rozvaděče dle příslušné dokumentace."
    help_en: "Physical connection of the data network to the switchboard per the documentation."

  - id: eth_connected_mar
    label_cs: "Zapojení Eth kabelu (datová síť) do všech rozvaděčů MaR"
    label_en: "Ethernet cable (data network) connected to all ISC panels"
    type: boolean
    blocking: true
    conditional_on: {field: mar_switchboard_count, gt: 0}
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: "Fyzické připojení datové sítě do rozvaděče dle příslušné dokumentace."
    help_en: "Physical connection of the data network to the switchboard per the documentation."

  - id: data_network_configured
    label_cs: "Nastavení datové sítě pro komunikaci řídících jednotek a následujících výjimek v pravidlech FireWallu"
    label_en: "Data network configured for controller-unit communication, with the firewall exceptions below"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
    help_cs: >
      Pro potřeby komunikace řídících jednotek s nadřazeným systémem je potřeba v rámci
      datové sítě nastavit příslušné parametry. Datová síť s přístupem na internet se
      připojuje na ETH 2 port řídící jednotky (případně na keystone RJ45/DIN). ETH 2 port
      je vyhrazen pro externí komunikaci (VPN k uživatelské aplikaci, externí datové
      zdroje: synchronizace času, predikce solárního osvitu, počasí, ceny denního trhu
      apod.). Doporučujeme připojit řídící jednotky do vyhrazené části sítě s přístupem
      do internetu. Ve firewallu je nutné povolit komunikaci na tyto adresy:
      vpn.icool.cloud tcp/1194, cz.pool.ntp.org, 8.8.8.8 (DNS), www.pvforecast.cz,
      www.ote-cr.cz.
    help_en: >
      The data network needs the correct parameters set for controller units to
      communicate with the parent system. The internet-facing data network connects to
      the controller unit's ETH 2 port (or a keystone RJ45/DIN). ETH 2 is reserved for
      external communication (VPN to the user app; external data sources: time sync,
      solar-irradiance forecast, weather, day-ahead prices). Recommended: put controller
      units on a dedicated network segment with internet access. The firewall must
      allow traffic to: vpn.icool.cloud tcp/1194, cz.pool.ntp.org, 8.8.8.8 (DNS),
      www.pvforecast.cz, www.ote-cr.cz.

  - id: control_units_ip_ic_table
    label_cs: "IP adresy a IC čísla řídících jednotek"
    label_en: "IP addresses and IC numbers of controller units"
    type: table
    repeatable: true
    suggested_rows: 2
    help_cs: >
      Při pořizování fotodokumentace IC čísla nezapomeň fotografii označit
      příslušností k rozvaděči. IC číslo je registrační číslo řídící jednotky v
      nadřazeném systému — k němu se lze dostat stisknutím tlačítka "Mode" (na displeji
      se objeví "RUN"), poté šipkou dolů nalistovat příslušný displej. Řídící jednotka má
      na ETH 2 portu zapnutý DHCP server; po připojení lze na displeji nalistovat
      položku ETH 2 a přečíst přidělenou IP adresu.
    help_en: >
      When taking the IC-number photo, remember to label which switchboard it
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
      - id: ip_address
        label_cs: "IP adresa"
        label_en: "IP address"
        type: text
        help_cs: "Aktuální IP adresa řídící jednotky (na displeji pod položkou ETH 2)."
        help_en: "The controller unit's current IP address (shown on the display under ETH 2)."
      - id: addressing
        label_cs: "Adresace"
        label_en: "Addressing"
        type: select
        options:
          - {value: static, label_cs: "STATICKÁ", label_en: "STATIC"}
          - {value: dhcp, label_cs: "DHCP", label_en: "DHCP"}
        help_cs: "Po připojení do back-endu EnergoStation lze DHCP vypnout a nastavit pevnou IP adresu dle požadavků místního IT."
        help_en: "Once connected to the EnergoStation back end, DHCP can be switched off and a static IP set per local IT's requirements."

  - id: local_network_params_heading
    type: group
    label_cs: "Parametry místní sítě ve které je technologie připojena"
    label_en: "Parameters of the local network the technology is connected to"
    help_cs: "Slouží pro kontrolu nastavení řídících jednotek."
    help_en: "Used to verify the controller units' network configuration."

  - id: ip_range
    label_cs: "IP adresa sítě"
    label_en: "Network IP address"
    type: text

  - id: subnet_mask
    label_cs: "Maska sítě"
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
    label_cs: "Všechny komponenty využívající připojení TCP (střídače, baterie, atd.) jsou vzájemně dostupné přes PING příkaz"
    label_en: "All components using a TCP connection (inverters, batteries, etc.) can reach each other by PING"
    type: boolean
    blocking: true
    options: {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}

  - id: connection_method
    label_cs: "Způsob připojení instalačního místa, resp. EMS/DŘ jednotky k Internetu"
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
    photo: true
    photo_required: true
    label_cs: "Zahájení konfigurace je podmíněno funkční datovou konektivitou"
    label_en: "Starting configuration requires working data connectivity"
    help_cs: >
      Přiložte fotografii displeje PLC, kde je vidět potvrzení o správné komunikaci PLC
      do cloudu — nutný je stav [100]. Fotografii přiložte i v §6 (Dodané podklady).
    help_en: >
      Attach a photo of the PLC display showing confirmation of correct PLC-to-cloud
      communication — the status must show [100]. Also include it with the §6 attachments.
    images:
      - file: assets/03-plc-display-connection-status.png
        caption_cs: "Displej PLC jednotky se stavem připojení"
        caption_en: "PLC unit display showing connection status"
```
