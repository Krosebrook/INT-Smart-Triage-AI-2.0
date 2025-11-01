from datetime import date, timedelta

import numpy as np
import pandas as pd

from services.forecasting.app import ForecastingEngine


def build_sample_history(days: int = 60) -> pd.DataFrame:
    today = date.today()
    records = []
    for idx in range(days):
        d = today - timedelta(days=(days - idx))
        weekday_factor = 1.2 if d.weekday() in (0, 1) else 0.8 if d.weekday() == 6 else 1.0
        records.append({"date": d, "volume": int(40 + idx * 0.3 * weekday_factor)})
    return pd.DataFrame(records)


def test_engine_trains_and_forecasts():
    engine = ForecastingEngine()
    history = build_sample_history()

    engine.train(history)
    forecasts = engine.generate_forecasts(7)

    assert len(forecasts) == 7
    assert all(f.predicted_volume >= 0 for f in forecasts)
    assert engine.baseline_volume > 0
    assert engine.residual_std >= 0


def test_alert_detection_high_volume():
    engine = ForecastingEngine()
    history = build_sample_history()
    engine.train(history)

    forecasts = engine.generate_forecasts(7)

    # Force an anomalously high final forecast to trigger alerting
    boosted = list(forecasts)
    boosted[-1].predicted_volume = int(engine.baseline_volume * 3)
    alerts = engine.detect_alerts(boosted)

    assert any(alert.severity in {"warning", "critical"} for alert in alerts)


def test_accuracy_requires_actuals():
    engine = ForecastingEngine()
    history = build_sample_history()
    engine.train(history)
    forecasts = engine.generate_forecasts(2)

    forecasts[0].actual_volume = forecasts[0].predicted_volume + 5
    engine._forecast_cache = forecasts

    accuracy = engine.calculate_accuracy()
    assert accuracy.total_forecasts == 1
    assert accuracy.mape >= 0


def test_accuracy_raises_without_data():
    engine = ForecastingEngine()
    history = build_sample_history()
    engine.train(history)
    engine.generate_forecasts(2)

    engine._forecast_cache = []

    try:
        engine.calculate_accuracy()
    except RuntimeError as exc:
        assert "No completed forecasts" in str(exc)
    else:  # pragma: no cover - failure branch
        assert False, "Expected RuntimeError for missing actuals"
