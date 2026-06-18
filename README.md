# conflicted-license
Cieľom projektu je vytvoriť nástroj, pomocou ktorého užívateľ získa informácie o node balíkoch z package.json. 
Ide hlavne o získanie tabuľky so zoznamom použitých balíkov a ich licencií spolu so zjednodušenými právami, ktoré pre používateľa z týchto licencií vyplývajú.
Neskorším cieľom je rozšíriť túto funkcionalitu aj na balíky, na ktorých sú pôvodné balíky závisle (teda balíky z package-lock.json) a z týchto informácií vytvoriť prehľadnú hierarchickú tabuľku po vzore pôvodnej tabuľky.

Tento nástroj je realizovaný v jazyku typescript a bude akceptovať súbory package.json, package-lock.json. Výstupom  bude .md alebo .html súbor obsahujúci tabuľku.

-- ako instalovat
1. naklonovať repozitár
2. vojsť do repozitára
3. `sudo npm link` - sprístupní `conflicted-license` používateľovi cez $PATH

-- usage guide
Walk users through how to use your project. Include code examples

Použitie:
- `-o`/`--output` 
	- definujú súbor, do ktorého sa uloží výstupný súbor.
	- prednastavený je priečinok z ktorého užívateľ spustí nástroj
- Prednastavene sa užívateľovi vygeneruje conflicts.md súbor. Toto správanie je možné zmeniť pomocou prepínačna `--html`
- `--html`
	- definuje html formát súboru, do ktorého sa uloží získaná tabuľka
- `-y` 
    - nastavenie premennej autoConfirm. Teda napríklad automatické potvrdenie otázky, či chce užívateľ prepísať výstupný súbor
- Za prepínačmi nasleduje cesta k package.json a/alebo cesta k package-lock.json, poprípade nič, kedy program bude hľadať package.json/package-lock.json priamo v priečinku, v ktorom bol spustený.

Výstup
- na stdin program vypisuje informácie o behu funkcií
- jeden z riadkov tohto výstupu obsahuje absolútnu cestu v výstupnému súboru
