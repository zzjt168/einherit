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
    assert "item_count" in hand and "generated_at" in hand, hand
    assert "heirs" in hand, hand

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
    assert job.get("status_label") in ("可执行", "已提交", "待授权", "已完成"), job
    assert "travel_budget_label" in job or job.get("travel_budget") == 2000, job

    lead = call(
        "/api/executor-lead",
        {
            "name": "自检加盟",
            "province": "湖北",
            "city": "武汉",
            "region": "武昌",
            "phone": "13800000000",
        },
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

    # 医旅意向详情 + 撤回
    hospitals = call("/api/hospitals")
    hid = hospitals["items"][0]["id"]
    intent = call(
        "/api/hospitals/intent", {"hospital_id": hid, "note": "自检医旅意向"}
    )["intent"]
    assert intent.get("status") == "open", intent
    intents = call("/api/hospitals/intents")
    assert any(i.get("id") == intent["id"] for i in intents.get("items") or []), intents
    detail = call(f"/api/hospitals/intent?id={intent['id']}")
    assert detail["item"]["id"] == intent["id"], detail
    cancelled = call("/api/hospitals/intent/cancel", {"id": intent["id"]})["intent"]
    assert cancelled.get("status") == "cancelled", cancelled
    assert lead.get("province") == "湖北", lead
    assert lead.get("region") == "武昌", lead

    leads = call("/api/executor-leads")
    assert any(x.get("id") == lead["id"] for x in leads["items"]), leads

    updated = call(
        "/api/executor-lead",
        {
            "id": lead["id"],
            "name": "自检加盟",
            "province": "湖北",
            "city": "武汉",
            "region": "洪山",
            "phone": "13800000000",
        },
    )["item"]
    assert updated.get("region") == "洪山", updated

    assets = call(
        "/api/assets", {"platform": "自检平台", "tag": "账号"}
    )["item"]
    assert assets["platform"] == "自检平台", assets
    assert assets.get("tag") == "账号", assets

    today = call("/api/today")
    assert len(today.get("items") or []) == 3, today
    assert "escalation" in today, today
    assert today["escalation"].get("state"), today

    refund = call("/api/membership/lapse", {})
    assert "refunded" in refund, refund
    fund = call("/api/travel-fund")["fund"]
    assert "threshold" in fund and "last_refund" in fund, fund

    b = call(
        "/api/beneficiaries",
        {
            "name": "自检受益人",
            "role": "heir",
            "relation": "子女",
            "contact": "13900000000",
            "passphrase_hint": "生日后四位提示",
        },
    )["item"]
    assert b["name"] == "自检受益人", b
    assert b.get("relation") == "子女", b
    assert "生日" in (b.get("passphrase_hint") or ""), b

    updated = call(
        "/api/beneficiaries/update",
        {"id": b["id"], "name": "自检受益人·改", "relation": "长子"},
    )["item"]
    assert updated["name"] == "自检受益人·改", updated
    assert updated.get("relation") == "长子", updated

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
    assert "summary" in snap and "item_count" in snap["summary"], snap
    snaps = call("/api/snapshots")
    assert snaps.get("latest"), snaps
    snap_one = call(f"/api/snapshot?id={snap['id']}")
    assert snap_one["item"]["id"] == snap["id"], snap_one

    audit = call("/api/audit")
    assert any(a.get("label") for a in audit.get("items") or []), audit

    # 会员与报备同屏字段
    me = call("/api/me")["user"]
    assert "checkin_interval_hours" in me and "grace_hours" in me, me
    assert "is_member" in me, me

    learn = call("/api/learnings")
    assert learn.get("adopted_now"), learn

    # export printable
    import urllib.request as u2

    with u2.urlopen(BASE + "/export/handover.html", timeout=5) as r:
        html = r.read().decode()
    assert "交割手册" in html, html[:200]
    assert "条目" in html or "生成" in html, html[:300]

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

    # round4：引导 / 报备历史 / 医院详情 / 导出包 / 部门排序
    ob = call("/api/onboarding")
    assert ob.get("total") == 3 and "steps" in ob, ob
    assert ob["complete"] is True, ob

    hist = call("/api/checkin/history?limit=5")
    assert "items" in hist and len(hist["items"]) >= 1, hist

    hid = hospitals["items"][0]["id"]
    detail = call(f"/api/hospitals?id={hid}")
    assert detail["item"]["id"] == hid, detail
    assert detail["item"].get("address") or detail["item"].get("dept"), detail

    pack = call("/api/export/pack")
    assert pack.get("domain") == "einherit.cn", pack
    assert "legacy_items" in pack and "beneficiaries" in pack, pack
    phones = [c.get("phone", "") for c in pack.get("user", {}).get("backup_contacts", [])]
    assert phones and all("****" in p for p in phones if p), pack

    co2 = call("/api/company")
    note_id = None
    for d in co2["depts"]:
        if d.get("notes"):
            note_id = d["notes"][0]["id"]
            break
    assert note_id, co2
    reordered = call(
        "/api/company/note/reorder",
        {"id": note_id, "direction": "down"},
    )
    assert "depts" in reordered, reordered

    print("selfcheck OK")


if __name__ == "__main__":
    main()
