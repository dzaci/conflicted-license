# conflicted-license
Cieľom projektu je vytvoriť nástroj, pomocou ktorého užívateľ získa informácie o node balíkoch z package.json. 
Ide hlavne o získanie tabuľky so zoznamom použitých balíkov a ich licencií spolu so zjednodušenými právami, ktoré pre používateľa z týchto licencií vyplývajú.
Neskorším cieľom je rozšíriť túto funkcionalitu aj na balíky, na ktorých sú pôvodné balíky závisle (teda balíky z package-lock.json) a z týchto informácií vytvoriť prehľadnú hierarchickú tabuľku po vzore pôvodnej tabuľky.

Tento nástroj je realizovaný v jazyku typescript a bude akceptovať súbory package.json, package-lock.json. Výstupom  bude .md alebo .html súbor obsahujúci tabuľku.

### ako inštalovať
1. naklonovať repozitár
2. vojsť do naklonovaného priečinka
3. zbehnúť `npm run build`
4. `sudo npm link` - sprístupní `conflicted-license` používateľovi cez $PATH

### použitie:
- `-o`/`--output` 
	- definujú súbor, do ktorého sa uloží výstupný súbor.
	- prednastavený je priečinok z ktorého užívateľ spustí nástroj
    - Prednastavene sa užívateľovi vygeneruje conflicts.md súbor. Toto správanie je možné zmeniť pomocou prepínačna `--html`
- `--html`
	- definuje html formát súboru, do ktorého sa uloží získaná tabuľka
- `-y` 
    - nastavenie premennej autoConfirm. Teda napríklad automatické potvrdenie otázky, či chce užívateľ prepísať výstupný súbor
- Za prepínačmi nasleduje cesta k package.json, poprípade nič, kedy program bude hľadať package.json priamo v priečinku, v ktorom bol spustený.
- `-v`
    - výpis verzie

### výstup
- na stdin program vypisuje informácie o behu funkcií
- jeden z riadkov tohto výstupu obsahuje absolútnu cestu v výstupnému súboru

### príklady
``` bash
cd /git
git clone git@github.com:dzaci/conflicted-license.git
cd ./conflicted-license
npm run build
sudo npm link
conflicted-license -v
```

```
cd /mock/projects/rpj
conflicted-license -o konflikty.md
```

