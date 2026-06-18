Cieľom tohto semestra bolo pripraviť dobrý základ na programovanie finálnej aplikácie.

Nasledovné čiastkové ciele boli splnené:
- oboznámenie sa s cieľom a účelom aplikácie
- výber vhodného programovacieho jazyka na implementáciu
- preskúmanie zdrojov (www.tldrlegal.com, www.typescriptlang.org/docs/, https://nodejs.org/en)
- veľká časť práce bola zadefinovať takzvaný konfiguračný súbor, podľa ktorého by aplikácia vyhodnocovala či došlo k porušeniu podmienok používania balíka
	- tento súbor je uložený v csv formáte a obsahuje tabuľku licencií[^1] a rôznych podmienok používania týchto licencií		
		- tieto informácie pochádzajú zo stránky www.tldrlegal.com
		- boli extrahované pomocou jednoduchého [web scrapingu](https://github.com/Jakubino158/conflicted-license/tree/main/web_scrape) a následne prekonvertované do csv podoby pomocou linuxových príkazov
		- okrem toho sa nám podarilo získať zoznam podmienok a ich zjednodušených vysvetlení 
	- bolo dôležité zadefinovať prednastavené hodnoty jednotlivých podmienok aby sme zabezpečili jednoznačný výsledok pozorovania kompatibility dvoch licencií
	- ďalším výsledkom vytvárania tohto súboru boli dve (jedna pre "zakazujúce a druha pre prikazujúce podmienky) matice[^2] 3x3 ktoré definujú kedy sú dve rôzne podmienky v rozpore 
		-  rôznorodosť podmienok používania licencií nás donútila zamyslieť sa, že ak je podmienka prikazujúca, platia pre ňu iné pravidlá ako pre zakazujúcu podmienku

Rozpracované ciele:
- implementácia riešenia v jazyku typescript
- formátovanie rôznych výstupov

Nasledujúce ciele: 
- testovanie implementácie na rôznych package.json súboroch
- rozšírenie implementácie na závislosti balíkov 


príklady tabuliek:

|                                     | Contact Author | Disclose Source | Distribute | Give Credit | Hold Liable |
| ----------------------------------- | -------------- | --------------- | ---------- | ----------- | ----------- |
| **4-Clause BSD**                    | can            | can             | can        | must        | cannot      |
| **Academic Free License 3.0 (AFL)** | can            | must            | can        | can         | cannot      |
| **Apple MIT License (AML)**         | can            | can             | can        | can         | cannot      |
[^1]: tabuľka zobrazujúca, či licencia môže, nemôže alebo musí dodržať danú podmienku

V nasledujúcej tabuľke stĺpec patrí vrchnej licencii a riadok patrí licencii na ktorej vrchna licencia závisí. Teda napríklad ak vrchná licencia hovorí can ale spodná hovorí cannot, potom je vhodné takýto stav užívateľovi oznámiť, potom by mohol ponechať licenciu a stačilo by iba dodržať podmienku cannot. Avšak ak nastane situácia !!!, jedná sa o nekompatibilné licencie.

|            | can    | cannot | must |
| ---------- | ------ | ------ | ---- |
| **can**    | can    | cannot | must |
| **cannot** | cannot | cannot | !!!  |
| **must**   | must   | !!!    | must |
[^2]: tabuľka porovnávania licencií. 

linky:
[Stránka projektu](https://www.st.fmph.uniba.sk/~dzacovsky2/rpj/)
[Repozitár so zdrojákmi](https://github.com/Jakubino158/conflicted-license)


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

