from datetime import date, timedelta
from typing import List

import pandas as pd
from fastapi.testclient import TestClient

from services.forecasting.app import (
    ForecastAlert,
    ForecastingEngine,
    app,
    get_engine,
)


class StubForecastingEngine(ForecastingEngine):
    def __init__(self, history: pd.DataFrame, train_on_init: bool = True) -> None:
        super().__init__()
        self._history = history
        if train_on_init and len(history) >= self.min_history_days:
            self.train(history)

    def fetch_ticket_history(self) -> pd.DataFrame:
        return self._history

    def persist_forecasts(self, forecasts):
        self._forecast_cache = forecasts

    def fetch_forecasts(self, days: int) -> List:
        return list(self._forecast_cache)


def build_history(days: int = 60) -> pd.DataFrame:
    today = date.today()
    records = []
    for idx in range(days):
        d = today - timedelta(days=(days - idx))
        records.append({"date": d, "volume": 30 + idx})
    return pd.DataFrame(records)


def test_generate_endpoint_success():
    stub = StubForecastingEngine(build_history())
    app.dependency_overrides[get_engine] = lambda: stub

    client = TestClient(app)
    response = client.post("/forecasts/generate", params={"days": 3})
    app.dependency_overrides.pop(get_engine, None)
    assert response.status_code == 200

    payload = response.json()
    assert len(payload["forecasts"]) == 3
    assert payload["metadata"]["model_version"] == stub.model_version


def test_generate_endpoint_insufficient_history():
    history = build_history(days=5)
    stub = StubForecastingEngine(history, train_on_init=False)
    stub.min_history_days = 10
    app.dependency_overrides[get_engine] = lambda: stub

    client = TestClient(app)
    response = client.post("/forecasts/generate", params={"days": 3})
    app.dependency_overrides.pop(get_engine, None)
    assert response.status_code == 400


def test_alerts_endpoint():
    stub = StubForecastingEngine(build_history())
    stub.baseline_volume = 20
    stub.residual_std = 5
    forecasts = stub.generate_forecasts(2)
    forecasts[0].predicted_volume = 999
    stub._forecast_cache = forecasts

    app.dependency_overrides[get_engine] = lambda: stub

    client = TestClient(app)
    response = client.get("/forecasts/alerts")
    app.dependency_overrides.pop(get_engine, None)
    assert response.status_code == 200
    alerts = [ForecastAlert(**alert) for alert in response.json()["alerts"]]
    assert any(alert.severity in {"warning", "critical"} for alert in alerts)


def test_accuracy_endpoint_handles_missing(monkeypatch):
    stub = StubForecastingEngine(build_history())
    stub._forecast_cache = []
    monkeypatch.setattr("services.forecasting.app.get_engine", lambda: stub)

    client = TestClient(app)
    response = client.get("/forecasts/accuracy")
    assert response.status_code == 404
