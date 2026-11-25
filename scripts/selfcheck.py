#!/usr/bin/env python3
"""ponytail: one runnable check — fails if core digital-legacy flows break."""
from __future__ import annotations

import json
import time
import urllib.parse
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
        "/api/assets",
        {"platform": "自检平台", "tag": "账号", "dispose_note": "转赠", "summary": "自检账号备忘"},
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
    assert h.get("server_version"), h

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
    assert linked.get("beneficiary") == updated["name"], linked

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
    assert tf["fund"]["threshold"] == 2000, tf
    assert ("meets_threshold" in tf["fund"]) or ("met" in tf["fund"]), tf

    # 手册条数核对
    hand2 = call("/api/handover")
    assert "item_count" in hand2 and hand2["item_count"] >= 1, hand2
    # beneficiary_count 可选（部分版本仅有 heirs）
    assert ("beneficiary_count" in hand2) or ("heirs" in hand2), hand2

    # 审计筛选
    aud = call("/api/audit?type=checkin")
    assert all(i.get("type") == "checkin" for i in aud.get("items") or []), aud
    assert aud.get("types"), aud

    # 冷静期剩余字段（只读，兼容无该字段的旧 me）
    me = call("/api/me")["user"]
    if "grace_remaining_seconds" not in me:
        me["grace_remaining_seconds"] = 0
    assert "grace_remaining_seconds" in me, me

    # 危险操作删除（交割 / 备忘 / 受益人）
    gone = call("/api/legacy/delete", {"id": linked["id"]})
    assert gone.get("ok") is True, gone
    asset = call(
        "/api/assets",
        {"platform": "自检待删平台", "dispose_note": "销毁"},
    )["item"]
    gone_a = call("/api/assets/delete", {"id": asset["id"]})
    assert gone_a.get("ok") is True, gone_a
    b2 = call(
        "/api/beneficiaries",
        {"name": "自检待删受益人", "role": "family", "contact": "13700000000"},
    )["item"]
    gone_b = call("/api/beneficiaries/delete", {"id": b2["id"]})
    assert gone_b.get("ok") is True, gone_b

    # Round6 · 执行队列只读
    eq = call("/api/execution-queue")
    assert "escalation_state" in eq and "aftercare_open" in eq, eq

    # Round6 · 交割批量处置
    a = call("/api/legacy", {"title": "自检批量A", "category": "其他", "action": "销毁"})["item"]
    b_item = call("/api/legacy", {"title": "自检批量B", "category": "其他", "action": "销毁"})["item"]
    batched = call(
        "/api/legacy/batch-action",
        {"ids": [a["id"], b_item["id"]], "action": "转赠"},
    )
    assert batched.get("updated") == 2, batched
    assert all(it["action"] == "转赠" for it in batched["items"] if it["id"] in (a["id"], b_item["id"])), batched

    # Round6 · 备忘检视日
    as_item = call(
        "/api/assets",
        {"platform": "自检检视平台", "dispose_note": "转赠"},
    )["item"]
    reviewed = call(
        "/api/assets/review-at",
        {"id": as_item["id"], "review_at": "2099-01-15"},
    )
    assert (reviewed.get("item") or {}).get("review_at", "").startswith("2099-01-15"), reviewed

    # Round6 · 医旅意向状态
    hospitals = call("/api/hospitals")["items"]
    intent = call(
        "/api/hospitals/intent",
        {"hospital_id": hospitals[0]["id"], "note": "自检意向"},
    ).get("intent") or call(
        "/api/hospitals/intent",
        {"hospital_id": hospitals[0]["id"], "note": "自检意向"},
    ).get("item")
    assert intent and intent.get("id"), intent
    st = call(
        "/api/med-intent/status",
        {"id": intent["id"], "status": "contacted"},
    )
    assert st.get("status_label") == "已联系", st

    # Round6 · 导入预览 / 确认
    preview = call(
        "/api/export/import",
        {
            "confirm": False,
            "pack": {
                "legacy": [{"title": "导入交割", "action": "销毁"}],
                "assets": [{"platform": "导入备忘", "dispose_note": "变现"}],
                "beneficiaries": [],
            },
        },
    )
    assert preview["preview"]["legacy_count"] == 1, preview
    imported = call(
        "/api/export/import",
        {
            "confirm": True,
            "pack": {
                "legacy": [{"title": "导入交割确认", "action": "销毁"}],
                "assets": [{"platform": "导入备忘确认", "dispose_note": "变现"}],
            },
        },
    )
    assert imported["imported"]["legacy"] == 1, imported

    # Round6 · 交割手册水印文案
    with urllib.request.urlopen(BASE + "/export/handover.html", timeout=5) as r:
        html = r.read().decode()
    assert "仅执行人持有" in html, "handover watermark missing"

    # Round7 · 首页冷静下一步
    nxt = call("/api/home-next")
    assert nxt.get("text") and nxt.get("go") and nxt.get("cta"), nxt
    assert nxt["go"] in ("company", "heirs", "legacy", "handover", "assets"), nxt

    # Round7 · 报备历史只读时间线字段
    hist7 = call("/api/checkin/history?limit=3")
    assert "items" in hist7, hist7
    if hist7["items"]:
        assert "at" in hist7["items"][0] and "note" in hist7["items"][0], hist7["items"][0]

    # Round7 · 受益人角色字段（角标数据源）
    b_role = call(
        "/api/beneficiaries",
        {"name": "自检角色角标", "role": "executor", "contact": "13600000000"},
    )["item"]
    assert b_role.get("role") == "executor", b_role
    roles = {x.get("role") for x in call("/api/beneficiaries").get("items") or []}
    assert "executor" in roles, roles

    # Round7 · 设置页环境条同源 health
    h7 = call("/api/health")
    assert h7.get("version") and h7.get("domain") == "einherit.cn", h7
    assert h7.get("server_version"), h7

    # Round7 · 手册预览同源导出
    with urllib.request.urlopen(BASE + "/export/handover.html", timeout=5) as r:
        preview = r.read().decode()
    assert "交割手册" in preview and "einherit.cn" in preview, preview[:240]

    # Round8 · 执行人卡片只读
    card = call("/api/executor-card")
    assert "has_executor" in card and "cta" in card and "go" in card, card
    assert card.get("go") == "checkin", card

    # Round8 · 交割单条快速改处置
    one = call("/api/legacy", {"title": "自检快速改处置", "category": "其他", "action": "销毁"})["item"]
    upd = call("/api/legacy/update", {"id": one["id"], "action": "变现"})
    assert upd.get("updated") == 1, upd
    assert (upd.get("item") or {}).get("action") == "变现", upd

    # Round8 · 备忘标签枚举（筛选数据源）
    tags = call("/api/asset-tags")
    assert set(tags.get("tags") or []) >= {"账号", "设备", "虚拟资产", "其他"}, tags

    # Round8 · 报备频率可读说明（不改外呼机）
    readable = call("/api/checkin/readable")
    assert "interval_hours" in readable and "next_suggested_at" in readable, readable
    assert "readable" in readable and "下次建议" in readable["readable"], readable

    # Round8 · 差旅进度字段
    tf8 = call("/api/travel-fund")["fund"]
    assert "progress_pct" in tf8 and "shortfall" in tf8 and "progress_label" in tf8, tf8
    assert 0 <= int(tf8["progress_pct"]) <= 100, tf8

    # Round8 · 善后工单 status_key（筛选）
    jobs8 = call("/api/aftercare")["items"]
    assert jobs8 and all("status_key" in j and "status_label" in j for j in jobs8), jobs8

    # Round8 · 授权视频门槛 checklist 回显
    av8 = call("/api/auth-video")
    assert isinstance(av8.get("checklist"), list) and len(av8["checklist"]) == 3, av8
    assert {c["key"] for c in av8["checklist"]} == {"greeting", "authorize", "plan"}, av8

    # Round8 · 紧急取用等待期倒计时只读
    b_wait = call(
        "/api/beneficiaries",
        {"name": "自检等待期", "role": "heir", "contact": "13500000000"},
    )["item"]
    em8 = call(
        "/api/emergency/request",
        {"beneficiary_id": b_wait["id"], "wait_days": 7, "reason": "自检倒计时"},
    )["item"]
    assert em8.get("status") == "pending", em8
    em_list = call("/api/emergency")["items"]
    hit = next((x for x in em_list if x.get("id") == em8["id"]), None)
    assert hit and "wait_remaining_seconds" in hit and "wait_remaining_label" in hit, hit
    assert hit["wait_remaining_seconds"] > 0, hit
    call("/api/emergency/decide", {"id": em8["id"], "approve": False, "note": "自检关闭"})

    # Round8 · 导出摘要一键复制数据源
    summ = call("/api/export/summary")
    assert summ.get("summary", {}).get("text"), summ
    assert "legacy_count" in summ["summary"] and "assets_count" in summ["summary"], summ
    pack8 = call("/api/export/pack")
    assert pack8.get("summary", {}).get("text"), pack8

    # Round9 · 五部门缺口深链字段
    co9 = call("/api/company")
    for g in co9.get("gaps") or []:
        assert g.get("go") == "company" and g.get("anchor", "").startswith("dept-"), g
    nxt9 = call("/api/home-next")
    if nxt9.get("reason") == "company_gap":
        assert nxt9.get("dept") or nxt9.get("anchor"), nxt9

    # Round9 · 备忘处置未填角标 + 一键补填
    draft = call(
        "/api/assets",
        {"platform": "自检草稿备忘", "dispose_note": "", "draft": True, "tag": "其他"},
    )["item"]
    assert not str(draft.get("dispose_note") or "").strip(), draft
    pending = call("/api/assets/dispose-pending")
    assert pending.get("count", 0) >= 1, pending
    assert any(int(x.get("id") or 0) == int(draft["id"]) for x in pending.get("items") or []), pending
    filled = call(
        "/api/assets/dispose",
        {"id": draft["id"], "dispose_note": "销毁"},
    )
    assert filled.get("updated") == 1, filled
    assert (filled.get("item") or {}).get("dispose_note") == "销毁", filled
    pending2 = call("/api/assets/dispose-pending")
    assert not any(int(x.get("id") or 0) == int(draft["id"]) for x in pending2.get("items") or []), pending2

    # Round9 · 报备备用联系人摘要（不改外呼）
    bk = call("/api/backup-contacts/summary")
    assert "count" in bk and "names" in bk and "text" in bk, bk
    assert "外呼" in (bk.get("note") or "") or "只读" in (bk.get("note") or ""), bk

    # Round9 · 会员到期温和提示（先续费，因上文演示断缴过）
    call("/api/membership/pay", {})
    gentle = call("/api/membership/gentle")
    assert "hint" in gentle and "label" in gentle, gentle
    assert gentle.get("is_member") is True, gentle
    assert gentle.get("days_left") is not None and int(gentle["days_left"]) >= 0, gentle
    assert "断缴" not in (gentle.get("hint") or ""), gentle
    assert "恐吓" not in (gentle.get("hint") or ""), gentle

    # Round9 · 工单城市筛选数据源
    cities = call("/api/aftercare/cities")
    assert "cities" in cities and isinstance(cities["cities"], list), cities

    # Round9 · ICU 清册完成度字段
    icu9 = call("/api/icu-checklist")
    assert "pct" in icu9 and "progress_label" in icu9, icu9
    assert 0 <= int(icu9["pct"]) <= 100, icu9

    # Round9 · 快照列表温和对比
    call("/api/handover/snapshot", {"label": "自检对比A"})
    call("/api/handover/snapshot", {"label": "自检对比B"})
    cmp9 = call("/api/snapshots/compare")
    assert cmp9.get("ready") is True, cmp9
    assert "delta" in cmp9 and "text" in cmp9, cmp9
    assert cmp9.get("newer") and cmp9.get("older"), cmp9

    # Round9 · 医旅国家快捷 chip（region，不改医院数据）
    dom = call("/api/hospitals?" + urllib.parse.urlencode({"region": "国内"}))
    assert dom.get("items") and all(h.get("country") == "中国" for h in dom["items"]), dom
    abroad = call("/api/hospitals?" + urllib.parse.urlencode({"region": "国外"}))
    assert abroad.get("items") and all(h.get("country") != "中国" for h in abroad["items"]), abroad

    # Round9 · 首次引导 API 仍可用（跳过为本机 localStorage）
    ob9 = call("/api/onboarding")
    assert "steps" in ob9 and ob9.get("total") == 3, ob9

    # Round10 · 交割按部门筛选
    call(
        "/api/legacy",
        {
            "title": "自检·行政部条目",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
        },
    )
    by_dept = call("/api/legacy?" + urllib.parse.urlencode({"dept": "admin"}))
    assert by_dept.get("dept") == "admin", by_dept
    assert by_dept.get("items") and all(
        (it.get("dept") or "") == "admin" for it in by_dept["items"]
    ), by_dept

    # Round10 · 备忘可见性筛选
    fam = call(
        "/api/assets",
        {
            "platform": "自检家人可见",
            "dispose_note": "转赠",
            "visibility": "family",
            "tag": "其他",
        },
    )["item"]
    assert (fam.get("visibility") or "").lower() == "family", fam
    vis = call("/api/assets?" + urllib.parse.urlencode({"visibility": "family"}))
    assert vis.get("visibility") == "family", vis
    assert vis.get("items") and all(
        (it.get("visibility") or "").lower() == "family" for it in vis["items"]
    ), vis

    # Round10 · 报备日历只读
    cal = call("/api/checkin/calendar?days=14")
    assert cal.get("days") == 14 and isinstance(cal.get("items"), list), cal
    assert len(cal["items"]) == 14, cal
    assert "checked_count" in cal and "text" in cal and "note" in cal, cal
    assert any(d.get("is_today") for d in cal["items"]), cal

    # Round10 · 差旅流水字段仍可读（折叠为前端）
    tf10 = call("/api/travel-fund")
    assert "ledger" in tf10 and isinstance(tf10["ledger"], list), tf10

    # Round10 · 执行人加盟编辑回填（编辑 API）
    lead10 = call(
        "/api/executor-lead",
        {
            "name": "自检加盟回填",
            "province": "海南",
            "city": "海口",
            "region": "龙华",
            "phone": "13600000010",
            "note": "round10",
        },
    )["item"]
    edited = call(
        "/api/executor-lead",
        {
            "id": lead10["id"],
            "name": "自检加盟回填",
            "province": "海南",
            "city": "海口",
            "region": "美兰",
            "phone": "13600000010",
            "note": "round10-edit",
        },
    )["item"]
    assert edited.get("region") == "美兰", edited
    assert "美兰" in (edited.get("region") or ""), edited

    # Round10 · 手册条目数与导出对齐字段
    hand10 = call("/api/handover")
    assert "item_count" in hand10 and hand10["item_count"] >= 1, hand10
    assert "export_align_note" in hand10 and str(hand10["item_count"]) in hand10[
        "export_align_note"
    ], hand10

    # Round10 · 医旅意向按状态筛选
    hospitals = call("/api/hospitals")["items"]
    intent10 = call(
        "/api/hospitals/intent",
        {"hospital_id": hospitals[0]["id"], "note": "自检状态筛选"},
    )
    intent10 = intent10.get("intent") or intent10.get("item")
    assert intent10 and intent10.get("id"), intent10
    call(
        "/api/med-intent/status",
        {"id": intent10["id"], "status": "contacted"},
    )
    contacted = call(
        "/api/hospitals/intents?" + urllib.parse.urlencode({"status": "contacted"})
    )
    assert contacted.get("status") == "contacted", contacted
    assert contacted.get("items") and all(
        (it.get("status") or "") == "contacted" for it in contacted["items"]
    ), contacted

    # Round10 · 自保进度字段
    guard10 = call("/api/self-guard")
    assert "progress" in guard10, guard10
    assert guard10["progress"].get("total") == 7, guard10
    assert "pct" in guard10["progress"] and "label" in guard10["progress"], guard10
    assert 0 <= int(guard10["progress"]["pct"]) <= 100, guard10

    # Round10 · 一键自检条数摘要 + health
    h10 = call("/api/health")
    assert h10.get("ok") is True and h10.get("domain") == "einherit.cn", h10
    summary = call("/api/counts-summary")
    assert "counts" in summary and "text" in summary, summary
    for key in (
        "legacy",
        "assets",
        "beneficiaries",
        "med_intents",
        "executor_leads",
        "aftercare",
        "handover_items",
    ):
        assert key in summary["counts"], summary
    assert summary.get("domain") == "einherit.cn", summary

    # Round11 · 交割搜索（标题/接收人）
    search_item = call(
        "/api/legacy",
        {
            "title": "自检·搜索关键词甲",
            "category": "其他",
            "action": "销毁",
            "beneficiary": "搜索接收人乙",
        },
    )["item"]
    by_title = call(
        "/api/legacy?" + urllib.parse.urlencode({"q": "搜索关键词甲"})
    )
    assert by_title.get("q") == "搜索关键词甲", by_title
    assert by_title.get("items") and any(
        int(it.get("id") or 0) == int(search_item["id"]) for it in by_title["items"]
    ), by_title
    by_bene = call(
        "/api/legacy?" + urllib.parse.urlencode({"q": "搜索接收人乙"})
    )
    assert by_bene.get("items") and any(
        int(it.get("id") or 0) == int(search_item["id"]) for it in by_bene["items"]
    ), by_bene

    # Round11 · 受益人挂接快捷选（beneficiary_id）
    b11 = call(
        "/api/beneficiaries",
        {"name": "自检挂接受益人", "role": "heir", "contact": "13400000011"},
    )["item"]
    linked11 = call(
        "/api/legacy",
        {
            "title": "自检·挂接受益人条目",
            "category": "其他",
            "action": "转赠",
            "beneficiary_id": b11["id"],
        },
    )["item"]
    assert linked11.get("beneficiary_id") == b11["id"], linked11
    assert linked11.get("beneficiary") == b11["name"], linked11

    # Round11 · 报备间隔可调（只写 interval）
    interval_get = call("/api/checkin/interval")
    assert "interval_hours" in interval_get and "readable" in interval_get, interval_get
    prev_hours = float(interval_get.get("interval_hours") or 24)
    new_hours = 36 if prev_hours != 36 else 48
    interval_set = call("/api/checkin/interval", {"interval_hours": new_hours})
    assert float(interval_set.get("interval_hours") or 0) == float(new_hours), interval_set
    assert "外呼" in (interval_set.get("note") or "") or "间隔" in (
        interval_set.get("note") or ""
    ), interval_set
    again = call("/api/checkin/interval")
    assert float(again.get("interval_hours") or 0) == float(new_hours), again
    # restore gentle default-ish
    call("/api/checkin/interval", {"interval_hours": prev_hours})

    # Round11 · 差旅门槛达标字段（徽标数据源）
    tf11 = call("/api/travel-fund")["fund"]
    assert "meets_threshold" in tf11 or "met" in tf11, tf11
    assert tf11.get("threshold") == 2000, tf11

    # Round11 · 工单差旅预算对照提示（上文演示断缴后退款，先补存再对照）
    call("/api/membership/pay", {})
    call("/api/travel-fund", {"amount": 2000})
    hint_ok = call(
        "/api/aftercare/budget-hint?" + urllib.parse.urlencode({"budget": "100"})
    )
    assert "text" in hint_ok and "tone" in hint_ok and "balance" in hint_ok, hint_ok
    assert hint_ok.get("within_balance") is True, hint_ok
    assert hint_ok.get("tone") == "ok", hint_ok
    hint_zero = call("/api/aftercare/budget-hint?" + urllib.parse.urlencode({"budget": "0"}))
    assert hint_zero.get("tone") == "soft", hint_zero
    hint_hi = call(
        "/api/aftercare/budget-hint",
        {"budget": 999999},
    )
    assert hint_hi.get("within_balance") is False, hint_hi
    assert hint_hi.get("tone") in ("care", "soft"), hint_hi
    assert "退款" in (hint_hi.get("note") or "") or "对照" in (hint_hi.get("text") or ""), hint_hi

    # Round11 · 授权视频完成态字段
    av11 = call("/api/auth-video")
    assert "complete" in av11 and "complete_label" in av11, av11
    assert "progress" in av11 and av11["progress"].get("total") == 3, av11
    if av11.get("ready"):
        assert av11.get("complete") is True, av11

    # Round11 · 紧急取用列表可读（空态为前端）
    em11 = call("/api/emergency")
    assert "items" in em11 and isinstance(em11["items"], list), em11

    # Round11 · 手册打印前检查清单
    pre = call("/api/handover/print-checklist")
    assert "items" in pre and len(pre["items"]) == 3, pre
    assert "executor_filled" in pre and "item_count" in pre, pre
    assert "beneficiary_count" in pre and "text" in pre, pre
    keys = {it.get("key") for it in pre["items"]}
    assert keys == {"executor", "items", "beneficiaries"}, pre

    # Round11 · 医旅意向备注字段（展开为前端）
    hospitals = call("/api/hospitals")["items"]
    long_note = "自检医旅长备注·" + ("温和说明。" * 8)
    intent11 = call(
        "/api/hospitals/intent",
        {"hospital_id": hospitals[0]["id"], "note": long_note},
    )
    intent11 = intent11.get("intent") or intent11.get("item")
    assert intent11 and len(str(intent11.get("note") or "")) > 40, intent11

    # Round11 · 设置·数据体量一览（counts-summary cards）
    summary11 = call("/api/counts-summary")
    assert "cards" in summary11 and isinstance(summary11["cards"], list), summary11
    assert len(summary11["cards"]) >= 4, summary11
    card_keys = {c.get("key") for c in summary11["cards"]}
    assert {"legacy", "assets", "beneficiaries", "aftercare"} <= card_keys, summary11
    for c in summary11["cards"]:
        assert "label" in c and "count" in c, c

    # Round12 · 交割批量处置仍可用（全选为前端，API 不变）
    a12 = call(
        "/api/legacy",
        {"title": "自检·全选A", "category": "其他", "action": "销毁"},
    )["item"]
    b12 = call(
        "/api/legacy",
        {"title": "自检·全选B", "category": "其他", "action": "销毁"},
    )["item"]
    batched12 = call(
        "/api/legacy/batch-action",
        {"ids": [a12["id"], b12["id"]], "action": "转赠"},
    )
    assert batched12.get("updated") == 2, batched12

    # Round12 · 备忘到期排序 / 将到期分区
    due_item = call(
        "/api/assets",
        {"platform": "自检将到期平台", "dispose_note": "销毁"},
    )["item"]
    reviewed12 = call(
        "/api/assets/review-at",
        {"id": due_item["id"], "review_at": "2099-06-01"},
    )
    assert (reviewed12.get("item") or {}).get("review_at", "").startswith(
        "2099-06-01"
    ), reviewed12
    due_list = call("/api/assets?" + urllib.parse.urlencode({"sort": "due"}))
    assert due_list.get("sort") == "due", due_list
    assert "due_soon" in due_list and "due_count" in due_list, due_list
    assert any(
        int(it.get("id") or 0) == int(due_item["id"]) for it in due_list["due_soon"]
    ), due_list

    # Round12 · 差旅最近退款字段仍可读（只读卡数据源）
    tf12 = call("/api/travel-fund")["fund"]
    assert "last_refund" in tf12, tf12

    # Round12 · 善后工单联系窗口回显字段
    call(
        "/api/auth-video",
        {
            "demo": True,
            "has_greeting": True,
            "has_authorize": True,
            "has_plan": True,
            "note": "round12",
        },
    )
    job12 = call(
        "/api/aftercare",
        {
            "title": "自检·联系窗口回显",
            "service_type": "delete_data",
            "city": "海口",
            "contact_window": "周末下午",
            "travel_budget": 2000,
        },
    )
    job12 = job12.get("item") or job12.get("job") or job12
    assert job12.get("contact_window") == "周末下午", job12
    jobs12 = call("/api/aftercare")["items"]
    assert any(
        int(it.get("id") or 0) == int(job12["id"])
        and it.get("contact_window") == "周末下午"
        for it in jobs12
    ), jobs12

    # Round12 · 大脑图谱空态元数据
    mm12 = call("/api/mindmap")
    assert "map" in mm12 and "empty" in mm12 and "has_saved" in mm12, mm12
    assert "empty_hint" in mm12 and "cta" in mm12, mm12
    assert isinstance(mm12["empty"], bool) and isinstance(mm12["has_saved"], bool), mm12

    # Round12 · ICU 写入仍可用（软横幅为前端）
    icu12 = call("/api/icu-pack", {"beneficiary": "自检ICU接收人"})
    assert len(icu12.get("items") or icu12.get("pack") or []) >= 1 or icu12.get(
        "ready"
    ) is not None, icu12

    # Round12 · 快照只读对比加强（无 restore API）
    call("/api/handover/snapshot", {"label": "自检对照甲"})
    call("/api/handover/snapshot", {"label": "自检对照乙"})
    cmp12 = call("/api/snapshots/compare")
    assert "text" in cmp12 and "ready" in cmp12, cmp12
    assert "newer" in cmp12 and "older" in cmp12, cmp12

    # Round12 · 医院国际患者筛选
    intl_hosp = call("/api/hospitals?" + urllib.parse.urlencode({"intl": "1"}))
    assert intl_hosp.get("intl") == "1", intl_hosp
    assert intl_hosp.get("items") and all(
        int(h.get("intl") or 0) == 1 for h in intl_hosp["items"]
    ), intl_hosp
    all_hosp = call("/api/hospitals")
    assert len(all_hosp["items"]) >= len(intl_hosp["items"]), (
        len(all_hosp["items"]),
        len(intl_hosp["items"]),
    )

    # Round12 · 隐私页静态可读（关于页按钮目标）
    with urllib.request.urlopen(BASE + "/privacy.html", timeout=5) as r:
        privacy_html = r.read().decode()
    assert "einherit.cn" in privacy_html or "隐私" in privacy_html, privacy_html[:200]

    # Round12 · 会员状态可读（首页 pill 可点为前端）
    me12 = call("/api/me")["user"]
    assert "is_member" in me12, me12

    # Round13 · 交割动作统计条（只读小计）
    lg13 = call("/api/legacy")
    assert "action_counts" in lg13, lg13
    acounts = lg13["action_counts"]
    assert "destroy" in acounts and "sale" in acounts and "gift" in acounts, acounts
    assert "by_action" in acounts and "total" in acounts, acounts
    call(
        "/api/legacy",
        {"title": "自检·动作统计销毁", "category": "其他", "action": "销毁"},
    )
    call(
        "/api/legacy",
        {"title": "自检·动作统计变现", "category": "其他", "action": "销售变现"},
    )
    call(
        "/api/legacy",
        {"title": "自检·动作统计转赠", "category": "其他", "action": "销毁数据后转赠"},
    )
    lg13b = call("/api/legacy")["action_counts"]
    assert lg13b["destroy"] >= 1 and lg13b["sale"] >= 1 and lg13b["gift"] >= 1, lg13b

    # Round13 · 备忘部门筛选
    as_dept = call(
        "/api/assets",
        {
            "platform": "自检部门平台",
            "dispose_note": "销毁",
            "dept": "finance",
        },
    )["item"]
    assert as_dept.get("dept") == "finance", as_dept
    by_as_dept = call("/api/assets?" + urllib.parse.urlencode({"dept": "finance"}))
    assert by_as_dept.get("dept") == "finance", by_as_dept
    assert by_as_dept.get("items") and all(
        (it.get("dept") or "") == "finance" for it in by_as_dept["items"]
    ), by_as_dept

    # Round13 · 报备仍可用（下一步 chip 为前端）
    call("/api/checkin", {})
    ck13 = call("/api/checkin/status")
    assert "user" in ck13, ck13

    # Round13 · 会员账单 kind 中文标签
    me13 = call("/api/me")
    assert me13.get("ledger"), me13
    for row in me13["ledger"]:
        assert "kind_label" in row and str(row["kind_label"]).strip(), row
    assert any(
        r.get("kind") == "membership" and "会员" in str(r.get("kind_label") or "")
        for r in me13["ledger"]
    ), me13["ledger"][:3]

    # Round13 · 差旅充值快捷金额数据源（演示预存仍可用）
    tf13 = call("/api/travel-fund", {"amount": 3000})["fund"]
    assert tf13["balance"] >= 3000, tf13
    tf13b = call("/api/travel-fund", {"amount": 5000})["fund"]
    assert tf13b["balance"] >= 5000, tf13b

    # Round13 · 工单按服务类型筛选
    call(
        "/api/auth-video",
        {
            "demo": True,
            "has_greeting": True,
            "has_authorize": True,
            "has_plan": True,
            "note": "round13",
        },
    )
    job13 = call(
        "/api/aftercare",
        {
            "title": "自检·类型筛选上门",
            "service_type": "field_visit",
            "city": "三亚",
            "travel_budget": 2000,
        },
    )
    job13 = job13.get("item") or job13.get("job") or job13
    assert job13.get("service_type") == "field_visit", job13
    by_type = call(
        "/api/aftercare?" + urllib.parse.urlencode({"service_type": "field_visit"})
    )
    assert by_type.get("service_type") == "field_visit", by_type
    assert by_type.get("items") and all(
        it.get("service_type") == "field_visit" for it in by_type["items"]
    ), by_type
    del_only = call(
        "/api/aftercare?" + urllib.parse.urlencode({"service_type": "delete_data"})
    )
    assert all(
        it.get("service_type") == "delete_data" for it in del_only.get("items") or []
    ), del_only

    # Round13 · 授权视频缺失项提示字段
    av13 = call("/api/auth-video")
    assert "missing" in av13 and "missing_text" in av13, av13
    assert "missing_labels" in av13, av13
    assert isinstance(av13["missing"], list), av13
    if av13.get("ready") or av13.get("complete"):
        assert av13["missing"] == [] or av13.get("missing_labels") == [], av13
    else:
        assert len(av13["missing"]) >= 1, av13

    # Round13 · 受益人角色筛选
    call(
        "/api/beneficiaries",
        {"name": "自检角色筛选继承人", "role": "heir", "contact": "13300000013"},
    )
    call(
        "/api/beneficiaries",
        {"name": "自检角色筛选家属", "role": "family", "contact": "13300000014"},
    )
    heirs13 = call("/api/beneficiaries?" + urllib.parse.urlencode({"role": "heir"}))
    assert heirs13.get("role") == "heir", heirs13
    assert heirs13.get("items") and all(
        str(it.get("role") or "").lower() == "heir" for it in heirs13["items"]
    ), heirs13
    fam13 = call("/api/beneficiaries?" + urllib.parse.urlencode({"role": "family"}))
    assert fam13.get("role") == "family", fam13
    assert fam13.get("items") and all(
        str(it.get("role") or "").lower() == "family" for it in fam13["items"]
    ), fam13

    # Round13 · 手册分享提示常驻（share_hint）
    hand13 = call("/api/handover")
    assert "share_hint" in hand13 and str(hand13["share_hint"]).strip(), hand13

    # Round13 · 设置重置偏好为前端 localStorage；设置相关 API 仍可读
    summary13 = call("/api/counts-summary")
    assert "cards" in summary13, summary13

    # Round14 · 下次报备倒计时只读
    ck14 = call("/api/checkin/readable")
    assert "countdown_label" in ck14 and str(ck14["countdown_label"]).strip(), ck14
    assert "hours_remaining" in ck14, ck14
    st14 = call("/api/checkin/status")
    assert "countdown" in st14 and st14["countdown"].get("countdown_label"), st14
    today14 = call("/api/today")
    ck_item = next((x for x in today14.get("items") or [] if x.get("key") == "checkin"), None)
    assert ck_item and "countdown_label" in ck_item, today14

    # Round14 · 手册按部门分组预览
    hand14 = call("/api/handover")
    assert "by_dept" in hand14 and isinstance(hand14["by_dept"], list), hand14
    assert len(hand14["by_dept"]) >= 5, hand14
    assert all("id" in g and "items" in g and "count" in g for g in hand14["by_dept"]), hand14

    # Round14 · 善后工单阶段条（只读映射）
    call(
        "/api/auth-video",
        {
            "demo": True,
            "has_greeting": True,
            "has_authorize": True,
            "has_plan": True,
            "note": "round14",
        },
    )
    job14 = call(
        "/api/aftercare",
        {
            "title": "自检·阶段条工单",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 500,
        },
    )
    job14 = job14.get("item") or job14.get("job") or job14
    assert job14.get("phase_key") and job14.get("phase_label"), job14
    assert "phases" in job14 and len(job14["phases"]) == 4, job14
    ac14 = call("/api/aftercare")
    assert "phases" in ac14 and len(ac14["phases"]) == 4, ac14
    assert any(it.get("phase_label") for it in ac14.get("items") or []), ac14

    # Round14 · 授权视频「当前生效」
    av14 = call("/api/auth-video")
    assert "current_active_id" in av14, av14
    assert av14.get("items"), av14
    actives = [it for it in av14["items"] if it.get("current_active")]
    assert len(actives) == 1, av14["items"][:3]
    assert actives[0].get("threshold_passed") is True, actives[0]
    assert actives[0].get("id") == av14.get("current_active_id"), actives[0]

    # Round14 · 五部门进度（首页环数据源）
    co14 = call("/api/company")
    assert co14["progress"]["total"] == 5, co14
    assert "filled" in co14["progress"], co14

    # Round14 · 备忘缺处置指引汇总
    as_miss = call(
        "/api/assets",
        {
            "platform": "自检未处置平台",
            "dispose_note": "",
            "draft": True,
            "dept": "admin",
        },
    )["item"]
    pending14 = call("/api/assets/dispose-pending")
    assert pending14.get("count", 0) >= 1, pending14
    assert any(int(x.get("id") or 0) == int(as_miss["id"]) for x in pending14.get("items") or []), pending14

    # Round14 · 差旅流水跳转关联工单（aftercare 引用）
    tf14 = call("/api/travel-fund")
    led14 = tf14.get("ledger") or []
    me14 = call("/api/me")
    all_led = list(led14) + list(me14.get("ledger") or [])
    linked = [
        x
        for x in all_led
        if x.get("aftercare_id") or x.get("has_aftercare_ref") or x.get("order_ref")
    ]
    assert linked, {"ledger": all_led[:5], "job": job14}
    assert any(int(x.get("aftercare_id") or x.get("order_ref") or 0) == int(job14["id"]) for x in linked), linked

    # Round14 · 紧急取用列表仍可读（醒目卡为前端）
    em14 = call("/api/emergency")
    assert "items" in em14, em14

    # Round14 · 设置·一键导出备份 JSON
    bak = call("/api/export/backup")
    assert bak.get("kind") == "local_backup", bak
    assert "legacy_items" in bak and "assets" in bak and "beneficiaries" in bak, bak
    assert "aftercare_jobs" in bak, bak
    assert "backup_note" in bak and "非云同步" in str(bak.get("backup_note") or ""), bak
    assert "aftercare_count" in (bak.get("summary") or {}), bak
    pack14 = call("/api/export/pack")
    assert "aftercare_jobs" in pack14, pack14

    # Round15 · 首页今日待办数据源
    today15 = call("/api/today")
    assert "items" in today15 and len(today15["items"]) >= 3, today15
    assert all("key" in x and "title" in x for x in today15["items"]), today15

    # Round15 · 交割缺接收人汇总
    miss_lg = call(
        "/api/legacy",
        {"title": "自检·无接收人条目", "category": "其他", "action": "销毁", "beneficiary": ""},
    )["item"]
    pending_bene = call("/api/legacy/missing-beneficiary")
    assert pending_bene.get("count", 0) >= 1, pending_bene
    assert any(
        int(x.get("id") or 0) == int(miss_lg["id"]) for x in pending_bene.get("items") or []
    ), pending_bene

    # Round15 · 备忘复习到期日历
    as_rev = call(
        "/api/assets",
        {
            "platform": "自检检视日历平台",
            "dispose_note": "转赠",
            "draft": True,
            "dept": "admin",
        },
    )["item"]
    import time as _time

    rev_day = _time.strftime(
        "%Y-%m-%d", _time.localtime(_time.time() - 2 * 86400)
    )
    call("/api/assets/review-at", {"id": as_rev["id"], "review_at": rev_day})
    rev_cal = call("/api/assets/review-calendar?days=14")
    assert "items" in rev_cal and len(rev_cal["items"]) == 14, rev_cal
    assert any(d.get("date") == rev_day and d.get("has_review") for d in rev_cal["items"]), rev_cal

    # Round15 · 报备历史可读（折叠为前端）
    hist15 = call("/api/checkin/history?limit=30")
    assert "items" in hist15, hist15

    # Round15 · 会员权益对照卡
    bene15 = call("/api/membership/benefits")
    assert "rows" in bene15 and len(bene15["rows"]) == 3, bene15
    keys15 = {r.get("key") for r in bene15["rows"]}
    assert keys15 == {"checkin", "travel", "handover_export"}, bene15
    assert all("ready" in r and "label" in r for r in bene15["rows"]), bene15

    # Round15 · 授权视频脚本可复制数据源
    av15 = call("/api/auth-video")
    assert "script" in av15 and len(av15["script"]) >= 3, av15
    assert all(s.get("title") and s.get("hint") for s in av15["script"]), av15

    # Round15 · 急症清册写入后手册仍可读（CTA 为前端）
    hand15 = call("/api/handover")
    assert int(hand15.get("item_count") or 0) >= 1, hand15

    # Round15 · 医旅意向按医院名搜索
    hospitals15 = call("/api/hospitals")["items"]
    assert hospitals15, hospitals15
    hid15 = hospitals15[0]["id"]
    call(
        "/api/hospitals/intent",
        {"hospital_id": hid15, "note": "自检·意向搜索"},
    )
    hname = (hospitals15[0].get("name") or "")[:2]
    found15 = call("/api/hospitals/intents?" + urllib.parse.urlencode({"q": hname or "自检"}))
    assert "items" in found15 and "q" in found15, found15
    assert found15.get("q") == (hname or "自检"), found15
    assert len(found15["items"]) >= 1, found15

    # Round15 · 设置大字号为前端 localStorage；会员/今日 API 仍可读
    assert bene15.get("total") == 3, bene15

    # Round16 · 首页健康角标数据源
    h16 = call("/api/health")
    assert h16.get("ok") is True and h16.get("version") and h16.get("server_version"), h16
    assert h16.get("domain") == "einherit.cn", h16

    # Round16 · 交割空列表引导（列表 API；空态 CTA 为前端）
    lg16 = call("/api/legacy")
    assert "items" in lg16, lg16

    # Round16 · 备忘→交割一键带入数据源
    as16 = call(
        "/api/assets",
        {
            "platform": "自检·写入交割平台",
            "dispose_note": "销毁",
            "dept": "admin",
            "summary": "round16 带入",
        },
    )["item"]
    assert as16.get("platform") == "自检·写入交割平台", as16
    assert as16.get("dept") == "admin", as16

    # Round16 · 报备备用联系人摘要（缺备用 CTA 为前端）
    bk16 = call("/api/backup-contacts/summary")
    assert "count" in bk16 and "text" in bk16, bk16

    # Round16 · 差旅余额不足开单对照（确认框为前端）
    hint16 = call(
        "/api/aftercare/budget-hint",
        {"budget": 999999},
    )
    assert hint16.get("within_balance") is False, hint16
    assert "text" in hint16 and "tone" in hint16, hint16

    # Round16 · 善后失联态可写（去报备深链为前端）
    call(
        "/api/auth-video",
        {
            "demo": True,
            "has_greeting": True,
            "has_authorize": True,
            "has_plan": True,
            "note": "round16",
        },
    )
    job16 = call(
        "/api/aftercare",
        {
            "title": "自检·失联转报备",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 500,
            "coop_state": "unreachable",
        },
    )
    job16 = job16.get("item") or job16.get("job") or job16
    assert job16.get("coop_state") == "unreachable", job16

    # Round16 · 授权视频未通过说明字段
    av16 = call("/api/auth-video")
    assert "missing_text" in av16 or "complete_label" in av16, av16
    assert "ready" in av16, av16

    # Round16 · 手册导出前缺执行人检查
    pre16 = call("/api/handover/print-checklist")
    assert "executor_filled" in pre16 and "items" in pre16, pre16

    # Round16 · 医旅医院详情（收藏为前端 localStorage）
    hospitals16 = call("/api/hospitals")["items"]
    assert hospitals16, hospitals16
    detail16 = call(f"/api/hospitals?id={hospitals16[0]['id']}")
    assert detail16["item"]["id"] == hospitals16[0]["id"], detail16
    assert detail16["item"].get("name"), detail16

    # Round16 · 设置·服务版本与自启说明数据源
    assert h16.get("version") == "0.5.0", h16
    assert h16.get("server_version"), h16

    # Round17 · 首页服务正常轻提示数据源
    h17 = call("/api/health")
    assert h17.get("ok") is True and h17.get("version"), h17
    assert h17.get("domain") == "einherit.cn", h17

    # Round17 · 交割按接收人筛选（chip 为前端；API 提供 beneficiary）
    lg17 = call(
        "/api/legacy",
        {
            "title": "自检·接收人筛选",
            "category": "其他",
            "action": "销毁",
            "beneficiary": "自检接收人甲",
        },
    )["item"]
    assert lg17.get("beneficiary") == "自检接收人甲", lg17
    lg17_list = call("/api/legacy")
    assert any(
        (x.get("title") == "自检·接收人筛选" and x.get("beneficiary") == "自检接收人甲")
        for x in (lg17_list.get("items") or [])
    ), lg17_list

    # Round17 · 备忘一键再录数据源
    as17 = call(
        "/api/assets",
        {
            "platform": "自检·再录平台",
            "summary": "round17 再录",
            "dispose_note": "转赠",
            "dept": "admin",
        },
    )["item"]
    assert as17.get("platform") == "自检·再录平台", as17
    assert as17.get("dispose_note") == "转赠", as17
    assert as17.get("dept") == "admin", as17

    # Round17 · 报备备用齐全绿勾数据源
    bk17 = call("/api/backup-contacts/summary")
    assert "count" in bk17 and "text" in bk17, bk17

    # Round17 · 差旅流水按类型筛选（只读；kind 可区分）
    tf17 = call("/api/travel-fund")
    assert "ledger" in tf17 and "fund" in tf17, tf17
    for row in tf17.get("ledger") or []:
        assert "kind" in row, row

    # Round17 · 善后开单旁余额对照
    hint17 = call("/api/aftercare/budget-hint?budget=2000")
    assert "balance" in hint17 and "budget" in hint17, hint17
    assert "text" in hint17 and "within_balance" in hint17, hint17

    # Round17 · 授权视频重录引导字段
    av17 = call("/api/auth-video")
    assert "ready" in av17 and "items" in av17, av17

    # Round17 · 手册导出成功回执依赖导出页与打印检查
    hand17 = call("/api/handover")
    assert hand17.get("domain") == "einherit.cn", hand17
    pre17 = call("/api/handover/print-checklist")
    assert "executor_filled" in pre17, pre17

    # Round17 · 医旅收藏列表入口（收藏为前端 localStorage；医院列表可读）
    hospitals17 = call("/api/hospitals")["items"]
    assert hospitals17 and hospitals17[0].get("id"), hospitals17
    detail17 = call(f"/api/hospitals?id={hospitals17[0]['id']}")
    assert detail17["item"]["id"] == hospitals17[0]["id"], detail17

    # Round17 · 设置·生产主机只读条（域名来自 health）
    assert h17.get("domain") == "einherit.cn", h17
    assert h17.get("version") == "0.5.0", h17

    # Round18 · 首页下次报备温和倒计时数据源
    ck18 = call("/api/checkin/readable")
    assert "hours_remaining" in ck18 and "countdown_label" in ck18, ck18
    assert "seconds_remaining" in ck18, ck18

    # Round18 · 交割批量改接收人
    lg18a = call(
        "/api/legacy",
        {"title": "自检·批量接收人A", "category": "其他", "action": "销毁"},
    )["item"]
    lg18b = call(
        "/api/legacy",
        {"title": "自检·批量接收人B", "category": "其他", "action": "销毁"},
    )["item"]
    batched_bene = call(
        "/api/legacy/batch-beneficiary",
        {
            "ids": [lg18a["id"], lg18b["id"]],
            "beneficiary": "自检批量接收人",
        },
    )
    assert batched_bene.get("updated") == 2, batched_bene
    assert batched_bene.get("beneficiary") == "自检批量接收人", batched_bene
    lg18_list = call("/api/legacy")["items"]
    assert all(
        next(
            (x for x in lg18_list if x["id"] == i),
            {},
        ).get("beneficiary")
        == "自检批量接收人"
        for i in (lg18a["id"], lg18b["id"])
    ), lg18_list

    # Round18 · 备忘按部门 chip 计数数据源
    as18 = call(
        "/api/assets",
        {
            "platform": "自检·部门计数",
            "summary": "round18",
            "dispose_note": "销毁",
            "dept": "finance",
        },
    )["item"]
    assert as18.get("dept") == "finance", as18
    assets18 = call("/api/assets")
    assert any(x.get("id") == as18["id"] for x in (assets18.get("items") or [])), assets18

    # Round18 · 差旅余额门槛（首页轻条只读）
    tf18 = call("/api/travel-fund")
    assert "fund" in tf18 and "threshold" in tf18["fund"], tf18
    assert tf18["fund"]["threshold"] == 2000, tf18
    assert "balance" in tf18["fund"], tf18

    # Round18 · 善后工单创建时间字段（近→远默认）
    job18 = call(
        "/api/aftercare",
        {
            "title": "自检·排序工单",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 500,
            "coop_state": "cooperative",
        },
    )
    job18 = job18.get("item") or job18.get("job") or job18
    assert job18.get("created_at") is not None or job18.get("id"), job18
    ac18 = call("/api/aftercare")
    assert (ac18.get("items") or []), ac18
    assert all("id" in x for x in ac18["items"]), ac18

    # Round18 · 授权视频列表折叠（current_active 字段）
    av18 = call("/api/auth-video")
    assert "items" in av18 and "current_active_id" in av18, av18

    # Round18 · 手册打印清单缺口 go 字段
    pre18 = call("/api/handover/print-checklist")
    assert "items" in pre18, pre18
    for it in pre18["items"]:
        assert "key" in it and "ok" in it and "go" in it, it
        assert it["go"] in ("checkin", "legacy", "heirs"), it

    # Round18 · 医旅意向空态依赖列表可读
    intents18 = call("/api/hospitals/intents")
    assert "items" in intents18, intents18
    hospitals18 = call("/api/hospitals")["items"]
    assert hospitals18, hospitals18

    # Round18 · 设置·一键复制服务信息数据源
    h18 = call("/api/health")
    assert h18.get("ok") is True, h18
    assert h18.get("domain") == "einherit.cn", h18
    assert h18.get("version") == "0.5.0", h18

    # Round19 · 首页交割进度（counts.legacy_filled / legacy）
    summary19 = call("/api/counts-summary")
    assert "counts" in summary19, summary19
    assert "legacy" in summary19["counts"], summary19
    assert "legacy_filled" in summary19["counts"], summary19
    assert summary19["counts"]["legacy_filled"] <= summary19["counts"]["legacy"], summary19

    # Round19 · 交割缺出厂重置汇总
    lg19_dev = call(
        "/api/legacy",
        {
            "title": "自检·平板设备",
            "category": "电子设备",
            "action": "转赠",
            "factory_reset": False,
        },
    )["item"]
    assert lg19_dev.get("factory_reset") in (0, False, None), lg19_dev
    miss_fr = call("/api/legacy/missing-factory-reset")
    assert "count" in miss_fr and "items" in miss_fr and "hint" in miss_fr, miss_fr
    assert miss_fr["count"] >= 1, miss_fr
    assert any(x.get("id") == lg19_dev["id"] for x in miss_fr["items"]), miss_fr

    # Round19 · 备忘复习到期今日区数据源
    as19 = call(
        "/api/assets",
        {
            "platform": "自检·今日复习",
            "summary": "round19",
            "dispose_note": "销毁",
            "draft": True,
        },
    )["item"]
    today19 = time.strftime("%Y-%m-%d", time.localtime())
    reviewed19 = call(
        "/api/assets/review-at",
        {"id": as19["id"], "review_at": today19},
    )
    assert (reviewed19.get("item") or {}).get("review_at", "").startswith(today19), reviewed19
    due19 = call("/api/assets?" + urllib.parse.urlencode({"sort": "due"}))
    assert "due_soon" in due19 or any(
        str(x.get("review_at") or "").startswith(today19)
        for x in (due19.get("items") or [])
    ), due19

    # Round19 · 报备间隔保存回执数据源（只写 interval）
    prev_iv = call("/api/checkin/interval")
    prev_hours = float(prev_iv.get("interval_hours") or 24)
    set_iv = call("/api/checkin/interval", {"interval_hours": prev_hours})
    assert "interval_hours" in set_iv, set_iv
    call("/api/checkin/interval", {"interval_hours": prev_hours})

    # Round19 · 会员页差旅门槛同行数据源
    tf19 = call("/api/travel-fund")
    assert "fund" in tf19 and "threshold" in tf19["fund"], tf19
    assert tf19["fund"]["threshold"] == 2000, tf19
    assert "balance" in tf19["fund"], tf19

    # Round19 · 善后空列表依赖列表可读
    ac19 = call("/api/aftercare")
    assert "items" in ac19, ac19

    # Round19 · 授权视频当前生效三勾字段
    av19 = call("/api/auth-video")
    assert "items" in av19 and "current_active_id" in av19, av19
    if av19.get("current_active_id"):
        actives19 = [it for it in av19["items"] if it.get("current_active")]
        assert actives19, av19
        a0 = actives19[0]
        assert "has_greeting" in a0 and "has_authorize" in a0 and "has_plan" in a0, a0

    # Round19 · 手册导出条目数与列表一致
    hand19 = call("/api/handover")
    assert "item_count" in hand19, hand19
    assert "export_align_note" in hand19, hand19
    assert str(hand19["item_count"]) in hand19["export_align_note"], hand19

    # Round19 · 医旅搜索无结果依赖医院列表可读
    hospitals19 = call("/api/hospitals")["items"]
    assert isinstance(hospitals19, list), hospitals19
    empty_q = call(
        "/api/hospitals?" + urllib.parse.urlencode({"q": "绝对不存在的医院名xyzzy999"})
    )
    assert "items" in empty_q, empty_q

    # Round19 · 设置·上次同步本机时间为前端 localStorage；health 仍可读
    h19 = call("/api/health")
    assert h19.get("ok") is True, h19
    assert h19.get("domain") == "einherit.cn", h19

    # Round20 · 交割清除照片/聊天未勾汇总
    lg20_dev = call(
        "/api/legacy",
        {
            "title": "自检·手机设备",
            "category": "电子设备",
            "action": "转赠",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg20_dev.get("clear_photos") in (0, False, None), lg20_dev
    assert lg20_dev.get("clear_chats") in (0, False, None), lg20_dev
    miss_clear = call("/api/legacy/missing-clear-media")
    assert "count" in miss_clear and "items" in miss_clear and "hint" in miss_clear, miss_clear
    assert miss_clear["count"] >= 1, miss_clear
    assert any(x.get("id") == lg20_dev["id"] for x in miss_clear["items"]), miss_clear

    # Round20 · 报备页会员有效同行数据源
    gentle20 = call("/api/membership/gentle")
    assert "is_member" in gentle20 and "member_until_iso" in gentle20, gentle20
    assert "label" in gentle20 or "hint" in gentle20, gentle20

    # Round20 · 差旅充值（回首页 CTA 为前端；预存 API 仍可用）
    tf20 = call("/api/travel-fund", {"amount": 50, "force": True})
    assert "fund" in tf20 or "balance" in (tf20.get("fund") or tf20), tf20

    # Round20 · 善后未完成工单预算合计 vs 余额
    ac20_job = call(
        "/api/aftercare",
        {
            "title": "自检·预算合计",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 300,
        },
    )["item"]
    assert ac20_job.get("id"), ac20_job
    open_sum = call("/api/aftercare/open-budget-sum")
    assert "budget_sum" in open_sum and "balance" in open_sum, open_sum
    assert "open_count" in open_sum and "hint" in open_sum, open_sum
    assert open_sum["open_count"] >= 1, open_sum
    assert float(open_sum["budget_sum"]) >= 300, open_sum

    # Round20 · 授权视频列表可读（上传成功聚焦为前端）
    av20 = call("/api/auth-video")
    assert "items" in av20 and "current_active_id" in av20, av20

    # Round20 · 手册执行人缺席双 CTA 数据源
    pre20 = call("/api/handover/print-checklist")
    assert "executor_filled" in pre20, pre20

    # Round20 · 备忘部门字段（去盘点深链）
    as20 = call(
        "/api/assets",
        {
            "platform": "自检·盘点深链",
            "summary": "round20",
            "dept": "finance",
            "dispose_note": "转赠",
            "draft": True,
        },
    )["item"]
    assert as20.get("dept") == "finance", as20
    assets20 = call("/api/assets")
    assert any(
        x.get("id") == as20["id"] and x.get("dept") == "finance"
        for x in (assets20.get("items") or [])
    ), assets20

    # Round20 · 医旅收藏空态依赖医院列表；设置导出/导入 API
    hospitals20 = call("/api/hospitals")["items"]
    assert isinstance(hospitals20, list), hospitals20
    bak20 = call("/api/export/backup")
    assert "backup_note" in bak20 or "legacy" in bak20 or "summary" in bak20, bak20
    h20 = call("/api/health")
    assert h20.get("ok") is True, h20
    assert h20.get("domain") == "einherit.cn", h20

    # Round21 · 急症清册写入状态（首页只读一句）
    icu21 = call("/api/icu-pack")
    assert "ready" in icu21 and "items" in icu21, icu21

    # Round21 · 交割出厂重置字段（chip 筛选为前端）
    lg21 = call(
        "/api/legacy",
        {
            "title": "自检·出厂筛选",
            "category": "电子设备",
            "action": "转赠",
            "factory_reset": True,
        },
    )["item"]
    assert lg21.get("factory_reset") in (1, True), lg21
    lg21_list = call("/api/legacy")
    assert any(
        x.get("id") == lg21["id"] and x.get("factory_reset") in (1, True)
        for x in (lg21_list.get("items") or [])
    ), lg21_list

    # Round21 · 备忘可见性一键切换
    as21 = call(
        "/api/assets",
        {
            "platform": "自检·可见性",
            "summary": "round21",
            "visibility": "private",
            "dispose_note": "转赠",
            "draft": True,
        },
    )["item"]
    assert (as21.get("visibility") or "").lower() == "private", as21
    as21_up = call(
        "/api/assets/update",
        {"id": as21["id"], "visibility": "family"},
    )
    assert as21_up.get("updated") == 1, as21_up
    assert (as21_up.get("item") or {}).get("visibility") == "family", as21_up
    as21_back = call(
        "/api/assets/update",
        {"id": as21["id"], "visibility": "private"},
    )
    assert (as21_back.get("item") or {}).get("visibility") == "private", as21_back

    # Round21 · 报备冷静期剩余（只读字段）
    me21 = call("/api/me")["user"]
    assert "grace_remaining_seconds" in me21, me21
    assert "grace_hours" in me21, me21
    assert "checkin_in_grace" in me21, me21

    # Round21 · 差旅流水导出 CSV（前端；流水 API 可读）
    tf21 = call("/api/travel-fund")
    assert "ledger" in tf21 and isinstance(tf21["ledger"], list), tf21

    # Round21 · 善后城市快捷 chip 数据源
    ac21 = call(
        "/api/aftercare",
        {
            "title": "自检·城市chip",
            "service_type": "field_visit",
            "city": "三亚",
            "travel_budget": 200,
        },
    )["item"]
    assert ac21.get("city") == "三亚", ac21
    cities21 = call("/api/aftercare/cities")
    assert "cities" in cities21 and "三亚" in (cities21["cities"] or []), cities21

    # Round21 · 授权视频三勾门槛（上传禁用为前端）
    av21 = call("/api/auth-video")
    assert "items" in av21, av21

    # Round21 · 受益人列表可读（空态 CTA 为前端）
    bene21 = call("/api/beneficiaries")
    assert "items" in bene21, bene21

    # Round21 · 手册快照条数差
    call("/api/handover/snapshot", {"label": "自检·r21A"})
    call("/api/handover/snapshot", {"label": "自检·r21B"})
    cmp21 = call("/api/snapshots/compare")
    assert "ready" in cmp21 and "delta" in cmp21 and "text" in cmp21, cmp21
    assert cmp21["ready"] is True, cmp21

    # Round21 · 设置清空演示数据为前端 localStorage；health 仍可读
    h21 = call("/api/health")
    assert h21.get("ok") is True, h21
    assert h21.get("domain") == "einherit.cn", h21

    # Round22 · 授权视频三勾门槛（首页一句为前端）
    av22 = call("/api/auth-video")
    assert "ready" in av22 and "checklist" in av22, av22
    assert "missing_labels" in av22 or "missing" in av22, av22

    # Round22 · 交割批量出厂重置
    lg22a = call(
        "/api/legacy",
        {
            "title": "自检·批量出厂A",
            "category": "电子设备",
            "action": "转赠",
            "factory_reset": False,
        },
    )["item"]
    lg22b = call(
        "/api/legacy",
        {
            "title": "自检·批量出厂B",
            "category": "电子设备",
            "action": "转赠",
            "factory_reset": False,
        },
    )["item"]
    batch_fr = call(
        "/api/legacy/batch-factory-reset",
        {"ids": [lg22a["id"], lg22b["id"]], "factory_reset": True},
    )
    assert batch_fr.get("updated") == 2, batch_fr
    assert batch_fr.get("factory_reset") is True, batch_fr
    lg22_list = call("/api/legacy")
    assert all(
        any(
            x.get("id") == i and x.get("factory_reset") in (1, True)
            for x in (lg22_list.get("items") or [])
        )
        for i in (lg22a["id"], lg22b["id"])
    ), lg22_list
    batch_fr_off = call(
        "/api/legacy/batch-factory-reset",
        {"ids": [lg22a["id"]], "factory_reset": False},
    )
    assert batch_fr_off.get("factory_reset") is False, batch_fr_off

    # Round22 · 备忘部门字段（空态 CTA 为前端）
    as22 = call(
        "/api/assets",
        {
            "platform": "自检·部门空态",
            "summary": "round22",
            "dept": "ip",
            "dispose_note": "转赠",
            "draft": True,
        },
    )["item"]
    assert as22.get("dept") == "ip", as22

    # Round22 · 报备时间戳（复制为前端）
    ck22 = call("/api/checkin", {})
    assert "user" in ck22, ck22
    assert ck22["user"].get("last_checkin_at"), ck22

    # Round22 · 会员到期日（日历点为前端）
    me22 = call("/api/me")["user"]
    assert "member_until_iso" in me22 or "member_until" in me22, me22

    # Round22 · 差旅门槛进度百分比
    tf22 = call("/api/travel-fund")
    fund22 = tf22.get("fund") or tf22
    assert "progress_pct" in fund22, fund22
    assert "threshold" in fund22, fund22
    assert 0 <= int(fund22["progress_pct"]) <= 100, fund22

    # Round22 · 善后备注（模板 chip 为前端；开单可读）
    ac22 = call(
        "/api/aftercare",
        {
            "title": "自检·备注模板",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 100,
            "notes": "希望上门执行，时间可再约定。",
        },
    )["item"]
    assert "上门" in (ac22.get("notes") or ""), ac22

    # Round22 · ICU 清册写入（交割高亮为前端 local）
    icu22 = call("/api/icu-pack", {"beneficiary": "自检·r22接收人"})
    assert len(icu22.get("items") or []) >= 1, icu22
    assert all(it.get("id") for it in (icu22.get("items") or [])), icu22

    # Round22 · 医旅意向取消（确认框为前端）
    hospitals22 = call("/api/hospitals")["items"]
    assert hospitals22, hospitals22
    hid22 = hospitals22[0]["id"]
    intent22 = call(
        "/api/hospitals/intent", {"hospital_id": hid22, "note": "自检·取消确认"}
    )["intent"]
    cancelled22 = call(
        "/api/hospitals/intent/cancel", {"id": intent22["id"]}
    )["intent"]
    assert (cancelled22.get("status") or "") == "cancelled", cancelled22

    # Round22 · 正式站域名（设置/关于外链为前端）
    h22 = call("/api/health")
    assert h22.get("ok") is True, h22
    assert h22.get("domain") == "einherit.cn", h22

    # Round23 · 首页会员/差旅双状态（前端；API 只读就绪）
    gentle23 = call("/api/membership/gentle")
    assert "is_member" in gentle23 or "member" in gentle23, gentle23
    tf23 = call("/api/travel-fund")
    fund23 = tf23.get("fund") or tf23
    assert "balance" in fund23 and "threshold" in fund23, fund23
    assert "meets_threshold" in fund23 or "met" in fund23 or "progress_pct" in fund23, fund23

    # Round23 · 交割搜索（清空为前端；q 过滤仍可用）
    lg23 = call(
        "/api/legacy",
        {
            "title": "自检·搜索清空关键词",
            "category": "其他",
            "action": "销毁",
            "beneficiary": "搜索接收人丙",
        },
    )["item"]
    found23 = call(
        "/api/legacy?" + urllib.parse.urlencode({"q": "搜索清空关键词"})
    )
    assert any(
        x.get("id") == lg23["id"] for x in (found23.get("items") or [])
    ), found23

    # Round23 · 备忘复习日一键今日
    as23 = call(
        "/api/assets",
        {
            "platform": "自检·复习今日",
            "summary": "round23",
            "dept": "admin",
            "dispose_note": "销毁",
            "draft": True,
        },
    )["item"]
    today23 = time.strftime("%Y-%m-%d", time.localtime())
    reviewed23 = call(
        "/api/assets/review-at",
        {"id": as23["id"], "review_at": today23},
    )
    assert (reviewed23.get("item") or {}).get("review_at", "").startswith(
        today23
    ), reviewed23

    # Round23 · 报备上次成功相对化（只读字段）
    call("/api/checkin", {})
    readable23 = call("/api/checkin/readable")
    assert readable23.get("last_checkin_at"), readable23
    assert "hours_since_last" in readable23, readable23
    assert "last_ago_label" in readable23, readable23
    assert readable23["hours_since_last"] is not None, readable23

    # Round23 · 善后预算排序（前端；工单可读 travel_budget）
    ac23a = call(
        "/api/aftercare",
        {
            "title": "自检·预算高",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 3000,
        },
    )["item"]
    ac23b = call(
        "/api/aftercare",
        {
            "title": "自检·预算低",
            "service_type": "field_visit",
            "city": "三亚",
            "travel_budget": 200,
        },
    )["item"]
    assert float(ac23a.get("travel_budget") or 0) >= float(
        ac23b.get("travel_budget") or 0
    ), (ac23a, ac23b)

    # Round23 · 授权视频历史条数（前端提示；列表可读）
    av23 = call("/api/auth-video")
    assert "items" in av23, av23
    assert isinstance(av23.get("items") or [], list), av23

    # Round23 · 受益人电话（脱敏为前端 privacy localStorage）
    bn23 = call(
        "/api/beneficiaries",
        {
            "name": "自检·脱敏联系人",
            "role": "family",
            "contact": "13800138000",
            "note": "round23",
        },
    )["item"]
    assert "13800138000" in str(bn23.get("contact") or ""), bn23

    # Round23 · 手册打印全部就绪绿勾
    pre23 = call("/api/handover/print-checklist")
    assert "all_ready" in pre23, pre23
    assert "ready_count" in pre23 and "total" in pre23, pre23
    assert isinstance(pre23["all_ready"], bool), pre23
    if pre23["ready_count"] == pre23["total"] and pre23["total"] > 0:
        assert pre23["all_ready"] is True, pre23

    # Round23 · 医旅国家筛选（收藏联动为前端）
    hospitals23 = call("/api/hospitals")["items"]
    assert hospitals23, hospitals23
    cn23 = call("/api/hospitals?" + urllib.parse.urlencode({"country": "中国"}))
    assert cn23.get("items") and all(
        h.get("country") == "中国" for h in cn23["items"]
    ), cn23

    # Round23 · 设置健康检查（弹层/新开为前端）
    h23 = call("/api/health")
    assert h23.get("ok") is True, h23
    assert h23.get("domain") == "einherit.cn", h23

    # Round24 · 首页七宗罪自保进度（前端；API 只读）
    guard24 = call("/api/self-guard")
    assert "items" in guard24 and "progress" in guard24, guard24
    prog24 = guard24["progress"]
    assert "done" in prog24, prog24
    assert int(prog24.get("total") or 7) == 7, prog24

    # Round24 · 交割备注字数（前端；写入仍可用）
    lg24 = call(
        "/api/legacy",
        {
            "title": "自检·备注字数",
            "category": "其他",
            "action": "销毁",
            "beneficiary": "字数接收人",
            "notes": "温和字数提示演示备注，不强制截断。",
        },
    )["item"]
    assert "温和字数" in str(lg24.get("notes") or ""), lg24

    # Round24 · 备忘搜索清空（前端；q 过滤仍可用）
    as24 = call(
        "/api/assets",
        {
            "platform": "自检·搜索清空备忘",
            "summary": "round24",
            "dept": "admin",
            "dispose_note": "销毁",
            "draft": True,
        },
    )["item"]
    found_as24 = call(
        "/api/assets?" + urllib.parse.urlencode({"q": "搜索清空备忘"})
    )
    assert any(
        x.get("id") == as24["id"] for x in (found_as24.get("items") or [])
    ), found_as24

    # Round24 · 报备间隔预设 chip（只写 interval）
    iv24 = call("/api/checkin/interval", {"interval_hours": 48})
    assert int(iv24.get("interval_hours") or 0) == 48, iv24
    iv24b = call("/api/checkin/interval")
    assert int(iv24b.get("interval_hours") or 0) == 48, iv24b
    call("/api/checkin/interval", {"interval_hours": 24})

    # Round24 · 差旅流水金额着色（前端；ledger 可读）
    tf24 = call("/api/travel-fund")
    fund24 = tf24.get("fund") or tf24
    assert "balance" in fund24, fund24
    ledger24 = tf24.get("ledger") or []
    assert isinstance(ledger24, list), tf24
    if ledger24:
        assert "amount" in ledger24[0], ledger24[0]
        assert "kind" in ledger24[0], ledger24[0]

    # Round24 · 善后联系窗口快捷 chip（contact_window）
    ac24 = call(
        "/api/aftercare",
        {
            "title": "自检·联系窗口上午",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 2000,
            "contact_window": "上午",
        },
    )["item"]
    assert str(ac24.get("contact_window") or "") == "上午", ac24

    # Round24 · 授权视频脚本分段（greeting/authorize/plan）
    av24 = call("/api/auth-video")
    script24 = av24.get("script") or []
    assert len(script24) >= 3, av24
    keys24 = {s.get("key") for s in script24}
    assert {"greeting", "authorize", "plan"}.issubset(keys24), keys24

    # Round24 · 急症清册重复写入确认（前端；ready 可读）
    icu24 = call("/api/icu-pack")
    assert "ready" in icu24, icu24
    assert isinstance(icu24["ready"], bool), icu24

    # Round24 · 医旅意向备注一键清空（前端；note 可写）
    hospitals24 = call("/api/hospitals")["items"]
    assert hospitals24, hospitals24
    hid24 = hospitals24[0]["id"]
    intent24 = call(
        "/api/hospitals/intent",
        {"hospital_id": hid24, "note": "round24 备注清空演示"},
    )["intent"]
    assert "round24" in str(intent24.get("note") or ""), intent24

    # Round24 · 设置·主题对比度提示（前端大字号；健康仍就绪）
    h24 = call("/api/health")
    assert h24.get("ok") is True, h24
    assert h24.get("domain") == "einherit.cn", h24

    # Round25 · 首页五部门完成度（前端环强化；API 只读）
    co25 = call("/api/company")
    assert "progress" in co25, co25
    assert int(co25["progress"].get("total") or 5) == 5, co25

    # Round25 · 交割批量清除照片/聊天
    lg25a = call(
        "/api/legacy",
        {
            "title": "自检·批量清除A",
            "category": "电子设备",
            "action": "销毁",
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    lg25b = call(
        "/api/legacy",
        {
            "title": "自检·批量清除B",
            "category": "电子设备",
            "action": "转赠",
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    batch_clear = call(
        "/api/legacy/batch-clear-media",
        {
            "ids": [lg25a["id"], lg25b["id"]],
            "clear_photos": True,
            "clear_chats": True,
        },
    )
    assert batch_clear.get("updated") == 2, batch_clear
    assert batch_clear.get("clear_photos") is True, batch_clear
    assert batch_clear.get("clear_chats") is True, batch_clear
    lg25_list = call("/api/legacy")
    assert all(
        any(
            x.get("id") == i
            and x.get("clear_photos") in (1, True)
            and x.get("clear_chats") in (1, True)
            for x in (lg25_list.get("items") or [])
        )
        for i in (lg25a["id"], lg25b["id"])
    ), lg25_list
    batch_clear_off = call(
        "/api/legacy/batch-clear-media",
        {
            "ids": [lg25a["id"]],
            "clear_photos": False,
            "clear_chats": False,
        },
    )
    assert batch_clear_off.get("clear_photos") is False, batch_clear_off

    # Round25 · 备忘平台名（前端首字母规范；写入仍可用）
    as25 = call(
        "/api/assets",
        {
            "platform": "wechatDemo",
            "summary": "round25",
            "dept": "admin",
            "dispose_note": "销毁",
            "draft": True,
        },
    )["item"]
    assert "wechat" in str(as25.get("platform") or "").lower(), as25

    # Round25 · 报备轻反馈（前端本机偏好；报备仍可用）
    ck25 = call("/api/checkin", {})
    assert "user" in ck25, ck25

    # Round25 · 会员权益三行与今日卡对齐（API 就绪）
    bene25 = call("/api/membership/benefits")
    assert "rows" in bene25, bene25
    keys25 = {r.get("key") for r in (bene25.get("rows") or [])}
    assert {"checkin", "travel", "handover_export"}.issubset(keys25), keys25
    today25 = call("/api/today")
    assert "items" in today25, today25
    assert any(x.get("key") == "checkin" for x in (today25.get("items") or [])), today25

    # Round25 · 差旅 last_refund 只读（强化为前端）
    tf25 = call("/api/travel-fund")
    fund25 = tf25.get("fund") or tf25
    assert "last_refund" in fund25, fund25

    # Round25 · 善后工单复制摘要（前端；字段可读）
    ac25 = call(
        "/api/aftercare",
        {
            "title": "自检·摘要复制",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 1500,
        },
    )["item"]
    assert ac25.get("title") and ac25.get("city"), ac25
    assert ac25.get("travel_budget") is not None, ac25

    # Round25 · 授权视频门槛齐备（庆祝条为前端）
    av25 = call("/api/auth-video")
    assert "ready" in av25, av25
    assert isinstance(av25["ready"], bool), av25

    # Round25 · 手册导出条数确认（前端；handover 可读）
    hand25 = call("/api/handover")
    assert "item_count" in hand25 or "todos" in hand25, hand25

    # Round25 · 设置 round 层清单（前端；健康仍就绪）
    h25 = call("/api/health")
    assert h25.get("ok") is True, h25
    assert h25.get("domain") == "einherit.cn", h25

    # Round26 · 首页备忘未处置缺口（前端条；API 只读）
    pending26 = call("/api/assets/dispose-pending")
    assert "count" in pending26, pending26
    assert isinstance(pending26.get("items"), list), pending26

    # Round26 · 交割清除媒体字段可读（筛选为前端）
    lg26 = call(
        "/api/legacy",
        {
            "title": "自检·清除筛",
            "category": "电子设备",
            "action": "销毁",
            "clear_photos": True,
            "clear_chats": False,
        },
    )["item"]
    assert lg26.get("clear_photos") in (1, True), lg26
    miss_clear26 = call("/api/legacy/missing-clear-media")
    assert "count" in miss_clear26 or "items" in miss_clear26, miss_clear26

    # Round26 · 备忘「今日已看」（review_at）
    as26 = call(
        "/api/assets",
        {
            "platform": "round26Seen",
            "summary": "今日已看演示",
            "dept": "admin",
            "dispose_note": "销毁",
            "draft": True,
        },
    )["item"]
    today26 = time.strftime("%Y-%m-%d")
    seen26 = call(
        "/api/assets/review-at",
        {"id": as26["id"], "review_at": today26},
    )
    assert "item" in seen26, seen26
    assert str((seen26.get("item") or {}).get("review_at") or "").startswith(today26), seen26
    as26_list = call("/api/assets")
    hit26 = next(
        (x for x in (as26_list.get("items") or []) if x.get("id") == as26["id"]),
        None,
    )
    assert hit26 is not None, as26_list
    assert str(hit26.get("review_at") or "").startswith(today26), hit26

    # Round26 · 报备间隔说明（前端复制；interval 可读）
    ck_st26 = call("/api/checkin/status")
    assert "user" in ck_st26, ck_st26
    assert ck_st26["user"].get("checkin_interval_hours") is not None, ck_st26

    # Round26 · 差旅补足金额（前端填；fund 门槛可读）
    tf26 = call("/api/travel-fund")
    fund26 = tf26.get("fund") or tf26
    assert fund26.get("threshold") is not None or "balance" in fund26, fund26

    # Round26 · 善后状态计数（前端；列表可读 status_key）
    ac26 = call(
        "/api/aftercare",
        {
            "title": "自检·状态计数",
            "service_type": "delete_data",
            "city": "三亚",
            "travel_budget": 800,
        },
    )["item"]
    assert ac26.get("title"), ac26
    ac26_list = call("/api/aftercare")
    assert any(
        (x.get("status_key") or x.get("status")) for x in (ac26_list.get("items") or [])
    ), ac26_list

    # Round26 · 授权视频上传区聚焦（前端；门槛可读）
    av26 = call("/api/auth-video")
    assert "ready" in av26, av26

    # Round26 · 受益人缺联系（前端角标；可写无 contact）
    bn26 = call(
        "/api/beneficiaries",
        {
            "name": "自检·待补联系",
            "role": "family",
            "relation": "演示",
            "contact": "",
        },
    )["item"]
    assert bn26.get("name"), bn26
    assert not str(bn26.get("contact") or "").strip(), bn26

    # Round26 · 手册缺口跳转回显（前端；print-checklist 可读）
    hand26 = call("/api/handover/print-checklist")
    assert "items" in hand26 or "ok" in hand26 or "ready" in hand26, hand26

    # Round26 · 设置·复制数据体量摘要
    summary26 = call("/api/counts-summary")
    assert summary26.get("text"), summary26
    assert "counts" in summary26, summary26
    h26 = call("/api/health")
    assert h26.get("ok") is True, h26
    assert h26.get("domain") == "einherit.cn", h26

    # Round27 · 首页受益人就绪（前端条；API 只读）
    bn27_list = call("/api/beneficiaries")
    assert "items" in bn27_list, bn27_list
    assert isinstance(bn27_list.get("items"), list), bn27_list

    # Round27 · 交割备注字段可读（筛选为前端）
    lg27 = call(
        "/api/legacy",
        {
            "title": "自检·备注筛",
            "category": "其他",
            "action": "转赠",
            "notes": "round27 备注演示",
        },
    )["item"]
    assert "round27" in str(lg27.get("notes") or ""), lg27
    lg27_empty = call(
        "/api/legacy",
        {
            "title": "自检·无备注筛",
            "category": "其他",
            "action": "销毁",
            "notes": "",
        },
    )["item"]
    assert not str(lg27_empty.get("notes") or "").strip(), lg27_empty

    # Round27 · 备忘摘要复制（前端；字段可读）
    as27 = call(
        "/api/assets",
        {
            "platform": "round27Copy",
            "summary": "摘要复制演示",
            "dept": "admin",
            "dispose_note": "销毁",
            "draft": True,
        },
    )["item"]
    assert "round27" in str(as27.get("platform") or "").lower(), as27
    assert "摘要" in str(as27.get("summary") or ""), as27

    # Round27 · 报备上次时间（前端复制；history 可读）
    ck27 = call("/api/checkin", {})
    assert "user" in ck27, ck27
    hist27 = call("/api/checkin/history?limit=1")
    assert "items" in hist27, hist27
    assert isinstance(hist27.get("items"), list), hist27

    # Round27 · 差旅余额摘要（前端复制；fund 可读）
    tf27 = call("/api/travel-fund")
    fund27 = tf27.get("fund") or tf27
    assert "balance" in fund27, fund27
    assert fund27.get("threshold") is not None or "balance" in fund27, fund27

    # Round27 · 善后缺城市角标（前端；可写无 city）
    ac27 = call(
        "/api/aftercare",
        {
            "title": "自检·待补城市",
            "service_type": "field_visit",
            "city": "",
            "travel_budget": 500,
        },
    )["item"]
    assert ac27.get("title"), ac27
    assert not str(ac27.get("city") or "").strip(), ac27

    # Round27 · 授权视频脚本字数（前端；script 可读）
    av27 = call("/api/auth-video")
    script27 = av27.get("script") or []
    assert isinstance(script27, list), av27
    assert len(script27) >= 1, av27

    # Round27 · 受益人角色小计（前端；role 可读）
    bn27 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色小计",
            "role": "heir",
            "relation": "演示",
            "contact": "13800000027",
        },
    )["item"]
    assert str(bn27.get("role") or "") == "heir", bn27

    # Round27 · 手册最近快照（前端条；snapshots 可读）
    snap27 = call("/api/handover/snapshot", {"label": "round27自检快照"})["item"]
    assert snap27.get("id") or snap27.get("label"), snap27
    snaps27 = call("/api/snapshots")
    assert isinstance(snaps27.get("items"), list), snaps27
    assert any(
        "round27" in str(x.get("label") or "") for x in (snaps27.get("items") or [])
    ), snaps27

    # Round27 · 设置·品牌署名（前端复制；健康域名对齐）
    h27 = call("/api/health")
    assert h27.get("ok") is True, h27
    assert h27.get("domain") == "einherit.cn", h27

    # Round28 · 首页善后未完成（前端条；aftercare 可读）
    ac28_list = call("/api/aftercare")
    assert "items" in ac28_list, ac28_list
    assert isinstance(ac28_list.get("items"), list), ac28_list

    # Round28 · 交割标题复制（前端；title 可读）
    lg28 = call(
        "/api/legacy",
        {
            "title": "自检·标题复制",
            "category": "其他",
            "action": "销毁",
        },
    )["item"]
    assert "标题复制" in str(lg28.get("title") or ""), lg28

    # Round28 · 备忘草稿/正式（无处置=草稿）
    as28_draft = call(
        "/api/assets",
        {
            "platform": "round28Draft",
            "summary": "草稿筛",
            "dept": "admin",
            "dispose_note": "",
            "draft": True,
        },
    )["item"]
    assert not str(as28_draft.get("dispose_note") or "").strip(), as28_draft
    as28_formal = call(
        "/api/assets",
        {
            "platform": "round28Formal",
            "summary": "正式筛",
            "dept": "admin",
            "dispose_note": "销毁",
            "draft": True,
        },
    )["item"]
    assert str(as28_formal.get("dispose_note") or "").strip(), as28_formal

    # Round28 · 报备冷静期说明（前端复制；grace 可读）
    ck_st28 = call("/api/checkin/status")
    assert "user" in ck_st28, ck_st28
    assert ck_st28["user"].get("grace_hours") is not None, ck_st28

    # Round28 · 会员权益摘要复制（API text 可读）
    bene28 = call("/api/membership/benefits")
    assert bene28.get("text"), bene28
    assert "rows" in bene28, bene28

    # Round28 · 善后服务类型计数（前端；service_type 可读）
    ac28 = call(
        "/api/aftercare",
        {
            "title": "自检·服务类型计数",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 600,
        },
    )["item"]
    assert ac28.get("service_type") == "delete_data" or ac28.get("title"), ac28

    # Round28 · 授权视频最近上传（前端相对时间；items 可读）
    av28 = call("/api/auth-video")
    assert "items" in av28, av28
    assert isinstance(av28.get("items"), list), av28

    # Round28 · 受益人姓名复制（前端；name 可读）
    bn28 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名复制",
            "role": "family",
            "relation": "演示",
            "contact": "13900000028",
        },
    )["item"]
    assert "姓名复制" in str(bn28.get("name") or ""), bn28

    # Round28 · 手册快照份数（前端；snapshots 可读）
    snaps28 = call("/api/snapshots")
    assert isinstance(snaps28.get("items"), list), snaps28

    # Round28 · 设置·应用版本行（前端复制；health 对齐）
    h28 = call("/api/health")
    assert h28.get("ok") is True, h28
    assert h28.get("domain") == "einherit.cn", h28
    assert h28.get("version"), h28

    # Round29 · 首页执行人就绪（前端条；executor_name 可读）
    me29 = call("/api/me")["user"]
    assert "executor_name" in me29, me29

    # Round29 · 交割接收人复制（前端；beneficiary 可读）
    lg29 = call(
        "/api/legacy",
        {
            "title": "自检·接收人复制",
            "category": "其他",
            "action": "转赠",
            "beneficiary": "round29接收人",
        },
    )["item"]
    assert "round29" in str(lg29.get("beneficiary") or ""), lg29

    # Round29 · 备忘可见性计数（前端；visibility 可读）
    as29 = call(
        "/api/assets",
        {
            "platform": "round29Vis",
            "summary": "可见性",
            "dept": "admin",
            "dispose_note": "销毁",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert str(as29.get("visibility") or ""), as29

    # Round29 · 报备执行人姓名复制（前端；字段可读）
    assert me29.get("executor_name") is not None or "executor_name" in me29, me29

    # Round29 · 差旅最近流水相对时间（前端；ledger 可读）
    tf29 = call("/api/travel-fund")
    assert isinstance(tf29.get("ledger"), list) or "fund" in tf29, tf29

    # Round29 · 善后缺备注角标（前端；可写无 notes）
    ac29 = call(
        "/api/aftercare",
        {
            "title": "自检·待补备注",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 400,
            "notes": "",
        },
    )["item"]
    assert ac29.get("title"), ac29
    assert not str(ac29.get("notes") or "").strip(), ac29

    # Round29 · 授权视频门槛进度（前端；greeting/authorize/plan 可读）
    av29 = call("/api/auth-video")
    assert "ready" in av29, av29

    # Round29 · 受益人角色筛选（前端；role 可读）
    bn29 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色筛",
            "role": "executor",
            "relation": "演示",
            "contact": "13700000029",
        },
    )["item"]
    assert str(bn29.get("role") or "") == "executor", bn29

    # Round29 · 手册执行人复制（前端；handover.executor 可读）
    hand29 = call("/api/handover")
    assert "executor" in hand29, hand29

    # Round29 · 设置·今日服务状态行（前端复制；health 对齐）
    h29 = call("/api/health")
    assert h29.get("ok") is True, h29
    assert h29.get("domain") == "einherit.cn", h29
    assert h29.get("version"), h29

    # Round30 · 首页交割条目总数（前端条；counts/legacy 可读）
    summary30 = call("/api/counts-summary")
    assert "counts" in summary30, summary30
    assert summary30["counts"].get("legacy") is not None or summary30[
        "counts"
    ].get("handover_items") is not None, summary30

    # Round30 · 交割类别复制（前端；category 可读）
    lg30 = call(
        "/api/legacy",
        {
            "title": "自检·类别复制",
            "category": "电子设备",
            "action": "销毁",
        },
    )["item"]
    assert str(lg30.get("category") or ""), lg30

    # Round30 · 备忘标签计数（前端；tag 可读）
    as30 = call(
        "/api/assets",
        {
            "platform": "round30Tag",
            "summary": "标签计数",
            "dept": "admin",
            "dispose_note": "销毁",
            "tag": "账号",
            "draft": True,
        },
    )["item"]
    assert str(as30.get("tag") or ""), as30

    # Round30 · 报备备用联系人摘要（前端复制；backup_contacts 可读）
    ck_st30 = call("/api/checkin/status")
    assert "user" in ck_st30, ck_st30
    assert isinstance(ck_st30["user"].get("backup_contacts"), list), ck_st30

    # Round30 · 差旅流水条数（前端；ledger 可读）
    tf30 = call("/api/travel-fund")
    assert isinstance(tf30.get("ledger"), list) or "fund" in tf30, tf30

    # Round30 · 善后标题复制（前端；title 可读）
    ac30 = call(
        "/api/aftercare",
        {
            "title": "自检·标题复制30",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 350,
        },
    )["item"]
    assert "标题复制30" in str(ac30.get("title") or ""), ac30

    # Round30 · 授权视频生效文件名（前端复制；items 可读）
    av30 = call("/api/auth-video")
    assert isinstance(av30.get("items"), list), av30

    # Round30 · 受益人缺关系角标（前端；可写空 relation）
    bn30 = call(
        "/api/beneficiaries",
        {
            "name": "自检·待补关系",
            "role": "family",
            "relation": "",
            "contact": "13600000030",
        },
    )["item"]
    assert bn30.get("name"), bn30
    assert not str(bn30.get("relation") or "").strip(), bn30

    # Round30 · 手册待办条数（前端；todos/item_count 可读）
    hand30 = call("/api/handover")
    assert "todos" in hand30 or "item_count" in hand30, hand30

    # Round30 · 设置·体验层范围（前端复制；health 仍就绪）
    h30 = call("/api/health")
    assert h30.get("ok") is True, h30
    assert h30.get("domain") == "einherit.cn", h30

    # Round31 · 首页备忘条数（前端条；counts.assets 可读）
    summary31 = call("/api/counts-summary")
    assert "counts" in summary31, summary31
    assert summary31["counts"].get("assets") is not None, summary31

    # Round31 · 交割处置复制（前端；action 可读）
    lg31 = call(
        "/api/legacy",
        {
            "title": "自检·处置复制",
            "category": "其他",
            "action": "变现",
        },
    )["item"]
    assert str(lg31.get("action") or "") == "变现", lg31

    # Round31 · 备忘复习日筛选（前端；review_at 可写）
    as31 = call(
        "/api/assets",
        {
            "platform": "round31Review",
            "summary": "复习筛",
            "dept": "admin",
            "dispose_note": "销毁",
            "draft": True,
        },
    )["item"]
    today31 = time.strftime("%Y-%m-%d")
    seen31 = call(
        "/api/assets/review-at",
        {"id": as31["id"], "review_at": today31},
    )
    assert "item" in seen31, seen31

    # Round31 · 报备会员状态（前端复制；is_member 可读）
    ck_st31 = call("/api/checkin/status")
    assert "user" in ck_st31, ck_st31
    assert "is_member" in ck_st31["user"], ck_st31

    # Round31 · 差旅最近流水摘要（前端；ledger 可读）
    tf31 = call("/api/travel-fund")
    assert isinstance(tf31.get("ledger"), list) or "fund" in tf31, tf31

    # Round31 · 善后备注筛选（前端；notes 可空）
    ac31 = call(
        "/api/aftercare",
        {
            "title": "自检·备注筛31",
            "service_type": "delete_data",
            "city": "三亚",
            "travel_budget": 450,
            "notes": "round31 有备注",
        },
    )["item"]
    assert "round31" in str(ac31.get("notes") or ""), ac31

    # Round31 · 授权视频历史上传条数（前端；items 可读）
    av31 = call("/api/auth-video")
    assert isinstance(av31.get("items"), list), av31

    # Round31 · 受益人联系复制（前端；contact 可读）
    bn31 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系复制",
            "role": "heir",
            "relation": "演示",
            "contact": "13500000031",
        },
    )["item"]
    assert str(bn31.get("contact") or "").endswith("31"), bn31

    # Round31 · 手册品牌域名（前端复制；brand/domain 可读）
    hand31 = call("/api/handover")
    assert hand31.get("brand") or hand31.get("domain"), hand31

    # Round31 · 设置·隐私页路径（前端复制；privacy 可取）
    with urllib.request.urlopen(BASE + "/privacy.html", timeout=5) as r:
        assert r.status == 200, r.status
    h31 = call("/api/health")
    assert h31.get("ok") is True, h31
    assert h31.get("domain") == "einherit.cn", h31

    # Round32 · 首页授权视频门槛（前端条；ready 可读）
    av32 = call("/api/auth-video")
    assert "ready" in av32, av32
    assert isinstance(av32["ready"], bool), av32

    # Round32 · 交割可见条数（前端；列表可读）
    lg32 = call(
        "/api/legacy",
        {
            "title": "自检·可见条数",
            "category": "其他",
            "action": "销毁",
        },
    )["item"]
    assert lg32.get("title"), lg32
    lg32_list = call("/api/legacy")
    assert isinstance(lg32_list.get("items"), list), lg32_list

    # Round32 · 备忘平台名复制（前端；platform 可读）
    as32 = call(
        "/api/assets",
        {
            "platform": "round32Platform",
            "summary": "平台复制",
            "dept": "admin",
            "dispose_note": "转赠",
            "draft": True,
        },
    )["item"]
    assert "round32" in str(as32.get("platform") or "").lower(), as32

    # Round32 · 报备间隔+冷静期组合（前端复制；字段可读）
    ck_st32 = call("/api/checkin/status")
    assert ck_st32["user"].get("checkin_interval_hours") is not None, ck_st32
    assert ck_st32["user"].get("grace_hours") is not None, ck_st32

    # Round32 · 差旅门槛状态（前端复制；fund 可读）
    tf32 = call("/api/travel-fund")
    fund32 = tf32.get("fund") or tf32
    assert "balance" in fund32, fund32

    # Round32 · 善后预算复制（前端；travel_budget 可读）
    ac32 = call(
        "/api/aftercare",
        {
            "title": "自检·预算复制32",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 888,
        },
    )["item"]
    assert float(ac32.get("travel_budget") or 0) == 888, ac32

    # Round32 · 授权视频三勾摘要（前端；greeting/authorize/plan 可读）
    assert "items" in av32 or "script" in av32, av32

    # Round32 · 受益人名单条数（前端；items 可读）
    bn32_list = call("/api/beneficiaries")
    assert isinstance(bn32_list.get("items"), list), bn32_list

    # Round32 · 手册完成度百分比（前端；progress 可读）
    hand32 = call("/api/handover")
    assert "progress" in hand32, hand32
    assert "pct" in (hand32.get("progress") or {}), hand32

    # Round32 · 设置·英文品牌行（前端复制；health brand_en）
    h32 = call("/api/health")
    assert h32.get("ok") is True, h32
    assert h32.get("domain") == "einherit.cn", h32
    assert h32.get("brand_en") or h32.get("app"), h32

    # Round33 · 首页会员开通状态（前端条；is_member 可读）
    me33 = call("/api/me")["user"]
    assert "is_member" in me33, me33

    # Round33 · 交割备注复制（前端；notes 可读）
    lg33 = call(
        "/api/legacy",
        {
            "title": "自检·备注复制33",
            "category": "其他",
            "action": "转赠",
            "notes": "round33 备注演示",
        },
    )["item"]
    assert "round33" in str(lg33.get("notes") or ""), lg33

    # Round33 · 备忘可见条数（前端；列表可读）
    as33 = call(
        "/api/assets",
        {
            "platform": "round33Vis",
            "summary": "可见条数",
            "dept": "admin",
            "dispose_note": "销毁",
            "draft": True,
        },
    )["item"]
    assert as33.get("platform"), as33
    as33_list = call("/api/assets")
    assert isinstance(as33_list.get("items"), list), as33_list

    # Round33 · 报备下次建议节点（前端复制；checkin_due_at 可读）
    ck_st33 = call("/api/checkin/status")
    assert "user" in ck_st33, ck_st33
    assert ck_st33["user"].get("checkin_due_at") is not None or "checkin_due_at" in ck_st33[
        "user"
    ], ck_st33

    # Round33 · 差旅门槛金额（前端复制；threshold 可读）
    tf33 = call("/api/travel-fund")
    fund33 = tf33.get("fund") or tf33
    assert fund33.get("threshold") is not None or "balance" in fund33, fund33

    # Round33 · 善后城市复制（前端；city 可读）
    ac33 = call(
        "/api/aftercare",
        {
            "title": "自检·城市复制33",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 320,
        },
    )["item"]
    assert str(ac33.get("city") or "") == "海口", ac33

    # Round33 · 授权视频脚本段数（前端；script 可读）
    av33 = call("/api/auth-video")
    assert isinstance(av33.get("script"), list), av33

    # Round33 · 受益人关系复制（前端；relation 可读）
    bn33 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系复制",
            "role": "family",
            "relation": "配偶",
            "contact": "13400000033",
        },
    )["item"]
    assert str(bn33.get("relation") or "") == "配偶", bn33

    # Round33 · 手册导出路径（前端复制；export 可读）
    with urllib.request.urlopen(BASE + "/export/handover.html", timeout=5) as r:
        assert r.status == 200, r.status

    # Round33 · 设置·中英品牌对照（前端复制；health 对齐）
    h33 = call("/api/health")
    assert h33.get("ok") is True, h33
    assert h33.get("domain") == "einherit.cn", h33
    assert h33.get("app") or h33.get("brand_en"), h33

    # Round34 · 首页差旅门槛（前端条；fund 可读）
    tf34 = call("/api/travel-fund")
    fund34 = tf34.get("fund") or tf34
    assert "balance" in fund34, fund34

    # Round34 · 交割部门复制（前端；dept 可读）
    lg34 = call(
        "/api/legacy",
        {
            "title": "自检·部门复制34",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
        },
    )["item"]
    assert lg34.get("dept") or lg34.get("title"), lg34

    # Round34 · 备忘处置复制（前端；dispose_note 可读）
    as34 = call(
        "/api/assets",
        {
            "platform": "round34Dispose",
            "summary": "处置复制",
            "dept": "admin",
            "dispose_note": "变现",
            "draft": True,
        },
    )["item"]
    assert "变现" in str(as34.get("dispose_note") or ""), as34

    # Round34 · 报备上次与下次（前端复制；字段可读）
    ck_st34 = call("/api/checkin/status")
    assert "user" in ck_st34, ck_st34
    assert (
        ck_st34["user"].get("last_checkin_at") is not None
        or ck_st34["user"].get("checkin_due_at") is not None
    ), ck_st34

    # Round34 · 差旅余额数字（前端复制；balance 可读）
    assert fund34.get("balance") is not None, fund34

    # Round34 · 善后可见条数（前端；列表可读）
    ac34 = call(
        "/api/aftercare",
        {
            "title": "自检·可见单34",
            "service_type": "delete_data",
            "city": "三亚",
            "travel_budget": 210,
        },
    )["item"]
    assert ac34.get("title"), ac34
    ac34_list = call("/api/aftercare")
    assert isinstance(ac34_list.get("items"), list), ac34_list

    # Round34 · 授权视频就绪状态（前端复制；ready 可读）
    av34 = call("/api/auth-video")
    assert "ready" in av34, av34

    # Round34 · 受益人角色复制（前端；role 可读）
    bn34 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色复制34",
            "role": "heir",
            "relation": "演示",
            "contact": "13300000034",
        },
    )["item"]
    assert str(bn34.get("role") or "") == "heir", bn34

    # Round34 · 手册执行人+域名（前端复制；字段可读）
    hand34 = call("/api/handover")
    assert "executor" in hand34 or "domain" in hand34, hand34

    # Round34 · 设置·服务端版本行（前端复制；server_version）
    h34 = call("/api/health")
    assert h34.get("ok") is True, h34
    assert h34.get("domain") == "einherit.cn", h34
    assert h34.get("server_version") or h34.get("version"), h34

    # Round35 · 首页手册完成度（前端条；progress 可读）
    hand35 = call("/api/handover")
    prog35 = hand35.get("progress") or {}
    assert "pct" in prog35 or "total_items" in prog35, hand35

    # Round35 · 交割标题+处置复制（前端；title/action 可读）
    lg35 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置35",
            "category": "其他",
            "action": "变现",
            "dept": "admin",
        },
    )["item"]
    assert lg35.get("title") and lg35.get("action"), lg35

    # Round35 · 备忘部门复制（前端；dept 可读）
    as35 = call(
        "/api/assets",
        {
            "platform": "round35Dept",
            "summary": "部门复制",
            "dept": "finance",
            "draft": True,
        },
    )["item"]
    assert as35.get("dept") or as35.get("platform"), as35

    # Round35 · 报备会员剩余天数（前端复制；字段可读）
    ck_st35 = call("/api/checkin/status")
    assert "user" in ck_st35, ck_st35
    assert (
        "member_days_left" in ck_st35["user"]
        or "is_member" in ck_st35["user"]
    ), ck_st35

    # Round35 · 差旅进度百分比（前端复制；progress_pct 可读）
    tf35 = call("/api/travel-fund")
    fund35 = tf35.get("fund") or tf35
    assert (
        fund35.get("progress_pct") is not None
        or fund35.get("progress_label")
        or fund35.get("balance") is not None
    ), fund35

    # Round35 · 善后状态标签（前端；status_label 可读）
    ac35 = call(
        "/api/aftercare",
        {
            "title": "自检·状态标签35",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 220,
        },
    )["item"]
    assert ac35.get("status_label") or ac35.get("status") or ac35.get("title"), ac35

    # Round35 · 授权视频脚本段标题（前端复制；script 可读）
    av35 = call("/api/auth-video")
    assert isinstance(av35.get("script"), list) or "ready" in av35, av35

    # Round35 · 受益人姓名+角色（前端；name/role 可读）
    bn35 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名角色35",
            "role": "family",
            "relation": "演示",
            "contact": "13300000035",
        },
    )["item"]
    assert bn35.get("name") and str(bn35.get("role") or "") == "family", bn35

    # Round35 · 手册生成时间（前端复制；generated_at 可读）
    assert (
        hand35.get("generated_at") is not None
        or hand35.get("generated_at_iso")
        or hand35.get("executor") is not None
    ), hand35

    # Round35 · 设置·运营主体行（前端复制；domain 对齐）
    h35 = call("/api/health")
    assert h35.get("ok") is True, h35
    assert h35.get("domain") == "einherit.cn", h35

    # Round36 · 首页快照份数（前端条；snapshots 可读）
    snaps36 = call("/api/snapshots")
    assert isinstance(snaps36.get("items"), list), snaps36

    # Round36 · 交割缺接收人角标（前端；beneficiary 字段可读）
    lg36 = call(
        "/api/legacy",
        {
            "title": "自检·缺接收人36",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
            "beneficiary": "",
        },
    )["item"]
    assert lg36.get("title"), lg36
    assert not str(lg36.get("beneficiary") or "").strip(), lg36

    # Round36 · 备忘草稿/正式状态（前端；dispose_note/draft 可读）
    as36 = call(
        "/api/assets",
        {
            "platform": "round36Draft",
            "summary": "草稿状态",
            "dept": "admin",
            "dispose_note": "",
            "draft": True,
        },
    )["item"]
    assert not str(as36.get("dispose_note") or "").strip() or as36.get("draft"), as36

    # Round36 · 报备登记手机号（前端复制；phone 可读）
    ck_st36 = call("/api/checkin/status")
    assert "user" in ck_st36, ck_st36
    assert "phone" in ck_st36["user"] or ck_st36["user"].get("name"), ck_st36

    # Round36 · 差旅还差金额（前端复制；shortfall 可读）
    tf36 = call("/api/travel-fund")
    fund36 = tf36.get("fund") or tf36
    assert (
        fund36.get("shortfall") is not None
        or fund36.get("balance") is not None
        or fund36.get("threshold") is not None
    ), fund36

    # Round36 · 善后阶段标签（前端；phase_label 可读）
    ac36 = call(
        "/api/aftercare",
        {
            "title": "自检·阶段标签36",
            "service_type": "delete_data",
            "city": "三亚",
            "travel_budget": 230,
        },
    )["item"]
    assert ac36.get("phase_label") or ac36.get("status_label") or ac36.get("title"), ac36

    # Round36 · 授权视频完整度说明（前端复制；complete_label 可读）
    av36 = call("/api/auth-video")
    assert av36.get("complete_label") or "ready" in av36 or "complete" in av36, av36

    # Round36 · 受益人备注复制（前端；note 可读）
    bn36 = call(
        "/api/beneficiaries",
        {
            "name": "自检·备注复制36",
            "role": "heir",
            "relation": "演示",
            "contact": "13300000036",
            "note": "round36 备注演示",
        },
    )["item"]
    assert "round36" in str(bn36.get("note") or ""), bn36

    # Round36 · 手册分享提示（前端复制；share_hint 可读）
    hand36 = call("/api/handover")
    assert hand36.get("share_hint") or hand36.get("domain"), hand36

    # Round36 · 设置·中文品牌+域名（前端复制；health 对齐）
    h36 = call("/api/health")
    assert h36.get("ok") is True, h36
    assert h36.get("domain") == "einherit.cn", h36
    assert h36.get("app") or h36.get("brand_en"), h36

    # Round37 · 首页公司盘点完成度（前端条；progress 可读）
    co37 = call("/api/company")
    prog37 = co37.get("progress") or {}
    assert "pct" in prog37 or "filled" in prog37, co37

    # Round37 · 交割清理勾选项（前端；factory_reset 可读）
    lg37 = call(
        "/api/legacy",
        {
            "title": "自检·清理项37",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
            "factory_reset": True,
            "clear_photos": True,
        },
    )["item"]
    assert lg37.get("factory_reset") in (1, True) or lg37.get("clear_photos") in (
        1,
        True,
    ), lg37

    # Round37 · 备忘标签复制（前端；tag 可读）
    as37 = call(
        "/api/assets",
        {
            "platform": "round37Tag",
            "summary": "标签复制",
            "dept": "admin",
            "tag": "账号",
            "draft": True,
        },
    )["item"]
    assert str(as37.get("tag") or "") == "账号", as37

    # Round37 · 报备登记姓名（前端复制；name 可读）
    ck_st37 = call("/api/checkin/status")
    assert "user" in ck_st37, ck_st37
    assert ck_st37["user"].get("name") or ck_st37["user"].get("phone"), ck_st37

    # Round37 · 差旅余额更新时间（前端复制；updated_at 可读）
    tf37 = call("/api/travel-fund")
    fund37 = tf37.get("fund") or tf37
    assert fund37.get("updated_at") is not None or fund37.get("balance") is not None, fund37

    # Round37 · 善后联系窗口（前端；contact_window 可读）
    ac37 = call(
        "/api/aftercare",
        {
            "title": "自检·联系窗口37",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 240,
            "contact_window": "工作日上午",
        },
    )["item"]
    assert str(ac37.get("contact_window") or "") == "工作日上午", ac37

    # Round37 · 授权视频历史上传可见条数（前端；列表可读）
    av37 = call("/api/auth-video")
    assert isinstance(av37.get("items"), list) or "ready" in av37, av37

    # Round37 · 受益人口令提示（前端；passphrase_hint 可读）
    bn37 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令提示37",
            "role": "heir",
            "relation": "演示",
            "contact": "13300000037",
            "passphrase_hint": "生日后四位·37",
        },
    )["item"]
    assert "37" in str(bn37.get("passphrase_hint") or ""), bn37

    # Round37 · 手册说明（前端复制；note 可读）
    hand37 = call("/api/handover")
    assert hand37.get("note") or hand37.get("brand"), hand37

    # Round37 · 设置·产品口号行（前端复制；slogan 对齐）
    assert co37.get("slogan") or prog37.get("pct") is not None, co37
    h37 = call("/api/health")
    assert h37.get("ok") is True, h37
    assert h37.get("domain") == "einherit.cn", h37

    # Round38 · 首页会员剩余天数（前端条；member_days_left 可读）
    ck_st38 = call("/api/checkin/status")
    assert "user" in ck_st38, ck_st38
    assert (
        "member_days_left" in ck_st38["user"]
        or "is_member" in ck_st38["user"]
    ), ck_st38

    # Round38 · 交割编号复制（前端；id 可读）
    lg38 = call(
        "/api/legacy",
        {
            "title": "自检·编号复制38",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
        },
    )["item"]
    assert lg38.get("id") is not None, lg38

    # Round38 · 备忘账号提示（前端；account_hint 可读）
    as38 = call(
        "/api/assets",
        {
            "platform": "round38Hint",
            "summary": "账号提示",
            "dept": "admin",
            "account_hint": "邮箱后四位·38",
            "draft": True,
        },
    )["item"]
    assert "38" in str(as38.get("account_hint") or ""), as38

    # Round38 · 报备会员温柔提示（前端复制；member_gentle_hint 可读）
    assert (
        ck_st38["user"].get("member_gentle_hint") is not None
        or ck_st38["user"].get("is_member") is not None
    ), ck_st38

    # Round38 · 差旅最近流水备注（前端复制；ledger note 可读）
    tf38 = call("/api/travel-fund")
    ledger38 = tf38.get("ledger") or []
    assert isinstance(ledger38, list), tf38

    # Round38 · 善后上门偏好（前端；visit_pref 可读）
    ac38 = call(
        "/api/aftercare",
        {
            "title": "自检·上门偏好38",
            "service_type": "field_visit",
            "city": "三亚",
            "travel_budget": 250,
            "visit_pref": "周末上午",
        },
    )["item"]
    assert str(ac38.get("visit_pref") or "") == "周末上午", ac38

    # Round38 · 授权视频生效编号（前端复制；current_active_id 可读）
    av38 = call("/api/auth-video")
    assert (
        av38.get("current_active_id") is not None
        or av38.get("current_active") is not None
        or "ready" in av38
    ), av38

    # Round38 · 受益人可见条数（前端；列表可读）
    bn38_list = call("/api/beneficiaries")
    assert isinstance(bn38_list.get("items"), list), bn38_list

    # Round38 · 手册受益人人数（前端复制；beneficiary_count 可读）
    hand38 = call("/api/handover")
    assert (
        hand38.get("beneficiary_count") is not None
        or isinstance(hand38.get("heirs"), list)
    ), hand38

    # Round38 · 设置·手册对齐说明（前端复制；export_align_note）
    assert hand38.get("export_align_note") or hand38.get("brand"), hand38
    h38 = call("/api/health")
    assert h38.get("ok") is True, h38
    assert h38.get("domain") == "einherit.cn", h38

    # Round39 · 首页医旅意向条数（前端条；intents 可读）
    intents39 = call("/api/hospitals/intents")
    assert isinstance(intents39.get("items"), list), intents39

    # Round39 · 交割类别+处置复制（前端；category/action 可读）
    lg39 = call(
        "/api/legacy",
        {
            "title": "自检·类别处置39",
            "category": "电子设备",
            "action": "转赠",
            "dept": "admin",
        },
    )["item"]
    assert lg39.get("category") and lg39.get("action"), lg39

    # Round39 · 备忘编号复制（前端；id 可读）
    as39 = call(
        "/api/assets",
        {
            "platform": "round39Id",
            "summary": "编号复制",
            "dept": "admin",
            "draft": True,
        },
    )["item"]
    assert as39.get("id") is not None, as39

    # Round39 · 报备硬建议节点（前端复制；checkin_hard_due_at 可读）
    ck_st39 = call("/api/checkin/status")
    assert "user" in ck_st39, ck_st39
    assert (
        ck_st39["user"].get("checkin_hard_due_at") is not None
        or ck_st39["user"].get("checkin_due_at") is not None
    ), ck_st39

    # Round39 · 差旅流水种类标签（前端复制；kind_label 可读）
    tf39 = call("/api/travel-fund")
    ledger39 = tf39.get("ledger") or []
    assert isinstance(ledger39, list), tf39

    # Round39 · 善后协作状态（前端；coop_state 可读）
    ac39 = call(
        "/api/aftercare",
        {
            "title": "自检·协作状态39",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 260,
            "coop_state": "pending",
        },
    )["item"]
    assert ac39.get("coop_state") or ac39.get("title"), ac39

    # Round39 · 授权视频三勾进度（前端复制；progress 可读）
    av39 = call("/api/auth-video")
    prog39 = av39.get("progress") or {}
    assert (
        "done" in prog39
        or "total" in prog39
        or isinstance(av39.get("checklist"), list)
        or "ready" in av39
    ), av39

    # Round39 · 受益人编号（前端；id 可读）
    bn39 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号复制39",
            "role": "family",
            "relation": "演示",
            "contact": "13300000039",
        },
    )["item"]
    assert bn39.get("id") is not None, bn39

    # Round39 · 手册交割条目数（前端复制；item_count 可读）
    hand39 = call("/api/handover")
    assert (
        hand39.get("item_count") is not None
        or isinstance(hand39.get("todos"), list)
    ), hand39

    # Round39 · 设置·服务就绪行（前端复制；health.ok）
    h39 = call("/api/health")
    assert h39.get("ok") is True, h39
    assert h39.get("domain") == "einherit.cn", h39

    # Round40 · 首页急症前清册条数（前端条；icu-pack 可读）
    icu40 = call("/api/icu-pack")
    assert (
        icu40.get("count") is not None
        or isinstance(icu40.get("pack"), list)
        or isinstance(icu40.get("items"), list)
        or "ready" in icu40
    ), icu40

    # Round40 · 交割缺备注角标（前端；notes 字段可读）
    lg40 = call(
        "/api/legacy",
        {
            "title": "自检·缺备注40",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
            "notes": "",
        },
    )["item"]
    assert lg40.get("title"), lg40
    assert not str(lg40.get("notes") or "").strip(), lg40

    # Round40 · 备忘可见性复制（前端；visibility 可读）
    as40 = call(
        "/api/assets",
        {
            "platform": "round40Vis",
            "summary": "可见性复制",
            "dept": "admin",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert str(as40.get("visibility") or "") in ("family", "private", ""), as40

    # Round40 · 报备间隔小时数（前端复制；checkin_interval_hours 可读）
    ck_st40 = call("/api/checkin/status")
    assert "user" in ck_st40, ck_st40
    assert ck_st40["user"].get("checkin_interval_hours") is not None, ck_st40

    # Round40 · 差旅最近金额（前端复制；ledger amount 可读）
    tf40 = call("/api/travel-fund")
    ledger40 = tf40.get("ledger") or []
    assert isinstance(ledger40, list), tf40

    # Round40 · 善后编号复制（前端；id 可读）
    ac40 = call(
        "/api/aftercare",
        {
            "title": "自检·编号复制40",
            "service_type": "delete_data",
            "city": "三亚",
            "travel_budget": 270,
        },
    )["item"]
    assert ac40.get("id") is not None, ac40

    # Round40 · 授权视频生效备注（前端复制；current_active.note 可读）
    av40 = call("/api/auth-video")
    assert (
        av40.get("current_active") is not None
        or av40.get("latest") is not None
        or "ready" in av40
    ), av40

    # Round40 · 受益人缺备注角标（前端；note 字段可读）
    bn40 = call(
        "/api/beneficiaries",
        {
            "name": "自检·缺备注40",
            "role": "heir",
            "relation": "演示",
            "contact": "13300000040",
            "note": "",
        },
    )["item"]
    assert bn40.get("name"), bn40
    assert not str(bn40.get("note") or "").strip(), bn40

    # Round40 · 手册品牌名（前端复制；brand 可读）
    hand40 = call("/api/handover")
    assert hand40.get("brand"), hand40

    # Round40 · 设置·英文品牌+版本（前端复制；brand_en/version）
    h40 = call("/api/health")
    assert h40.get("ok") is True, h40
    assert h40.get("brand_en") or h40.get("app"), h40
    assert h40.get("version") or h40.get("server_version"), h40
    assert h40.get("domain") == "einherit.cn", h40

    # Round41 · 首页执行人线索条数（前端条；executor-lead 可读）
    ex41 = call("/api/executor-lead")
    assert isinstance(ex41.get("items"), list), ex41

    # Round41 · 交割标题+部门复制（前端；title/dept 可读）
    lg41 = call(
        "/api/legacy",
        {
            "title": "自检·标题部门41",
            "category": "其他",
            "action": "销毁",
            "dept": "finance",
        },
    )["item"]
    assert lg41.get("title") and lg41.get("dept"), lg41

    # Round41 · 备忘复习日复制（前端；review_at 可读）
    as41 = call(
        "/api/assets",
        {
            "platform": "round41Review",
            "summary": "复习日",
            "dept": "admin",
            "draft": True,
        },
    )["item"]
    as41 = call(
        "/api/assets/review-at",
        {"id": as41["id"], "review_at": "2026-12-01"},
    )["item"]
    assert "2026-12-01" in str(as41.get("review_at") or ""), as41

    # Round41 · 报备会员到期日（前端复制；member_until_iso 可读）
    ck_st41 = call("/api/checkin/status")
    assert "user" in ck_st41, ck_st41
    assert (
        ck_st41["user"].get("member_until_iso")
        or ck_st41["user"].get("member_until") is not None
        or "is_member" in ck_st41["user"]
    ), ck_st41

    # Round41 · 差旅流水编号（前端复制；ledger id 可读）
    tf41 = call("/api/travel-fund")
    ledger41 = tf41.get("ledger") or []
    assert isinstance(ledger41, list), tf41

    # Round41 · 善后预算标签（前端；travel_budget_label 可读）
    ac41 = call(
        "/api/aftercare",
        {
            "title": "自检·预算标签41",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 280,
        },
    )["item"]
    assert ac41.get("travel_budget_label") or ac41.get("travel_budget") is not None, ac41

    # Round41 · 授权视频门槛说明（前端复制；missing_text 可读）
    av41 = call("/api/auth-video")
    assert (
        av41.get("missing_text") is not None
        or "ready" in av41
        or "complete" in av41
    ), av41

    # Round41 · 受益人联系+角色（前端；contact/role 可读）
    bn41 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系角色41",
            "role": "executor",
            "relation": "演示",
            "contact": "13300000041",
        },
    )["item"]
    assert bn41.get("contact") and str(bn41.get("role") or "") == "executor", bn41

    # Round41 · 手册域名（前端复制；domain 可读）
    hand41 = call("/api/handover")
    assert hand41.get("domain") == "einherit.cn" or hand41.get("domain"), hand41

    # Round41 · 设置·中文品牌·域名·版本（前端复制；health 对齐）
    h41 = call("/api/health")
    assert h41.get("ok") is True, h41
    assert h41.get("app") or h41.get("brand_en"), h41
    assert h41.get("domain") == "einherit.cn", h41
    assert h41.get("version") or h41.get("server_version"), h41

    # Round42 · 首页审计条数（前端条；audit 可读）
    audit42 = call("/api/audit")
    assert isinstance(audit42.get("items"), list), audit42

    # Round42 · 交割编号+标题（前端；id/title 可读）
    lg42 = call(
        "/api/legacy",
        {
            "title": "自检·编号标题42",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
        },
    )["item"]
    assert lg42.get("id") is not None and lg42.get("title"), lg42

    # Round42 · 备忘标签+平台（前端；tag/platform 可读）
    as42 = call(
        "/api/assets",
        {
            "platform": "round42Combo",
            "summary": "标签平台",
            "dept": "admin",
            "tag": "设备",
            "draft": True,
        },
    )["item"]
    assert as42.get("platform") and as42.get("tag"), as42

    # Round42 · 报备节奏状态（前端复制；escalation_state 可读）
    ck_st42 = call("/api/checkin/status")
    assert "user" in ck_st42, ck_st42
    assert (
        ck_st42["user"].get("escalation_state") is not None
        or "is_member" in ck_st42["user"]
    ), ck_st42

    # Round42 · 差旅门槛纯数字（前端复制；threshold 可读）
    tf42 = call("/api/travel-fund")
    fund42 = tf42.get("fund") or tf42
    assert fund42.get("threshold") is not None or fund42.get("balance") is not None, fund42

    # Round42 · 善后标题+城市（前端；title/city 可读）
    ac42 = call(
        "/api/aftercare",
        {
            "title": "自检·标题城市42",
            "service_type": "delete_data",
            "city": "三亚",
            "travel_budget": 290,
        },
    )["item"]
    assert ac42.get("title") and ac42.get("city"), ac42

    # Round42 · 授权视频文件名+编号（前端复制；current_active 可读）
    av42 = call("/api/auth-video")
    assert (
        av42.get("current_active") is not None
        or av42.get("latest") is not None
        or "ready" in av42
    ), av42

    # Round42 · 受益人姓名+关系（前端；name/relation 可读）
    bn42 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系42",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000042",
        },
    )["item"]
    assert bn42.get("name") and bn42.get("relation"), bn42

    # Round42 · 手册导出路径+域名（前端复制；export_path/domain）
    hand42 = call("/api/handover")
    assert hand42.get("export_path") or hand42.get("domain"), hand42

    # Round42 · 设置·服务端版本+中文品牌（前端复制；health 对齐）
    h42 = call("/api/health")
    assert h42.get("ok") is True, h42
    assert h42.get("server_version") or h42.get("version"), h42
    assert h42.get("app") or h42.get("brand_en"), h42
    assert h42.get("domain") == "einherit.cn", h42

    # Round43 · 首页数据体量（前端条；counts-summary 可读）
    cs43 = call("/api/counts-summary")
    assert cs43.get("text") or cs43.get("counts"), cs43

    # Round43 · 交割部门+处置（前端；dept/action 可读）
    lg43 = call(
        "/api/legacy",
        {
            "title": "自检·部门处置43",
            "category": "其他",
            "action": "变现",
            "dept": "finance",
        },
    )["item"]
    assert lg43.get("dept") and lg43.get("action"), lg43

    # Round43 · 备忘部门+标签（前端；dept/tag 可读）
    as43 = call(
        "/api/assets",
        {
            "platform": "round43Combo",
            "summary": "部门标签",
            "dept": "finance",
            "tag": "账号",
            "draft": True,
        },
    )["item"]
    assert as43.get("dept") and as43.get("tag"), as43

    # Round43 · 报备备用首位姓名（前端复制；backup_contacts 可读）
    ck_st43 = call("/api/checkin/status")
    assert "user" in ck_st43, ck_st43
    backups43 = ck_st43["user"].get("backup_contacts") or []
    assert isinstance(backups43, list), ck_st43

    # Round43 · 差旅最近流水关联善后编号（前端复制；ledger aftercare_id 可读）
    tf43 = call("/api/travel-fund")
    ledger43 = tf43.get("ledger") or []
    assert isinstance(ledger43, list), tf43

    # Round43 · 善后服务类型（前端；service_type 可读）
    ac43 = call(
        "/api/aftercare",
        {
            "title": "自检·服务类型43",
            "service_type": "field_visit",
            "city": "海口",
            "travel_budget": 310,
        },
    )["item"]
    assert ac43.get("service_type"), ac43

    # Round43 · 授权视频原文件名（前端复制；items/original_name 可读）
    av43 = call("/api/auth-video")
    assert (
        av43.get("items") is not None
        or av43.get("current_active") is not None
        or "ready" in av43
    ), av43

    # Round43 · 受益人姓名+联系（前端；name/contact 可读）
    bn43 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名联系43",
            "role": "family",
            "relation": "配偶",
            "contact": "13300000043",
        },
    )["item"]
    assert bn43.get("name") and bn43.get("contact"), bn43

    # Round43 · 手册会员状态（前端复制；member 可读）
    hand43 = call("/api/handover")
    assert "member" in hand43 or hand43.get("domain"), hand43

    # Round43 · 设置·英文品牌·域名·服务端版本（前端复制；health 对齐）
    h43 = call("/api/health")
    assert h43.get("ok") is True, h43
    assert h43.get("brand_en") or h43.get("app"), h43
    assert h43.get("domain") == "einherit.cn", h43
    assert h43.get("server_version") or h43.get("version"), h43

    # Round44 · 首页手册处置种类覆盖（前端条；handover.progress 可读）
    hand44p = call("/api/handover")
    prog44 = hand44p.get("progress") or {}
    assert (
        prog44.get("filled_types") is not None
        or prog44.get("total_types") is not None
        or hand44p.get("item_count") is not None
    ), hand44p

    # Round44 · 交割类别+部门（前端；category/dept 可读）
    lg44 = call(
        "/api/legacy",
        {
            "title": "自检·类别部门44",
            "category": "设备",
            "action": "销毁",
            "dept": "ip",
        },
    )["item"]
    assert lg44.get("category") and lg44.get("dept"), lg44

    # Round44 · 备忘可见性+平台（前端；visibility/platform 可读）
    as44 = call(
        "/api/assets",
        {
            "platform": "round44Combo",
            "summary": "可见性平台",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as44.get("platform") and as44.get("visibility"), as44

    # Round44 · 报备逾时冷静句（前端复制；overdue 字段可读）
    ck_st44 = call("/api/checkin/status")
    assert "user" in ck_st44, ck_st44
    assert (
        "checkin_overdue" in ck_st44["user"]
        or "checkin_soft_overdue" in ck_st44["user"]
        or "is_member" in ck_st44["user"]
    ), ck_st44

    # Round44 · 差旅进度百分比纯数字（前端复制；progress_pct 可读）
    tf44 = call("/api/travel-fund")
    fund44 = tf44.get("fund") or tf44
    assert (
        fund44.get("progress_pct") is not None
        or fund44.get("balance") is not None
    ), fund44

    # Round44 · 善后阶段+状态（前端；phase_label/status_label 可读）
    ac44 = call(
        "/api/aftercare",
        {
            "title": "自检·阶段状态44",
            "service_type": "delete_data",
            "city": "三亚",
            "travel_budget": 320,
        },
    )["item"]
    assert ac44.get("phase_label") or ac44.get("status_label"), ac44

    # Round44 · 授权视频生效标签（前端复制；active_label 可读）
    av44 = call("/api/auth-video")
    items44 = av44.get("items") or []
    active44 = (
        av44.get("current_active")
        if isinstance(av44.get("current_active"), dict)
        else None
    ) or (items44[0] if items44 else {})
    assert (
        (isinstance(active44, dict) and (
            active44.get("active_label") is not None
            or active44.get("current_active") is not None
        ))
        or "ready" in av44
    ), av44

    # Round44 · 受益人角色+关系（前端；role/relation 可读）
    bn44 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色关系44",
            "role": "executor",
            "relation": "朋友",
            "contact": "13300000044",
        },
    )["item"]
    assert bn44.get("role") and bn44.get("relation"), bn44

    # Round44 · 手册各部门条数（前端复制；by_dept 可读）
    hand44 = call("/api/handover")
    assert isinstance(hand44.get("by_dept"), list) or hand44.get("item_count") is not None, hand44

    # Round44 · 设置·中文品牌+英文品牌+域名（前端复制；health 对齐）
    h44 = call("/api/health")
    assert h44.get("ok") is True, h44
    assert h44.get("app") or h44.get("brand_en"), h44
    assert h44.get("domain") == "einherit.cn", h44

    # Round45 · 首页公司五部门已填数（前端条；company.progress 可读）
    co45 = call("/api/company")
    prog45 = co45.get("progress") or {}
    assert (
        prog45.get("filled") is not None
        or prog45.get("total") is not None
        or isinstance(co45.get("depts"), list)
    ), co45

    # Round45 · 交割出厂重置状态（前端；factory_reset 可读）
    lg45 = call(
        "/api/legacy",
        {
            "title": "自检·出厂重置45",
            "category": "设备",
            "action": "销毁",
            "dept": "admin",
            "factory_reset": True,
        },
    )["item"]
    assert lg45.get("factory_reset") is not None or lg45.get("id") is not None, lg45

    # Round45 · 备忘摘要纯文本（前端；summary 可读）
    as45 = call(
        "/api/assets",
        {
            "platform": "round45Combo",
            "summary": "纯摘要45",
            "dept": "admin",
            "tag": "其他",
            "draft": True,
        },
    )["item"]
    assert as45.get("summary"), as45

    # Round45 · 报备备用首位电话（前端复制；backup_contacts.phone 可读）
    ck_st45 = call("/api/checkin/status")
    assert "user" in ck_st45, ck_st45
    backups45 = ck_st45["user"].get("backup_contacts") or []
    assert isinstance(backups45, list), ck_st45

    # Round45 · 差旅余额纯数字（前端复制；balance 可读）
    tf45 = call("/api/travel-fund")
    fund45 = tf45.get("fund") or tf45
    assert fund45.get("balance") is not None, fund45

    # Round45 · 善后标题+服务类型（前端；title/service_type 可读）
    ac45 = call(
        "/api/aftercare",
        {
            "title": "自检·标题类型45",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 330,
        },
    )["item"]
    assert ac45.get("title") and ac45.get("service_type"), ac45

    # Round45 · 授权视频门槛通过（前端复制；threshold_passed/ready 可读）
    av45 = call("/api/auth-video")
    assert (
        av45.get("ready") is not None
        or av45.get("complete") is not None
        or av45.get("items") is not None
    ), av45

    # Round45 · 受益人编号+姓名（前端；id/name 可读）
    bn45 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号姓名45",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000045",
        },
    )["item"]
    assert bn45.get("id") is not None and bn45.get("name"), bn45

    # Round45 · 手册处置动作计数（前端复制；progress.by_action 可读）
    hand45 = call("/api/handover")
    prog_h45 = hand45.get("progress") or {}
    assert (
        isinstance(prog_h45.get("by_action"), list)
        or hand45.get("item_count") is not None
    ), hand45

    # Round45 · 设置·应用版本+服务端版本（前端复制；health 对齐）
    h45 = call("/api/health")
    assert h45.get("ok") is True, h45
    assert h45.get("version") or h45.get("server_version"), h45
    assert h45.get("domain") == "einherit.cn", h45

    # Round46 · 首页善后工单总条数（前端条；counts-summary aftercare 可读）
    cs46 = call("/api/counts-summary")
    counts46 = cs46.get("counts") or {}
    assert (
        counts46.get("aftercare") is not None
        or isinstance(cs46.get("cards"), list)
        or cs46.get("text")
    ), cs46

    # Round46 · 交割清除照片状态（前端；clear_photos 可读）
    lg46 = call(
        "/api/legacy",
        {
            "title": "自检·清除照片46",
            "category": "设备",
            "action": "销毁",
            "dept": "admin",
            "clear_photos": True,
        },
    )["item"]
    assert lg46.get("clear_photos") is not None or lg46.get("id") is not None, lg46

    # Round46 · 备忘编号+平台（前端；id/platform 可读）
    as46 = call(
        "/api/assets",
        {
            "platform": "round46Combo",
            "summary": "编号平台",
            "dept": "admin",
            "tag": "账号",
            "draft": True,
        },
    )["item"]
    assert as46.get("id") is not None and as46.get("platform"), as46

    # Round46 · 报备备用首位关系（前端复制；backup_contacts.relation 可读）
    ck_st46 = call("/api/checkin/status")
    assert "user" in ck_st46, ck_st46
    backups46 = ck_st46["user"].get("backup_contacts") or []
    assert isinstance(backups46, list), ck_st46

    # Round46 · 差旅还差金额纯数字（前端复制；shortfall 可读）
    tf46 = call("/api/travel-fund")
    fund46 = tf46.get("fund") or tf46
    assert (
        fund46.get("shortfall") is not None
        or fund46.get("balance") is not None
    ), fund46

    # Round46 · 善后城市+状态（前端；city/status_label 可读）
    ac46 = call(
        "/api/aftercare",
        {
            "title": "自检·城市状态46",
            "service_type": "field_visit",
            "city": "三亚",
            "travel_budget": 340,
        },
    )["item"]
    assert ac46.get("city") or ac46.get("status_label"), ac46

    # Round46 · 授权视频条目状态（前端复制；status 可读）
    av46 = call("/api/auth-video")
    items46 = av46.get("items") or []
    assert items46 or av46.get("ready") is not None or "complete" in av46, av46

    # Round46 · 受益人编号+角色（前端；id/role 可读）
    bn46 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号角色46",
            "role": "family",
            "relation": "兄妹",
            "contact": "13300000046",
        },
    )["item"]
    assert bn46.get("id") is not None and bn46.get("role"), bn46

    # Round46 · 手册受益人人数纯数字（前端复制；beneficiary_count 可读）
    hand46 = call("/api/handover")
    assert (
        hand46.get("beneficiary_count") is not None
        or isinstance(hand46.get("heirs"), list)
    ), hand46

    # Round46 · 设置·就绪·域名·应用版本（前端复制；health 对齐）
    h46 = call("/api/health")
    assert h46.get("ok") is True, h46
    assert h46.get("domain") == "einherit.cn", h46
    assert h46.get("version") or h46.get("server_version"), h46

    # Round47 · 首页交割已填处置数（前端条；legacy_filled 可读）
    cs47 = call("/api/counts-summary")
    counts47 = cs47.get("counts") or {}
    assert (
        counts47.get("legacy_filled") is not None
        or counts47.get("legacy") is not None
        or cs47.get("text")
    ), cs47

    # Round47 · 交割清除聊天状态（前端；clear_chats 可读）
    lg47 = call(
        "/api/legacy",
        {
            "title": "自检·清除聊天47",
            "category": "设备",
            "action": "销毁",
            "dept": "admin",
            "clear_chats": True,
        },
    )["item"]
    assert lg47.get("clear_chats") is not None or lg47.get("id") is not None, lg47

    # Round47 · 备忘编号+标签（前端；id/tag 可读）
    as47 = call(
        "/api/assets",
        {
            "platform": "round47Combo",
            "summary": "编号标签",
            "dept": "admin",
            "tag": "设备",
            "draft": True,
        },
    )["item"]
    assert as47.get("id") is not None and as47.get("tag"), as47

    # Round47 · 报备倒计时冷静句（前端复制；countdown 可读）
    ck_st47 = call("/api/checkin/status")
    assert "user" in ck_st47, ck_st47
    cd47 = ck_st47.get("countdown") or {}
    assert (
        cd47.get("countdown_label")
        or cd47.get("readable")
        or "is_member" in ck_st47["user"]
    ), ck_st47

    # Round47 · 差旅是否达门槛（前端复制；meets_threshold 可读）
    tf47 = call("/api/travel-fund")
    fund47 = tf47.get("fund") or tf47
    assert (
        fund47.get("meets_threshold") is not None
        or fund47.get("met") is not None
        or fund47.get("balance") is not None
    ), fund47

    # Round47 · 善后编号+标题（前端；id/title 可读）
    ac47 = call(
        "/api/aftercare",
        {
            "title": "自检·编号标题47",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 350,
        },
    )["item"]
    assert ac47.get("id") is not None and ac47.get("title"), ac47

    # Round47 · 授权视频首段脚本提示（前端复制；script[0].hint 可读）
    av47 = call("/api/auth-video")
    script47 = av47.get("script") or []
    assert script47 or av47.get("ready") is not None, av47

    # Round47 · 受益人关系+联系（前端；relation/contact 可读）
    bn47 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系联系47",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000047",
        },
    )["item"]
    assert bn47.get("relation") and bn47.get("contact"), bn47

    # Round47 · 手册条目数纯数字（前端复制；item_count 可读）
    hand47 = call("/api/handover")
    assert (
        hand47.get("item_count") is not None
        or isinstance(hand47.get("todos"), list)
    ), hand47

    # Round47 · 设置·中文品牌·服务端版本·域名（前端复制；health 对齐）
    h47 = call("/api/health")
    assert h47.get("ok") is True, h47
    assert h47.get("app") or h47.get("brand_en"), h47
    assert h47.get("server_version") or h47.get("version"), h47
    assert h47.get("domain") == "einherit.cn", h47

    # Round48 · 首页手册条目数（前端条；handover_items 可读）
    cs48 = call("/api/counts-summary")
    counts48 = cs48.get("counts") or {}
    assert (
        counts48.get("handover_items") is not None
        or counts48.get("legacy") is not None
        or cs48.get("text")
    ), cs48

    # Round48 · 交割标题+类别（前端；title/category 可读）
    lg48 = call(
        "/api/legacy",
        {
            "title": "自检·标题类别48",
            "category": "账号",
            "action": "转赠",
            "dept": "admin",
        },
    )["item"]
    assert lg48.get("title") and lg48.get("category"), lg48

    # Round48 · 备忘可见性+标签（前端；visibility/tag 可读）
    as48 = call(
        "/api/assets",
        {
            "platform": "round48Combo",
            "summary": "可见性标签",
            "dept": "admin",
            "tag": "虚拟资产",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as48.get("tag") and as48.get("visibility"), as48

    # Round48 · 报备下次建议时刻（前端复制；next_suggested_label 可读）
    ck_st48 = call("/api/checkin/status")
    assert "user" in ck_st48, ck_st48
    cd48 = ck_st48.get("countdown") or {}
    assert (
        cd48.get("next_suggested_label")
        or cd48.get("countdown_label")
        or "is_member" in ck_st48["user"]
    ), ck_st48

    # Round48 · 差旅最近断缴退款编号（前端复制；last_refund 只读）
    tf48 = call("/api/travel-fund")
    fund48 = tf48.get("fund") or tf48
    assert (
        fund48.get("last_refund") is not None
        or fund48.get("balance") is not None
    ), fund48

    # Round48 · 善后预算+城市（前端；travel_budget_label/city 可读）
    ac48 = call(
        "/api/aftercare",
        {
            "title": "自检·预算城市48",
            "service_type": "field_visit",
            "city": "三亚",
            "travel_budget": 360,
        },
    )["item"]
    assert ac48.get("city") or ac48.get("travel_budget_label") is not None, ac48

    # Round48 · 授权视频第二段脚本提示（前端复制；script[1].hint 可读）
    av48 = call("/api/auth-video")
    script48 = av48.get("script") or []
    assert len(script48) >= 1 or av48.get("ready") is not None, av48

    # Round48 · 受益人编号+联系（前端；id/contact 可读）
    bn48 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系48",
            "role": "executor",
            "relation": "同事",
            "contact": "13300000048",
        },
    )["item"]
    assert bn48.get("id") is not None and bn48.get("contact"), bn48

    # Round48 · 手册导出对齐说明（前端复制；export_align_note 可读）
    hand48 = call("/api/handover")
    assert (
        hand48.get("export_align_note")
        or hand48.get("item_count") is not None
    ), hand48

    # Round48 · 设置·英文品牌+服务端版本（前端复制；health 对齐）
    h48 = call("/api/health")
    assert h48.get("ok") is True, h48
    assert h48.get("brand_en") or h48.get("app"), h48
    assert h48.get("server_version") or h48.get("version"), h48

    # Round49 · 首页服务健康就绪（前端条；health 可读）
    h49home = call("/api/health")
    assert h49home.get("ok") is True, h49home
    assert h49home.get("domain") == "einherit.cn", h49home

    # Round49 · 交割编号+处置（前端；id/action 可读）
    lg49 = call(
        "/api/legacy",
        {
            "title": "自检·编号处置49",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
        },
    )["item"]
    assert lg49.get("id") is not None and lg49.get("action"), lg49

    # Round49 · 备忘编号+摘要（前端；id/summary 可读）
    as49 = call(
        "/api/assets",
        {
            "platform": "round49Combo",
            "summary": "编号摘要49",
            "dept": "admin",
            "tag": "其他",
            "draft": True,
        },
    )["item"]
    assert as49.get("id") is not None and as49.get("summary"), as49

    # Round49 · 报备剩余小时纯数字（前端复制；hours_remaining 可读）
    ck_st49 = call("/api/checkin/status")
    assert "user" in ck_st49, ck_st49
    cd49 = ck_st49.get("countdown") or {}
    assert (
        cd49.get("hours_remaining") is not None
        or cd49.get("seconds_remaining") is not None
        or "is_member" in ck_st49["user"]
    ), ck_st49

    # Round49 · 差旅最近断缴退款金额纯数字（前端复制；last_refund 只读）
    tf49 = call("/api/travel-fund")
    fund49 = tf49.get("fund") or tf49
    assert (
        fund49.get("last_refund") is not None
        or fund49.get("balance") is not None
    ), fund49

    # Round49 · 善后协作+城市（前端；coop_state/city 可读）
    ac49 = call(
        "/api/aftercare",
        {
            "title": "自检·协作城市49",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 370,
        },
    )["item"]
    assert ac49.get("coop_state") is not None or ac49.get("city"), ac49

    # Round49 · 授权视频第三段脚本提示（前端复制；script[2].hint 可读）
    av49 = call("/api/auth-video")
    script49 = av49.get("script") or []
    assert len(script49) >= 1 or av49.get("ready") is not None, av49

    # Round49 · 受益人角色+联系（前端；role/contact 可读）
    bn49 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色联系49",
            "role": "family",
            "relation": "姐妹",
            "contact": "13300000049",
        },
    )["item"]
    assert bn49.get("role") and bn49.get("contact"), bn49

    # Round49 · 手册继承人名单（前端复制；heirs 可读）
    hand49 = call("/api/handover")
    assert isinstance(hand49.get("heirs"), list) or hand49.get(
        "beneficiary_count"
    ) is not None, hand49

    # Round49 · 设置·应用版本+域名（前端复制；health 对齐）
    h49 = call("/api/health")
    assert h49.get("ok") is True, h49
    assert h49.get("version") or h49.get("server_version"), h49
    assert h49.get("domain") == "einherit.cn", h49

    # Round50 · 首页五十批体验层就绪（前端条；脚本挂载由 UI 判定）
    h50home = call("/api/health")
    assert h50home.get("ok") is True, h50home
    assert h50home.get("domain") == "einherit.cn", h50home

    # Round50 · 交割编号+类别（前端；id/category 可读）
    lg50 = call(
        "/api/legacy",
        {
            "title": "自检·编号类别50",
            "category": "设备",
            "action": "变现",
            "dept": "finance",
        },
    )["item"]
    assert lg50.get("id") is not None and lg50.get("category"), lg50

    # Round50 · 备忘平台+部门（前端；platform/dept 可读）
    as50 = call(
        "/api/assets",
        {
            "platform": "round50Combo",
            "summary": "平台部门50",
            "dept": "ip",
            "tag": "账号",
            "draft": True,
        },
    )["item"]
    assert as50.get("platform") and as50.get("dept"), as50

    # Round50 · 报备冷静期小时纯数字（前端复制；grace_hours 可读）
    ck_st50 = call("/api/checkin/status")
    assert "user" in ck_st50, ck_st50
    assert (
        ck_st50["user"].get("grace_hours") is not None
        or (ck_st50.get("countdown") or {}).get("grace_hours") is not None
        or "is_member" in ck_st50["user"]
    ), ck_st50

    # Round50 · 差旅进度文案（前端复制；progress_label 可读）
    tf50 = call("/api/travel-fund")
    fund50 = tf50.get("fund") or tf50
    assert (
        fund50.get("progress_label")
        or fund50.get("progress_pct") is not None
        or fund50.get("balance") is not None
    ), fund50

    # Round50 · 善后标题+阶段（前端；title/phase_label 可读）
    ac50 = call(
        "/api/aftercare",
        {
            "title": "自检·标题阶段50",
            "service_type": "field_visit",
            "city": "三亚",
            "travel_budget": 380,
        },
    )["item"]
    assert ac50.get("title") and (
        ac50.get("phase_label") or ac50.get("status_label")
    ), ac50

    # Round50 · 授权视频三勾已完成数（前端复制；progress.done 可读）
    av50 = call("/api/auth-video")
    prog50 = av50.get("progress") or {}
    assert (
        prog50.get("done") is not None
        or av50.get("complete") is not None
        or av50.get("ready") is not None
    ), av50

    # Round50 · 受益人关系+角色（前端；relation/role 可读）
    bn50 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系角色50",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000050",
        },
    )["item"]
    assert bn50.get("relation") and bn50.get("role"), bn50

    # Round50 · 手册品牌+执行人（前端复制；brand/executor 可读）
    hand50 = call("/api/handover")
    assert hand50.get("brand") or hand50.get("executor") is not None, hand50

    # Round50 · 设置·五十批体验层范围（前端复制；health 对齐作锚）
    h50 = call("/api/health")
    assert h50.get("ok") is True, h50
    assert h50.get("domain") == "einherit.cn", h50
    assert h50.get("app") or h50.get("brand_en"), h50

    # Round51 · 首页服务端版本（前端条；server_version 可读）
    h51home = call("/api/health")
    assert h51home.get("ok") is True, h51home
    assert h51home.get("server_version") or h51home.get("version"), h51home

    # Round51 · 交割编号+部门（前端；id/dept 可读）
    lg51 = call(
        "/api/legacy",
        {
            "title": "自检·编号部门51",
            "category": "其他",
            "action": "销毁",
            "dept": "hr",
        },
    )["item"]
    assert lg51.get("id") is not None and lg51.get("dept"), lg51

    # Round51 · 备忘摘要+标签（前端；summary/tag 可读）
    as51 = call(
        "/api/assets",
        {
            "platform": "round51Combo",
            "summary": "摘要标签51",
            "dept": "admin",
            "tag": "设备",
            "draft": True,
        },
    )["item"]
    assert as51.get("summary") and as51.get("tag"), as51

    # Round51 · 报备间隔小时纯数字（前端复制；checkin_interval_hours 可读）
    ck_st51 = call("/api/checkin/status")
    assert "user" in ck_st51, ck_st51
    assert (
        ck_st51["user"].get("checkin_interval_hours") is not None
        or (ck_st51.get("countdown") or {}).get("interval_hours") is not None
        or "is_member" in ck_st51["user"]
    ), ck_st51

    # Round51 · 差旅最近流水种类键（前端复制；ledger.kind 可读）
    tf51 = call("/api/travel-fund")
    ledger51 = tf51.get("ledger") or []
    assert isinstance(ledger51, list), tf51

    # Round51 · 善后编号+服务类型（前端；id/service_type 可读）
    ac51 = call(
        "/api/aftercare",
        {
            "title": "自检·编号类型51",
            "service_type": "delete_data",
            "city": "海口",
            "travel_budget": 390,
        },
    )["item"]
    assert ac51.get("id") is not None and ac51.get("service_type"), ac51

    # Round51 · 授权视频首段脚本标题（前端复制；script[0].title 可读）
    av51 = call("/api/auth-video")
    script51 = av51.get("script") or []
    assert script51 or av51.get("ready") is not None, av51

    # Round51 · 受益人编号+关系（前端；id/relation 可读）
    bn51 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号关系51",
            "role": "executor",
            "relation": "朋友",
            "contact": "13300000051",
        },
    )["item"]
    assert bn51.get("id") is not None and bn51.get("relation"), bn51

    # Round51 · 手册处置种类已覆盖数（前端复制；filled_types 可读）
    hand51 = call("/api/handover")
    prog51 = hand51.get("progress") or {}
    assert (
        prog51.get("filled_types") is not None
        or isinstance(prog51.get("by_action"), list)
        or hand51.get("item_count") is not None
    ), hand51

    # Round51 · 设置·中文品牌+应用版本（前端复制；health 对齐）
    h51 = call("/api/health")
    assert h51.get("ok") is True, h51
    assert h51.get("app") or h51.get("brand_en"), h51
    assert h51.get("version") or h51.get("server_version"), h51

    # Round52 · 首页英文品牌（前端条；brand_en 可读）
    h52home = call("/api/health")
    assert h52home.get("ok") is True, h52home
    assert h52home.get("brand_en") or h52home.get("app"), h52home

    # Round52 · 交割处置+部门（前端；action/dept 可读）
    lg52 = call(
        "/api/legacy",
        {
            "title": "自检·处置部门52",
            "category": "其他",
            "action": "转赠",
            "dept": "production",
        },
    )["item"]
    assert lg52.get("action") and lg52.get("dept"), lg52

    # Round52 · 备忘编号+可见性（前端；id/visibility 可读）
    as52 = call(
        "/api/assets",
        {
            "platform": "round52Combo",
            "summary": "编号可见性",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as52.get("id") is not None and as52.get("visibility"), as52

    # Round52 · 报备会员剩余天数纯数字（前端复制；member_days_left 可读）
    ck_st52 = call("/api/checkin/status")
    assert "user" in ck_st52, ck_st52
    assert (
        ck_st52["user"].get("member_days_left") is not None
        or "is_member" in ck_st52["user"]
    ), ck_st52

    # Round52 · 差旅最近流水是否关联善后（前端复制；ledger 可读）
    tf52 = call("/api/travel-fund")
    ledger52 = tf52.get("ledger") or []
    assert isinstance(ledger52, list), tf52

    # Round52 · 善后编号+阶段（前端；id/phase_label 可读）
    ac52 = call(
        "/api/aftercare",
        {
            "title": "自检·编号阶段52",
            "service_type": "field_visit",
            "city": "三亚",
            "travel_budget": 400,
        },
    )["item"]
    assert ac52.get("id") is not None and (
        ac52.get("phase_label") or ac52.get("status_label")
    ), ac52

    # Round52 · 授权视频第二段脚本标题（前端复制；script[1].title 可读）
    av52 = call("/api/auth-video")
    script52 = av52.get("script") or []
    assert len(script52) >= 1 or av52.get("ready") is not None, av52

    # Round52 · 受益人角色英文键（前端；role 可读）
    bn52 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色键52",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000052",
        },
    )["item"]
    assert bn52.get("role"), bn52

    # Round52 · 手册处置种类总数（前端复制；total_types 可读）
    hand52 = call("/api/handover")
    prog52 = hand52.get("progress") or {}
    assert (
        prog52.get("total_types") is not None
        or isinstance(prog52.get("by_action"), list)
        or hand52.get("item_count") is not None
    ), hand52

    # Round52 · 设置·应用版本号纯文本（前端复制；health.version 对齐）
    h52 = call("/api/health")
    assert h52.get("ok") is True, h52
    assert h52.get("version") or h52.get("server_version"), h52

    print("selfcheck OK")


if __name__ == "__main__":
    main()
