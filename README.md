# Niebieska panda czerwona

Pixel-artowa platformówka 2D napisana w HTML, CSS i czystym JavaScript.
Wersja v0.4 podbija czytelność sceny, powiększa kadr gry, dopracowuje niebieską
pandę czerwoną i poprawia UX na mobile bez używania zewnętrznych assetów lub
bibliotek.

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
- `P` / `Esc` - pauza lub powrót z ekranu pomocy
- na mobile - joystick po lewej, duży skok po prawej i mały przycisk pauzy w HUD

## Jak grać

- Pospiesz się po planszy i zbieraj bambusowe monety oraz listki.
- Unikaj kolców i przeciwników. Trafienie zabiera życie, pokazuje krótki efekt
  i przenosi na checkpoint.
- Pauza pozwala bezpiecznie wrócić do gry, instrukcji albo menu.
- W trakcie gry HUD pokazuje tylko punkty, życia i poziom.

## Mechaniki

- side-scroller 2D z płynnym przewijaniem kamery
- grawitacja, ruch lewo/prawo i skok z czułym buforem
- kolizje z platformami, przeszkodami i checkpointami
- większa niebieska panda czerwona narysowana programowo w canvasie
- pixel-artowe kafelki, tło, platformy, skarby i efekty punktów
- bambusowe monety i listki jako kolekcjonowalne skarby
- przeciwnicy patrolujący poziom
- 3 życia i respawn po trafieniu
- ekran startowy
- ekran pauzy
- ekran "Jak grać"
- ekran wyboru poziomu
- 2 poziomy do ukończenia
- zapis najlepszego wyniku w `localStorage`
- ekran Game Over
- ekran zwycięstwa po dotarciu do końca poziomu
- scena gry zajmuje możliwie dużo miejsca na desktopie i mobile
- mobilny joystick po lewej i duży przycisk skoku po prawej

## Wersja v0.4

- większy kadr gry, mniej pustych marginesów i czytelniejszy HUD
- dopracowany sprite bohatera z większym ogonem i wyraźniejszą sylwetką
- mocniejszy kontrast tła, platform i przeszkód
- krótkie efekty przy zbieraniu i otrzymywaniu obrażeń
- mały przycisk pauzy dostępny w trakcie gry
- porządki w kodzie i aktualizacja tekstów menu

## Uwagi

- Cała grafika jest generowana programowo i utrzymana w stylu pixel-art.
- Gra nie wymaga instalowania zależności.
- Projekt jest statyczny, więc powinien działać lokalnie i na GitHub Pages bez
  dodatkowego builda.
