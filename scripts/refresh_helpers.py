from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Callable, Iterable, TypeVar

T = TypeVar('T')


def expected_complete_year(today: date | None = None) -> int:
    """Most annual international datasets are complete through the prior year."""
    return (today or date.today()).year - 1


def select_latest_available_year(
    fetch: Callable[[int], Iterable[T]],
    start_year: int | None = None,
    lookback: int = 4,
) -> tuple[int, list[T]]:
    """Return the newest non-empty annual response, falling back deterministically."""
    first = start_year or expected_complete_year()
    errors: list[str] = []
    for year in range(first, first - lookback, -1):
        try:
            items = list(fetch(year))
        except Exception as exc:  # upstream errors are summarized after all fallbacks
            errors.append(f'{year}: {exc}')
            continue
        if items:
            return year, items
        errors.append(f'{year}: empty response')
    raise RuntimeError('No usable annual response; ' + '; '.join(errors))


def observation_year_range(years: Iterable[int]) -> str | None:
    valid = sorted(set(years))
    if not valid:
        return None
    return str(valid[0]) if len(valid) == 1 else f'{valid[0]}–{valid[-1]}'


def publish_candidates(payload: str, targets: Iterable[Path], validate: Callable[[str], None]) -> None:
    """Validate first, then atomically replace every published snapshot."""
    validate(payload)
    paths = list(targets)
    candidates = [path.with_suffix(path.suffix + '.candidate') for path in paths]
    try:
        for path, candidate in zip(paths, candidates):
            path.parent.mkdir(parents=True, exist_ok=True)
            candidate.write_text(payload)
        for path, candidate in zip(paths, candidates):
            candidate.replace(path)
    finally:
        for candidate in candidates:
            candidate.unlink(missing_ok=True)
