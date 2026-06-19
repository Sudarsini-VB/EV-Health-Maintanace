from fastapi import APIRouter, HTTPException
from app.schemas import schemas
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api/predict", tags=["Predictions"])


@router.post("/", response_model=schemas.PredictionResponse)
def predict_battery_state(payload: schemas.PredictionRequest):
    try:
        result = ml_service.predict(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/model-metrics")
def get_model_metrics():
    return ml_service.get_metrics()
