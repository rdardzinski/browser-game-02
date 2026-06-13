from __future__ import annotations

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
INDEX_HTML = (ROOT / "index.html").read_text(encoding="utf-8")
STYLE_CSS = (ROOT / "style.css").read_text(encoding="utf-8")
GAME_JS = (ROOT / "game.js").read_text(encoding="utf-8")


class UiContractsTest(unittest.TestCase):
    def test_start_screen_contains_difficulty_and_navigation(self) -> None:
        self.assertIn('id="difficultyPicker"', INDEX_HTML)
        self.assertIn('id="startButton"', INDEX_HTML)
        self.assertIn('id="scoresButton"', INDEX_HTML)
        self.assertIn('id="backToGameButton"', INDEX_HTML)
        self.assertIn('id="highScoresList"', INDEX_HTML)

    def test_game_layout_does_not_allow_page_scroll(self) -> None:
        self.assertIn("overflow: hidden;", STYLE_CSS)
        self.assertIn("height: 100dvh;", STYLE_CSS)
        self.assertIn(".screen--scores", STYLE_CSS)

    def test_start_overlay_is_bounded_inside_viewport(self) -> None:
        self.assertIn("max-height: calc(100% - 16px);", STYLE_CSS)
        self.assertIn("overflow: auto;", STYLE_CSS)

    def test_endgame_states_are_distinct(self) -> None:
        self.assertIn('overlay.dataset.state = won ? "victory" : "gameover";', GAME_JS)
        self.assertIn('state === "victory"', GAME_JS)
        self.assertIn('state === "gameover"', GAME_JS)
        self.assertIn("Cała plansza jest Twoja!", GAME_JS)
        self.assertIn("Twój wynik:", GAME_JS)

    def test_scores_screen_renders_list_on_open(self) -> None:
        self.assertIn("showScoresScreen()", GAME_JS)
        self.assertIn("renderHighScores();", GAME_JS)
        self.assertIn("backToGameButton.addEventListener", GAME_JS)
        self.assertIn("scoresButton.addEventListener", GAME_JS)

    def test_board_resizes_to_available_space(self) -> None:
        self.assertIn("ResizeObserver", GAME_JS)
        self.assertIn("resizeBoard()", GAME_JS)
        self.assertIn("boardWrap.style.width", GAME_JS)
        self.assertIn("canvas.width = boardSize;", GAME_JS)


if __name__ == "__main__":
    unittest.main()
