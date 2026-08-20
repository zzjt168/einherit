#!/usr/bin/env python3
"""ponytail: one runnable check — fails if core digital-legacy flows break."""
from __future__ import annotations

import json
import urllib.request

BASE = "http://127.0.0.1:8877"


def call(path: str, data: dict | None = None) -> dict:
    body = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(
        BASE + path,
        data=body,
        headers={"Content-Type": "application/json"} if body else {},
        method="GET" if body is None else "POST",
    )
    with urllib.request.urlopen(req, timeout=5) as r:
        return json.loads(r.read().decode())


def main() -> None:
    h = call("/api/health")
    assert h.get("ok") is True, h

    u = call("/api/membership/pay", {})["user"]
    assert u["is_member"] is True, u

    call("/api/checkin", {})
    fund = call("/api/travel-fund", {"amount": 2000})["fund"]
    assert fund["balance"] >= 2000, fund

    item = call(
        "/api/legacy",
        {"title": "自检条目", "category": "其他", "action": "销毁"},
    )["item"]
    assert item["title"] == "自检条目", item

    hospitals = call("/api/hospitals")
    assert len(hospitals["items"]) >= 1, hospitals

    company = call("/api/company")
    assert company["progress"]["total"] == 5, company

    guard = call("/api/self-guard")
    assert len(guard["items"]) == 7, guard
    assert guard["items"][0]["sin"] == "色欲", guard

    hand = call("/api/handover")
    assert hand["domain"] == "einherit.cn", hand

    icu = call("/api/icu-pack", {"beneficiary": "自检接收人"})
    assert len(icu["items"]) == 4, icu

    job = call(
        "/api/aftercare",
        {
            "service_type": "field_visit",
            "title": "自检上门清数据",
            "city": "武汉",
            "travel_budget": 2000,
            "coop_state": "cooperative",
        },
    )["item"]
    assert job["title"] == "自检上门清数据", job

    lead = call(
        "/api/executor-lead",
        {"name": "自检加盟", "city": "武汉", "phone": "13800000000"},
    )["item"]
    assert lead["name"] == "自检加盟", lead

    assets = call("/api/assets", {"platform": "自检平台"})["item"]
    assert assets["platform"] == "自检平台", assets

    refund = call("/api/membership/lapse", {})
    assert "refunded" in refund, refund

    h = call("/api/health")
    assert h.get("domain") == "einherit.cn", h
    assert "继承" in h.get("app", ""), h
    assert h.get("version") == "0.3.0", h

    print("selfcheck OK")


if __name__ == "__main__":
    main()
