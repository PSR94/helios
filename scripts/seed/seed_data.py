import duckdb
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import pyarrow.parquet as pq
import pyarrow as pa

# Ensure we're in the right directory structure
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
RAW_DIR = os.path.join(DATASETS_DIR, "raw")
DB_PATH = os.path.join(DATASETS_DIR, "helios_analytics.duckdb")

os.makedirs(RAW_DIR, exist_ok=True)

def generate_saas_data():
    """Generates realistic SaaS analytics data: users, subscriptions, and events."""
    print("Generating synthetic SaaS data...")
    
    # 1. Users
    num_users = 5000
    np.random.seed(42)
    user_ids = np.arange(1, num_users + 1)
    signup_dates = [datetime(2023, 1, 1) + timedelta(days=int(d)) for d in np.random.randint(0, 365, num_users)]
    
    users_df = pd.DataFrame({
        "user_id": user_ids,
        "signup_date": signup_dates,
        "country": np.random.choice(["US", "UK", "CA", "DE", "FR", "JP", "IN"], num_users, p=[0.4, 0.15, 0.1, 0.1, 0.1, 0.05, 0.1]),
        "acquisition_channel": np.random.choice(["Organic", "Paid Social", "Paid Search", "Referral", "Direct"], num_users)
    })
    
    # 2. Subscriptions
    # About 60% of users have active subscriptions
    active_mask = np.random.rand(num_users) < 0.6
    sub_users = users_df[active_mask].copy()
    
    plans = ["Starter", "Pro", "Enterprise"]
    plan_prices = {"Starter": 29.0, "Pro": 99.0, "Enterprise": 499.0}
    
    sub_users["plan_tier"] = np.random.choice(plans, len(sub_users), p=[0.5, 0.4, 0.1])
    sub_users["mrr"] = sub_users["plan_tier"].map(plan_prices)
    sub_users["status"] = np.random.choice(["Active", "Past Due", "Canceled"], len(sub_users), p=[0.85, 0.05, 0.10])
    
    subs_df = sub_users[["user_id", "plan_tier", "mrr", "status"]]
    
    # 3. Events (Daily logins/actions)
    num_events = 50000
    event_dates = [datetime(2023, 1, 1) + timedelta(days=int(d)) for d in np.random.randint(0, 365, num_events)]
    
    events_df = pd.DataFrame({
        "event_id": np.arange(1, num_events + 1),
        "user_id": np.random.choice(user_ids, num_events),
        "event_date": event_dates,
        "event_type": np.random.choice(["login", "view_dashboard", "run_query", "export_data"], num_events, p=[0.4, 0.3, 0.2, 0.1])
    })
    
    # Write to Parquet
    print("Writing to Parquet...")
    users_table = pa.Table.from_pandas(users_df)
    pq.write_table(users_table, os.path.join(RAW_DIR, "users.parquet"))
    
    subs_table = pa.Table.from_pandas(subs_df)
    pq.write_table(subs_table, os.path.join(RAW_DIR, "subscriptions.parquet"))
    
    events_table = pa.Table.from_pandas(events_df)
    pq.write_table(events_table, os.path.join(RAW_DIR, "events.parquet"))
    
    return os.path.join(RAW_DIR, "users.parquet"), os.path.join(RAW_DIR, "subscriptions.parquet"), os.path.join(RAW_DIR, "events.parquet")

def seed_duckdb(users_file, subs_file, events_file):
    """Loads Parquet files into DuckDB tables."""
    print(f"Connecting to DuckDB at {DB_PATH}")
    
    # Remove existing DB to ensure clean state if requested, or just overwrite tables
    conn = duckdb.connect(DB_PATH)
    
    print("Creating views over Parquet files...")
    
    # We create tables rather than just views so we have actual data in the DB file for easy local querying
    conn.execute(f"CREATE TABLE IF NOT EXISTS users AS SELECT * FROM read_parquet('{users_file}');")
    conn.execute(f"CREATE TABLE IF NOT EXISTS subscriptions AS SELECT * FROM read_parquet('{subs_file}');")
    conn.execute(f"CREATE TABLE IF NOT EXISTS events AS SELECT * FROM read_parquet('{events_file}');")
    
    print("Seed complete. Validating row counts:")
    print("Users:", conn.execute("SELECT COUNT(*) FROM users").fetchone()[0])
    print("Subscriptions:", conn.execute("SELECT COUNT(*) FROM subscriptions").fetchone()[0])
    print("Events:", conn.execute("SELECT COUNT(*) FROM events").fetchone()[0])
    
    conn.close()

if __name__ == "__main__":
    u_file, s_file, e_file = generate_saas_data()
    seed_duckdb(u_file, s_file, e_file)
    print("✅ Seed script finished successfully.")
