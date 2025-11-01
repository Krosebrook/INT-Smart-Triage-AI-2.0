"""Forecasting microservice powered by FastAPI.

This service trains a lightweight regression model on historical ticket
volume data and exposes endpoints for generating forecasts, retrieving
forecast outputs, surfacing proactive alerts, and reporting accuracy
metrics. Data persistence relies on Supabase but the service gracefully
falls back to in-memory caches when Supabase credentials are absent.
"""
from __future__ import annotations

import logging
import os
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sklearn.linear_model import LinearRegression

try:
    from supabase import Client, create_client
except ImportError:  # pragma: no cover - handled in requirements
    Client = None  # type: ignore
    create_client = None  # type: ignore


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Forecasting Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ServiceModel(BaseModel):
    """Base model configuration shared across payload schemas."""

    model_config = ConfigDict(protected_namespaces=())


class ForecastFactors(ServiceModel):
    """Contextual metadata explaining a forecast."""

    baseline_volume: float = Field(..., description="Mean historical daily volume")
    trend_adjustment: float = Field(..., description="Trend multiplier applied")
    weekday: str = Field(..., description="Name of the weekday")
    upper_bound: float = Field(..., description="Upper bound of 95% CI")
    lower_bound: float = Field(..., description="Lower bound of 95% CI")
    model_version: str = Field(..., description="Model version identifier")


class ForecastPoint(ServiceModel):
    """Single day forecast entry."""

    forecast_date: date
    predicted_volume: int
    confidence_level: float = Field(..., ge=0.0, le=1.0)
    upper_bound: float
    lower_bound: float
    factors: ForecastFactors
    actual_volume: Optional[int] = None


class ForecastMetadata(ServiceModel):
    """Metadata returned with forecast generation results."""

    history_window_days: int
    trained_at: datetime
    model_version: str
    baseline_volume: float
    residual_std: float


class ForecastAlert(ServiceModel):
    """Alert describing a risk surfaced by the forecast."""

    id: str
    forecast_date: date
    severity: str = Field(..., pattern="^(info|warning|critical)$")
    message: str
    predicted_volume: int
    upper_bound: float
    threshold: float


class ForecastGenerationResponse(ServiceModel):
    """Response payload for the generate endpoint."""

    forecasts: List[ForecastPoint]
    metadata: ForecastMetadata
    alerts: List[ForecastAlert]


class ForecastCollectionResponse(ServiceModel):
    """Payload returned when retrieving stored forecasts."""

    forecasts: List[ForecastPoint]


class ForecastAccuracyResponse(ServiceModel):
    """Model accuracy metrics."""

    mape: float
    avg_error: float
    total_forecasts: int


class ForecastAlertResponse(ServiceModel):
    """Alert collection payload."""

    alerts: List[ForecastAlert]


