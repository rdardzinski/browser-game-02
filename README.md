# Niebieska panda czerwona

Pixel-artowa platformówka 2D napisana w HTML, CSS i czystym JavaScript.
Wersja v0.2 dodaje ekran startowy, wybór poziomu, drugi poziom i zapis
najlepszego wyniku.

Gra działa lokalnie bez zewnętrznych bibliotek i assetów. Możesz otworzyć
`index.html` bezpośrednio w przeglądarce albo uruchomić prosty serwer HTTP.

## Uruchomienie

Otwórz plik `index.html` w nowoczesnej przeglądarce.

Opcjonalnie uruchom lokalny serwer:

```bash
python3 -m http.server 8080
```

Następnie wejdź na `http://localhost:8080`.

## Sterowanie

- `←` / `A` - ruch w lewo
- `→` / `D` - ruch w prawo
- `Spacja` / `↑` / `W` - skok
- `Enter` - start, restart lub potwierdzenie akcji w menu
- `Esc` - powrót do ekranu startowego z menu wyboru
- na mobile - przyciski ekranowe pod planszą

## Mechaniki

- side-scroller 2D z płynnym przewijaniem kamery
- grawitacja, ruch lewo/prawo i skok
- kolizje z platformami i przeszkodami
- niebieska panda czerwona narysowana programowo w canvasie
- bambusowe monety i listki jako kolekcjonowalne skarby
- przeciwnicy patrolujący poziom
- 3 życia i respawn po trafieniu
- ekran startowy
- ekran wyboru poziomu
- 2 poziomy do ukończenia
- zapis najlepszego wyniku w `localStorage`
- krótka instrukcja sterowania na starcie
- ekran Game Over
- ekran zwycięstwa po dotarciu do końca poziomu

## Uwagi

- Cała grafika jest generowana programowo i utrzymana w stylu pixel-art.
- Gra nie wymaga instalowania zależności.
