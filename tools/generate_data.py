"""Generates the two made-up measurement lots used in the demo (fixed seed, reproducible).

Usage: python3 -I tools/generate_data.py
Writes demo/lot_A.csv, demo/limites_A.csv, demo/lot_B.csv, demo/limites_B.csv.
Column names are French on purpose: the recorded demo session used these exact files.
"""
import csv
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEMO = ROOT / "demo"
DEMO.mkdir(exist_ok=True)
rng = random.Random(2026)


def mesure(moyenne, sigma, taux_derive, derive):
    """Gaussian value, with a small share of chips pushed outside the limits."""
    v = rng.gauss(moyenne, sigma)
    if rng.random() < taux_derive:
        v += rng.choice([-1, 1]) * derive
    return v


# Product A: 200 chips, 4 measurements, snake_case column names.
limites_a = [
    ("vdd_V", 3.135, 3.465, "V"),
    ("idd_mA", 2.0, 4.5, "mA"),
    ("vout_V", 1.180, 1.220, "V"),
    ("freq_osc_kHz", 237.5, 262.5, "kHz"),
]
with open(DEMO / "limites_A.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["mesure", "min", "max", "unite"])
    w.writerows(limites_a)
with open(DEMO / "lot_A.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["puce"] + [m[0] for m in limites_a])
    for i in range(1, 201):
        w.writerow([
            f"A-{i:04d}",
            f"{mesure(3.30, 0.04, 0.02, 0.25):.3f}",
            f"{mesure(3.10, 0.35, 0.03, 1.8):.2f}",
            f"{mesure(1.200, 0.006, 0.03, 0.03):.4f}",
            f"{mesure(250.0, 3.0, 0.02, 15.0):.1f}",
        ])

# Product B: 150 chips, 5 measurements, other column and limit header names.
limites_b = [
    ("Supply (V)", 4.75, 5.25, "V"),
    ("Iq (uA)", 40, 95, "uA"),
    ("Offset (mV)", -2.5, 2.5, "mV"),
    ("Gain err (%)", -0.5, 0.5, "%"),
    ("Tj (degC)", 15, 60, "degC"),
]
with open(DEMO / "limites_B.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["parametre", "limite_basse", "limite_haute", "unite"])
    w.writerows(limites_b)
with open(DEMO / "lot_B.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["DUT"] + [m[0] for m in limites_b])
    for i in range(1, 151):
        w.writerow([
            f"B{i:03d}",
            f"{mesure(5.00, 0.06, 0.02, 0.35):.3f}",
            f"{mesure(68, 8, 0.03, 35):.1f}",
            f"{mesure(0.0, 0.7, 0.03, 2.8):.2f}",
            f"{mesure(0.0, 0.14, 0.03, 0.6):.3f}",
            f"{mesure(38, 5, 0.02, 30):.1f}",
        ])

print("wrote:", ", ".join(sorted(p.name for p in DEMO.glob("*.csv"))))
