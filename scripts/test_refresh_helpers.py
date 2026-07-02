import unittest
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory

from scripts.refresh_helpers import expected_complete_year, observation_year_range, publish_candidates, select_latest_available_year


class RefreshHelpersTest(unittest.TestCase):
    def test_expected_complete_year(self):
        self.assertEqual(expected_complete_year(date(2026, 7, 1)), 2025)

    def test_latest_year_falls_back_from_empty_and_failed_responses(self):
        def fetch(year):
            if year == 2025:
                return []
            if year == 2024:
                raise OSError('temporary failure')
            return [{'year': year}]

        year, rows = select_latest_available_year(fetch, 2025, lookback=4)
        self.assertEqual(year, 2023)
        self.assertEqual(rows, [{'year': 2023}])

    def test_all_failed_years_raise_without_publishing(self):
        with self.assertRaises(RuntimeError):
            select_latest_available_year(lambda _year: [], 2025, lookback=2)

    def test_observation_year_range(self):
        self.assertEqual(observation_year_range([2024, 2022, 2024]), '2022–2024')
        self.assertEqual(observation_year_range([2024]), '2024')
        self.assertIsNone(observation_year_range([]))

    def test_failed_validation_preserves_published_snapshot(self):
        with TemporaryDirectory() as directory:
            target = Path(directory) / 'data.json'
            target.write_text('previous')
            with self.assertRaises(ValueError):
                publish_candidates('candidate', [target], lambda _payload: (_ for _ in ()).throw(ValueError('invalid')))
            self.assertEqual(target.read_text(), 'previous')


if __name__ == '__main__':
    unittest.main()
