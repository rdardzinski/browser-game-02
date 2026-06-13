from __future__ import annotations

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
INDEX_HTML = (ROOT / "index.html").read_text(encoding="utf-8")
STYLE_CSS = (ROOT / "style.css").read_text(encoding="utf-8")
GAME_JS = (ROOT / "game.js").read_text(encoding="utf-8")


class UiContractsTest(unittest.TestCase):
    def test_start_screen_contains_level_selection_and_score_ui(self) -> None:
        self.assertIn('id="startButton"', INDEX_HTML)
        self.assertIn('id="helpButton"', INDEX_HTML)
        self.assertIn('id="levelSelectButton"', INDEX_HTML)
        self.assertIn('id="backButton"', INDEX_HTML)
        self.assertIn('id="levelGrid"', INDEX_HTML)
        self.assertIn('id="pauseButton"', INDEX_HTML)
        self.assertIn('id="joystick"', INDEX_HTML)
        self.assertIn('id="joystickThumb"', INDEX_HTML)
        self.assertIn('data-level="0"', INDEX_HTML)
        self.assertIn('data-level="1"', INDEX_HTML)
        self.assertIn('id="bestScore"', INDEX_HTML)
        self.assertIn('id="levelIndicator"', INDEX_HTML)

    def test_game_layout_does_not_allow_page_scroll(self) -> None:
        self.assertIn("overflow: hidden;", STYLE_CSS)
        self.assertIn("height: 100dvh;", STYLE_CSS)
        self.assertIn("overscroll-behavior: none;", STYLE_CSS)
        self.assertIn("touch-action: none;", STYLE_CSS)
        self.assertIn(".level-grid", STYLE_CSS)
        self.assertIn(".secondary-button", STYLE_CSS)
        self.assertIn(".touch-controls", STYLE_CSS)

    def test_start_overlay_is_bounded_inside_viewport(self) -> None:
        self.assertIn("max-height: calc(100% - 16px);", STYLE_CSS)
        self.assertIn("overflow: auto;", STYLE_CSS)

    def test_endgame_states_cover_level_progression_and_persistence(self) -> None:
        self.assertIn("showLevelSelectScreen()", GAME_JS)
        self.assertIn("showHowToPlayScreen(", GAME_JS)
        self.assertIn("showPauseScreen()", GAME_JS)
        self.assertIn("showLevelClearScreen(", GAME_JS)
        self.assertIn("showVictoryScreen()", GAME_JS)
        self.assertIn("continueToLevel(", GAME_JS)
        self.assertIn("browser-game-02.bestScore", GAME_JS)
        self.assertIn("levelIndex === 0", GAME_JS)
        self.assertIn("else {", GAME_JS)

    def test_board_resizes_to_available_space(self) -> None:
        self.assertIn("ResizeObserver", GAME_JS)
        self.assertIn("resizeCanvas()", GAME_JS)
        self.assertIn("boardWrap.style.width", GAME_JS)
        self.assertIn("Math.max(0.5, rawScale)", GAME_JS)


if __name__ == "__main__":
    unittest.main()
