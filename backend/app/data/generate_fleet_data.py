"""
Synthetic EV Fleet Battery Dataset Generator
---------------------------------------------
Generates realistic battery telemetry for a fleet of EVs, modeled on patterns
from public datasets (NASA Li-ion Battery Aging Dataset, NASA PCoE).

Real physics modeled:
- Capacity fade follows a roughly exponential degradation curve.
- Internal resistance increases with cycle count and temperature.
- High temperature accelerates degradation (Arrhenius-like behavior).
- Fast charging / deep discharge accelerates degradation.
- Random sensor noise added for realism.
"""

import numpy as np
import pandas as pd
import os
from datetime import datetime, timedelta

np.random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__))
NUM_VEHICLES = 60
CYCLES_PER_VEHICLE = 120  # ~ a few months of daily cycles per vehicle

VEHICLE_MODELS = ["Tata Nexon EV", "Mahindra XUV400", "MG ZS EV", "Tata Tigor EV", "Hyundai Kona"]
REGIONS = ["Chennai", "Madurai", "Coimbatore", "Bengaluru", "Hyderabad", "Pune"]


def simulate_vehicle(vehicle_id: int) -> pd.DataFrame:
    model = np.random.choice(VEHICLE_MODELS)
    region = np.random.choice(REGIONS)

    # Each vehicle has its own "usage personality"
    avg_temp = np.random.normal(32, 5)          # ambient + pack temp baseline (deg C)
    fast_charge_ratio = np.random.beta(2, 5)     # fraction of fast charges (0-1)
    driver_aggressiveness = np.random.uniform(0.7, 1.3)  # affects discharge current

    base_capacity_kwh = np.random.choice([30.2, 34.5, 39.0, 50.0])  # nominal pack size
    nominal_voltage = 350 + np.random.normal(0, 5)

    rows = []
    capacity_pct = 100.0
    internal_resistance = 0.08  # ohm baseline

    start_date = datetime(2024, 1, 1) + timedelta(days=int(vehicle_id * 1.5))

    for cycle in range(1, CYCLES_PER_VEHICLE + 1):
        # Temperature varies seasonally + noise
        temperature = avg_temp + 6 * np.sin(cycle / 18) + np.random.normal(0, 2)
        temperature = max(15, temperature)

        # Degradation acceleration factors
        temp_stress = max(0, (temperature - 30) / 10) * 0.15
        fast_charge_event = np.random.rand() < fast_charge_ratio
        charge_stress = 0.12 if fast_charge_event else 0.04

        degradation_step = (0.018 + temp_stress + charge_stress) * driver_aggressiveness
        degradation_step *= np.random.uniform(0.85, 1.15)  # noise
        capacity_pct -= degradation_step
        capacity_pct = max(capacity_pct, 55)  # floor near end-of-life

        # Internal resistance rises as capacity fades (inverse relationship)
        internal_resistance = 0.08 + (100 - capacity_pct) * 0.0021 + np.random.normal(0, 0.002)

        voltage = (nominal_voltage * (capacity_pct / 100)) + np.random.normal(0, 1.5)
        current = 80 * driver_aggressiveness + np.random.normal(0, 6)
        soc = np.random.uniform(20, 100)
        charge_cycles = cycle
        fast_charge_count = 1 if fast_charge_event else 0
        depth_of_discharge = np.random.uniform(30, 95)
        ambient_humidity = np.random.uniform(40, 85)
        odometer_km = cycle * np.random.uniform(35, 60)

        # Remaining Useful Life proxy (cycles until capacity hits 70% — common EOL threshold)
        # Recomputed properly later from full curve; placeholder here.
        rows.append({
            "vehicle_id": f"EV-{vehicle_id:03d}",
            "model": model,
            "region": region,
            "date": (start_date + timedelta(days=cycle)).strftime("%Y-%m-%d"),
            "cycle": cycle,
            "voltage_v": round(voltage, 2),
            "current_a": round(current, 2),
            "temperature_c": round(temperature, 2),
            "internal_resistance_ohm": round(internal_resistance, 4),
            "soc_pct": round(soc, 2),
            "depth_of_discharge_pct": round(depth_of_discharge, 2),
            "fast_charge_event": fast_charge_count,
            "ambient_humidity_pct": round(ambient_humidity, 2),
            "odometer_km": round(odometer_km, 1),
            "capacity_pct": round(capacity_pct, 3),
            "nominal_capacity_kwh": base_capacity_kwh,
        })

    df = pd.DataFrame(rows)

    # Remaining Useful Life: cycles remaining until capacity crosses 70% (EOL threshold)
    eol_threshold = 70.0
    below_eol = df[df["capacity_pct"] <= eol_threshold]
    eol_cycle = below_eol["cycle"].min() if not below_eol.empty else CYCLES_PER_VEHICLE * 2.2
    df["rul_cycles"] = (eol_cycle - df["cycle"]).clip(lower=0)

    # Battery health label for classification model
    def health_label(cap):
        if cap >= 90:
            return "Healthy"
        elif cap >= 80:
            return "Moderate"
        elif cap >= 70:
            return "Degraded"
        else:
            return "Critical"

    df["health_status"] = df["capacity_pct"].apply(health_label)

    return df


def generate_fleet_dataset():
    all_data = []
    for vid in range(1, NUM_VEHICLES + 1):
        vehicle_df = simulate_vehicle(vid)
        all_data.append(vehicle_df)

    fleet_df = pd.concat(all_data, ignore_index=True)
    out_path = os.path.join(OUTPUT_DIR, "fleet_battery_data.csv")
    fleet_df.to_csv(out_path, index=False)
    print(f"Generated {len(fleet_df)} rows for {NUM_VEHICLES} vehicles -> {out_path}")
    return fleet_df


if __name__ == "__main__":
    generate_fleet_dataset()