class ForecastingEngine:
    """Core forecasting engine built around linear regression."""

    def __init__(
        self,
        lookback_days: int = 120,
        min_history_days: int = 30,
        model_version: str = "linreg-1.0",
    ) -> None:
        self.lookback_days = lookback_days
        self.min_history_days = min_history_days
        self.model_version = model_version
        self.model: Optional[LinearRegression] = None
        self.history_frame: Optional[pd.DataFrame] = None
        self.residual_std: float = 0.0
        self.baseline_volume: float = 0.0
        self.supabase: Optional[Client] = None
        self._forecast_cache: List[ForecastPoint] = []

    # ------------------------------------------------------------------
    # Data Access
    # ------------------------------------------------------------------
    def connect_supabase(self) -> None:
        """Initialise the Supabase client if credentials are available."""

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            logger.warning("Supabase credentials not provided - operating in memory-only mode")
            self.supabase = None
            return

        if create_client is None:
            logger.error("supabase-py dependency missing; forecasts will not persist")
            self.supabase = None
            return

        self.supabase = create_client(url, key)
        logger.info("Supabase client initialised for forecasting service")

    def fetch_ticket_history(self) -> pd.DataFrame:
        """Load ticket history from Supabase and aggregate to daily counts."""

        if self.supabase is None:
            raise RuntimeError("Supabase client unavailable")

        since = datetime.utcnow().date() - timedelta(days=self.lookback_days)
        response = (
            self.supabase.table("tickets")
            .select("created_at")
            .gte("created_at", since.isoformat())
            .execute()
        )

        records = response.data or []
        if not records:
            raise RuntimeError("No ticket history available for forecasting")

        df = pd.DataFrame(records)
        df["created_at"] = pd.to_datetime(df["created_at"])
        df["date"] = df["created_at"].dt.date
        daily_counts = df.groupby("date").size().reset_index(name="volume")
        daily_counts = daily_counts.sort_values("date")

        return daily_counts

    # ------------------------------------------------------------------
    # Modelling
    # ------------------------------------------------------------------
    def _build_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add engineered features to the dataframe."""

        df = df.copy()
        df["day_index"] = np.arange(len(df))
        df["day_of_week"] = pd.to_datetime(df["date"]).dt.dayofweek
        df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
        df["month"] = pd.to_datetime(df["date"]).dt.month
        return df

    def train(self, df: Optional[pd.DataFrame] = None) -> None:
        """Train the regression model on historical data."""

        if df is None:
            df = self.fetch_ticket_history()

        if df.empty or len(df) < self.min_history_days:
            raise ValueError("Insufficient historical data for training")

        features = self._build_features(df)
        X = features[["day_index", "day_of_week", "is_weekend", "month"]]
        y = features["volume"]

        model = LinearRegression()
        model.fit(X, y)

        predictions = model.predict(X)
        residuals = y - predictions

        self.model = model
        self.history_frame = df
        self.residual_std = float(np.std(residuals)) if len(residuals) > 1 else float(np.std(y))
        self.baseline_volume = float(y.mean())

    def _ensure_model(self) -> None:
        if self.model is None or self.history_frame is None:
            raise RuntimeError("Model not trained")

    def generate_forecasts(self, days: int) -> List[ForecastPoint]:
        """Generate forecasts for the specified horizon."""

        self._ensure_model()
        assert self.history_frame is not None

        last_index = len(self.history_frame) - 1
        last_date = self.history_frame["date"].iloc[-1]

        forecasts: List[ForecastPoint] = []

        for step in range(1, days + 1):
            forecast_date = last_date + timedelta(days=step)
            day_index = last_index + step
            day_of_week = forecast_date.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            month = forecast_date.month

            features = np.array([[day_index, day_of_week, is_weekend, month]])
            predicted = float(self.model.predict(features)[0])
            predicted = max(predicted, 0.0)

            std = self.residual_std or max(np.sqrt(predicted), 1.0)
            interval = 1.96 * std
            lower = max(predicted - interval, 0.0)
            upper = max(predicted + interval, lower)

            confidence = max(0.5, min(0.95, 1.0 - (std / (predicted + std + 1e-6))))

            factors = ForecastFactors(
                baseline_volume=self.baseline_volume,
                trend_adjustment=float(predicted / self.baseline_volume) if self.baseline_volume else 1.0,
                weekday=forecast_date.strftime("%A"),
                upper_bound=upper,
                lower_bound=lower,
                model_version=self.model_version,
            )

            forecasts.append(
                ForecastPoint(
                    forecast_date=forecast_date,
                    predicted_volume=int(round(predicted)),
                    confidence_level=float(round(confidence, 3)),
                    upper_bound=float(round(upper, 2)),
                    lower_bound=float(round(lower, 2)),
                    factors=factors,
                )
            )

        self._forecast_cache = forecasts
        return forecasts

    # ------------------------------------------------------------------
    # Persistence & Alerts
    # ------------------------------------------------------------------
    def persist_forecasts(self, forecasts: List[ForecastPoint]) -> None:
        """Persist forecasts into Supabase if configured."""

        if not forecasts:
            return
        if self.supabase is None:
            return

        start = forecasts[0].forecast_date.isoformat()
        end = forecasts[-1].forecast_date.isoformat()

        try:
            self.supabase.table("ticket_volume_forecast").delete().gte("forecast_date", start).lte("forecast_date", end).execute()
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Failed to clear previous forecasts: %s", exc)

        payload: List[Dict[str, Any]] = []
        for item in forecasts:
            payload.append(
                {
                    "forecast_date": item.forecast_date.isoformat(),
                    "predicted_volume": item.predicted_volume,
                    "confidence_level": item.confidence_level,
                    "factors": {
                        "baseline_volume": item.factors.baseline_volume,
                        "trend_adjustment": item.factors.trend_adjustment,
                        "weekday": item.factors.weekday,
                        "upper_bound": item.factors.upper_bound,
                        "lower_bound": item.factors.lower_bound,
                        "model_version": item.factors.model_version,
                    },
                }
            )

        try:
            self.supabase.table("ticket_volume_forecast").insert(payload).execute()
        except Exception as exc:  # pragma: no cover - logging only
            logger.error("Failed to persist forecasts: %s", exc)

    def detect_alerts(self, forecasts: List[ForecastPoint]) -> List[ForecastAlert]:
        """Detect significant spikes in forecasted volume."""

        alerts: List[ForecastAlert] = []
        if not forecasts:
            return alerts

        baseline = self.baseline_volume or np.mean([f.predicted_volume for f in forecasts])
        std = self.residual_std or np.std([f.predicted_volume for f in forecasts])
        threshold_warning = baseline + std
        threshold_critical = baseline + (2 * std if std > 0 else baseline)

        for item in forecasts:
            severity = None
            threshold = threshold_warning
            if item.predicted_volume >= threshold_critical:
                severity = "critical"
                threshold = threshold_critical
            elif item.predicted_volume >= threshold_warning:
                severity = "warning"
                threshold = threshold_warning

            if severity:
                alerts.append(
                    ForecastAlert(
                        id=f"{item.forecast_date.isoformat()}::{severity}",
                        forecast_date=item.forecast_date,
                        severity=severity,
                        message=(
                            f"Projected {item.predicted_volume} tickets on {item.forecast_date.strftime('%b %d')} "
                            f"exceeds the {severity} threshold of {int(round(threshold))}."
                        ),
                        predicted_volume=item.predicted_volume,
                        upper_bound=item.upper_bound,
                        threshold=float(round(threshold, 2)),
                    )
                )

        return alerts

    def fetch_forecasts(self, days: int) -> List[ForecastPoint]:
        """Retrieve stored forecasts from Supabase or in-memory cache."""

        if self.supabase is not None:
            today = date.today().isoformat()
            end = (date.today() + timedelta(days=days)).isoformat()
            response = (
                self.supabase.table("ticket_volume_forecast")
                .select("forecast_date,predicted_volume,confidence_level,factors,actual_volume")
                .gte("forecast_date", today)
                .lte("forecast_date", end)
                .order("forecast_date", desc=False)
                .execute()
            )
            records = response.data or []
            return [self._record_to_forecast(r) for r in records]

        # Memory fallback
        filtered: List[ForecastPoint] = []
        horizon_end = date.today() + timedelta(days=days)
        for forecast in self._forecast_cache:
            if date.today() <= forecast.forecast_date <= horizon_end:
                filtered.append(forecast)
        return filtered

    def _record_to_forecast(self, record: Dict[str, Any]) -> ForecastPoint:
        factors = record.get("factors") or {}
        return ForecastPoint(
            forecast_date=datetime.fromisoformat(str(record["forecast_date"])).date(),
            predicted_volume=int(record.get("predicted_volume", 0)),
            confidence_level=float(record.get("confidence_level", 0.0)),
            upper_bound=float(factors.get("upper_bound", 0.0)),
            lower_bound=float(factors.get("lower_bound", 0.0)),
            factors=ForecastFactors(
                baseline_volume=float(factors.get("baseline_volume", self.baseline_volume)),
                trend_adjustment=float(factors.get("trend_adjustment", 1.0)),
                weekday=str(factors.get("weekday", "")),
                upper_bound=float(factors.get("upper_bound", 0.0)),
                lower_bound=float(factors.get("lower_bound", 0.0)),
                model_version=str(factors.get("model_version", self.model_version)),
            ),
            actual_volume=(
                int(record["actual_volume"]) if record.get("actual_volume") is not None else None
            ),
        )

    def calculate_accuracy(self) -> ForecastAccuracyResponse:
        """Compute MAPE and average absolute error for completed forecasts."""

        records: List[Dict[str, Any]] = []
        if self.supabase is not None:
            response = (
                self.supabase.table("ticket_volume_forecast")
                .select("predicted_volume,actual_volume")
                .not_("actual_volume", "is", None)
                .execute()
            )
            records = response.data or []

        else:
            records = [
                {
                    "predicted_volume": item.predicted_volume,
                    "actual_volume": item.actual_volume,
                }
                for item in self._forecast_cache
                if item.actual_volume is not None
            ]

        if not records:
            raise RuntimeError("No completed forecasts available for accuracy computation")

        errors = []
        percent_errors = []
        for row in records:
            predicted = float(row.get("predicted_volume", 0))
            actual_raw = row.get("actual_volume")
            if actual_raw in (None, 0):
                continue
            actual = float(actual_raw)
            error = abs(predicted - actual)
            percent_error = (error / actual) * 100.0
            errors.append(error)
            percent_errors.append(percent_error)

        if not errors:
            raise RuntimeError("No valid forecast comparisons available")

        avg_error = float(np.mean(errors))
        mape = float(np.mean(percent_errors))

        return ForecastAccuracyResponse(
            mape=round(mape, 2),
            avg_error=round(avg_error, 2),
            total_forecasts=len(errors),
        )


engine = ForecastingEngine()


def get_engine() -> ForecastingEngine:
    return engine


@app.on_event("startup")
def startup_event() -> None:
    engine.connect_supabase()


@app.get("/healthz")
def healthcheck() -> Dict[str, str]:
    return {"status": "ok", "service": "forecasting"}


@app.post("/forecasts/generate", response_model=ForecastGenerationResponse)
def generate_forecasts(
    days: int = Query(7, ge=1, le=30),
    svc: ForecastingEngine = Depends(get_engine),
) -> ForecastGenerationResponse:
    try:
        svc.train()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    forecasts = svc.generate_forecasts(days)
    svc.persist_forecasts(forecasts)
    alerts = svc.detect_alerts(forecasts)

    metadata = ForecastMetadata(
        history_window_days=svc.lookback_days,
        trained_at=datetime.now(timezone.utc),
        model_version=svc.model_version,
        baseline_volume=round(svc.baseline_volume, 2),
        residual_std=round(svc.residual_std, 2),
    )

    return ForecastGenerationResponse(forecasts=forecasts, metadata=metadata, alerts=alerts)


@app.get("/forecasts", response_model=ForecastCollectionResponse)
def read_forecasts(
    days: int = Query(7, ge=1, le=30),
    svc: ForecastingEngine = Depends(get_engine),
) -> ForecastCollectionResponse:
    forecasts = svc.fetch_forecasts(days)
    return ForecastCollectionResponse(forecasts=forecasts)


@app.get("/forecasts/alerts", response_model=ForecastAlertResponse)
def read_alerts(
    days: int = Query(7, ge=1, le=30),
    svc: ForecastingEngine = Depends(get_engine),
) -> ForecastAlertResponse:
    forecasts = svc.fetch_forecasts(days)
    alerts = svc.detect_alerts(forecasts)
    return ForecastAlertResponse(alerts=alerts)


@app.get("/forecasts/accuracy", response_model=ForecastAccuracyResponse)
def forecast_accuracy(
    svc: ForecastingEngine = Depends(get_engine),
) -> ForecastAccuracyResponse:
    try:
        return svc.calculate_accuracy()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
