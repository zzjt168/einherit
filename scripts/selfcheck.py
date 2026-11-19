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
    assert "gaps" in company, company

    guard = call("/api/self-guard")
    assert len(guard["items"]) == 7, guard
    assert guard["items"][0]["sin"] == "色欲", guard
    assert [i["sin"] for i in guard["items"]] == [
        "色欲",
        "暴食",
        "贪婪",
        "懒惰",
        "暴怒",
        "嫉妒",
        "傲慢",
    ], guard

    hand = call("/api/handover")
    assert hand["domain"] == "einherit.cn", hand
    assert "progress" in hand and "by_action" in hand["progress"], hand

    icu = call("/api/icu-pack", {"beneficiary": "自检接收人"})
    assert len(icu["items"]) == 4, icu
    icu_get = call("/api/icu-pack")
    assert icu_get.get("ready") is True, icu_get

    # 授权说明视频门槛（对标案例：问候+授权+处置思路）
    av = call(
        "/api/auth-video",
        {
            "demo": True,
            "has_greeting": True,
            "has_authorize": True,
            "has_plan": True,
            "note": "自检演示",
        },
    )
    assert av["status"]["ready"] is True, av

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
    leads = call("/api/executor-lead")
    assert any(x.get("name") == "自检加盟" for x in leads.get("items") or []), leads

    assets = call(
        "/api/assets",
        {"platform": "自检平台", "dispose_note": "销毁"},
    )["item"]
    assert assets["platform"] == "自检平台", assets
    assert "销毁" in (assets.get("dispose_note") or ""), assets

    # 备用联系人可写回
    me = call(
        "/api/me",
        {
            "backup_contacts": [
                {"name": "自检备用", "relation": "家人", "phone": "13700000000"}
            ]
        },
    )["user"]
    assert any(c.get("name") == "自检备用" for c in me.get("backup_contacts") or []), me

    # 医旅意向闭环
    hospitals = call("/api/hospitals")
    hid = hospitals["items"][0]["id"]
    call("/api/hospitals/intent", {"hospital_id": hid, "note": "自检意向"})
    intents = call("/api/hospitals/intents")
    assert any(i.get("note") == "自检意向" for i in intents.get("items") or []), intents

    refund = call("/api/membership/lapse", {})
    assert "refunded" in refund, refund
    fund = call("/api/travel-fund")["fund"]
    assert "threshold" in fund and "last_refund" in fund, fund

    b = call(
        "/api/beneficiaries",
        {"name": "自检受益人", "role": "heir", "contact": "13900000000"},
    )["item"]
    assert b["name"] == "自检受益人", b

    em = call(
        "/api/emergency/request",
        {"beneficiary_id": b["id"], "wait_days": 7, "reason": "自检"},
    )["item"]
    assert em["status"] == "pending", em

    denied = call(
        "/api/emergency/decide",
        {"id": em["id"], "approve": False, "note": "自检拒绝"},
    )["item"]
    assert denied["status"] == "denied", denied

    snap = call("/api/handover/snapshot", {"label": "自检快照"})["item"]
    assert "自检" in snap["label"] or snap["label"], snap

    learn = call("/api/learnings")
    assert learn.get("adopted_now"), learn

    # export printable
    import urllib.request as u2

    with u2.urlopen(BASE + "/export/handover.html", timeout=5) as r:
        html = r.read().decode()
    assert "交割手册" in html, html[:200]

    with u2.urlopen(BASE + "/export/icu.html", timeout=5) as r:
        icu_html = r.read().decode()
    assert "急症前清册" in icu_html or "冷静摘要" in icu_html, icu_html[:200]

    h = call("/api/health")
    assert h.get("domain") == "einherit.cn", h
    assert "继承" in h.get("app", ""), h
    assert h.get("version") == "0.5.0", h

    mm = call("/api/mindmap")
    assert mm["map"]["center"]["label"] == "主人", mm
    assert any(n["label"] == "长子" for n in [mm["map"].get("heir_bridge", {})]), mm

    print("selfcheck OK")


if __name__ == "__main__":
    main()
