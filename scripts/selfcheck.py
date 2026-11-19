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

    assets = call("/api/assets", {"platform": "自检平台"})["item"]
    assert assets["platform"] == "自检平台", assets

    refund = call("/api/membership/lapse", {})
    assert "refunded" in refund, refund

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

    h = call("/api/health")
    assert h.get("domain") == "einherit.cn", h
    assert "继承" in h.get("app", ""), h
    assert h.get("version") == "0.5.0", h
    assert h.get("server_version"), h

    mm = call("/api/mindmap")
    assert mm["map"]["center"]["label"] == "主人", mm
    assert any(n["label"] == "长子" for n in [mm["map"].get("heir_bridge", {})]), mm

    # Round5 · 受益人挂到交割条目
    linked = call(
        "/api/legacy",
        {
            "title": "自检·受益人条目",
            "category": "其他",
            "action": "销毁数据后转赠",
            "beneficiary_id": b["id"],
        },
    )["item"]
    assert linked.get("beneficiary_id") == b["id"], linked
    assert linked.get("beneficiary") == b["name"], linked

    # 急症前清册勾选持久化
    icu_state = call("/api/icu-checklist")
    assert icu_state.get("total") == 4, icu_state
    key0 = icu_state["items"][0]["pack_key"]
    saved = call("/api/icu-checklist", {"pack_key": key0, "checked": True})
    assert saved["items"][0]["checked"] is True, saved
    again = call("/api/icu-checklist")
    assert again["items"][0]["checked"] is True, again

    # 善后工单联系窗口
    job2 = call(
        "/api/aftercare",
        {
            "service_type": "field_visit",
            "title": "自检联系窗口工单",
            "city": "海口",
            "visit_pref": "需家属在场",
            "contact_window": "工作日上午",
            "travel_budget": 2000,
            "coop_state": "cooperative",
            "notes": "自检备注",
        },
    )["item"]
    assert job2.get("contact_window") == "工作日上午", job2

    # 差旅门槛字段（GET）
    tf = call("/api/travel-fund")
    assert "meets_threshold" in tf["fund"], tf
    assert tf["fund"]["threshold"] == 2000, tf

    # 手册条数核对
    hand2 = call("/api/handover")
    assert "item_count" in hand2 and hand2["item_count"] >= 1, hand2
    assert "beneficiary_count" in hand2, hand2

    # 审计筛选
    aud = call("/api/audit?type=checkin")
    assert all(i.get("type") == "checkin" for i in aud.get("items") or []), aud
    assert aud.get("types"), aud

    # 冷静期剩余字段（只读）
    me = call("/api/me")["user"]
    assert "grace_remaining_seconds" in me, me

    # 危险操作删除（交割 / 备忘 / 受益人）
    gone = call("/api/legacy/delete", {"id": linked["id"]})
    assert gone.get("ok") is True, gone
    asset = call("/api/assets", {"platform": "自检待删平台"})["item"]
    gone_a = call("/api/assets/delete", {"id": asset["id"]})
    assert gone_a.get("ok") is True, gone_a
    b2 = call(
        "/api/beneficiaries",
        {"name": "自检待删受益人", "role": "family", "contact": "13700000000"},
    )["item"]
    gone_b = call("/api/beneficiaries/delete", {"id": b2["id"]})
    assert gone_b.get("ok") is True, gone_b

    print("selfcheck OK")


if __name__ == "__main__":
    main()
