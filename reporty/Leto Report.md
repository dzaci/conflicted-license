Cieľ tohto semestra priamo nadväzoval na ciele minulého semestra.
Na základe dobrých vybudovaných základov na programovanie finálnej aplikácie, sme sa mohli pustiť priamo do implementácie.

Prvým krokom bolo spracovanie vstupu od užívateľa, implementované v súbore parse-args.ts.
Konkrétne sa jedná o funkciu parseArgs, ktorej vstupom sú pracovný adresár a argumenty od užívateľa.
Funkcia nastavuje prednastavené hodnoty, spracúva argumenty, nastavuje a upravuje premenné outputPath, inputPath.
Na tie sa v tejto funkcii pozerá iba ako na cesty v súborovom systéme, nie ako na reálne súbory. Tieto cesty sú po spracovaní absolútne cesty k potencionálnym súborom na disku.

Ďalšou dvôležitou funkciou je validateInputFile, ktorá dostane inputPath, a jej úlohou je zistiť, či sa jedná o súbor, z ktorého vie užívateľ čítať.
To je realizované dvoma kontrolami, najprv kontrolou prístupových práv a následne kontrolou, či sa jedná o obyčajný súbor.

Nasleduje očosi zložitejšia funkcia validateOutputFile, ktorá najprv testuje prístupové práva užívateľa, následne skúša vytvoriť súbor na ceste outputPath, čo môže vytvoriť súbor, čím sa program posúva ďalej v kóde, alebo sa subor nedá otvoriť na zapisovanie, vtedy program končí.

Teraz poďme k súboru package.json.
Najpr niečo o rozhraní IPkg. Ten je celkom šikovný, keďže rovnaké rozhranie vieme použiť pre package.json od užívateľa, ale aj pre informácie o dependency moduloch.
Informácie o moduloch hľadáme na troch miestach a to v package-lock.json, v node_modules a cez online register https://registry.npmjs.org.
Týmto spôsobom zmenšujeme šancu, že sa nedostaneme k informáciam o module, ako napríklad licencia modulu a podobne.

Implementácia hľadania spočíva v identifikácii dependencies, ktorých informácia zatiaľ nemáme k dispozícii. Teda každé spomenuté prehľadávané miesto prehľadáva menšiu alebo robnakú množinu modulov. Ak sa informácie o module nepodarí nájsť vôbec, užívateľ je o tom informovaný cez štandardný výstup.

Ďalším, finálnym krokom príprav pred porovnávaním licencií je načítanie tabuľky licencií z csv súboru. Tento krok bol uľahčený použitím modulu csv-parse. Pomocou neho sme vytvorili pole, ktorého jeden riadok je informácia o konkrétnej licencii a hodnoty povolení alebo zákazov.


