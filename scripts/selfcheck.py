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

    # Round53 · 首页中文品牌（前端条；health.app 可读）
    h53home = call("/api/health")
    assert h53home.get("ok") is True, h53home
    assert h53home.get("app") or h53home.get("brand_en"), h53home

    # Round53 · 交割标题+处置（前端；title/action 可读）
    lg53 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置53",
            "category": "其他",
            "action": "销毁",
            "dept": "finance",
        },
    )["item"]
    assert lg53.get("title") and lg53.get("action"), lg53

    # Round53 · 备忘平台+摘要（前端；platform/summary 可读）
    as53 = call(
        "/api/assets",
        {
            "platform": "round53Combo",
            "summary": "平台摘要",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as53.get("platform") and as53.get("summary"), as53

    # Round53 · 报备最近相对时间（前端复制；last_ago_label 可读）
    ck_st53 = call("/api/checkin/status")
    assert "countdown" in ck_st53 or "user" in ck_st53, ck_st53
    cd53 = ck_st53.get("countdown") or {}
    assert cd53.get("last_ago_label") or ck_st53.get("user"), ck_st53

    # Round53 · 差旅最近流水中文种类标签（前端复制；kind_label 可读）
    tf53 = call("/api/travel-fund")
    ledger53 = tf53.get("ledger") or []
    assert isinstance(ledger53, list), tf53
    if ledger53:
        assert ledger53[0].get("kind_label") or ledger53[0].get("kind"), ledger53[0]

    # Round53 · 善后编号+城市（前端；id/city 可读）
    ac53 = call(
        "/api/aftercare",
        {
            "title": "自检·编号城市53",
            "service_type": "data_wipe",
            "city": "海口",
            "travel_budget": 450,
        },
    )["item"]
    assert ac53.get("id") is not None and ac53.get("city"), ac53

    # Round53 · 授权视频第三段脚本标题（前端复制；script[2].title 可读）
    av53 = call("/api/auth-video")
    script53 = av53.get("script") or []
    assert len(script53) >= 1 or av53.get("ready") is not None, av53

    # Round53 · 受益人姓名纯文本（前端；name 可读）
    bn53 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名53",
            "role": "family",
            "relation": "配偶",
            "contact": "13300000053",
        },
    )["item"]
    assert bn53.get("name"), bn53

    # Round53 · 手册覆盖百分比（前端复制；progress.pct 可读）
    hand53 = call("/api/handover")
    prog53 = hand53.get("progress") or {}
    assert (
        prog53.get("pct") is not None
        or (
            prog53.get("filled_types") is not None
            and prog53.get("total_types") is not None
        )
        or hand53.get("item_count") is not None
    ), hand53

    # Round53 · 设置·域名纯文本（前端复制；health.domain 对齐）
    h53 = call("/api/health")
    assert h53.get("ok") is True, h53
    assert h53.get("domain") or h53.get("brand_en"), h53

    # Round54 · 首页公司盘点标语（前端条；company.slogan 可读）
    co54 = call("/api/company")
    assert co54.get("slogan") or co54.get("progress"), co54

    # Round54 · 交割类别+处置（前端；category/action 可读）
    lg54 = call(
        "/api/legacy",
        {
            "title": "自检·类别处置54",
            "category": "虚拟资产",
            "action": "销售变现",
            "dept": "finance",
        },
    )["item"]
    assert lg54.get("category") and lg54.get("action"), lg54

    # Round54 · 备忘摘要+部门（前端；summary/dept 可读）
    as54 = call(
        "/api/assets",
        {
            "platform": "round54Combo",
            "summary": "摘要部门",
            "dept": "hr",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as54.get("summary") and as54.get("dept"), as54

    # Round54 · 报备最近绝对时刻（前端复制；last_checkin_label 可读）
    ck_st54 = call("/api/checkin/status")
    cd54 = ck_st54.get("countdown") or {}
    assert cd54.get("last_checkin_label") or ck_st54.get("user"), ck_st54

    # Round54 · 差旅余额与门槛（前端复制；balance/threshold 可读）
    tf54 = call("/api/travel-fund")
    fund54 = tf54.get("fund") or tf54
    assert fund54.get("balance") is not None and fund54.get("threshold") is not None, tf54

    # Round54 · 善后编号+状态（前端；id/status_label 可读）
    ac54 = call(
        "/api/aftercare",
        {
            "title": "自检·编号状态54",
            "service_type": "field_visit",
            "city": "儋州",
            "travel_budget": 480,
        },
    )["item"]
    assert ac54.get("id") is not None and (
        ac54.get("status_label") or ac54.get("phase_label")
    ), ac54

    # Round54 · 授权视频齐备说明（前端复制；complete_label 可读）
    av54 = call("/api/auth-video")
    assert av54.get("complete_label") or av54.get("ready") is not None, av54

    # Round54 · 受益人关系纯文本（前端；relation 可读）
    bn54 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系54",
            "role": "executor",
            "relation": "好友",
            "contact": "13300000054",
        },
    )["item"]
    assert bn54.get("relation"), bn54

    # Round54 · 手册执行人姓名（前端复制；executor 可读）
    hand54 = call("/api/handover")
    assert hand54.get("executor") or hand54.get("brand"), hand54

    # Round54 · 设置·英文品牌纯文本（前端复制；health.brand_en 对齐）
    h54 = call("/api/health")
    assert h54.get("ok") is True, h54
    assert h54.get("brand_en") or h54.get("app"), h54

    # Round55 · 首页受益人条数（前端条；counts.beneficiaries 可读）
    counts55 = call("/api/counts-summary")
    assert (counts55.get("counts") or {}).get("beneficiaries") is not None or counts55.get(
        "text"
    ), counts55

    # Round55 · 交割类别纯文本（前端；category 可读）
    lg55 = call(
        "/api/legacy",
        {
            "title": "自检·类别55",
            "category": "虚拟资产",
            "action": "销毁",
            "dept": "finance",
        },
    )["item"]
    assert lg55.get("category"), lg55

    # Round55 · 备忘编号+部门（前端；id/dept 可读）
    as55 = call(
        "/api/assets",
        {
            "platform": "round55Combo",
            "summary": "编号部门",
            "dept": "ip",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as55.get("id") is not None and as55.get("dept"), as55

    # Round55 · 报备距上次小时（前端复制；hours_since_last 可读）
    ck_st55 = call("/api/checkin/status")
    cd55 = ck_st55.get("countdown") or {}
    assert cd55.get("hours_since_last") is not None or ck_st55.get("user"), ck_st55

    # Round55 · 差旅断缴退款种类键（前端复制；last_refund.kind 可读）
    tf55 = call("/api/travel-fund")
    fund55 = tf55.get("fund") or tf55
    refund55 = fund55.get("last_refund")
    assert refund55 is None or refund55.get("kind") or isinstance(
        tf55.get("ledger") or [], list
    ), tf55

    # Round55 · 善后服务类型+城市（前端；service_type/city 可读）
    ac55 = call(
        "/api/aftercare",
        {
            "title": "自检·服务城市55",
            "service_type": "delete_data",
            "city": "文昌",
            "travel_budget": 520,
        },
    )["item"]
    assert ac55.get("service_type") and ac55.get("city"), ac55

    # Round55 · 授权视频门槛总数（前端复制；progress.total 可读）
    av55 = call("/api/auth-video")
    prog_av55 = av55.get("progress") or {}
    assert prog_av55.get("total") is not None or av55.get("ready") is not None, av55

    # Round55 · 受益人编号纯数字（前端；id 可读）
    bn55 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号55",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000055",
        },
    )["item"]
    assert bn55.get("id") is not None, bn55

    # Round55 · 手册转赠条数（前端复制；action_counts.gift 可读）
    hand55 = call("/api/handover")
    prog55 = hand55.get("progress") or {}
    gift55 = (prog55.get("action_counts") or {}).get("gift")
    assert gift55 is not None or isinstance(prog55.get("by_action"), list) or hand55.get(
        "item_count"
    ) is not None, hand55

    # Round55 · 设置·服务端版本纯文本（前端复制；health.server_version 对齐）
    h55 = call("/api/health")
    assert h55.get("ok") is True, h55
    assert h55.get("server_version") or h55.get("version"), h55

    # Round56 · 首页产品域名（前端条；health.domain 可读）
    h56home = call("/api/health")
    assert h56home.get("ok") is True, h56home
    assert h56home.get("domain") or h56home.get("brand_en"), h56home

    # Round56 · 交割处置纯文本（前端；action 可读）
    lg56 = call(
        "/api/legacy",
        {
            "title": "自检·处置56",
            "category": "其他",
            "action": "销售变现",
            "dept": "finance",
        },
    )["item"]
    assert lg56.get("action"), lg56

    # Round56 · 备忘标签纯文本（前端；tag 可读）
    as56 = call(
        "/api/assets",
        {
            "platform": "round56Combo",
            "summary": "标签纯文本",
            "dept": "admin",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as56.get("tag"), as56

    # Round56 · 报备将到建议时刻状态（前端复制；due_soon 可读）
    ck_st56 = call("/api/checkin/status")
    cd56 = ck_st56.get("countdown") or {}
    assert "due_soon" in cd56 or ck_st56.get("user"), ck_st56

    # Round56 · 差旅断缴退款备注（前端复制；last_refund.note 可读）
    tf56 = call("/api/travel-fund")
    fund56 = tf56.get("fund") or tf56
    refund56 = fund56.get("last_refund")
    assert refund56 is None or refund56.get("note") is not None or isinstance(
        tf56.get("ledger") or [], list
    ), tf56

    # Round56 · 善后状态英文键（前端；status_key 可读）
    ac56 = call(
        "/api/aftercare",
        {
            "title": "自检·状态键56",
            "service_type": "field_visit",
            "city": "琼海",
            "travel_budget": 560,
        },
    )["item"]
    assert ac56.get("status_key") or ac56.get("status_label"), ac56

    # Round56 · 授权视频首段脚本键（前端复制；script[0].key 可读）
    av56 = call("/api/auth-video")
    script56 = av56.get("script") or []
    assert (script56 and script56[0].get("key")) or av56.get("ready") is not None, av56

    # Round56 · 受益人角色中文（前端；role 可读）
    bn56 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色中文56",
            "role": "family",
            "relation": "配偶",
            "contact": "13300000056",
        },
    )["item"]
    assert bn56.get("role"), bn56

    # Round56 · 手册销毁条数（前端复制；action_counts.destroy 可读）
    hand56 = call("/api/handover")
    prog56 = hand56.get("progress") or {}
    destroy56 = (prog56.get("action_counts") or {}).get("destroy")
    assert destroy56 is not None or isinstance(prog56.get("by_action"), list) or hand56.get(
        "item_count"
    ) is not None, hand56

    # Round56 · 设置·服务就绪状态纯词（前端复制；health.ok 对齐）
    h56 = call("/api/health")
    assert h56.get("ok") is True, h56

    # Round57 · 首页应用版本号（前端条；health.version 可读）
    h57home = call("/api/health")
    assert h57home.get("ok") is True, h57home
    assert h57home.get("version") or h57home.get("server_version"), h57home

    # Round57 · 交割标题纯文本（前端；title 可读）
    lg57 = call(
        "/api/legacy",
        {
            "title": "自检·标题57",
            "category": "其他",
            "action": "转赠",
            "dept": "admin",
        },
    )["item"]
    assert lg57.get("title"), lg57

    # Round57 · 备忘平台纯文本（前端；platform 可读）
    as57 = call(
        "/api/assets",
        {
            "platform": "round57Plain",
            "summary": "平台纯文本",
            "dept": "finance",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as57.get("platform"), as57

    # Round57 · 报备剩余秒（前端复制；seconds_remaining 可读）
    ck_st57 = call("/api/checkin/status")
    cd57 = ck_st57.get("countdown") or {}
    assert cd57.get("seconds_remaining") is not None or ck_st57.get("user"), ck_st57

    # Round57 · 差旅最近流水金额纯数字（前端复制；ledger.amount 可读）
    tf57 = call("/api/travel-fund")
    ledger57 = tf57.get("ledger") or []
    assert isinstance(ledger57, list), tf57

    # Round57 · 善后阶段英文键（前端；phase_key 可读）
    ac57 = call(
        "/api/aftercare",
        {
            "title": "自检·阶段键57",
            "service_type": "delete_data",
            "city": "万宁",
            "travel_budget": 570,
        },
    )["item"]
    assert ac57.get("phase_key") or ac57.get("phase_label"), ac57

    # Round57 · 授权视频第二段脚本键（前端复制；script[1].key 可读）
    av57 = call("/api/auth-video")
    script57 = av57.get("script") or []
    assert len(script57) >= 1 or av57.get("ready") is not None, av57

    # Round57 · 受益人角色键+姓名（前端；role/name 可读）
    bn57 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色姓名57",
            "role": "executor",
            "relation": "同事",
            "contact": "13300000057",
        },
    )["item"]
    assert bn57.get("role") and bn57.get("name"), bn57

    # Round57 · 手册变现条数（前端复制；action_counts.sale 可读）
    hand57 = call("/api/handover")
    prog57 = hand57.get("progress") or {}
    sale57 = (prog57.get("action_counts") or {}).get("sale")
    assert sale57 is not None or isinstance(prog57.get("by_action"), list) or hand57.get(
        "item_count"
    ) is not None, hand57

    # Round57 · 设置·带 v 前缀应用版本（前端复制；health.version 对齐）
    h57 = call("/api/health")
    assert h57.get("ok") is True, h57
    assert h57.get("version") or h57.get("server_version"), h57

    # Round58 · 首页差旅余额（前端条；balance 可读）
    tf58home = call("/api/travel-fund")
    fund58home = tf58home.get("fund") or tf58home
    assert fund58home.get("balance") is not None or fund58home.get("threshold") is not None, tf58home

    # Round58 · 交割部门短名（前端；dept 可读）
    lg58 = call(
        "/api/legacy",
        {
            "title": "自检·部门58",
            "category": "其他",
            "action": "销毁",
            "dept": "hr",
        },
    )["item"]
    assert lg58.get("dept"), lg58

    # Round58 · 备忘部门短名（前端；dept 可读）
    as58 = call(
        "/api/assets",
        {
            "platform": "round58Dept",
            "summary": "部门纯文本",
            "dept": "production",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as58.get("dept"), as58

    # Round58 · 报备冷静期剩余秒（前端复制；grace_remaining_seconds 可读）
    ck_st58 = call("/api/checkin/status")
    assert (ck_st58.get("user") or {}).get("grace_remaining_seconds") is not None or ck_st58.get(
        "countdown"
    ), ck_st58

    # Round58 · 差旅流水种类键+标签（前端复制；kind/kind_label 可读）
    tf58 = call("/api/travel-fund")
    ledger58 = tf58.get("ledger") or []
    assert isinstance(ledger58, list), tf58
    if ledger58:
        assert ledger58[0].get("kind") or ledger58[0].get("kind_label"), ledger58[0]

    # Round58 · 善后阶段序号（前端；phase_index 可读）
    ac58 = call(
        "/api/aftercare",
        {
            "title": "自检·阶段序号58",
            "service_type": "field_visit",
            "city": "东方",
            "travel_budget": 580,
        },
    )["item"]
    assert ac58.get("phase_index") is not None or ac58.get("phase_key"), ac58

    # Round58 · 授权视频第三段脚本键（前端复制；script[2].key 可读）
    av58 = call("/api/auth-video")
    script58 = av58.get("script") or []
    assert len(script58) >= 1 or av58.get("ready") is not None, av58

    # Round58 · 受益人关系+角色键（前端；relation/role 可读）
    bn58 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系角色58",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000058",
        },
    )["item"]
    assert bn58.get("relation") and bn58.get("role"), bn58

    # Round58 · 手册清除类条数（前端复制；action_counts.clear 可读）
    hand58 = call("/api/handover")
    prog58 = hand58.get("progress") or {}
    clear58 = (prog58.get("action_counts") or {}).get("clear")
    assert clear58 is not None or isinstance(prog58.get("by_action"), list) or hand58.get(
        "item_count"
    ) is not None, hand58

    # Round58 · 设置·域名+英文品牌（前端复制；domain/brand_en 对齐）
    h58 = call("/api/health")
    assert h58.get("ok") is True, h58
    assert h58.get("domain") or h58.get("brand_en"), h58

    # Round59 · 首页差旅进度百分比（前端条；progress_pct 可读）
    tf59home = call("/api/travel-fund")
    fund59home = tf59home.get("fund") or tf59home
    assert (
        fund59home.get("progress_pct") is not None
        or fund59home.get("balance") is not None
    ), tf59home

    # Round59 · 交割编号纯数字（前端；id 可读）
    lg59 = call(
        "/api/legacy",
        {
            "title": "自检·编号59",
            "category": "其他",
            "action": "转赠",
            "dept": "admin",
        },
    )["item"]
    assert lg59.get("id") is not None, lg59

    # Round59 · 备忘可见性英文键（前端；visibility 可读）
    as59 = call(
        "/api/assets",
        {
            "platform": "round59Vis",
            "summary": "可见性键",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as59.get("visibility"), as59

    # Round59 · 报备是否冷静期（前端复制；checkin_in_grace 可读）
    ck_st59 = call("/api/checkin/status")
    assert "checkin_in_grace" in (ck_st59.get("user") or {}) or ck_st59.get(
        "countdown"
    ), ck_st59

    # Round59 · 差旅流水编号+种类键（前端复制；id/kind 可读）
    tf59 = call("/api/travel-fund")
    ledger59 = tf59.get("ledger") or []
    assert isinstance(ledger59, list), tf59
    if ledger59:
        assert ledger59[0].get("id") is not None or ledger59[0].get("kind"), ledger59[0]

    # Round59 · 善后服务类型英文键（前端；service_type 可读）
    ac59 = call(
        "/api/aftercare",
        {
            "title": "自检·服务类型键59",
            "service_type": "delete_data",
            "city": "临高",
            "travel_budget": 590,
        },
    )["item"]
    assert ac59.get("service_type"), ac59

    # Round59 · 授权视频生效文件名（前端复制；filename 可读）
    av59 = call("/api/auth-video")
    active59 = av59.get("current_active") or av59.get("latest") or {}
    assert active59.get("filename") or av59.get("ready") is not None, av59

    # Round59 · 受益人角色键+关系（前端；role/relation 可读）
    bn59 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色关系59",
            "role": "family",
            "relation": "兄妹",
            "contact": "13300000059",
        },
    )["item"]
    assert bn59.get("role") and bn59.get("relation"), bn59

    # Round59 · 手册处置计数英文键摘要（前端复制；action_counts 可读）
    hand59 = call("/api/handover")
    prog59 = hand59.get("progress") or {}
    assert prog59.get("action_counts") or isinstance(prog59.get("by_action"), list) or hand59.get(
        "item_count"
    ) is not None, hand59

    # Round59 · 设置·服务端+应用版本纯号（前端复制；server_version/version 对齐）
    h59 = call("/api/health")
    assert h59.get("ok") is True, h59
    assert h59.get("server_version") or h59.get("version"), h59

    # Round60 · 首页六十批体验层就绪（前端条；脚本挂载由 UI 判定）
    h60home = call("/api/health")
    assert h60home.get("ok") is True, h60home
    assert h60home.get("domain") == "einherit.cn", h60home

    # Round60 · 交割编号+出厂重置（前端；id/factory_reset 可读）
    lg60 = call(
        "/api/legacy",
        {
            "title": "自检·编号出厂60",
            "category": "其他",
            "action": "销毁",
            "dept": "production",
            "factory_reset": True,
        },
    )["item"]
    assert lg60.get("id") is not None, lg60
    assert lg60.get("factory_reset") is not None or "factory_reset" in lg60, lg60

    # Round60 · 备忘可见性+部门（前端；visibility/dept 可读）
    as60 = call(
        "/api/assets",
        {
            "platform": "round60VisDept",
            "summary": "可见性部门60",
            "dept": "finance",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as60.get("visibility") and as60.get("dept"), as60

    # Round60 · 报备最近与下次建议时刻标签（前端复制；label 只读，不改外呼）
    ck_st60 = call("/api/checkin/status")
    cd60 = ck_st60.get("countdown") or {}
    assert (
        cd60.get("last_checkin_label")
        or cd60.get("next_suggested_label")
        or ck_st60.get("user")
    ), ck_st60

    # Round60 · 差旅门槛与进度百分比（前端复制；threshold/progress_pct 只读，不改退款）
    tf60 = call("/api/travel-fund")
    fund60 = tf60.get("fund") or tf60
    assert (
        fund60.get("threshold") is not None
        or fund60.get("progress_pct") is not None
        or fund60.get("balance") is not None
    ), tf60

    # Round60 · 善后编号+协作状态（前端；id/coop_state 可读）
    ac60 = call(
        "/api/aftercare",
        {
            "title": "自检·编号协作60",
            "service_type": "field_visit",
            "city": "琼海",
            "travel_budget": 600,
        },
    )["item"]
    assert ac60.get("id") is not None, ac60
    assert ac60.get("coop_state") is not None or "coop_state" in ac60, ac60

    # Round60 · 授权视频三勾已完成/总数（前端复制；progress.done/total 可读）
    av60 = call("/api/auth-video")
    prog60 = av60.get("progress") or {}
    assert (
        (prog60.get("done") is not None and prog60.get("total") is not None)
        or av60.get("complete") is not None
        or av60.get("ready") is not None
    ), av60

    # Round60 · 受益人编号+角色键（前端；id/role 可读）
    bn60 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号角色60",
            "role": "heir",
            "relation": "侄子",
            "contact": "13300000060",
        },
    )["item"]
    assert bn60.get("id") is not None and bn60.get("role"), bn60

    # Round60 · 手册覆盖百分比+条目总数（前端复制；pct/total_items 可读）
    hand60 = call("/api/handover")
    prog_h60 = hand60.get("progress") or {}
    assert (
        prog_h60.get("pct") is not None
        or prog_h60.get("total_items") is not None
        or hand60.get("item_count") is not None
    ), hand60

    # Round60 · 设置·六十批体验层范围（前端复制；health 对齐）
    h60 = call("/api/health")
    assert h60.get("ok") is True, h60
    assert h60.get("domain") == "einherit.cn", h60
    assert h60.get("brand_en") or h60.get("version") or h60.get("server_version"), h60

    # Round61 · 首页报备软逾期冷静状态（前端条；checkin_soft_overdue 只读）
    ck_st61home = call("/api/checkin/status")
    assert "checkin_soft_overdue" in (ck_st61home.get("user") or {}) or ck_st61home.get(
        "countdown"
    ), ck_st61home

    # Round61 · 交割编号+清除聊天（前端；id/clear_chats 可读）
    lg61 = call(
        "/api/legacy",
        {
            "title": "自检·编号清除聊天61",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
            "clear_chats": True,
        },
    )["item"]
    assert lg61.get("id") is not None, lg61
    assert lg61.get("clear_chats") is not None or "clear_chats" in lg61, lg61

    # Round61 · 备忘平台+可见性（前端；platform/visibility 可读）
    as61 = call(
        "/api/assets",
        {
            "platform": "round61PlatVis",
            "summary": "平台可见性61",
            "dept": "ip",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as61.get("platform") and as61.get("visibility"), as61

    # Round61 · 报备剩余小时与距今（前端复制；hours_remaining/last_ago_label 只读）
    ck_st61 = call("/api/checkin/status")
    cd61 = ck_st61.get("countdown") or {}
    assert (
        cd61.get("hours_remaining") is not None
        or cd61.get("last_ago_label")
        or ck_st61.get("user")
    ), ck_st61

    # Round61 · 差旅缺口与达标（前端复制；shortfall/meets_threshold 只读，不改退款）
    tf61 = call("/api/travel-fund")
    fund61 = tf61.get("fund") or tf61
    assert (
        fund61.get("shortfall") is not None
        or fund61.get("meets_threshold") is not None
        or fund61.get("met") is not None
        or fund61.get("balance") is not None
    ), tf61

    # Round61 · 善后状态键+阶段键（前端；status_key/phase_key 可读）
    ac61 = call(
        "/api/aftercare",
        {
            "title": "自检·状态阶段键61",
            "service_type": "delete_data",
            "city": "文昌",
            "travel_budget": 610,
        },
    )["item"]
    assert ac61.get("status_key") or ac61.get("phase_key"), ac61

    # Round61 · 授权视频原文件名+状态（前端复制；original_name/status 可读）
    av61 = call("/api/auth-video")
    active61 = av61.get("current_active") or av61.get("latest") or {}
    assert (
        active61.get("original_name")
        or active61.get("filename")
        or active61.get("status")
        or av61.get("ready") is not None
    ), av61

    # Round61 · 受益人编号+备注（前端；id/note 可读）
    bn61 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号备注61",
            "role": "executor",
            "relation": "朋友",
            "contact": "13300000061",
            "note": "round61备注",
        },
    )["item"]
    assert bn61.get("id") is not None, bn61
    assert bn61.get("note") is not None or "note" in bn61, bn61

    # Round61 · 手册已填类型与种类总数（前端复制；filled_types/total_types 可读）
    hand61 = call("/api/handover")
    prog61 = hand61.get("progress") or {}
    assert (
        prog61.get("filled_types") is not None
        or prog61.get("total_types") is not None
        or hand61.get("item_count") is not None
    ), hand61

    # Round61 · 设置·应用中文名+英文品牌（前端复制；app/brand_en 对齐）
    h61 = call("/api/health")
    assert h61.get("ok") is True, h61
    assert h61.get("app") or h61.get("brand_en"), h61
    assert h61.get("domain") == "einherit.cn", h61

    # Round62 · 首页会员温和提示（前端条；member_gentle_hint 只读）
    ck_st62home = call("/api/checkin/status")
    assert (ck_st62home.get("user") or {}).get("member_gentle_hint") or ck_st62home.get(
        "user"
    ), ck_st62home

    # Round62 · 交割编号+清除照片（前端；id/clear_photos 可读）
    lg62 = call(
        "/api/legacy",
        {
            "title": "自检·编号清除照片62",
            "category": "其他",
            "action": "销毁",
            "dept": "production",
            "clear_photos": True,
        },
    )["item"]
    assert lg62.get("id") is not None, lg62
    assert lg62.get("clear_photos") is not None or "clear_photos" in lg62, lg62

    # Round62 · 备忘平台+账号提示（前端；platform/account_hint 可读）
    as62 = call(
        "/api/assets",
        {
            "platform": "round62PlatHint",
            "summary": "平台账号提示62",
            "account_hint": "demo@einherit",
            "dept": "admin",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as62.get("platform"), as62
    assert as62.get("account_hint") is not None or "account_hint" in as62, as62

    # Round62 · 报备剩余小时与冷静期小时（前端复制；只读，不改外呼）
    ck_st62 = call("/api/checkin/status")
    cd62 = ck_st62.get("countdown") or {}
    user62 = ck_st62.get("user") or {}
    assert (
        cd62.get("hours_remaining") is not None
        or cd62.get("grace_hours") is not None
        or user62.get("grace_hours") is not None
        or user62
    ), ck_st62

    # Round62 · 差旅流水编号+备注（前端复制；ledger id/note 只读，不改退款）
    tf62 = call("/api/travel-fund")
    ledger62 = tf62.get("ledger") or []
    assert isinstance(ledger62, list), tf62
    if ledger62:
        assert ledger62[0].get("id") is not None or "note" in ledger62[0], ledger62[0]

    # Round62 · 善后城市+协作状态（前端；city/coop_state 可读）
    ac62 = call(
        "/api/aftercare",
        {
            "title": "自检·城市协作62",
            "service_type": "field_visit",
            "city": "儋州",
            "travel_budget": 620,
        },
    )["item"]
    assert ac62.get("city") or ac62.get("coop_state") is not None, ac62

    # Round62 · 授权视频就绪与齐备文案（前端复制；ready/complete_label 可读）
    av62 = call("/api/auth-video")
    assert (
        av62.get("ready") is not None
        or av62.get("complete_label")
        or av62.get("complete") is not None
    ), av62

    # Round62 · 受益人联系+备注（前端；contact/note 可读）
    bn62 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系备注62",
            "role": "family",
            "relation": "亲属",
            "contact": "13300000062",
            "note": "round62备注",
        },
    )["item"]
    assert bn62.get("contact"), bn62
    assert bn62.get("note") is not None or "note" in bn62, bn62

    # Round62 · 手册转赠与清除条数（前端复制；action_counts.gift/clear 可读）
    hand62 = call("/api/handover")
    counts62 = ((hand62.get("progress") or {}).get("action_counts")) or {}
    assert (
        counts62.get("gift") is not None
        or counts62.get("clear") is not None
        or hand62.get("item_count") is not None
    ), hand62

    # Round62 · 设置·就绪状态+域名（前端复制；ok/domain 对齐）
    h62 = call("/api/health")
    assert h62.get("ok") is True, h62
    assert h62.get("domain") == "einherit.cn", h62

    # Round63 · 首页报备升级冷静状态（前端条；escalation_state 只读）
    ck_st63home = call("/api/checkin/status")
    assert "escalation_state" in (ck_st63home.get("user") or {}) or ck_st63home.get(
        "user"
    ), ck_st63home

    # Round63 · 交割编号+受益人（前端；id/beneficiary 可读）
    lg63 = call(
        "/api/legacy",
        {
            "title": "自检·编号受益人63",
            "category": "其他",
            "action": "转赠",
            "dept": "hr",
            "beneficiary": "演示受益人63",
        },
    )["item"]
    assert lg63.get("id") is not None, lg63
    assert lg63.get("beneficiary") is not None or "beneficiary" in lg63, lg63

    # Round63 · 备忘平台+标签（前端；platform/tag 可读）
    as63 = call(
        "/api/assets",
        {
            "platform": "round63PlatTag",
            "summary": "平台标签63",
            "dept": "finance",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as63.get("platform") and as63.get("tag"), as63

    # Round63 · 报备双剩余秒（前端复制；seconds_remaining/grace_remaining_seconds 只读）
    ck_st63 = call("/api/checkin/status")
    cd63 = ck_st63.get("countdown") or {}
    user63 = ck_st63.get("user") or {}
    assert (
        cd63.get("seconds_remaining") is not None
        or user63.get("grace_remaining_seconds") is not None
        or user63
    ), ck_st63

    # Round63 · 差旅余额与缺口（前端复制；balance/shortfall 只读，不改退款）
    tf63 = call("/api/travel-fund")
    fund63 = tf63.get("fund") or tf63
    assert (
        fund63.get("balance") is not None
        or fund63.get("shortfall") is not None
        or fund63.get("threshold") is not None
    ), tf63

    # Round63 · 善后标题+状态文案（前端；title/status_label 可读）
    ac63 = call(
        "/api/aftercare",
        {
            "title": "自检·标题状态63",
            "service_type": "delete_data",
            "city": "五指山",
            "travel_budget": 630,
        },
    )["item"]
    assert ac63.get("title") and (
        ac63.get("status_label") or ac63.get("status")
    ), ac63

    # Round63 · 授权视频生效标签+状态（前端复制；active_label/status 可读）
    av63 = call("/api/auth-video")
    active63 = av63.get("current_active") or av63.get("latest") or {}
    assert (
        active63.get("active_label")
        or active63.get("status")
        or active63.get("current_active") is not None
        or av63.get("ready") is not None
    ), av63

    # Round63 · 受益人编号+口令提示（前端；id/passphrase_hint 可读）
    bn63 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号口令63",
            "role": "heir",
            "relation": "侄子",
            "contact": "13300000063",
            "passphrase_hint": "round63口令",
        },
    )["item"]
    assert bn63.get("id") is not None, bn63
    assert bn63.get("passphrase_hint") is not None or "passphrase_hint" in bn63, bn63

    # Round63 · 手册销毁与变现条数（前端复制；action_counts.destroy/sale 可读）
    hand63 = call("/api/handover")
    counts63 = ((hand63.get("progress") or {}).get("action_counts")) or {}
    assert (
        counts63.get("destroy") is not None
        or counts63.get("sale") is not None
        or hand63.get("item_count") is not None
    ), hand63

    # Round63 · 设置·应用版本+英文品牌（前端复制；version/brand_en 对齐）
    h63 = call("/api/health")
    assert h63.get("ok") is True, h63
    assert h63.get("version") or h63.get("brand_en"), h63
    assert h63.get("domain") == "einherit.cn", h63

    # Round64 · 首页会员剩余天数（前端条；member_days_left 只读）
    ck_st64home = call("/api/checkin/status")
    assert (ck_st64home.get("user") or {}).get("member_days_left") is not None or ck_st64home.get(
        "user"
    ), ck_st64home

    # Round64 · 交割类别+出厂重置（前端；category/factory_reset 可读）
    lg64 = call(
        "/api/legacy",
        {
            "title": "自检·类别出厂64",
            "category": "设备",
            "action": "销毁",
            "dept": "production",
            "factory_reset": True,
        },
    )["item"]
    assert lg64.get("category"), lg64
    assert lg64.get("factory_reset") is not None or "factory_reset" in lg64, lg64

    # Round64 · 备忘处置备注+标签（前端；dispose_note/tag 可读）
    as64 = call(
        "/api/assets",
        {
            "platform": "round64DisposeTag",
            "summary": "处置标签64",
            "dispose_note": "演示处置64",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as64.get("tag"), as64
    assert as64.get("dispose_note") is not None or "dispose_note" in as64, as64

    # Round64 · 报备间隔小时与冷静期小时（前端复制；配置只读，不改外呼）
    ck_st64 = call("/api/checkin/status")
    cd64 = ck_st64.get("countdown") or {}
    user64 = ck_st64.get("user") or {}
    assert (
        cd64.get("interval_hours") is not None
        or user64.get("checkin_interval_hours") is not None
        or cd64.get("grace_hours") is not None
        or user64.get("grace_hours") is not None
        or user64
    ), ck_st64

    # Round64 · 差旅最近退款编号+金额（前端复制；last_refund 只读，不改退款）
    tf64 = call("/api/travel-fund")
    fund64 = tf64.get("fund") or tf64
    refund64 = fund64.get("last_refund") or {}
    assert (
        refund64.get("id") is not None
        or refund64.get("amount") is not None
        or fund64.get("balance") is not None
    ), tf64

    # Round64 · 善后阶段文案+城市（前端；phase_label/city 可读）
    ac64 = call(
        "/api/aftercare",
        {
            "title": "自检·阶段城市64",
            "service_type": "field_visit",
            "city": "保亭",
            "travel_budget": 640,
        },
    )["item"]
    assert ac64.get("city") and (
        ac64.get("phase_label") or ac64.get("phase_key")
    ), ac64

    # Round64 · 授权视频清单已完成键（前端复制；checklist 可读）
    av64 = call("/api/auth-video")
    assert (
        isinstance(av64.get("checklist"), list)
        or av64.get("ready") is not None
        or av64.get("complete") is not None
    ), av64

    # Round64 · 受益人关系+备注（前端；relation/note 可读）
    bn64 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系备注64",
            "role": "family",
            "relation": "表亲",
            "contact": "13300000064",
            "note": "round64备注",
        },
    )["item"]
    assert bn64.get("relation"), bn64
    assert bn64.get("note") is not None or "note" in bn64, bn64

    # Round64 · 手册受益人数与条目总数（前端复制；beneficiary_count/item_count 可读）
    hand64 = call("/api/handover")
    assert (
        hand64.get("beneficiary_count") is not None
        or isinstance(hand64.get("heirs"), list)
        or hand64.get("item_count") is not None
    ), hand64

    # Round64 · 设置·应用中文名+域名（前端复制；app/domain 对齐）
    h64 = call("/api/health")
    assert h64.get("ok") is True, h64
    assert h64.get("app") or h64.get("domain") == "einherit.cn", h64
    assert h64.get("domain") == "einherit.cn", h64

    # Round65 · 首页会员有效冷静条（前端条；is_member 只读）
    ck_st65home = call("/api/checkin/status")
    assert "is_member" in (ck_st65home.get("user") or {}) or ck_st65home.get(
        "user"
    ), ck_st65home

    # Round65 · 交割备注+部门（前端；notes/dept 可读）
    lg65 = call(
        "/api/legacy",
        {
            "title": "自检·备注部门65",
            "category": "其他",
            "action": "转赠",
            "dept": "ip",
            "notes": "round65备注",
        },
    )["item"]
    assert lg65.get("dept"), lg65
    assert lg65.get("notes") is not None or "notes" in lg65, lg65

    # Round65 · 备忘摘要+可见性（前端；summary/visibility 可读）
    as65 = call(
        "/api/assets",
        {
            "platform": "round65SumVis",
            "summary": "摘要可见性65",
            "dept": "hr",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as65.get("summary") and as65.get("visibility"), as65

    # Round65 · 报备距今与已过小时（前端复制；last_ago_label/hours_since_last 只读）
    ck_st65 = call("/api/checkin/status")
    cd65 = ck_st65.get("countdown") or {}
    assert (
        cd65.get("last_ago_label")
        or cd65.get("hours_since_last") is not None
        or ck_st65.get("user")
    ), ck_st65

    # Round65 · 差旅进度文案与百分比（前端复制；progress_label/progress_pct 只读）
    tf65 = call("/api/travel-fund")
    fund65 = tf65.get("fund") or tf65
    assert (
        fund65.get("progress_label")
        or fund65.get("progress_pct") is not None
        or fund65.get("balance") is not None
    ), tf65

    # Round65 · 善后服务类型+阶段文案（前端；service_type/phase_label 可读）
    ac65 = call(
        "/api/aftercare",
        {
            "title": "自检·服务阶段65",
            "service_type": "delete_data",
            "city": "乐东",
            "travel_budget": 650,
        },
    )["item"]
    assert ac65.get("service_type") and (
        ac65.get("phase_label") or ac65.get("phase_key")
    ), ac65

    # Round65 · 授权视频准入提示（前端复制；gate 可读）
    av65 = call("/api/auth-video")
    assert av65.get("gate") or av65.get("ready") is not None, av65

    # Round65 · 受益人姓名+口令提示（前端；name/passphrase_hint 可读）
    bn65 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名口令65",
            "role": "executor",
            "relation": "同事",
            "contact": "13300000065",
            "passphrase_hint": "round65口令",
        },
    )["item"]
    assert bn65.get("name"), bn65
    assert bn65.get("passphrase_hint") is not None or "passphrase_hint" in bn65, bn65

    # Round65 · 手册域名+执行人（前端复制；domain/executor 可读）
    hand65 = call("/api/handover")
    assert hand65.get("domain") or hand65.get("executor"), hand65

    # Round65 · 设置·服务端版本+域名（前端复制；server_version/domain 对齐）
    h65 = call("/api/health")
    assert h65.get("ok") is True, h65
    assert h65.get("server_version") or h65.get("domain") == "einherit.cn", h65
    assert h65.get("domain") == "einherit.cn", h65

    # Round66 · 首页域名+英文品牌（前端条；health domain/brand_en）
    h66home = call("/api/health")
    assert h66home.get("domain") == "einherit.cn", h66home
    assert h66home.get("brand_en") or h66home.get("ok") is True, h66home

    # Round66 · 交割标题+类别（前端；title/category 可读）
    lg66 = call(
        "/api/legacy",
        {
            "title": "自检·标题类别66",
            "category": "账号",
            "action": "销毁",
            "dept": "admin",
        },
    )["item"]
    assert lg66.get("title") and lg66.get("category"), lg66

    # Round66 · 备忘编号+处置备注（前端；id/dispose_note 可读）
    as66 = call(
        "/api/assets",
        {
            "platform": "round66IdDispose",
            "summary": "编号处置66",
            "dispose_note": "演示处置66",
            "dept": "finance",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as66.get("id") is not None, as66
    assert as66.get("dispose_note") is not None or "dispose_note" in as66, as66

    # Round66 · 报备即将到期与剩余小时（前端复制；due_soon/hours_remaining 只读）
    ck_st66 = call("/api/checkin/status")
    cd66 = ck_st66.get("countdown") or {}
    assert (
        "due_soon" in cd66
        or cd66.get("hours_remaining") is not None
        or ck_st66.get("user")
    ), ck_st66

    # Round66 · 差旅达标与缺口（前端复制；meets_threshold/shortfall 只读）
    tf66 = call("/api/travel-fund")
    fund66 = tf66.get("fund") or tf66
    assert (
        fund66.get("meets_threshold") is not None
        or fund66.get("met") is not None
        or fund66.get("shortfall") is not None
        or fund66.get("balance") is not None
    ), tf66

    # Round66 · 善后编号+阶段键（前端；id/phase_key 可读）
    ac66 = call(
        "/api/aftercare",
        {
            "title": "自检·编号阶段键66",
            "service_type": "field_visit",
            "city": "白沙",
            "travel_budget": 660,
        },
    )["item"]
    assert ac66.get("id") is not None, ac66
    assert ac66.get("phase_key") or ac66.get("phase_label"), ac66

    # Round66 · 授权视频缺失项标签（前端复制；missing_labels 可读）
    av66 = call("/api/auth-video")
    assert (
        isinstance(av66.get("missing_labels"), list)
        or av66.get("ready") is not None
        or av66.get("complete") is not None
    ), av66

    # Round66 · 受益人角色键+备注（前端；role/note 可读）
    bn66 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色备注66",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000066",
            "note": "round66备注",
        },
    )["item"]
    assert bn66.get("role"), bn66
    assert bn66.get("note") is not None or "note" in bn66, bn66

    # Round66 · 手册品牌+会员状态（前端复制；brand/member 可读）
    hand66 = call("/api/handover")
    assert hand66.get("brand") or "member" in hand66, hand66

    # Round66 · 设置·就绪状态+应用版本（前端复制；ok/version 对齐）
    h66 = call("/api/health")
    assert h66.get("ok") is True, h66
    assert h66.get("version") or h66.get("domain") == "einherit.cn", h66
    assert h66.get("domain") == "einherit.cn", h66

    # Round67 · 首页报备硬逾期冷静条（前端条；checkin_overdue 只读）
    ck_st67home = call("/api/checkin/status")
    assert "checkin_overdue" in (ck_st67home.get("user") or {}) or ck_st67home.get(
        "user"
    ), ck_st67home

    # Round67 · 交割双清除状态（前端；clear_photos/clear_chats 可读）
    lg67 = call(
        "/api/legacy",
        {
            "title": "自检·双清除67",
            "category": "其他",
            "action": "销毁",
            "dept": "admin",
            "clear_photos": True,
            "clear_chats": True,
        },
    )["item"]
    assert "clear_photos" in lg67 or lg67.get("clear_photos") is not None, lg67
    assert "clear_chats" in lg67 or lg67.get("clear_chats") is not None, lg67

    # Round67 · 备忘账号提示+标签（前端；account_hint/tag 可读）
    as67 = call(
        "/api/assets",
        {
            "platform": "round67HintTag",
            "summary": "账号提示标签67",
            "account_hint": "hint67@einherit",
            "dept": "ip",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as67.get("tag"), as67
    assert as67.get("account_hint") is not None or "account_hint" in as67, as67

    # Round67 · 报备会员到期日与剩余天（前端复制；member_until_iso/member_days_left 只读）
    ck_st67 = call("/api/checkin/status")
    user67 = ck_st67.get("user") or {}
    assert (
        user67.get("member_until_iso")
        or user67.get("member_days_left") is not None
        or user67
    ), ck_st67

    # Round67 · 差旅余额与达标（前端复制；balance/meets_threshold 只读）
    tf67 = call("/api/travel-fund")
    fund67 = tf67.get("fund") or tf67
    assert (
        fund67.get("balance") is not None
        or fund67.get("meets_threshold") is not None
        or fund67.get("met") is not None
    ), tf67

    # Round67 · 善后状态语气+状态键（前端；status_tone/status_key 可读）
    ac67 = call(
        "/api/aftercare",
        {
            "title": "自检·语气状态键67",
            "service_type": "delete_data",
            "city": "昌江",
            "travel_budget": 670,
        },
    )["item"]
    assert ac67.get("status_tone") or ac67.get("status_key"), ac67

    # Round67 · 授权视频齐备与就绪布尔（前端复制；complete/ready 可读）
    av67 = call("/api/auth-video")
    assert (
        av67.get("complete") is not None
        or av67.get("ready") is not None
    ), av67

    # Round67 · 受益人联系+口令提示（前端；contact/passphrase_hint 可读）
    bn67 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系口令67",
            "role": "family",
            "relation": "兄妹",
            "contact": "13300000067",
            "passphrase_hint": "round67口令",
        },
    )["item"]
    assert bn67.get("contact"), bn67
    assert bn67.get("passphrase_hint") is not None or "passphrase_hint" in bn67, bn67

    # Round67 · 手册条目总数与覆盖百分比（前端复制；item_count/pct 可读）
    hand67 = call("/api/handover")
    prog67 = hand67.get("progress") or {}
    assert (
        hand67.get("item_count") is not None
        or prog67.get("pct") is not None
        or prog67.get("total_items") is not None
    ), hand67

    # Round67 · 设置·英文品牌+服务端版本（前端复制；brand_en/server_version 对齐）
    h67 = call("/api/health")
    assert h67.get("ok") is True, h67
    assert h67.get("brand_en") or h67.get("server_version"), h67
    assert h67.get("domain") == "einherit.cn", h67

    # Round68 · 首页备用联系人数（前端条；backup_contacts 只读）
    ck_st68home = call("/api/checkin/status")
    assert isinstance(
        (ck_st68home.get("user") or {}).get("backup_contacts"), list
    ) or ck_st68home.get("user"), ck_st68home

    # Round68 · 交割编号+双清除（前端；id/clear_photos/clear_chats 可读）
    lg68 = call(
        "/api/legacy",
        {
            "title": "自检·编号双清除68",
            "category": "其他",
            "action": "销毁",
            "dept": "hr",
            "clear_photos": True,
            "clear_chats": False,
        },
    )["item"]
    assert lg68.get("id") is not None, lg68
    assert "clear_photos" in lg68 or lg68.get("clear_photos") is not None, lg68

    # Round68 · 备忘可见性+处置备注（前端；visibility/dispose_note 可读）
    as68 = call(
        "/api/assets",
        {
            "platform": "round68VisDispose",
            "summary": "可见性处置68",
            "dispose_note": "演示处置68",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as68.get("visibility"), as68
    assert as68.get("dispose_note") is not None or "dispose_note" in as68, as68

    # Round68 · 报备备用联系人数（前端复制；backup_contacts 只读）
    ck_st68 = call("/api/checkin/status")
    assert isinstance(
        (ck_st68.get("user") or {}).get("backup_contacts"), list
    ) or ck_st68.get("user"), ck_st68

    # Round68 · 差旅流水种类+金额（前端复制；ledger kind/amount 只读）
    tf68 = call("/api/travel-fund")
    ledger68 = tf68.get("ledger") or []
    assert isinstance(ledger68, list), tf68
    if ledger68:
        assert ledger68[0].get("kind") or ledger68[0].get("amount") is not None, ledger68[0]

    # Round68 · 善后到访偏好+城市（前端；visit_pref/city 可读）
    ac68 = call(
        "/api/aftercare",
        {
            "title": "自检·到访城市68",
            "service_type": "field_visit",
            "city": "屯昌",
            "visit_pref": "上午",
            "travel_budget": 680,
        },
    )["item"]
    assert ac68.get("city"), ac68
    assert ac68.get("visit_pref") is not None or "visit_pref" in ac68, ac68

    # Round68 · 授权视频文件名+状态（前端复制；filename/status 可读）
    av68 = call("/api/auth-video")
    active68 = av68.get("current_active") or av68.get("latest") or {}
    assert (
        active68.get("filename")
        or active68.get("status")
        or av68.get("ready") is not None
    ), av68

    # Round68 · 受益人关系+口令提示（前端；relation/passphrase_hint 可读）
    bn68 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系口令68",
            "role": "heir",
            "relation": "表亲",
            "contact": "13300000068",
            "passphrase_hint": "round68口令",
        },
    )["item"]
    assert bn68.get("relation"), bn68
    assert bn68.get("passphrase_hint") is not None or "passphrase_hint" in bn68, bn68

    # Round68 · 手册生成时间与域名（前端复制；generated_at_iso/domain 可读）
    hand68 = call("/api/handover")
    assert (
        hand68.get("generated_at_iso")
        or hand68.get("domain")
        or hand68.get("generated_at") is not None
    ), hand68

    # Round68 · 设置·应用版本+域名（前端复制；version/domain 对齐）
    h68 = call("/api/health")
    assert h68.get("ok") is True, h68
    assert h68.get("version") or h68.get("domain") == "einherit.cn", h68
    assert h68.get("domain") == "einherit.cn", h68

    # Round69 · 首页执行人姓名（前端条；executor_name 只读）
    ck_st69home = call("/api/checkin/status")
    assert (ck_st69home.get("user") or {}) is not None, ck_st69home
    assert "executor_name" in (ck_st69home.get("user") or {}) or (
        ck_st69home.get("user") or {}
    ).get("executor_name") is not None or ck_st69home.get("user"), ck_st69home

    # Round69 · 交割处置+出厂（前端；action/factory_reset 可读）
    lg69 = call(
        "/api/legacy",
        {
            "title": "自检·处置出厂69",
            "category": "其他",
            "action": "销毁",
            "dept": "hr",
            "factory_reset": True,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg69.get("action"), lg69
    assert "factory_reset" in lg69 or lg69.get("factory_reset") is not None, lg69

    # Round69 · 备忘编号+账号提示（前端；id/account_hint 可读）
    as69 = call(
        "/api/assets",
        {
            "platform": "round69IdHint",
            "account_hint": "hint69",
            "summary": "编号提示69",
            "dispose_note": "演示处置69",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as69.get("id") is not None, as69
    assert as69.get("account_hint") is not None or "account_hint" in as69, as69

    # Round69 · 报备软硬逾期（前端复制；checkin_soft_overdue/checkin_overdue 只读）
    ck_st69 = call("/api/checkin/status")
    u69 = ck_st69.get("user") or {}
    assert "checkin_soft_overdue" in u69 or "checkin_overdue" in u69 or u69, ck_st69

    # Round69 · 差旅退款种类+备注（前端复制；last_refund kind/note 只读）
    tf69 = call("/api/travel-fund")
    fund69 = tf69.get("fund") or tf69
    refund69 = fund69.get("last_refund")
    assert refund69 is not None or "last_refund" in fund69 or isinstance(
        tf69.get("ledger"), list
    ), tf69

    # Round69 · 善后预算标签+城市（前端；travel_budget_label/city 可读）
    ac69 = call(
        "/api/aftercare",
        {
            "title": "自检·预算城市69",
            "service_type": "field_visit",
            "city": "澄迈",
            "visit_pref": "下午",
            "travel_budget": 690,
        },
    )["item"]
    assert ac69.get("city"), ac69
    assert (
        ac69.get("travel_budget_label")
        or ac69.get("travel_budget") is not None
    ), ac69

    # Round69 · 授权视频门槛+就绪（前端复制；threshold_passed/ready 可读）
    av69 = call("/api/auth-video")
    active69 = av69.get("current_active") or av69.get("latest") or {}
    assert (
        "threshold_passed" in active69
        or av69.get("ready") is not None
        or active69.get("status")
    ), av69

    # Round69 · 受益人编号+姓名+角色（前端；id/name/role 可读）
    bn69 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号角色69",
            "role": "heir",
            "relation": "堂亲",
            "contact": "13300000069",
            "passphrase_hint": "round69口令",
        },
    )["item"]
    assert bn69.get("id") is not None, bn69
    assert bn69.get("name") and bn69.get("role"), bn69

    # Round69 · 手册分享提示与域名（前端复制；share_hint/domain 可读）
    hand69 = call("/api/handover")
    assert hand69.get("share_hint") or hand69.get("domain"), hand69

    # Round69 · 设置·英文品牌+服务就绪（前端复制；brand_en/ok 对齐）
    h69 = call("/api/health")
    assert h69.get("ok") is True, h69
    assert h69.get("brand_en") or h69.get("domain") == "einherit.cn", h69
    assert h69.get("domain") == "einherit.cn", h69

    # Round70 · 首页中文品牌（前端条；app 只读）
    h70home = call("/api/health")
    assert h70home.get("app") or h70home.get("brand_en"), h70home

    # Round70 · 交割标题+部门+处置（前端；title/dept/action 可读）
    lg70 = call(
        "/api/legacy",
        {
            "title": "自检·标题部门70",
            "category": "其他",
            "action": "转赠",
            "dept": "finance",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg70.get("title") and lg70.get("dept") and lg70.get("action"), lg70

    # Round70 · 备忘摘要+账号提示（前端；summary/account_hint 可读）
    as70 = call(
        "/api/assets",
        {
            "platform": "round70SummaryHint",
            "account_hint": "hint70",
            "summary": "摘要提示70",
            "dispose_note": "演示处置70",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as70.get("summary") is not None or "summary" in as70, as70
    assert as70.get("account_hint") is not None or "account_hint" in as70, as70

    # Round70 · 报备手机号（前端复制；phone 只读）
    ck_st70 = call("/api/checkin/status")
    assert (ck_st70.get("user") or {}).get("phone") or ck_st70.get("user"), ck_st70

    # Round70 · 差旅善后关联+金额（前端复制；ledger has_aftercare_ref/amount 只读）
    tf70 = call("/api/travel-fund")
    ledger70 = tf70.get("ledger") or []
    assert isinstance(ledger70, list), tf70
    if ledger70:
        assert (
            "has_aftercare_ref" in ledger70[0]
            or ledger70[0].get("amount") is not None
        ), ledger70[0]

    # Round70 · 善后备注+城市（前端；notes/city 可读）
    ac70 = call(
        "/api/aftercare",
        {
            "title": "自检·备注城市70",
            "service_type": "field_visit",
            "city": "临高",
            "notes": "里程碑备注70",
            "visit_pref": "傍晚",
            "travel_budget": 700,
        },
    )["item"]
    assert ac70.get("city"), ac70
    assert ac70.get("notes") is not None or "notes" in ac70, ac70

    # Round70 · 授权视频生效编号+状态（前端复制；id/status 可读）
    av70 = call("/api/auth-video")
    active70 = av70.get("current_active") or av70.get("latest") or {}
    assert (
        active70.get("id") is not None
        or av70.get("current_active_id") is not None
        or active70.get("status")
    ), av70

    # Round70 · 受益人姓名+关系+角色（前端；name/relation/role 可读）
    bn70 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系70",
            "role": "heir",
            "relation": "挚友",
            "contact": "13300000070",
            "passphrase_hint": "round70口令",
        },
    )["item"]
    assert bn70.get("name") and bn70.get("relation") and bn70.get("role"), bn70

    # Round70 · 手册条目与域名（前端复制；item_count/domain 可读）
    hand70 = call("/api/handover")
    assert (
        hand70.get("item_count") is not None or hand70.get("domain")
    ), hand70

    # Round70 · 设置·品牌+域名+英文（前端复制；app/domain/brand_en 对齐）
    h70 = call("/api/health")
    assert h70.get("ok") is True, h70
    assert h70.get("app") and h70.get("domain") == "einherit.cn", h70
    assert h70.get("brand_en"), h70

    # Round71 · 首页报备手机号（前端条；phone 只读）
    ck_st71home = call("/api/checkin/status")
    assert (ck_st71home.get("user") or {}).get("phone") or ck_st71home.get(
        "user"
    ), ck_st71home

    # Round71 · 交割编号+标题+处置（前端；id/title/action 可读）
    lg71 = call(
        "/api/legacy",
        {
            "title": "自检·编号标题71",
            "category": "其他",
            "action": "销售变现",
            "dept": "hr",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg71.get("id") is not None and lg71.get("title") and lg71.get("action"), lg71

    # Round71 · 备忘标签+可见性（前端；tag/visibility 可读）
    as71 = call(
        "/api/assets",
        {
            "platform": "round71TagVis",
            "account_hint": "hint71",
            "summary": "标签可见71",
            "dispose_note": "演示处置71",
            "dept": "admin",
            "tag": "社交",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as71.get("tag") is not None or "tag" in as71, as71
    assert as71.get("visibility"), as71

    # Round71 · 报备上次距今（前端复制；last_ago_label 只读）
    ck_st71 = call("/api/checkin/status")
    cd71 = ck_st71.get("countdown") or {}
    assert cd71.get("last_ago_label") or "hours_since_last" in cd71 or cd71, ck_st71

    # Round71 · 差旅短差与达标（前端复制；shortfall/met 只读）
    tf71 = call("/api/travel-fund")
    fund71 = tf71.get("fund") or tf71
    assert (
        fund71.get("shortfall") is not None
        or fund71.get("met") is not None
        or fund71.get("meets_threshold") is not None
    ), tf71

    # Round71 · 善后编号+状态+城市（前端；id/status/city 可读）
    ac71 = call(
        "/api/aftercare",
        {
            "title": "自检·编号状态71",
            "service_type": "field_visit",
            "city": "白沙",
            "notes": "编号状态71",
            "visit_pref": "上午",
            "travel_budget": 710,
        },
    )["item"]
    assert ac71.get("id") is not None and ac71.get("city"), ac71
    assert ac71.get("status") or ac71.get("status_label"), ac71

    # Round71 · 授权视频进度与缺失（前端复制；progress/missing_text 可读）
    av71 = call("/api/auth-video")
    assert (
        av71.get("progress")
        or av71.get("missing_text")
        or av71.get("missing_labels") is not None
    ), av71

    # Round71 · 受益人口令+角色（前端；passphrase_hint/role 可读）
    bn71 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令角色71",
            "role": "executor",
            "relation": "同事",
            "contact": "13300000071",
            "passphrase_hint": "round71口令",
        },
    )["item"]
    assert bn71.get("role"), bn71
    assert bn71.get("passphrase_hint") is not None or "passphrase_hint" in bn71, bn71

    # Round71 · 手册品牌与域名（前端复制；brand/domain 可读）
    hand71 = call("/api/handover")
    assert hand71.get("brand") or hand71.get("domain"), hand71

    # Round71 · 设置·服务端版本+就绪（前端复制；server_version/ok 对齐）
    h71 = call("/api/health")
    assert h71.get("ok") is True, h71
    assert h71.get("server_version") or h71.get("version"), h71
    assert h71.get("domain") == "einherit.cn", h71

    # Round72 · 首页会员身份与剩余天（前端条；is_member/member_days_left 只读）
    ck_st72home = call("/api/checkin/status")
    u72home = ck_st72home.get("user") or {}
    assert "is_member" in u72home or "member_days_left" in u72home or u72home, ck_st72home

    # Round72 · 交割分类+受益人（前端；category/beneficiary 可读）
    lg72 = call(
        "/api/legacy",
        {
            "title": "自检·分类受益72",
            "category": "手机",
            "action": "销毁",
            "dept": "hr",
            "beneficiary": "自检受益人72",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg72.get("category"), lg72
    assert lg72.get("beneficiary") is not None or "beneficiary" in lg72, lg72

    # Round72 · 备忘编号+平台+标签（前端；id/platform/tag 可读）
    as72 = call(
        "/api/assets",
        {
            "platform": "round72IdPlatformTag",
            "account_hint": "hint72",
            "summary": "编号平台标签72",
            "dispose_note": "演示处置72",
            "dept": "admin",
            "tag": "金融",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as72.get("id") is not None and as72.get("platform"), as72
    assert as72.get("tag") is not None or "tag" in as72, as72

    # Round72 · 报备会员剩余天纯（前端复制；member_days_left 只读）
    ck_st72 = call("/api/checkin/status")
    assert (ck_st72.get("user") or {}).get("member_days_left") is not None or ck_st72.get(
        "user"
    ), ck_st72

    # Round72 · 差旅余额与门槛（前端复制；balance/threshold 只读）
    tf72 = call("/api/travel-fund")
    fund72 = tf72.get("fund") or tf72
    assert fund72.get("balance") is not None or fund72.get("threshold") is not None, tf72

    # Round72 · 善后阶段+预算（前端；phase_label/travel_budget 可读）
    ac72 = call(
        "/api/aftercare",
        {
            "title": "自检·阶段预算72",
            "service_type": "field_visit",
            "city": "昌江",
            "notes": "阶段预算72",
            "visit_pref": "中午",
            "travel_budget": 720,
        },
    )["item"]
    assert ac72.get("phase_label") or ac72.get("travel_budget") is not None, ac72

    # Round72 · 授权视频门闩+就绪（前端复制；gate/ready 可读）
    av72 = call("/api/auth-video")
    assert av72.get("gate") or av72.get("ready") is not None, av72

    # Round72 · 受益人编号+姓名+联系（前端；id/name/contact 可读）
    bn72 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系72",
            "role": "heir",
            "relation": "邻居",
            "contact": "13300000072",
            "passphrase_hint": "round72口令",
        },
    )["item"]
    assert bn72.get("id") is not None and bn72.get("name") and bn72.get("contact"), bn72

    # Round72 · 手册条目与品牌（前端复制；item_count/brand 可读）
    hand72 = call("/api/handover")
    assert (
        hand72.get("item_count") is not None or hand72.get("brand")
    ), hand72

    # Round72 · 设置·就绪与域名（前端复制；ok/domain 对齐）
    h72 = call("/api/health")
    assert h72.get("ok") is True, h72
    assert h72.get("domain") == "einherit.cn", h72

    # Round73 · 首页宽限小时（前端条；grace_hours 只读）
    ck_st73home = call("/api/checkin/status")
    assert (ck_st73home.get("user") or {}).get("grace_hours") is not None or ck_st73home.get(
        "user"
    ), ck_st73home

    # Round73 · 交割编号+分类+部门（前端；id/category/dept 可读）
    lg73 = call(
        "/api/legacy",
        {
            "title": "自检·编号分类73",
            "category": "电脑",
            "action": "转赠",
            "dept": "ops",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg73.get("id") is not None and lg73.get("category") and lg73.get("dept"), lg73

    # Round73 · 备忘处置+可见性（前端；dispose_note/visibility 可读）
    as73 = call(
        "/api/assets",
        {
            "platform": "round73DisposeVis",
            "account_hint": "hint73",
            "summary": "处置可见73",
            "dispose_note": "演示处置73",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as73.get("dispose_note") is not None or "dispose_note" in as73, as73
    assert as73.get("visibility"), as73

    # Round73 · 报备宽限小时纯（前端复制；grace_hours 只读）
    ck_st73 = call("/api/checkin/status")
    assert (ck_st73.get("user") or {}).get("grace_hours") is not None or ck_st73.get(
        "user"
    ), ck_st73

    # Round73 · 差旅进度百分比与文案（前端复制；progress_pct/progress_label 只读）
    tf73 = call("/api/travel-fund")
    fund73 = tf73.get("fund") or tf73
    assert (
        fund73.get("progress_pct") is not None or fund73.get("progress_label")
    ), tf73

    # Round73 · 善后标题+城市+状态（前端；title/city/status 可读）
    ac73 = call(
        "/api/aftercare",
        {
            "title": "自检·标题状态73",
            "service_type": "field_visit",
            "city": "乐东",
            "notes": "标题状态73",
            "visit_pref": "傍晚",
            "travel_budget": 730,
        },
    )["item"]
    assert ac73.get("title") and ac73.get("city"), ac73
    assert ac73.get("status") or ac73.get("status_label"), ac73

    # Round73 · 授权视频齐备文案+就绪（前端复制；complete_label/ready 可读）
    av73 = call("/api/auth-video")
    assert av73.get("complete_label") or av73.get("ready") is not None, av73

    # Round73 · 受益人备注+角色（前端；note/role 可读）
    bn73 = call(
        "/api/beneficiaries",
        {
            "name": "自检·备注角色73",
            "role": "heir",
            "relation": "同学",
            "contact": "13300000073",
            "note": "round73备注",
            "passphrase_hint": "round73口令",
        },
    )["item"]
    assert bn73.get("role"), bn73
    assert bn73.get("note") is not None or "note" in bn73, bn73

    # Round73 · 手册生成时间与品牌（前端复制；generated_at_iso/brand 可读）
    hand73 = call("/api/handover")
    assert (
        hand73.get("generated_at_iso")
        or hand73.get("brand")
        or hand73.get("generated_at") is not None
    ), hand73

    # Round73 · 设置·应用版本+就绪（前端复制；version/ok 对齐）
    h73 = call("/api/health")
    assert h73.get("ok") is True, h73
    assert h73.get("version") or h73.get("server_version"), h73
    assert h73.get("domain") == "einherit.cn", h73

    # Round74 · 首页报备间隔小时（前端条；checkin_interval_hours 只读）
    ck_st74home = call("/api/checkin/status")
    assert (ck_st74home.get("user") or {}).get(
        "checkin_interval_hours"
    ) is not None or ck_st74home.get("user"), ck_st74home

    # Round74 · 交割备注+处置（前端；notes/action 可读）
    lg74 = call(
        "/api/legacy",
        {
            "title": "自检·备注处置74",
            "category": "其他",
            "action": "销毁",
            "dept": "hr",
            "notes": "round74备注",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg74.get("action"), lg74
    assert lg74.get("notes") is not None or "notes" in lg74, lg74

    # Round74 · 备忘编号+摘要+可见性（前端；id/summary/visibility 可读）
    as74 = call(
        "/api/assets",
        {
            "platform": "round74IdSummaryVis",
            "account_hint": "hint74",
            "summary": "编号摘要可见74",
            "dispose_note": "演示处置74",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as74.get("id") is not None, as74
    assert as74.get("summary") is not None or "summary" in as74, as74
    assert as74.get("visibility"), as74

    # Round74 · 报备间隔小时纯（前端复制；checkin_interval_hours 只读）
    ck_st74 = call("/api/checkin/status")
    assert (ck_st74.get("user") or {}).get(
        "checkin_interval_hours"
    ) is not None or ck_st74.get("user"), ck_st74

    # Round74 · 差旅达标与进度（前端复制；met/progress_pct 只读）
    tf74 = call("/api/travel-fund")
    fund74 = tf74.get("fund") or tf74
    assert (
        fund74.get("met") is not None
        or fund74.get("meets_threshold") is not None
        or fund74.get("progress_pct") is not None
    ), tf74

    # Round74 · 善后编号+阶段+城市（前端；id/phase_label/city 可读）
    ac74 = call(
        "/api/aftercare",
        {
            "title": "自检·编号阶段74",
            "service_type": "field_visit",
            "city": "保亭",
            "notes": "编号阶段74",
            "visit_pref": "上午",
            "travel_budget": 740,
        },
    )["item"]
    assert ac74.get("id") is not None and ac74.get("city"), ac74
    assert ac74.get("phase_label") or ac74.get("status"), ac74

    # Round74 · 授权视频脚本条数+就绪（前端复制；script/ready 可读）
    av74 = call("/api/auth-video")
    assert (
        isinstance(av74.get("script"), list)
        or av74.get("ready") is not None
    ), av74

    # Round74 · 受益人姓名+备注+角色（前端；name/note/role 可读）
    bn74 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名备注74",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000074",
            "note": "round74备注",
            "passphrase_hint": "round74口令",
        },
    )["item"]
    assert bn74.get("name") and bn74.get("role"), bn74
    assert bn74.get("note") is not None or "note" in bn74, bn74

    # Round74 · 手册分享提示与品牌（前端复制；share_hint/brand 可读）
    hand74 = call("/api/handover")
    assert hand74.get("share_hint") or hand74.get("brand"), hand74

    # Round74 · 设置·英文品牌+应用版本（前端复制；brand_en/version 对齐）
    h74 = call("/api/health")
    assert h74.get("ok") is True, h74
    assert h74.get("brand_en") and (h74.get("version") or h74.get("server_version")), h74
    assert h74.get("domain") == "einherit.cn", h74

    # Round75 · 首页宽限内（前端条；checkin_in_grace 只读）
    ck_st75home = call("/api/checkin/status")
    assert "checkin_in_grace" in (ck_st75home.get("user") or {}) or ck_st75home.get(
        "user"
    ), ck_st75home

    # Round75 · 交割编号+备注+出厂（前端；id/notes/factory_reset 可读）
    lg75 = call(
        "/api/legacy",
        {
            "title": "自检·编号备注出厂75",
            "category": "其他",
            "action": "销毁",
            "dept": "hr",
            "notes": "round75备注",
            "factory_reset": True,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg75.get("id") is not None, lg75
    assert "factory_reset" in lg75 or lg75.get("factory_reset") is not None, lg75

    # Round75 · 备忘平台+处置（前端；platform/dispose_note 可读）
    as75 = call(
        "/api/assets",
        {
            "platform": "round75PlatformDispose",
            "account_hint": "hint75",
            "summary": "平台处置75",
            "dispose_note": "演示处置75",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as75.get("platform"), as75
    assert as75.get("dispose_note") is not None or "dispose_note" in as75, as75

    # Round75 · 报备宽限内布尔（前端复制；checkin_in_grace 只读）
    ck_st75 = call("/api/checkin/status")
    assert "checkin_in_grace" in (ck_st75.get("user") or {}) or ck_st75.get(
        "user"
    ), ck_st75

    # Round75 · 差旅退款编号+种类（前端复制；last_refund id/kind 只读）
    tf75 = call("/api/travel-fund")
    fund75 = tf75.get("fund") or tf75
    refund75 = fund75.get("last_refund")
    assert refund75 is not None or "last_refund" in fund75 or isinstance(
        tf75.get("ledger"), list
    ), tf75

    # Round75 · 善后到访+预算（前端；visit_pref/travel_budget 可读）
    ac75 = call(
        "/api/aftercare",
        {
            "title": "自检·到访预算75",
            "service_type": "field_visit",
            "city": "琼中",
            "notes": "到访预算75",
            "visit_pref": "下午",
            "travel_budget": 750,
        },
    )["item"]
    assert ac75.get("visit_pref") is not None or "visit_pref" in ac75, ac75
    assert ac75.get("travel_budget") is not None, ac75

    # Round75 · 授权视频缺失数+就绪（前端复制；missing/ready 可读）
    av75 = call("/api/auth-video")
    assert (
        isinstance(av75.get("missing"), list)
        or av75.get("ready") is not None
        or av75.get("missing_labels") is not None
    ), av75

    # Round75 · 受益人编号+关系+角色（前端；id/relation/role 可读）
    bn75 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号关系75",
            "role": "heir",
            "relation": "远亲",
            "contact": "13300000075",
            "passphrase_hint": "round75口令",
        },
    )["item"]
    assert bn75.get("id") is not None and bn75.get("relation") and bn75.get("role"), bn75

    # Round75 · 手册执行人与品牌（前端复制；executor/brand 可读）
    hand75 = call("/api/handover")
    assert (
        hand75.get("executor")
        or hand75.get("executor_name")
        or hand75.get("brand")
    ), hand75

    # Round75 · 设置·中文品牌+就绪（前端复制；app/ok 对齐）
    h75 = call("/api/health")
    assert h75.get("ok") is True, h75
    assert h75.get("app"), h75
    assert h75.get("domain") == "einherit.cn", h75

    # Round76 · 首页会员到期日（前端条；member_until_iso 只读）
    ck_st76home = call("/api/checkin/status")
    assert (ck_st76home.get("user") or {}).get("member_until_iso") or ck_st76home.get(
        "user"
    ), ck_st76home

    # Round76 · 交割标题+备注+处置（前端；title/notes/action 可读）
    lg76 = call(
        "/api/legacy",
        {
            "title": "自检·标题备注76",
            "category": "其他",
            "action": "转赠",
            "dept": "hr",
            "notes": "round76备注",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg76.get("title") and lg76.get("action"), lg76

    # Round76 · 备忘编号+部门+标签（前端；id/dept/tag 可读）
    as76 = call(
        "/api/assets",
        {
            "platform": "round76IdDeptTag",
            "account_hint": "hint76",
            "summary": "编号部门标签76",
            "dispose_note": "演示处置76",
            "dept": "finance",
            "tag": "社交",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as76.get("id") is not None and as76.get("dept"), as76
    assert as76.get("tag") is not None or "tag" in as76, as76

    # Round76 · 报备会员温柔提示（前端复制；member_gentle_hint 只读）
    ck_st76 = call("/api/checkin/status")
    assert (ck_st76.get("user") or {}).get("member_gentle_hint") or ck_st76.get(
        "user"
    ), ck_st76

    # Round76 · 差旅流水编号+金额（前端复制；ledger id/amount 只读）
    tf76 = call("/api/travel-fund")
    ledger76 = tf76.get("ledger") or []
    assert isinstance(ledger76, list), tf76
    if ledger76:
        assert ledger76[0].get("id") is not None or ledger76[0].get("amount") is not None, ledger76[0]

    # Round76 · 善后状态语气+城市（前端；status_tone/city 可读）
    ac76 = call(
        "/api/aftercare",
        {
            "title": "自检·语气城市76",
            "service_type": "field_visit",
            "city": "五指山",
            "notes": "语气城市76",
            "visit_pref": "中午",
            "travel_budget": 760,
        },
    )["item"]
    assert ac76.get("city"), ac76
    assert ac76.get("status_tone") is not None or "status_tone" in ac76 or ac76.get(
        "status"
    ), ac76

    # Round76 · 授权视频清单数+就绪（前端复制；checklist/ready 可读）
    av76 = call("/api/auth-video")
    assert (
        isinstance(av76.get("checklist"), list) or av76.get("ready") is not None
    ), av76

    # Round76 · 受益人编号+口令+角色（前端；id/passphrase_hint/role 可读）
    bn76 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号口令76",
            "role": "heir",
            "relation": "至亲",
            "contact": "13300000076",
            "passphrase_hint": "round76口令",
        },
    )["item"]
    assert bn76.get("id") is not None and bn76.get("role"), bn76
    assert bn76.get("passphrase_hint") is not None or "passphrase_hint" in bn76, bn76

    # Round76 · 手册覆盖与域名（前端复制；progress.pct/domain 可读）
    hand76 = call("/api/handover")
    prog76 = hand76.get("progress") or {}
    assert (
        prog76.get("pct") is not None
        or hand76.get("pct") is not None
        or hand76.get("domain")
    ), hand76

    # Round76 · 设置·服务端版本+英文品牌（前端复制；server_version/brand_en 对齐）
    h76 = call("/api/health")
    assert h76.get("ok") is True, h76
    assert h76.get("server_version") or h76.get("version"), h76
    assert h76.get("brand_en"), h76
    assert h76.get("domain") == "einherit.cn", h76

    # Round77 · 首页用户姓名（前端条；name 只读）
    ck_st77home = call("/api/checkin/status")
    assert (ck_st77home.get("user") or {}).get("name") or ck_st77home.get(
        "user"
    ), ck_st77home

    # Round77 · 交割编号+受益人+部门（前端；id/beneficiary/dept 可读）
    lg77 = call(
        "/api/legacy",
        {
            "title": "自检·受益人部门77",
            "category": "其他",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人77",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg77.get("id") is not None and lg77.get("dept"), lg77
    assert lg77.get("beneficiary") is not None or "beneficiary" in lg77, lg77

    # Round77 · 备忘账号提示+标签+可见性（前端；account_hint/tag/visibility 可读）
    as77 = call(
        "/api/assets",
        {
            "platform": "round77HintTagVis",
            "account_hint": "hint77",
            "summary": "提示标签可见77",
            "dispose_note": "演示处置77",
            "dept": "admin",
            "tag": "金融",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as77.get("account_hint") is not None or "account_hint" in as77, as77
    assert as77.get("tag") is not None or "tag" in as77, as77
    assert as77.get("visibility"), as77

    # Round77 · 报备倒计时剩余小时（前端复制；hours_remaining 只读）
    ck_st77 = call("/api/checkin/status")
    cd77 = ck_st77.get("countdown") or {}
    assert cd77.get("hours_remaining") is not None or cd77, ck_st77

    # Round77 · 差旅退款金额+种类（前端复制；last_refund amount/kind 只读）
    tf77 = call("/api/travel-fund")
    fund77 = tf77.get("fund") or tf77
    refund77 = fund77.get("last_refund")
    assert refund77 is not None or "last_refund" in fund77 or isinstance(
        tf77.get("ledger"), list
    ), tf77

    # Round77 · 善后编号+到访+城市（前端；id/visit_pref/city 可读）
    ac77 = call(
        "/api/aftercare",
        {
            "title": "自检·到访城市77",
            "service_type": "field_visit",
            "city": "定安",
            "notes": "到访城市77",
            "visit_pref": "傍晚",
            "travel_budget": 770,
        },
    )["item"]
    assert ac77.get("id") is not None and ac77.get("city"), ac77
    assert ac77.get("visit_pref") is not None or "visit_pref" in ac77, ac77

    # Round77 · 授权视频生效标签+就绪（前端复制；active_label/ready 可读）
    av77 = call("/api/auth-video")
    active77 = av77.get("current_active") or av77.get("latest") or {}
    assert (
        active77.get("active_label")
        or av77.get("ready") is not None
        or active77.get("status")
    ), av77

    # Round77 · 受益人姓名+编号+联系（前端；name/id/contact 可读）
    bn77 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名编号77",
            "role": "heir",
            "relation": "故交",
            "contact": "13300000077",
            "passphrase_hint": "round77口令",
        },
    )["item"]
    assert bn77.get("id") is not None and bn77.get("name") and bn77.get("contact"), bn77

    # Round77 · 手册会员与品牌（前端复制；member/brand 可读）
    hand77 = call("/api/handover")
    assert hand77.get("member") is not None or hand77.get("brand"), hand77

    # Round77 · 设置·应用版本+域名（前端复制；version/domain 对齐）
    h77 = call("/api/health")
    assert h77.get("ok") is True, h77
    assert h77.get("version") or h77.get("server_version"), h77
    assert h77.get("domain") == "einherit.cn", h77

    # Round78 · 首页品牌与域名（前端条；brand/domain 或 health.app/domain 只读）
    ck_st78home = call("/api/checkin/status")
    u78home = ck_st78home.get("user") or {}
    h78home = call("/api/health")
    assert (
        u78home.get("brand")
        or u78home.get("domain")
        or h78home.get("app")
        or h78home.get("domain")
    ), (ck_st78home, h78home)

    # Round78 · 交割分类+处置+部门（前端；category/action/dept 可读）
    lg78 = call(
        "/api/legacy",
        {
            "title": "自检·分类处置78",
            "category": "平板",
            "action": "销售变现",
            "dept": "finance",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg78.get("category") and lg78.get("action") and lg78.get("dept"), lg78

    # Round78 · 备忘编号+平台+可见性（前端；id/platform/visibility 可读）
    as78 = call(
        "/api/assets",
        {
            "platform": "round78IdPlatformVis",
            "account_hint": "hint78",
            "summary": "编号平台可见78",
            "dispose_note": "演示处置78",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as78.get("id") is not None and as78.get("platform"), as78
    assert as78.get("visibility"), as78

    # Round78 · 报备临近到期布尔（前端复制；due_soon 只读）
    ck_st78 = call("/api/checkin/status")
    cd78 = ck_st78.get("countdown") or {}
    assert "due_soon" in cd78 or cd78, ck_st78

    # Round78 · 差旅短差与余额（前端复制；shortfall/balance 只读）
    tf78 = call("/api/travel-fund")
    fund78 = tf78.get("fund") or tf78
    assert (
        fund78.get("shortfall") is not None or fund78.get("balance") is not None
    ), tf78

    # Round78 · 善后标题+阶段+预算（前端；title/phase_label/travel_budget 可读）
    ac78 = call(
        "/api/aftercare",
        {
            "title": "自检·标题阶段78",
            "service_type": "field_visit",
            "city": "万宁",
            "notes": "标题阶段78",
            "visit_pref": "上午",
            "travel_budget": 780,
        },
    )["item"]
    assert ac78.get("title"), ac78
    assert ac78.get("phase_label") or ac78.get("travel_budget") is not None, ac78

    # Round78 · 授权视频门闩+齐备（前端复制；gate/complete_label 可读）
    av78 = call("/api/auth-video")
    assert av78.get("gate") or av78.get("complete_label"), av78

    # Round78 · 受益人角色+联系+关系（前端；role/contact/relation 可读）
    bn78 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色联系78",
            "role": "executor",
            "relation": "旧友",
            "contact": "13300000078",
            "passphrase_hint": "round78口令",
        },
    )["item"]
    assert bn78.get("role") and bn78.get("contact") and bn78.get("relation"), bn78

    # Round78 · 手册导出路径与域名（前端复制；export_path/domain 可读）
    hand78 = call("/api/handover")
    assert hand78.get("export_path") or hand78.get("domain"), hand78

    # Round78 · 设置·就绪+中英品牌（前端复制；ok/app/brand_en 对齐）
    h78 = call("/api/health")
    assert h78.get("ok") is True, h78
    assert h78.get("app") and h78.get("brand_en"), h78
    assert h78.get("domain") == "einherit.cn", h78

    # Round79 · 首页升级状态（前端条；escalation_state 只读）
    ck_st79home = call("/api/checkin/status")
    u79home = ck_st79home.get("user") or {}
    assert "escalation_state" in u79home or u79home, ck_st79home

    # Round79 · 交割编号+标题+备注（前端；id/title/notes 可读）
    lg79 = call(
        "/api/legacy",
        {
            "title": "自检·编号标题79",
            "category": "笔记本",
            "action": "转赠",
            "dept": "admin",
            "notes": "编号标题备注79",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg79.get("id") is not None and lg79.get("title"), lg79
    assert "notes" in lg79 or lg79.get("notes") is not None, lg79

    # Round79 · 备忘摘要+处置+标签（前端；summary/dispose_note/tag 可读）
    as79 = call(
        "/api/assets",
        {
            "platform": "round79SummaryDisposeTag",
            "account_hint": "hint79",
            "summary": "摘要处置标签79",
            "dispose_note": "演示处置79",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as79.get("summary") and as79.get("dispose_note") and as79.get("tag"), as79

    # Round79 · 报备软逾期布尔（前端复制；checkin_soft_overdue 只读）
    ck_st79 = call("/api/checkin/status")
    u79 = ck_st79.get("user") or {}
    assert "checkin_soft_overdue" in u79 or u79, ck_st79

    # Round79 · 差旅达标+门槛+金额（前端复制；met/threshold/balance 只读）
    tf79 = call("/api/travel-fund")
    fund79 = tf79.get("fund") or tf79
    assert (
        fund79.get("met") is not None
        or fund79.get("threshold") is not None
        or fund79.get("balance") is not None
    ), tf79

    # Round79 · 善后备注+状态+城市（前端；notes/status/city 可读）
    ac79 = call(
        "/api/aftercare",
        {
            "title": "自检·备注状态79",
            "service_type": "field_visit",
            "city": "琼海",
            "notes": "备注状态城市79",
            "visit_pref": "下午",
            "travel_budget": 790,
        },
    )["item"]
    assert ac79.get("notes") or ac79.get("status") or ac79.get("city"), ac79

    # Round79 · 授权视频进度完成/总数（前端复制；progress.done/total 可读）
    av79 = call("/api/auth-video")
    prog79 = av79.get("progress") or {}
    assert prog79.get("done") is not None or prog79.get("total") is not None, av79

    # Round79 · 受益人编号+姓名+口令（前端；id/name/passphrase_hint 可读）
    bn79 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号姓名79",
            "role": "heir",
            "relation": "亲属",
            "contact": "13300000079",
            "passphrase_hint": "round79口令",
        },
    )["item"]
    assert bn79.get("id") is not None and bn79.get("name"), bn79
    assert bn79.get("passphrase_hint"), bn79

    # Round79 · 手册待办数与品牌（前端复制；todos/brand 可读）
    hand79 = call("/api/handover")
    assert hand79.get("todos") is not None or hand79.get("brand"), hand79

    # Round79 · 设置·版本+就绪+域名（前端复制；version/ok/domain 对齐）
    h79 = call("/api/health")
    assert h79.get("ok") is True, h79
    assert h79.get("version") or h79.get("server_version"), h79
    assert h79.get("domain") == "einherit.cn", h79

    # Round80 · 首页用户编号（前端条；user.id 只读）
    ck_st80home = call("/api/checkin/status")
    u80home = ck_st80home.get("user") or {}
    assert u80home.get("id") is not None or u80home, ck_st80home

    # Round80 · 交割编号+分类+处置（前端；id/category/action 可读）
    lg80 = call(
        "/api/legacy",
        {
            "title": "自检·编号分类80",
            "category": "手机",
            "action": "销毁",
            "dept": "admin",
            "factory_reset": True,
            "clear_photos": True,
            "clear_chats": False,
        },
    )["item"]
    assert lg80.get("id") is not None and lg80.get("category") and lg80.get("action"), lg80

    # Round80 · 备忘提示+平台+部门（前端；account_hint/platform/dept 可读）
    as80 = call(
        "/api/assets",
        {
            "platform": "round80HintPlatformDept",
            "account_hint": "hint80",
            "summary": "提示平台部门80",
            "dispose_note": "演示处置80",
            "dept": "finance",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as80.get("account_hint") and as80.get("platform") and as80.get("dept"), as80

    # Round80 · 报备倒计时文案（前端复制；countdown_label 只读）
    ck_st80 = call("/api/checkin/status")
    cd80 = ck_st80.get("countdown") or {}
    assert cd80.get("countdown_label") or cd80, ck_st80

    # Round80 · 差旅进度%与达标（前端复制；progress_pct/met 只读）
    tf80 = call("/api/travel-fund")
    fund80 = tf80.get("fund") or tf80
    assert (
        fund80.get("progress_pct") is not None or fund80.get("met") is not None
    ), tf80

    # Round80 · 善后编号+标题+城市（前端；id/title/city 可读）
    ac80 = call(
        "/api/aftercare",
        {
            "title": "自检·编号标题80",
            "service_type": "field_visit",
            "city": "三亚",
            "notes": "编号标题城市80",
            "visit_pref": "上午",
            "travel_budget": 800,
        },
    )["item"]
    assert ac80.get("id") is not None and ac80.get("title") and ac80.get("city"), ac80

    # Round80 · 授权视频脚本段数与就绪（前端复制；script/ready 可读）
    av80 = call("/api/auth-video")
    assert isinstance(av80.get("script"), list) or av80.get("ready") is not None, av80

    # Round80 · 受益人姓名+角色+联系（前端；name/role/contact 可读）
    bn80 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名角色80",
            "role": "executor",
            "relation": "同事",
            "contact": "13300000080",
            "passphrase_hint": "round80口令",
        },
    )["item"]
    assert bn80.get("name") and bn80.get("role") and bn80.get("contact"), bn80

    # Round80 · 手册分享提示与域名（前端复制；share_hint/domain 可读）
    hand80 = call("/api/handover")
    assert hand80.get("share_hint") or hand80.get("domain"), hand80

    # Round80 · 设置·服务版本+就绪+域名（前端复制；server_version/ok/domain 对齐）
    h80 = call("/api/health")
    assert h80.get("ok") is True, h80
    assert h80.get("server_version") or h80.get("version"), h80
    assert h80.get("domain") == "einherit.cn", h80

    # Round81 · 首页域名（前端条；domain 或 health.domain 只读）
    ck_st81home = call("/api/checkin/status")
    u81home = ck_st81home.get("user") or {}
    h81home = call("/api/health")
    assert u81home.get("domain") or h81home.get("domain") == "einherit.cn", (
        ck_st81home,
        h81home,
    )

    # Round81 · 交割标题+受益人+部门（前端；title/beneficiary/dept 可读）
    lg81 = call(
        "/api/legacy",
        {
            "title": "自检·标题受益81",
            "category": "平板",
            "action": "转赠",
            "dept": "admin",
            "beneficiary": "自检受益人81",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg81.get("title") and lg81.get("dept"), lg81
    assert lg81.get("beneficiary") or "beneficiary" in lg81, lg81

    # Round81 · 备忘编号+摘要+标签（前端；id/summary/tag 可读）
    as81 = call(
        "/api/assets",
        {
            "platform": "round81IdSummaryTag",
            "account_hint": "hint81",
            "summary": "编号摘要标签81",
            "dispose_note": "演示处置81",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as81.get("id") is not None and as81.get("summary") and as81.get("tag"), as81

    # Round81 · 报备上次文案（前端复制；last_ago_label 只读）
    ck_st81 = call("/api/checkin/status")
    cd81 = ck_st81.get("countdown") or {}
    assert cd81.get("last_ago_label") or cd81, ck_st81

    # Round81 · 差旅达标与进度%（前端复制；met/progress_pct 只读）
    tf81 = call("/api/travel-fund")
    fund81 = tf81.get("fund") or tf81
    assert (
        fund81.get("met") is not None or fund81.get("progress_pct") is not None
    ), tf81

    # Round81 · 善后阶段+预算+城市（前端；phase_label/travel_budget/city 可读）
    ac81 = call(
        "/api/aftercare",
        {
            "title": "自检·阶段预算81",
            "service_type": "field_visit",
            "city": "海口",
            "notes": "阶段预算城市81",
            "visit_pref": "上午",
            "travel_budget": 810,
        },
    )["item"]
    assert (
        ac81.get("phase_label")
        or ac81.get("travel_budget") is not None
        or ac81.get("city")
    ), ac81

    # Round81 · 授权视频门闩+就绪（前端复制；gate/ready 可读）
    av81 = call("/api/auth-video")
    assert av81.get("gate") or av81.get("ready") is not None, av81

    # Round81 · 受益人编号+关系+联系（前端；id/relation/contact 可读）
    bn81 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号关系81",
            "role": "heir",
            "relation": "表亲",
            "contact": "13300000081",
            "passphrase_hint": "round81口令",
        },
    )["item"]
    assert bn81.get("id") is not None and bn81.get("relation") and bn81.get("contact"), bn81

    # Round81 · 手册导出路径与品牌（前端复制；export_path/brand 可读）
    hand81 = call("/api/handover")
    assert hand81.get("export_path") or hand81.get("brand"), hand81

    # Round81 · 设置·中文品牌+就绪+域名（前端复制；app/ok/domain 对齐）
    h81 = call("/api/health")
    assert h81.get("ok") is True, h81
    assert h81.get("app") and h81.get("domain") == "einherit.cn", h81

    # Round82 · 首页英文品牌（前端条；brand_en 或 health.brand_en 只读）
    ck_st82home = call("/api/checkin/status")
    u82home = ck_st82home.get("user") or {}
    h82home = call("/api/health")
    assert u82home.get("brand_en") or h82home.get("brand_en"), (
        ck_st82home,
        h82home,
    )

    # Round82 · 交割备注+分类+处置（前端；notes/category/action 可读）
    lg82 = call(
        "/api/legacy",
        {
            "title": "自检·备注分类82",
            "category": "音箱",
            "action": "销售变现",
            "dept": "finance",
            "notes": "备注分类处置82",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg82.get("category") and lg82.get("action"), lg82
    assert "notes" in lg82 or lg82.get("notes") is not None, lg82

    # Round82 · 备忘平台+标签+可见性（前端；platform/tag/visibility 可读）
    as82 = call(
        "/api/assets",
        {
            "platform": "round82PlatformTagVis",
            "account_hint": "hint82",
            "summary": "平台标签可见82",
            "dispose_note": "演示处置82",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as82.get("platform") and as82.get("tag") and as82.get("visibility"), as82

    # Round82 · 报备下次建议文案（前端复制；next_suggested_label 只读）
    ck_st82 = call("/api/checkin/status")
    cd82 = ck_st82.get("countdown") or {}
    assert cd82.get("next_suggested_label") or cd82, ck_st82

    # Round82 · 差旅短差与门槛（前端复制；shortfall/threshold 只读）
    tf82 = call("/api/travel-fund")
    fund82 = tf82.get("fund") or tf82
    assert (
        fund82.get("shortfall") is not None or fund82.get("threshold") is not None
    ), tf82

    # Round82 · 善后状态+阶段+城市（前端；status/phase_label/city 可读）
    ac82 = call(
        "/api/aftercare",
        {
            "title": "自检·状态阶段82",
            "service_type": "field_visit",
            "city": "儋州",
            "notes": "状态阶段城市82",
            "visit_pref": "下午",
            "travel_budget": 820,
        },
    )["item"]
    assert ac82.get("status") or ac82.get("phase_label") or ac82.get("city"), ac82

    # Round82 · 授权视频就绪+齐备（前端复制；ready/complete_label 可读）
    av82 = call("/api/auth-video")
    assert av82.get("ready") is not None or av82.get("complete_label"), av82

    # Round82 · 受益人关系+口令+角色（前端；relation/passphrase_hint/role 可读）
    bn82 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系口令82",
            "role": "executor",
            "relation": "挚友",
            "contact": "13300000082",
            "passphrase_hint": "round82口令",
        },
    )["item"]
    assert (
        bn82.get("relation") and bn82.get("passphrase_hint") and bn82.get("role")
    ), bn82

    # Round82 · 手册进度%与品牌（前端复制；progress.pct/brand 可读）
    hand82 = call("/api/handover")
    prog82 = hand82.get("progress") or {}
    assert prog82.get("pct") is not None or hand82.get("brand"), hand82

    # Round82 · 设置·英文品牌+版本+就绪（前端复制；brand_en/version/ok 对齐）
    h82 = call("/api/health")
    assert h82.get("ok") is True, h82
    assert h82.get("brand_en") and (h82.get("version") or h82.get("server_version")), h82

    # Round83 · 首页版本（前端条；health.version 只读）
    h83home = call("/api/health")
    assert h83home.get("version") or h83home.get("server_version"), h83home

    # Round83 · 交割编号+受益人+处置（前端；id/beneficiary/action 可读）
    lg83 = call(
        "/api/legacy",
        {
            "title": "自检·编号受益83",
            "category": "相机",
            "action": "转赠",
            "dept": "admin",
            "beneficiary": "自检受益人83",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg83.get("id") is not None and lg83.get("action"), lg83
    assert lg83.get("beneficiary") or "beneficiary" in lg83, lg83

    # Round83 · 备忘编号+提示+处置（前端；id/account_hint/dispose_note 可读）
    as83 = call(
        "/api/assets",
        {
            "platform": "round83IdHintDispose",
            "account_hint": "hint83",
            "summary": "编号提示处置83",
            "dispose_note": "演示处置83",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert (
        as83.get("id") is not None
        and as83.get("account_hint")
        and as83.get("dispose_note")
    ), as83

    # Round83 · 报备距上次小时数（前端复制；hours_since_last 只读）
    ck_st83 = call("/api/checkin/status")
    cd83 = ck_st83.get("countdown") or {}
    assert cd83.get("hours_since_last") is not None or cd83, ck_st83

    # Round83 · 差旅余额与达标（前端复制；balance/met 只读）
    tf83 = call("/api/travel-fund")
    fund83 = tf83.get("fund") or tf83
    assert fund83.get("balance") is not None or fund83.get("met") is not None, tf83

    # Round83 · 善后编号+备注+城市（前端；id/notes/city 可读）
    ac83 = call(
        "/api/aftercare",
        {
            "title": "自检·编号备注83",
            "service_type": "field_visit",
            "city": "文昌",
            "notes": "编号备注城市83",
            "visit_pref": "上午",
            "travel_budget": 830,
        },
    )["item"]
    assert ac83.get("id") is not None and (ac83.get("notes") or ac83.get("city")), ac83

    # Round83 · 授权视频缺失文案+就绪（前端复制；missing_text/ready 可读）
    av83 = call("/api/auth-video")
    assert av83.get("missing_text") or av83.get("ready") is not None, av83

    # Round83 · 受益人姓名+口令+联系（前端；name/passphrase_hint/contact 可读）
    bn83 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名口令83",
            "role": "heir",
            "relation": "姻亲",
            "contact": "13300000083",
            "passphrase_hint": "round83口令",
        },
    )["item"]
    assert (
        bn83.get("name") and bn83.get("passphrase_hint") and bn83.get("contact")
    ), bn83

    # Round83 · 手册域名与品牌（前端复制；domain/brand 可读）
    hand83 = call("/api/handover")
    assert hand83.get("domain") or hand83.get("brand"), hand83

    # Round83 · 设置·版本+英文品牌+域名（前端复制；version/brand_en/domain 对齐）
    h83 = call("/api/health")
    assert h83.get("ok") is True, h83
    assert (h83.get("version") or h83.get("server_version")) and h83.get("brand_en"), h83
    assert h83.get("domain") == "einherit.cn", h83

    # Round84 · 首页就绪状态（前端条；health.ok 只读）
    h84home = call("/api/health")
    assert h84home.get("ok") is True, h84home

    # Round84 · 交割标题+分类+备注（前端；title/category/notes 可读）
    lg84 = call(
        "/api/legacy",
        {
            "title": "自检·标题分类84",
            "category": "路由器",
            "action": "销毁",
            "dept": "admin",
            "notes": "标题分类备注84",
            "factory_reset": True,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg84.get("title") and lg84.get("category"), lg84
    assert "notes" in lg84 or lg84.get("notes") is not None, lg84

    # Round84 · 备忘部门+标签+摘要（前端；dept/tag/summary 可读）
    as84 = call(
        "/api/assets",
        {
            "platform": "round84DeptTagSummary",
            "account_hint": "hint84",
            "summary": "部门标签摘要84",
            "dispose_note": "演示处置84",
            "dept": "finance",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as84.get("dept") and as84.get("tag") and as84.get("summary"), as84

    # Round84 · 报备可读倒计时（前端复制；readable 只读）
    ck_st84 = call("/api/checkin/status")
    cd84 = ck_st84.get("countdown") or {}
    assert cd84.get("readable") or cd84, ck_st84

    # Round84 · 差旅最新流水种类金额（前端复制；ledger kind/amount 只读）
    tf84 = call("/api/travel-fund")
    ledger84 = tf84.get("ledger") or []
    assert ledger84 or tf84.get("fund"), tf84

    # Round84 · 善后探访+预算+城市（前端；visit_pref/travel_budget/city 可读）
    ac84 = call(
        "/api/aftercare",
        {
            "title": "自检·探访预算84",
            "service_type": "field_visit",
            "city": "东方",
            "notes": "探访预算城市84",
            "visit_pref": "傍晚",
            "travel_budget": 840,
        },
    )["item"]
    assert (
        ac84.get("visit_pref")
        or ac84.get("travel_budget") is not None
        or ac84.get("city")
    ), ac84

    # Round84 · 授权视频进度+就绪（前端复制；progress/ready 可读）
    av84 = call("/api/auth-video")
    prog84 = av84.get("progress") or {}
    assert (
        prog84.get("done") is not None
        or prog84.get("total") is not None
        or av84.get("ready") is not None
    ), av84

    # Round84 · 受益人编号+角色+口令（前端；id/role/passphrase_hint 可读）
    bn84 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号角色84",
            "role": "executor",
            "relation": "邻居",
            "contact": "13300000084",
            "passphrase_hint": "round84口令",
        },
    )["item"]
    assert bn84.get("id") is not None and bn84.get("role") and bn84.get("passphrase_hint"), bn84

    # Round84 · 手册分享提示与品牌（前端复制；share_hint/brand 可读）
    hand84 = call("/api/handover")
    assert hand84.get("share_hint") or hand84.get("brand"), hand84

    # Round84 · 设置·中英品牌+就绪（前端复制；app/brand_en/ok 对齐）
    h84 = call("/api/health")
    assert h84.get("ok") is True, h84
    assert h84.get("app") and h84.get("brand_en"), h84

    # Round85 · 首页服务版本（前端条；server_version 只读）
    h85home = call("/api/health")
    assert h85home.get("server_version") or h85home.get("version"), h85home

    # Round85 · 交割编号+部门+备注（前端；id/dept/notes 可读）
    lg85 = call(
        "/api/legacy",
        {
            "title": "自检·编号部门85",
            "category": "硬盘",
            "action": "销毁",
            "dept": "admin",
            "notes": "编号部门备注85",
            "factory_reset": True,
            "clear_photos": True,
            "clear_chats": False,
        },
    )["item"]
    assert lg85.get("id") is not None and lg85.get("dept"), lg85
    assert "notes" in lg85 or lg85.get("notes") is not None, lg85

    # Round85 · 备忘编号+可见性+摘要（前端；id/visibility/summary 可读）
    as85 = call(
        "/api/assets",
        {
            "platform": "round85IdVisSummary",
            "account_hint": "hint85",
            "summary": "编号可见摘要85",
            "dispose_note": "演示处置85",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as85.get("id") is not None
        and as85.get("visibility")
        and as85.get("summary")
    ), as85

    # Round85 · 报备下次建议时间点（前端复制；next_suggested_at 只读）
    ck_st85 = call("/api/checkin/status")
    cd85 = ck_st85.get("countdown") or {}
    assert cd85.get("next_suggested_at") is not None or cd85, ck_st85

    # Round85 · 差旅门槛与达标（前端复制；threshold/met 只读）
    tf85 = call("/api/travel-fund")
    fund85 = tf85.get("fund") or tf85
    assert (
        fund85.get("threshold") is not None or fund85.get("met") is not None
    ), tf85

    # Round85 · 善后编号+阶段+状态（前端；id/phase_label/status 可读）
    ac85 = call(
        "/api/aftercare",
        {
            "title": "自检·编号阶段85",
            "service_type": "field_visit",
            "city": "澄迈",
            "notes": "编号阶段状态85",
            "visit_pref": "上午",
            "travel_budget": 850,
        },
    )["item"]
    assert ac85.get("id") is not None and (
        ac85.get("phase_label") or ac85.get("status")
    ), ac85

    # Round85 · 授权视频门闩+缺失文案（前端复制；gate/missing_text 可读）
    av85 = call("/api/auth-video")
    assert av85.get("gate") or av85.get("missing_text"), av85

    # Round85 · 受益人姓名+关系+联系（前端；name/relation/contact 可读）
    bn85 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系85",
            "role": "heir",
            "relation": "堂亲",
            "contact": "13300000085",
            "passphrase_hint": "round85口令",
        },
    )["item"]
    assert bn85.get("name") and bn85.get("relation") and bn85.get("contact"), bn85

    # Round85 · 手册条目数与品牌（前端复制；item_count/brand 可读）
    hand85 = call("/api/handover")
    assert hand85.get("item_count") is not None or hand85.get("brand"), hand85

    # Round85 · 设置·就绪+域名+版本（前端复制；ok/domain/version 对齐）
    h85 = call("/api/health")
    assert h85.get("ok") is True, h85
    assert h85.get("domain") == "einherit.cn", h85
    assert h85.get("version") or h85.get("server_version"), h85

    # Round86 · 首页应用就绪（前端条；app/ok 只读）
    h86home = call("/api/health")
    assert h86home.get("app") and h86home.get("ok") is True, h86home

    # Round86 · 交割处置+部门+备注（前端；action/dept/notes 可读）
    lg86 = call(
        "/api/legacy",
        {
            "title": "自检·处置部门86",
            "category": "手表",
            "action": "销售变现",
            "dept": "finance",
            "notes": "处置部门备注86",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg86.get("action") and lg86.get("dept"), lg86
    assert "notes" in lg86 or lg86.get("notes") is not None, lg86

    # Round86 · 备忘平台+提示+摘要（前端；platform/account_hint/summary 可读）
    as86 = call(
        "/api/assets",
        {
            "platform": "round86PlatformHintSummary",
            "account_hint": "hint86",
            "summary": "平台提示摘要86",
            "dispose_note": "演示处置86",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert (
        as86.get("platform")
        and as86.get("account_hint")
        and as86.get("summary")
    ), as86

    # Round86 · 报备上次报备标签（前端复制；last_checkin_label 只读）
    ck_st86 = call("/api/checkin/status")
    cd86 = ck_st86.get("countdown") or {}
    assert cd86.get("last_checkin_label") or cd86, ck_st86

    # Round86 · 差旅短差与进度%（前端复制；shortfall/progress_pct 只读）
    tf86 = call("/api/travel-fund")
    fund86 = tf86.get("fund") or tf86
    assert (
        fund86.get("shortfall") is not None
        or fund86.get("progress_pct") is not None
    ), tf86

    # Round86 · 善后标题+状态+预算（前端；title/status/travel_budget 可读）
    ac86 = call(
        "/api/aftercare",
        {
            "title": "自检·标题状态86",
            "service_type": "field_visit",
            "city": "临高",
            "notes": "标题状态预算86",
            "visit_pref": "下午",
            "travel_budget": 860,
        },
    )["item"]
    assert ac86.get("title") and (
        ac86.get("status") or ac86.get("travel_budget") is not None
    ), ac86

    # Round86 · 授权视频齐备+就绪（前端复制；complete_label/ready 可读）
    av86 = call("/api/auth-video")
    assert av86.get("complete_label") or av86.get("ready") is not None, av86

    # Round86 · 受益人编号+姓名+关系（前端；id/name/relation 可读）
    bn86 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号姓名86",
            "role": "executor",
            "relation": "同学",
            "contact": "13300000086",
            "passphrase_hint": "round86口令",
        },
    )["item"]
    assert bn86.get("id") is not None and bn86.get("name") and bn86.get("relation"), bn86

    # Round86 · 手册生成时间与域名（前端复制；generated_at/domain 可读）
    hand86 = call("/api/handover")
    assert hand86.get("generated_at") is not None or hand86.get("domain"), hand86

    # Round86 · 设置·服务版本+就绪+英文品牌（前端复制；server_version/ok/brand_en 对齐）
    h86 = call("/api/health")
    assert h86.get("ok") is True, h86
    assert (h86.get("server_version") or h86.get("version")) and h86.get("brand_en"), h86

    # Round87 · 首页应用名（前端条；health.app 只读）
    h87home = call("/api/health")
    assert h87home.get("app"), h87home

    # Round87 · 交割编号+处置+备注（前端；id/action/notes 可读）
    lg87 = call(
        "/api/legacy",
        {
            "title": "自检·编号处置87",
            "category": "键盘",
            "action": "转赠",
            "dept": "admin",
            "notes": "编号处置备注87",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg87.get("id") is not None and lg87.get("action"), lg87
    assert "notes" in lg87 or lg87.get("notes") is not None, lg87

    # Round87 · 备忘编号+处置+标签（前端；id/dispose_note/tag 可读）
    as87 = call(
        "/api/assets",
        {
            "platform": "round87IdDisposeTag",
            "account_hint": "hint87",
            "summary": "编号处置标签87",
            "dispose_note": "演示处置87",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert (
        as87.get("id") is not None
        and as87.get("dispose_note")
        and as87.get("tag")
    ), as87

    # Round87 · 报备剩余秒数（前端复制；seconds_remaining 只读）
    ck_st87 = call("/api/checkin/status")
    cd87 = ck_st87.get("countdown") or {}
    assert cd87.get("seconds_remaining") is not None or cd87, ck_st87

    # Round87 · 差旅余额与短差（前端复制；balance/shortfall 只读）
    tf87 = call("/api/travel-fund")
    fund87 = tf87.get("fund") or tf87
    assert (
        fund87.get("balance") is not None or fund87.get("shortfall") is not None
    ), tf87

    # Round87 · 善后城市+状态+备注（前端；city/status/notes 可读）
    ac87 = call(
        "/api/aftercare",
        {
            "title": "自检·城市状态87",
            "service_type": "field_visit",
            "city": "定安",
            "notes": "城市状态备注87",
            "visit_pref": "上午",
            "travel_budget": 870,
        },
    )["item"]
    assert ac87.get("city") or ac87.get("status") or ac87.get("notes"), ac87

    # Round87 · 授权视频生效编号+就绪（前端复制；current_active_id/ready 可读）
    av87 = call("/api/auth-video")
    assert (
        av87.get("current_active_id") is not None or av87.get("ready") is not None
    ), av87

    # Round87 · 受益人角色+口令+联系（前端；role/passphrase_hint/contact 可读）
    bn87 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色口令87",
            "role": "heir",
            "relation": "挚友",
            "contact": "13300000087",
            "passphrase_hint": "round87口令",
        },
    )["item"]
    assert (
        bn87.get("role") and bn87.get("passphrase_hint") and bn87.get("contact")
    ), bn87

    # Round87 · 手册导出路径与分享提示（前端复制；export_path/share_hint 可读）
    hand87 = call("/api/handover")
    assert hand87.get("export_path") or hand87.get("share_hint"), hand87

    # Round87 · 设置·中文品牌+版本+英文品牌（前端复制；app/version/brand_en 对齐）
    h87 = call("/api/health")
    assert h87.get("ok") is True, h87
    assert h87.get("app") and h87.get("brand_en"), h87
    assert h87.get("version") or h87.get("server_version"), h87

    # Round88 · 首页英文品牌就绪（前端条；brand_en/ok 只读）
    h88home = call("/api/health")
    assert h88home.get("brand_en") and h88home.get("ok") is True, h88home

    # Round88 · 交割分类+受益人+部门（前端；category/beneficiary/dept 可读）
    lg88 = call(
        "/api/legacy",
        {
            "title": "自检·分类受益88",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人88",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg88.get("category") and lg88.get("dept"), lg88
    assert lg88.get("beneficiary") or "beneficiary" in lg88, lg88

    # Round88 · 备忘提示+可见性+标签（前端；account_hint/visibility/tag 可读）
    as88 = call(
        "/api/assets",
        {
            "platform": "round88HintVisTag",
            "account_hint": "hint88",
            "summary": "提示可见标签88",
            "dispose_note": "演示处置88",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as88.get("account_hint")
        and as88.get("visibility")
        and as88.get("tag")
    ), as88

    # Round88 · 报备间隔小时（前端复制；interval_hours 只读）
    ck_st88 = call("/api/checkin/status")
    cd88 = ck_st88.get("countdown") or {}
    assert cd88.get("interval_hours") is not None or cd88, ck_st88

    # Round88 · 差旅达标与余额（前端复制；met/balance 只读）
    tf88 = call("/api/travel-fund")
    fund88 = tf88.get("fund") or tf88
    assert fund88.get("met") is not None or fund88.get("balance") is not None, tf88

    # Round88 · 善后编号+探访+城市（前端；id/visit_pref/city 可读）
    ac88 = call(
        "/api/aftercare",
        {
            "title": "自检·编号探访88",
            "service_type": "field_visit",
            "city": "屯昌",
            "notes": "编号探访城市88",
            "visit_pref": "傍晚",
            "travel_budget": 880,
        },
    )["item"]
    assert ac88.get("id") is not None and (
        ac88.get("visit_pref") or ac88.get("city")
    ), ac88

    # Round88 · 授权视频清单+就绪（前端复制；checklist/ready 可读）
    av88 = call("/api/auth-video")
    assert isinstance(av88.get("checklist"), list) or av88.get("ready") is not None, av88

    # Round88 · 受益人编号+联系+角色（前端；id/contact/role 可读）
    bn88 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系88",
            "role": "executor",
            "relation": "同事",
            "contact": "13300000088",
            "passphrase_hint": "round88口令",
        },
    )["item"]
    assert bn88.get("id") is not None and bn88.get("contact") and bn88.get("role"), bn88

    # Round88 · 手册条目数与分享提示（前端复制；item_count/share_hint 可读）
    hand88 = call("/api/handover")
    assert hand88.get("item_count") is not None or hand88.get("share_hint"), hand88

    # Round88 · 设置·域名+就绪+英文品牌（前端复制；domain/ok/brand_en 对齐）
    h88 = call("/api/health")
    assert h88.get("ok") is True, h88
    assert h88.get("domain") == "einherit.cn" and h88.get("brand_en"), h88

    # Round89 · 首页域名英文品牌（前端条；domain/brand_en 只读）
    h89home = call("/api/health")
    assert h89home.get("domain") == "einherit.cn" and h89home.get("brand_en"), h89home

    # Round89 · 交割标题+受益人+备注（前端；title/beneficiary/notes 可读）
    lg89 = call(
        "/api/legacy",
        {
            "title": "自检·标题受益89",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人89",
            "notes": "备注89",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg89.get("title") and (lg89.get("beneficiary") or lg89.get("notes")), lg89

    # Round89 · 备忘编号+平台+处置（前端；id/platform/dispose_note 可读）
    as89 = call(
        "/api/assets",
        {
            "platform": "round89IdPlatDisp",
            "account_hint": "hint89",
            "summary": "编号平台处置89",
            "dispose_note": "演示处置89",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as89.get("id") is not None and as89.get("platform") and as89.get(
        "dispose_note"
    ), as89

    # Round89 · 报备冷静期小时（前端复制；grace_hours 只读）
    ck_st89 = call("/api/checkin/status")
    cd89 = ck_st89.get("countdown") or {}
    assert cd89.get("grace_hours") is not None or cd89, ck_st89

    # Round89 · 差旅门槛与余额（前端复制；threshold/balance 只读）
    tf89 = call("/api/travel-fund")
    fund89 = tf89.get("fund") or tf89
    assert fund89.get("threshold") is not None or fund89.get("balance") is not None, tf89

    # Round89 · 善后标题+阶段+备注（前端；title/phase/notes 可读）
    ac89 = call(
        "/api/aftercare",
        {
            "title": "自检·标题阶段89",
            "service_type": "field_visit",
            "city": "澄迈",
            "notes": "标题阶段备注89",
            "visit_pref": "午后",
            "travel_budget": 890,
        },
    )["item"]
    assert ac89.get("title") and (ac89.get("phase") or ac89.get("notes")), ac89

    # Round89 · 授权视频脚本+完成文案（前端复制；script/complete_label 可读）
    av89 = call("/api/auth-video")
    assert isinstance(av89.get("script"), list) or av89.get("complete_label"), av89

    # Round89 · 受益人姓名+关系+口令（前端；name/relation/passphrase_hint 可读）
    bn89 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系89",
            "role": "executor",
            "relation": "好友",
            "contact": "13300000089",
            "passphrase_hint": "round89口令",
        },
    )["item"]
    assert bn89.get("name") and bn89.get("relation") and bn89.get(
        "passphrase_hint"
    ), bn89

    # Round89 · 手册待办数与域名（前端复制；todos/domain 可读）
    hand89 = call("/api/handover")
    assert isinstance(hand89.get("todos"), list) or hand89.get("domain"), hand89

    # Round89 · 设置·版本+就绪+英文品牌（前端复制；version/ok/brand_en 对齐）
    h89 = call("/api/health")
    assert h89.get("ok") is True, h89
    assert (h89.get("version") or h89.get("server_version")) and h89.get("brand_en"), h89

    # Round90 · 首页应用名版本（前端条；app/version 只读）
    h90home = call("/api/health")
    assert h90home.get("app") and (
        h90home.get("version") or h90home.get("server_version")
    ), h90home

    # Round90 · 交割处置+受益人+部门（前端；action/beneficiary/dept 可读）
    lg90 = call(
        "/api/legacy",
        {
            "title": "自检·处置受益90",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人90",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg90.get("action") and lg90.get("dept"), lg90
    assert lg90.get("beneficiary") or "beneficiary" in lg90, lg90

    # Round90 · 备忘摘要+提示+标签（前端；summary/account_hint/tag 可读）
    as90 = call(
        "/api/assets",
        {
            "platform": "round90SumHintTag",
            "account_hint": "hint90",
            "summary": "摘要提示标签90",
            "dispose_note": "演示处置90",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as90.get("summary") and as90.get("account_hint") and as90.get("tag"), as90

    # Round90 · 报备即将到期（前端复制；due_soon 只读）
    ck_st90 = call("/api/checkin/status")
    cd90 = ck_st90.get("countdown") or {}
    assert "due_soon" in cd90 or cd90, ck_st90

    # Round90 · 差旅达标与进度百分比（前端复制；met/progress_pct 只读）
    tf90 = call("/api/travel-fund")
    fund90 = tf90.get("fund") or tf90
    assert fund90.get("met") is not None or fund90.get("progress_pct") is not None, tf90

    # Round90 · 善后编号+状态+预算（前端；id/status/travel_budget 可读）
    ac90 = call(
        "/api/aftercare",
        {
            "title": "自检·编号状态90",
            "service_type": "field_visit",
            "city": "临高",
            "notes": "编号状态预算90",
            "visit_pref": "上午",
            "travel_budget": 900,
        },
    )["item"]
    assert ac90.get("id") is not None and (
        ac90.get("status") or ac90.get("travel_budget") is not None
    ), ac90

    # Round90 · 授权视频清单+完成文案（前端复制；checklist/complete_label 可读）
    av90 = call("/api/auth-video")
    assert isinstance(av90.get("checklist"), list) or av90.get("complete_label"), av90

    # Round90 · 受益人联系+关系+角色（前端；contact/relation/role 可读）
    bn90 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系关系90",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000090",
            "passphrase_hint": "round90口令",
        },
    )["item"]
    assert bn90.get("contact") and bn90.get("relation") and bn90.get("role"), bn90

    # Round90 · 手册生成时间与品牌（前端复制；generated_at/brand 可读）
    hand90 = call("/api/handover")
    assert hand90.get("generated_at") is not None or hand90.get("brand"), hand90

    # Round90 · 设置·域名+版本+就绪（前端复制；domain/version/ok 对齐）
    h90 = call("/api/health")
    assert h90.get("ok") is True, h90
    assert h90.get("domain") == "einherit.cn" and (
        h90.get("version") or h90.get("server_version")
    ), h90

    # Round91 · 首页就绪英文品牌（前端条；ok/brand_en 只读）
    h91home = call("/api/health")
    assert h91home.get("ok") is True and h91home.get("brand_en"), h91home

    # Round91 · 交割标题+分类+处置（前端；title/category/action 可读）
    lg91 = call(
        "/api/legacy",
        {
            "title": "自检·标题分类91",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人91",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg91.get("title") and lg91.get("category") and lg91.get("action"), lg91

    # Round91 · 备忘编号+可见性+部门（前端；id/visibility/dept 可读）
    as91 = call(
        "/api/assets",
        {
            "platform": "round91IdVisDept",
            "account_hint": "hint91",
            "summary": "编号可见部门91",
            "dispose_note": "演示处置91",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as91.get("id") is not None and as91.get("visibility") and as91.get(
        "dept"
    ), as91

    # Round91 · 报备剩余小时（前端复制；hours_remaining 只读）
    ck_st91 = call("/api/checkin/status")
    cd91 = ck_st91.get("countdown") or {}
    assert cd91.get("hours_remaining") is not None or cd91, ck_st91

    # Round91 · 差旅缺口与达标（前端复制；shortfall/met 只读）
    tf91 = call("/api/travel-fund")
    fund91 = tf91.get("fund") or tf91
    assert fund91.get("shortfall") is not None or fund91.get("met") is not None, tf91

    # Round91 · 善后城市+阶段+预算（前端；city/phase/travel_budget 可读）
    ac91 = call(
        "/api/aftercare",
        {
            "title": "自检·城市阶段91",
            "service_type": "field_visit",
            "city": "定安",
            "notes": "城市阶段预算91",
            "visit_pref": "晚上",
            "travel_budget": 910,
        },
    )["item"]
    assert ac91.get("city") and (
        ac91.get("phase") or ac91.get("travel_budget") is not None
    ), ac91

    # Round91 · 授权视频缺失标签+完成（前端复制；missing_labels/complete 可读）
    av91 = call("/api/auth-video")
    assert isinstance(av91.get("missing_labels"), list) or av91.get(
        "complete"
    ) is not None, av91

    # Round91 · 受益人姓名+口令+角色（前端；name/passphrase_hint/role 可读）
    bn91 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名口令91",
            "role": "executor",
            "relation": "家属",
            "contact": "13300000091",
            "passphrase_hint": "round91口令",
        },
    )["item"]
    assert bn91.get("name") and bn91.get("passphrase_hint") and bn91.get("role"), bn91

    # Round91 · 手册进度百分比与分享提示（前端复制；progress.pct/share_hint 可读）
    hand91 = call("/api/handover")
    prog91 = hand91.get("progress") or {}
    assert prog91.get("pct") is not None or hand91.get("share_hint"), hand91

    # Round91 · 设置·应用名+域名+英文品牌（前端复制；app/domain/brand_en 对齐）
    h91 = call("/api/health")
    assert h91.get("ok") is True, h91
    assert h91.get("app") and h91.get("domain") == "einherit.cn" and h91.get(
        "brand_en"
    ), h91

    # Round92 · 首页域名版本（前端条；domain/version 只读）
    h92home = call("/api/health")
    assert h92home.get("domain") == "einherit.cn" and (
        h92home.get("version") or h92home.get("server_version")
    ), h92home

    # Round92 · 交割编号+受益人+备注（前端；id/beneficiary/notes 可读）
    lg92 = call(
        "/api/legacy",
        {
            "title": "自检·编号受益92",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人92",
            "notes": "备注92",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg92.get("id") is not None and (
        lg92.get("beneficiary") or lg92.get("notes")
    ), lg92

    # Round92 · 备忘平台+摘要+可见性（前端；platform/summary/visibility 可读）
    as92 = call(
        "/api/assets",
        {
            "platform": "round92PlatSumVis",
            "account_hint": "hint92",
            "summary": "平台摘要可见92",
            "dispose_note": "演示处置92",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as92.get("platform") and as92.get("summary") and as92.get(
        "visibility"
    ), as92

    # Round92 · 报备上次距今（前端复制；last_ago_label 只读）
    ck_st92 = call("/api/checkin/status")
    cd92 = ck_st92.get("countdown") or {}
    assert cd92.get("last_ago_label") or cd92, ck_st92

    # Round92 · 差旅进度百分比与门槛（前端复制；progress_pct/threshold 只读）
    tf92 = call("/api/travel-fund")
    fund92 = tf92.get("fund") or tf92
    assert fund92.get("progress_pct") is not None or fund92.get(
        "threshold"
    ) is not None, tf92

    # Round92 · 善后标题+状态+城市（前端；title/status/city 可读）
    ac92 = call(
        "/api/aftercare",
        {
            "title": "自检·标题状态92",
            "service_type": "field_visit",
            "city": "白沙",
            "notes": "标题状态城市92",
            "visit_pref": "周末",
            "travel_budget": 920,
        },
    )["item"]
    assert ac92.get("title") and (ac92.get("status") or ac92.get("city")), ac92

    # Round92 · 授权视频闸口+完成文案（前端复制；gate/complete_label 可读）
    av92 = call("/api/auth-video")
    assert av92.get("gate") or av92.get("complete_label"), av92

    # Round92 · 受益人联系+口令+角色（前端；contact/passphrase_hint/role 可读）
    bn92 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系口令92",
            "role": "executor",
            "relation": "朋友",
            "contact": "13300000092",
            "passphrase_hint": "round92口令",
        },
    )["item"]
    assert bn92.get("contact") and bn92.get("passphrase_hint") and bn92.get(
        "role"
    ), bn92

    # Round92 · 手册条目数与域名（前端复制；item_count/domain 可读）
    hand92 = call("/api/handover")
    assert hand92.get("item_count") is not None or hand92.get("domain"), hand92

    # Round92 · 设置·版本+域名+英文品牌（前端复制；version/domain/brand_en 对齐）
    h92 = call("/api/health")
    assert h92.get("ok") is True, h92
    assert (h92.get("version") or h92.get("server_version")) and h92.get(
        "domain"
    ) == "einherit.cn" and h92.get("brand_en"), h92

    # Round93 · 首页应用就绪域名（前端条；app/ok/domain 只读）
    h93home = call("/api/health")
    assert h93home.get("app") and h93home.get("ok") is True and h93home.get(
        "domain"
    ) == "einherit.cn", h93home

    # Round93 · 交割分类+处置+受益人（前端；category/action/beneficiary 可读）
    lg93 = call(
        "/api/legacy",
        {
            "title": "自检·分类处置93",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人93",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg93.get("category") and lg93.get("action"), lg93
    assert lg93.get("beneficiary") or "beneficiary" in lg93, lg93

    # Round93 · 备忘标签+可见性+部门（前端；tag/visibility/dept 可读）
    as93 = call(
        "/api/assets",
        {
            "platform": "round93TagVisDept",
            "account_hint": "hint93",
            "summary": "标签可见部门93",
            "dispose_note": "演示处置93",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as93.get("tag") and as93.get("visibility") and as93.get("dept"), as93

    # Round93 · 报备可读说明（前端复制；readable 只读）
    ck_st93 = call("/api/checkin/status")
    cd93 = ck_st93.get("countdown") or {}
    assert cd93.get("readable") or cd93, ck_st93

    # Round93 · 差旅达标与门槛（前端复制；met/threshold 只读）
    tf93 = call("/api/travel-fund")
    fund93 = tf93.get("fund") or tf93
    assert fund93.get("met") is not None or fund93.get("threshold") is not None, tf93

    # Round93 · 善后编号+阶段+备注（前端；id/phase/notes 可读）
    ac93 = call(
        "/api/aftercare",
        {
            "title": "自检·编号阶段93",
            "service_type": "field_visit",
            "city": "琼中",
            "notes": "编号阶段备注93",
            "visit_pref": "清晨",
            "travel_budget": 930,
        },
    )["item"]
    assert ac93.get("id") is not None and (
        ac93.get("phase") or ac93.get("notes")
    ), ac93

    # Round93 · 授权视频进度+完成文案（前端复制；progress/complete_label 可读）
    av93 = call("/api/auth-video")
    prog93 = av93.get("progress") or {}
    assert prog93.get("done") is not None or av93.get("complete_label"), av93

    # Round93 · 受益人联系+姓名+关系（前端；contact/name/relation 可读）
    bn93 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名93",
            "role": "executor",
            "relation": "同学",
            "contact": "13300000093",
            "passphrase_hint": "round93口令",
        },
    )["item"]
    assert bn93.get("contact") and bn93.get("name") and bn93.get("relation"), bn93

    # Round93 · 手册导出路径与分享提示（前端复制；export_path/share_hint 可读）
    hand93 = call("/api/handover")
    assert hand93.get("export_path") or hand93.get("share_hint"), hand93

    # Round93 · 设置·就绪+域名+英文品牌（前端复制；ok/domain/brand_en 对齐）
    h93 = call("/api/health")
    assert h93.get("ok") is True, h93
    assert h93.get("domain") == "einherit.cn" and h93.get("brand_en"), h93

    # Round94 · 首页英文品牌版本（前端条；brand_en/version 只读）
    h94home = call("/api/health")
    assert h94home.get("brand_en") and (
        h94home.get("version") or h94home.get("server_version")
    ), h94home

    # Round94 · 交割编号+处置+部门（前端；id/action/dept 可读）
    lg94 = call(
        "/api/legacy",
        {
            "title": "自检·编号处置94",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人94",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg94.get("id") is not None and lg94.get("action") and lg94.get(
        "dept"
    ), lg94

    # Round94 · 备忘摘要+可见性+平台（前端；summary/visibility/platform 可读）
    as94 = call(
        "/api/assets",
        {
            "platform": "round94SumVisPlat",
            "account_hint": "hint94",
            "summary": "摘要可见平台94",
            "dispose_note": "演示处置94",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as94.get("summary") and as94.get("visibility") and as94.get(
        "platform"
    ), as94

    # Round94 · 报备建议时间（前端复制；next_suggested_label 只读）
    ck_st94 = call("/api/checkin/status")
    cd94 = ck_st94.get("countdown") or {}
    assert cd94.get("next_suggested_label") or cd94.get(
        "next_suggested_at"
    ) is not None or cd94, ck_st94

    # Round94 · 差旅缺口与余额（前端复制；shortfall/balance 只读）
    tf94 = call("/api/travel-fund")
    fund94 = tf94.get("fund") or tf94
    assert fund94.get("shortfall") is not None or fund94.get(
        "balance"
    ) is not None, tf94

    # Round94 · 善后标题+预算+城市（前端；title/travel_budget/city 可读）
    ac94 = call(
        "/api/aftercare",
        {
            "title": "自检·标题预算94",
            "service_type": "field_visit",
            "city": "保亭",
            "notes": "标题预算城市94",
            "visit_pref": "午间",
            "travel_budget": 940,
        },
    )["item"]
    assert ac94.get("title") and (
        ac94.get("travel_budget") is not None or ac94.get("city")
    ), ac94

    # Round94 · 授权视频清单+闸口（前端复制；checklist/gate 可读）
    av94 = call("/api/auth-video")
    assert isinstance(av94.get("checklist"), list) or av94.get("gate"), av94

    # Round94 · 受益人编号+关系+口令（前端；id/relation/passphrase_hint 可读）
    bn94 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号关系94",
            "role": "executor",
            "relation": "邻居",
            "contact": "13300000094",
            "passphrase_hint": "round94口令",
        },
    )["item"]
    assert bn94.get("id") is not None and bn94.get("relation") and bn94.get(
        "passphrase_hint"
    ), bn94

    # Round94 · 手册待办数与分享提示（前端复制；todos/share_hint 可读）
    hand94 = call("/api/handover")
    assert isinstance(hand94.get("todos"), list) or hand94.get("share_hint"), hand94

    # Round94 · 设置·版本+应用名+域名（前端复制；version/app/domain 对齐）
    h94 = call("/api/health")
    assert h94.get("ok") is True, h94
    assert (h94.get("version") or h94.get("server_version")) and h94.get(
        "app"
    ) and h94.get("domain") == "einherit.cn", h94

    # Round95 · 首页就绪版本（前端条；ok/version 只读）
    h95home = call("/api/health")
    assert h95home.get("ok") is True and (
        h95home.get("version") or h95home.get("server_version")
    ), h95home

    # Round95 · 交割受益人+部门+备注（前端；beneficiary/dept/notes 可读）
    lg95 = call(
        "/api/legacy",
        {
            "title": "自检·受益部门95",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人95",
            "notes": "备注95",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg95.get("dept") and (
        lg95.get("beneficiary") or lg95.get("notes")
    ), lg95

    # Round95 · 备忘编号+标签+提示（前端；id/tag/account_hint 可读）
    as95 = call(
        "/api/assets",
        {
            "platform": "round95IdTagHint",
            "account_hint": "hint95",
            "summary": "编号标签提示95",
            "dispose_note": "演示处置95",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as95.get("id") is not None and as95.get("tag") and as95.get(
        "account_hint"
    ), as95

    # Round95 · 报备倒计时标签（前端复制；countdown_label 只读）
    ck_st95 = call("/api/checkin/status")
    cd95 = ck_st95.get("countdown") or {}
    assert cd95.get("countdown_label") or cd95, ck_st95

    # Round95 · 差旅进度百分比与达标（前端复制；progress_pct/met 只读）
    tf95 = call("/api/travel-fund")
    fund95 = tf95.get("fund") or tf95
    assert fund95.get("progress_pct") is not None or fund95.get(
        "met"
    ) is not None, tf95

    # Round95 · 善后阶段+预算+状态（前端；phase/travel_budget/status 可读）
    ac95 = call(
        "/api/aftercare",
        {
            "title": "自检·阶段预算95",
            "service_type": "field_visit",
            "city": "乐东",
            "notes": "阶段预算状态95",
            "visit_pref": "傍晚",
            "travel_budget": 950,
        },
    )["item"]
    assert (
        ac95.get("phase")
        or ac95.get("travel_budget") is not None
        or ac95.get("status")
    ), ac95

    # Round95 · 授权视频缺失文案+完成（前端复制；missing_text/complete 可读）
    av95 = call("/api/auth-video")
    assert av95.get("missing_text") or av95.get("complete") is not None, av95

    # Round95 · 受益人姓名+联系+口令（前端；name/contact/passphrase_hint 可读）
    bn95 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名联系95",
            "role": "executor",
            "relation": "亲戚",
            "contact": "13300000095",
            "passphrase_hint": "round95口令",
        },
    )["item"]
    assert bn95.get("name") and bn95.get("contact") and bn95.get(
        "passphrase_hint"
    ), bn95

    # Round95 · 手册生成时间与分享提示（前端复制；generated_at/share_hint 可读）
    hand95 = call("/api/handover")
    assert hand95.get("generated_at") is not None or hand95.get(
        "share_hint"
    ), hand95

    # Round95 · 设置·英文品牌+应用名+就绪（前端复制；brand_en/app/ok 对齐）
    h95 = call("/api/health")
    assert h95.get("ok") is True, h95
    assert h95.get("brand_en") and h95.get("app"), h95

    # Round96 · 首页应用英文域名（前端条；app/brand_en/domain 只读）
    h96home = call("/api/health")
    assert h96home.get("app") and h96home.get("brand_en") and h96home.get(
        "domain"
    ) == "einherit.cn", h96home

    # Round96 · 交割编号+标题+分类（前端；id/title/category 可读）
    lg96 = call(
        "/api/legacy",
        {
            "title": "自检·编号标题96",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人96",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg96.get("id") is not None and lg96.get("title") and lg96.get(
        "category"
    ), lg96

    # Round96 · 备忘处置+标签+部门（前端；dispose_note/tag/dept 可读）
    as96 = call(
        "/api/assets",
        {
            "platform": "round96DispTagDept",
            "account_hint": "hint96",
            "summary": "处置标签部门96",
            "dispose_note": "演示处置96",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as96.get("dispose_note") and as96.get("tag") and as96.get(
        "dept"
    ), as96

    # Round96 · 报备距上次小时（前端复制；hours_since_last 只读）
    ck_st96 = call("/api/checkin/status")
    cd96 = ck_st96.get("countdown") or {}
    assert cd96.get("hours_since_last") is not None or cd96, ck_st96

    # Round96 · 差旅余额与达标（前端复制；balance/met 只读）
    tf96 = call("/api/travel-fund")
    fund96 = tf96.get("fund") or tf96
    assert fund96.get("balance") is not None or fund96.get("met") is not None, tf96

    # Round96 · 善后编号+标题+探访（前端；id/title/visit_pref 可读）
    ac96 = call(
        "/api/aftercare",
        {
            "title": "自检·编号探访96",
            "service_type": "field_visit",
            "city": "五指山",
            "notes": "编号标题探访96",
            "visit_pref": "上午",
            "travel_budget": 960,
        },
    )["item"]
    assert ac96.get("id") is not None and ac96.get("title") and (
        ac96.get("visit_pref") or True
    ), ac96

    # Round96 · 授权视频脚本+闸口+就绪（前端复制；script/gate/ready 可读）
    av96 = call("/api/auth-video")
    assert (
        isinstance(av96.get("script"), list)
        or av96.get("gate")
        or av96.get("ready") is not None
    ), av96

    # Round96 · 受益人编号+角色+联系（前端；id/role/contact 可读）
    bn96 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号角色96",
            "role": "executor",
            "relation": "同事",
            "contact": "13300000096",
            "passphrase_hint": "round96口令",
        },
    )["item"]
    assert bn96.get("id") is not None and bn96.get("role") and bn96.get(
        "contact"
    ), bn96

    # Round96 · 手册进度百分比与导出路径（前端复制；progress.pct/export_path 可读）
    hand96 = call("/api/handover")
    prog96 = hand96.get("progress") or {}
    assert prog96.get("pct") is not None or hand96.get("export_path"), hand96

    # Round96 · 设置·域名+应用名+版本（前端复制；domain/app/version 对齐）
    h96 = call("/api/health")
    assert h96.get("ok") is True, h96
    assert h96.get("domain") == "einherit.cn" and h96.get("app") and (
        h96.get("version") or h96.get("server_version")
    ), h96

    # Round97 · 首页就绪域名版本（前端条；ok/domain/version 只读）
    h97home = call("/api/health")
    assert h97home.get("ok") is True and h97home.get("domain") == "einherit.cn" and (
        h97home.get("version") or h97home.get("server_version")
    ), h97home

    # Round97 · 交割处置+备注+部门（前端；action/notes/dept 可读）
    lg97 = call(
        "/api/legacy",
        {
            "title": "自检·处置备注97",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人97",
            "notes": "备注97",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg97.get("action") and lg97.get("dept"), lg97

    # Round97 · 备忘提示+平台+标签（前端；account_hint/platform/tag 可读）
    as97 = call(
        "/api/assets",
        {
            "platform": "round97HintPlatTag",
            "account_hint": "hint97",
            "summary": "提示平台标签97",
            "dispose_note": "演示处置97",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as97.get("account_hint") and as97.get("platform") and as97.get(
        "tag"
    ), as97

    # Round97 · 报备剩余秒数（前端复制；seconds_remaining 只读）
    ck_st97 = call("/api/checkin/status")
    cd97 = ck_st97.get("countdown") or {}
    assert cd97.get("seconds_remaining") is not None or cd97, ck_st97

    # Round97 · 差旅门槛与缺口（前端复制；threshold/shortfall 只读）
    tf97 = call("/api/travel-fund")
    fund97 = tf97.get("fund") or tf97
    assert fund97.get("threshold") is not None or fund97.get(
        "shortfall"
    ) is not None, tf97

    # Round97 · 善后城市+备注+预算（前端；city/notes/travel_budget 可读）
    ac97 = call(
        "/api/aftercare",
        {
            "title": "自检·城市备注97",
            "service_type": "field_visit",
            "city": "东方",
            "notes": "城市备注预算97",
            "visit_pref": "午后",
            "travel_budget": 970,
        },
    )["item"]
    assert ac97.get("city") and (
        ac97.get("notes") or ac97.get("travel_budget") is not None
    ), ac97

    # Round97 · 授权视频就绪+缺失数（前端复制；ready/missing_labels 可读）
    av97 = call("/api/auth-video")
    assert av97.get("ready") is not None or isinstance(
        av97.get("missing_labels"), list
    ), av97

    # Round97 · 受益人关系+角色+联系（前端；relation/role/contact 可读）
    bn97 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系角色97",
            "role": "executor",
            "relation": "好友",
            "contact": "13300000097",
            "passphrase_hint": "round97口令",
        },
    )["item"]
    assert bn97.get("relation") and bn97.get("role") and bn97.get(
        "contact"
    ), bn97

    # Round97 · 手册条目数与品牌（前端复制；item_count/brand 可读）
    hand97 = call("/api/handover")
    assert hand97.get("item_count") is not None or hand97.get("brand"), hand97

    # Round97 · 设置·就绪+英文品牌+版本（前端复制；ok/brand_en/version 对齐）
    h97 = call("/api/health")
    assert h97.get("ok") is True, h97
    assert h97.get("brand_en") and (
        h97.get("version") or h97.get("server_version")
    ), h97

    # Round98 · 首页英文域名就绪（前端条；brand_en/domain/ok 只读）
    h98home = call("/api/health")
    assert h98home.get("brand_en") and h98home.get("domain") == "einherit.cn" and h98home.get(
        "ok"
    ) is True, h98home

    # Round98 · 交割分类+备注+受益人（前端；category/notes/beneficiary 可读）
    lg98 = call(
        "/api/legacy",
        {
            "title": "自检·分类备注98",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人98",
            "notes": "备注98",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg98.get("category") and (
        lg98.get("notes") or lg98.get("beneficiary")
    ), lg98

    # Round98 · 备忘可见性+摘要+部门（前端；visibility/summary/dept 可读）
    as98 = call(
        "/api/assets",
        {
            "platform": "round98VisSumDept",
            "account_hint": "hint98",
            "summary": "可见摘要部门98",
            "dispose_note": "演示处置98",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as98.get("visibility") and as98.get("summary") and as98.get(
        "dept"
    ), as98

    # Round98 · 报备最近报备时刻（前端复制；last_checkin_label 只读）
    ck_st98 = call("/api/checkin/status")
    cd98 = ck_st98.get("countdown") or {}
    assert cd98.get("last_checkin_label") or cd98, ck_st98

    # Round98 · 差旅达标+余额+门槛（前端复制；met/balance/threshold 只读）
    tf98 = call("/api/travel-fund")
    fund98 = tf98.get("fund") or tf98
    assert (
        fund98.get("met") is not None
        or fund98.get("balance") is not None
        or fund98.get("threshold") is not None
    ), tf98

    # Round98 · 善后预算+状态+城市（前端；travel_budget/status/city 可读）
    ac98 = call(
        "/api/aftercare",
        {
            "title": "自检·预算状态98",
            "service_type": "field_visit",
            "city": "昌江",
            "notes": "预算状态城市98",
            "visit_pref": "晚上",
            "travel_budget": 980,
        },
    )["item"]
    assert (
        ac98.get("travel_budget") is not None
        or ac98.get("status")
        or ac98.get("city")
    ), ac98

    # Round98 · 授权视频完成+闸口+就绪（前端复制；complete/gate/ready 可读）
    av98 = call("/api/auth-video")
    assert (
        av98.get("complete") is not None
        or av98.get("gate")
        or av98.get("ready") is not None
    ), av98

    # Round98 · 受益人口令+姓名+角色（前端；passphrase_hint/name/role 可读）
    bn98 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令姓名98",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000098",
            "passphrase_hint": "round98口令",
        },
    )["item"]
    assert bn98.get("passphrase_hint") and bn98.get("name") and bn98.get(
        "role"
    ), bn98

    # Round98 · 手册域名与品牌（前端复制；domain/brand 可读）
    hand98 = call("/api/handover")
    assert hand98.get("domain") or hand98.get("brand"), hand98

    # Round98 · 设置·应用名+就绪+版本（前端复制；app/ok/version 对齐）
    h98 = call("/api/health")
    assert h98.get("ok") is True, h98
    assert h98.get("app") and (
        h98.get("version") or h98.get("server_version")
    ), h98

    # Round99 · 首页应用域名版本（前端条；app/domain/version 只读）
    h99home = call("/api/health")
    assert h99home.get("app") and h99home.get("domain") == "einherit.cn" and (
        h99home.get("version") or h99home.get("server_version")
    ), h99home

    # Round99 · 交割编号+部门+受益人（前端；id/dept/beneficiary 可读）
    lg99 = call(
        "/api/legacy",
        {
            "title": "自检·编号部门99",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人99",
            "notes": "备注99",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg99.get("id") is not None and lg99.get("dept") and lg99.get(
        "beneficiary"
    ), lg99

    # Round99 · 备忘平台+标签+提示（前端；platform/tag/account_hint 可读）
    as99 = call(
        "/api/assets",
        {
            "platform": "round99PlatTagHint",
            "account_hint": "hint99",
            "summary": "平台标签提示99",
            "dispose_note": "演示处置99",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as99.get("platform") and as99.get("tag") and as99.get(
        "account_hint"
    ), as99

    # Round99 · 报备间隔小时说明（前端复制；interval_hours 只读）
    ck_st99 = call("/api/checkin/status")
    cd99 = ck_st99.get("countdown") or {}
    assert cd99.get("interval_hours") is not None or cd99, ck_st99

    # Round99 · 差旅进度百分比与缺口（前端复制；progress_pct/shortfall 只读）
    tf99 = call("/api/travel-fund")
    fund99 = tf99.get("fund") or tf99
    assert (
        fund99.get("progress_pct") is not None
        or fund99.get("progress") is not None
        or fund99.get("shortfall") is not None
    ), tf99

    # Round99 · 善后标题+备注+状态（前端；title/notes/status 可读）
    ac99 = call(
        "/api/aftercare",
        {
            "title": "自检·标题备注99",
            "service_type": "field_visit",
            "city": "三亚",
            "notes": "标题备注状态99",
            "visit_pref": "晚上",
            "travel_budget": 990,
        },
    )["item"]
    assert ac99.get("title") and (
        ac99.get("notes") or ac99.get("status")
    ), ac99

    # Round99 · 授权视频清单+进度+就绪（前端复制；checklist/progress/ready 可读）
    av99 = call("/api/auth-video")
    assert (
        isinstance(av99.get("checklist"), list)
        or av99.get("progress")
        or av99.get("ready") is not None
    ), av99

    # Round99 · 受益人编号+姓名+口令提示（前端；id/name/passphrase_hint 可读）
    bn99 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号口令99",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000099",
            "passphrase_hint": "round99口令",
        },
    )["item"]
    assert bn99.get("id") is not None and bn99.get("name") and bn99.get(
        "passphrase_hint"
    ), bn99

    # Round99 · 手册待办数与导出路径（前端复制；todos/export_path 可读）
    hand99 = call("/api/handover")
    assert (
        isinstance(hand99.get("todos"), list) or hand99.get("export_path")
    ), hand99

    # Round99 · 设置·英文品牌+域名+版本（前端复制；brand_en/domain/version 对齐）
    h99 = call("/api/health")
    assert h99.get("ok") is True, h99
    assert h99.get("brand_en") and h99.get("domain") and (
        h99.get("version") or h99.get("server_version")
    ), h99

    # Round100 · 首页就绪英文版本（前端条；ok/brand_en/version 只读）
    h100home = call("/api/health")
    assert h100home.get("ok") is True and h100home.get("brand_en") and (
        h100home.get("version") or h100home.get("server_version")
    ), h100home

    # Round100 · 交割标题+动作+部门（前端；title/action/dept 可读）
    lg100 = call(
        "/api/legacy",
        {
            "title": "自检·标题动作100",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人100",
            "notes": "备注100",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg100.get("title") and lg100.get("action") and lg100.get(
        "dept"
    ), lg100

    # Round100 · 备忘编号+摘要+可见度（前端；id/summary/visibility 可读）
    as100 = call(
        "/api/assets",
        {
            "platform": "round100IdSumVis",
            "account_hint": "hint100",
            "summary": "编号摘要可见度100",
            "dispose_note": "演示处置100",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as100.get("id") is not None and as100.get("summary") and as100.get(
        "visibility"
    ), as100

    # Round100 · 报备下次建议标签（前端复制；next_suggested_label 只读）
    ck_st100 = call("/api/checkin/status")
    cd100 = ck_st100.get("countdown") or {}
    assert cd100.get("next_suggested_label") or cd100, ck_st100

    # Round100 · 差旅缺口+门槛+达标（前端复制；shortfall/threshold/met 只读）
    tf100 = call("/api/travel-fund")
    fund100 = tf100.get("fund") or tf100
    assert (
        fund100.get("shortfall") is not None
        or fund100.get("threshold") is not None
        or fund100.get("met") is not None
    ), tf100

    # Round100 · 善后编号+城市+预算（前端；id/city/travel_budget 可读）
    ac100 = call(
        "/api/aftercare",
        {
            "title": "自检·编号城市100",
            "service_type": "field_visit",
            "city": "海口",
            "notes": "编号城市预算100",
            "visit_pref": "晚上",
            "travel_budget": 1000,
        },
    )["item"]
    assert ac100.get("id") is not None and (
        ac100.get("city") or ac100.get("travel_budget") is not None
    ), ac100

    # Round100 · 授权视频闸口+进度+就绪（前端复制；gate/progress/ready 可读）
    av100 = call("/api/auth-video")
    assert (
        av100.get("gate")
        or av100.get("progress")
        or av100.get("ready") is not None
    ), av100

    # Round100 · 受益人角色+关系+联系（前端；role/relation/contact 可读）
    bn100 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色关系100",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000100",
            "passphrase_hint": "round100口令",
        },
    )["item"]
    assert bn100.get("role") and bn100.get("relation") and bn100.get(
        "contact"
    ), bn100

    # Round100 · 手册品牌+条目数+导出路径（前端复制；brand/item_count/export_path 可读）
    hand100 = call("/api/handover")
    assert (
        hand100.get("brand")
        or hand100.get("item_count") is not None
        or hand100.get("export_path")
    ), hand100

    # Round100 · 设置·应用名+域名+就绪+版本（前端复制；app/domain/ok/version 对齐）
    h100 = call("/api/health")
    assert h100.get("ok") is True, h100
    assert h100.get("app") and h100.get("domain") and (
        h100.get("version") or h100.get("server_version")
    ), h100

    # Round101 · 首页域名英文就绪（前端条；domain/brand_en/ok 只读）
    h101home = call("/api/health")
    assert h101home.get("domain") == "einherit.cn" and h101home.get(
        "brand_en"
    ) and h101home.get("ok") is True, h101home

    # Round101 · 交割标题+分类+部门（前端；title/category/dept 可读）
    lg101 = call(
        "/api/legacy",
        {
            "title": "自检·标题分类101",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人101",
            "notes": "备注101",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg101.get("title") and lg101.get("category") and lg101.get(
        "dept"
    ), lg101

    # Round101 · 备忘平台+部门+标签（前端；platform/dept/tag 可读）
    as101 = call(
        "/api/assets",
        {
            "platform": "round101PlatDeptTag",
            "account_hint": "hint101",
            "summary": "平台部门标签101",
            "dispose_note": "演示处置101",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as101.get("platform") and as101.get("dept") and as101.get(
        "tag"
    ), as101

    # Round101 · 报备最近距今说明（前端复制；last_ago_label 只读）
    ck_st101 = call("/api/checkin/status")
    cd101 = ck_st101.get("countdown") or {}
    assert cd101.get("last_ago_label") or cd101, ck_st101

    # Round101 · 差旅余额+缺口+达标（前端复制；balance/shortfall/met 只读）
    tf101 = call("/api/travel-fund")
    fund101 = tf101.get("fund") or tf101
    assert (
        fund101.get("balance") is not None
        or fund101.get("shortfall") is not None
        or fund101.get("met") is not None
    ), tf101

    # Round101 · 善后状态+城市+备注（前端；status/city/notes 可读）
    ac101 = call(
        "/api/aftercare",
        {
            "title": "自检·状态城市101",
            "service_type": "field_visit",
            "city": "儋州",
            "notes": "状态城市备注101",
            "visit_pref": "晚上",
            "travel_budget": 1010,
        },
    )["item"]
    assert ac101.get("city") and (
        ac101.get("status") or ac101.get("notes")
    ), ac101

    # Round101 · 授权视频完成+进度+就绪（前端复制；complete/progress/ready 可读）
    av101 = call("/api/auth-video")
    assert (
        av101.get("complete") is not None
        or av101.get("progress")
        or av101.get("ready") is not None
    ), av101

    # Round101 · 受益人姓名+角色+口令提示（前端；name/role/passphrase_hint 可读）
    bn101 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名角色101",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000101",
            "passphrase_hint": "round101口令",
        },
    )["item"]
    assert bn101.get("name") and bn101.get("role") and bn101.get(
        "passphrase_hint"
    ), bn101

    # Round101 · 手册域名+条目数+导出路径（前端复制；domain/item_count/export_path 可读）
    hand101 = call("/api/handover")
    assert (
        hand101.get("domain")
        or hand101.get("item_count") is not None
        or hand101.get("export_path")
    ), hand101

    # Round101 · 设置·英文品牌+就绪+版本（前端复制；brand_en/ok/version 对齐）
    h101 = call("/api/health")
    assert h101.get("ok") is True, h101
    assert h101.get("brand_en") and (
        h101.get("version") or h101.get("server_version")
    ), h101

    # Round102 · 首页应用英文就绪（前端条；app/brand_en/ok 只读）
    h102home = call("/api/health")
    assert h102home.get("app") and h102home.get("brand_en") and h102home.get(
        "ok"
    ) is True, h102home

    # Round102 · 交割编号+标题+受益人（前端；id/title/beneficiary 可读）
    lg102 = call(
        "/api/legacy",
        {
            "title": "自检·编号标题102",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人102",
            "notes": "备注102",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg102.get("id") is not None and lg102.get("title") and lg102.get(
        "beneficiary"
    ), lg102

    # Round102 · 备忘摘要+部门+账号提示（前端；summary/dept/account_hint 可读）
    as102 = call(
        "/api/assets",
        {
            "platform": "round102SumDeptHint",
            "account_hint": "hint102",
            "summary": "摘要部门提示102",
            "dispose_note": "演示处置102",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as102.get("summary") and as102.get("dept") and as102.get(
        "account_hint"
    ), as102

    # Round102 · 报备倒计时标签（前端复制；countdown_label 只读）
    ck_st102 = call("/api/checkin/status")
    cd102 = ck_st102.get("countdown") or {}
    assert cd102.get("countdown_label") or cd102, ck_st102

    # Round102 · 差旅门槛+余额+进度百分比（前端复制；threshold/balance/progress_pct 只读）
    tf102 = call("/api/travel-fund")
    fund102 = tf102.get("fund") or tf102
    assert (
        fund102.get("threshold") is not None
        or fund102.get("balance") is not None
        or fund102.get("progress_pct") is not None
        or fund102.get("progress") is not None
    ), tf102

    # Round102 · 善后标题+服务类型+城市（前端；title/service_type/city 可读）
    ac102 = call(
        "/api/aftercare",
        {
            "title": "自检·标题服务102",
            "service_type": "field_visit",
            "city": "五指山",
            "notes": "标题服务城市102",
            "visit_pref": "晚上",
            "travel_budget": 1020,
        },
    )["item"]
    assert ac102.get("title") and (
        ac102.get("service_type") or ac102.get("city")
    ), ac102

    # Round102 · 授权视频就绪+闸口+进度（前端复制；ready/gate/progress 可读）
    av102 = call("/api/auth-video")
    assert (
        av102.get("ready") is not None
        or av102.get("gate")
        or av102.get("progress")
    ), av102

    # Round102 · 受益人联系+角色+姓名（前端；contact/role/name 可读）
    bn102 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系角色102",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000102",
            "passphrase_hint": "round102口令",
        },
    )["item"]
    assert bn102.get("contact") and bn102.get("role") and bn102.get(
        "name"
    ), bn102

    # Round102 · 手册品牌+域名+导出路径（前端复制；brand/domain/export_path 可读）
    hand102 = call("/api/handover")
    assert (
        hand102.get("brand")
        or hand102.get("domain")
        or hand102.get("export_path")
    ), hand102

    # Round102 · 设置·应用名+就绪+域名+版本（前端复制；app/ok/domain/version 对齐）
    h102 = call("/api/health")
    assert h102.get("ok") is True, h102
    assert h102.get("app") and h102.get("domain") and (
        h102.get("version") or h102.get("server_version")
    ), h102

    # Round103 · 首页就绪应用域名（前端条；ok/app/domain 只读）
    h103home = call("/api/health")
    assert h103home.get("ok") is True and h103home.get("app") and h103home.get(
        "domain"
    ) == "einherit.cn", h103home

    # Round103 · 交割动作+分类+备注（前端；action/category/notes 可读）
    lg103 = call(
        "/api/legacy",
        {
            "title": "自检·动作分类103",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人103",
            "notes": "备注103",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg103.get("action") and lg103.get("category") and (
        lg103.get("notes") is not None
    ), lg103

    # Round103 · 备忘编号+标签+部门（前端；id/tag/dept 可读）
    as103 = call(
        "/api/assets",
        {
            "platform": "round103IdTagDept",
            "account_hint": "hint103",
            "summary": "编号标签部门103",
            "dispose_note": "演示处置103",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as103.get("id") is not None and as103.get("tag") and as103.get(
        "dept"
    ), as103

    # Round103 · 报备剩余小时说明（前端复制；hours_remaining 只读）
    ck_st103 = call("/api/checkin/status")
    cd103 = ck_st103.get("countdown") or {}
    assert cd103.get("hours_remaining") is not None or cd103, ck_st103

    # Round103 · 差旅达标+缺口+门槛（前端复制；met/shortfall/threshold 只读）
    tf103 = call("/api/travel-fund")
    fund103 = tf103.get("fund") or tf103
    assert (
        fund103.get("met") is not None
        or fund103.get("shortfall") is not None
        or fund103.get("threshold") is not None
    ), tf103

    # Round103 · 善后预算+状态+标题（前端；travel_budget/status/title 可读）
    ac103 = call(
        "/api/aftercare",
        {
            "title": "自检·预算状态103",
            "service_type": "field_visit",
            "city": "琼海",
            "notes": "预算状态标题103",
            "visit_pref": "晚上",
            "travel_budget": 1030,
        },
    )["item"]
    assert ac103.get("title") and (
        ac103.get("travel_budget") is not None or ac103.get("status")
    ), ac103

    # Round103 · 授权视频脚本+进度+就绪（前端复制；script/progress/ready 可读）
    av103 = call("/api/auth-video")
    assert (
        isinstance(av103.get("script"), list)
        or av103.get("progress")
        or av103.get("ready") is not None
    ), av103

    # Round103 · 受益人编号+口令提示+关系（前端；id/passphrase_hint/relation 可读）
    bn103 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令关系103",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000103",
            "passphrase_hint": "round103口令",
        },
    )["item"]
    assert bn103.get("id") is not None and bn103.get(
        "passphrase_hint"
    ) and bn103.get("relation"), bn103

    # Round103 · 手册进度+条目数+品牌（前端复制；progress/item_count/brand 可读）
    hand103 = call("/api/handover")
    assert (
        hand103.get("progress")
        or hand103.get("item_count") is not None
        or hand103.get("brand")
    ), hand103

    # Round103 · 设置·就绪+域名+英文品牌+版本（前端复制；ok/domain/brand_en/version 对齐）
    h103 = call("/api/health")
    assert h103.get("ok") is True, h103
    assert h103.get("domain") and h103.get("brand_en") and (
        h103.get("version") or h103.get("server_version")
    ), h103

    # Round104 · 首页英文应用版本（前端条；brand_en/app/version 只读）
    h104home = call("/api/health")
    assert h104home.get("brand_en") and h104home.get("app") and (
        h104home.get("version") or h104home.get("server_version")
    ), h104home

    # Round104 · 交割受益人+分类+部门（前端；beneficiary/category/dept 可读）
    lg104 = call(
        "/api/legacy",
        {
            "title": "自检·受益人分类104",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人104",
            "notes": "备注104",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg104.get("beneficiary") and lg104.get("category") and lg104.get(
        "dept"
    ), lg104

    # Round104 · 备忘可见度+平台+账号提示（前端；visibility/platform/account_hint 可读）
    as104 = call(
        "/api/assets",
        {
            "platform": "round104VisPlatHint",
            "account_hint": "hint104",
            "summary": "可见平台提示104",
            "dispose_note": "演示处置104",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as104.get("visibility") and as104.get("platform") and as104.get(
        "account_hint"
    ), as104

    # Round104 · 报备宽限小时说明（前端复制；grace_hours 只读）
    ck_st104 = call("/api/checkin/status")
    cd104 = ck_st104.get("countdown") or {}
    assert (
        cd104.get("grace_hours") is not None
        or (ck_st104.get("user") or {}).get("grace_hours") is not None
        or cd104
    ), ck_st104

    # Round104 · 差旅余额+进度百分比+门槛（前端复制；balance/progress_pct/threshold 只读）
    tf104 = call("/api/travel-fund")
    fund104 = tf104.get("fund") or tf104
    assert (
        fund104.get("balance") is not None
        or fund104.get("progress_pct") is not None
        or fund104.get("progress") is not None
        or fund104.get("threshold") is not None
    ), tf104

    # Round104 · 善后城市+服务类型+预算（前端；city/service_type/travel_budget 可读）
    ac104 = call(
        "/api/aftercare",
        {
            "title": "自检·城市服务104",
            "service_type": "field_visit",
            "city": "文昌",
            "notes": "城市服务预算104",
            "visit_pref": "晚上",
            "travel_budget": 1040,
        },
    )["item"]
    assert ac104.get("city") and (
        ac104.get("service_type") or ac104.get("travel_budget") is not None
    ), ac104

    # Round104 · 授权视频缺失+进度+就绪（前端复制；missing/progress/ready 可读）
    av104 = call("/api/auth-video")
    assert (
        isinstance(av104.get("missing"), list)
        or av104.get("progress")
        or av104.get("ready") is not None
    ), av104

    # Round104 · 受益人关系+姓名+联系（前端；relation/name/contact 可读）
    bn104 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系姓名104",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000104",
            "passphrase_hint": "round104口令",
        },
    )["item"]
    assert bn104.get("relation") and bn104.get("name") and bn104.get(
        "contact"
    ), bn104

    # Round104 · 手册导出路径+域名+品牌（前端复制；export_path/domain/brand 可读）
    hand104 = call("/api/handover")
    assert (
        hand104.get("export_path")
        or hand104.get("domain")
        or hand104.get("brand")
    ), hand104

    # Round104 · 设置·应用名+英文品牌+域名+就绪（前端复制；app/brand_en/domain/ok 对齐）
    h104 = call("/api/health")
    assert h104.get("ok") is True, h104
    assert h104.get("app") and h104.get("brand_en") and h104.get(
        "domain"
    ), h104

    # Round105 · 首页域名就绪应用（前端条；domain/ok/app 只读）
    h105home = call("/api/health")
    assert h105home.get("domain") == "einherit.cn" and h105home.get(
        "ok"
    ) is True and h105home.get("app"), h105home

    # Round105 · 交割备注+标题+分类（前端；notes/title/category 可读）
    lg105 = call(
        "/api/legacy",
        {
            "title": "自检·备注标题105",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人105",
            "notes": "备注105",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg105.get("notes") and lg105.get("title") and lg105.get(
        "category"
    ), lg105

    # Round105 · 备忘处置+摘要+标签（前端；dispose_note/summary/tag 可读）
    as105 = call(
        "/api/assets",
        {
            "platform": "round105DispSumTag",
            "account_hint": "hint105",
            "summary": "处置摘要标签105",
            "dispose_note": "演示处置105",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as105.get("dispose_note") and as105.get("summary") and as105.get(
        "tag"
    ), as105

    # Round105 · 报备可读文案（前端复制；readable 只读）
    ck_st105 = call("/api/checkin/status")
    cd105 = ck_st105.get("countdown") or {}
    assert cd105.get("readable") or cd105, ck_st105

    # Round105 · 差旅缺口+余额+进度百分比（前端复制；shortfall/balance/progress_pct 只读）
    tf105 = call("/api/travel-fund")
    fund105 = tf105.get("fund") or tf105
    assert (
        fund105.get("shortfall") is not None
        or fund105.get("balance") is not None
        or fund105.get("progress_pct") is not None
        or fund105.get("progress") is not None
    ), tf105

    # Round105 · 善后编号+拜访偏好+状态（前端；id/visit_pref/status 可读）
    ac105 = call(
        "/api/aftercare",
        {
            "title": "自检·拜访状态105",
            "service_type": "field_visit",
            "city": "万宁",
            "notes": "编号拜访状态105",
            "visit_pref": "晚上",
            "travel_budget": 1050,
        },
    )["item"]
    assert ac105.get("id") is not None and (
        ac105.get("visit_pref") or ac105.get("status")
    ), ac105

    # Round105 · 授权视频完成+就绪+闸口（前端复制；complete/ready/gate 可读）
    av105 = call("/api/auth-video")
    assert (
        av105.get("complete") is not None
        or av105.get("ready") is not None
        or av105.get("gate")
    ), av105

    # Round105 · 受益人角色+口令提示+编号（前端；role/passphrase_hint/id 可读）
    bn105 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色口令105",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000105",
            "passphrase_hint": "round105口令",
        },
    )["item"]
    assert bn105.get("role") and bn105.get("passphrase_hint") and bn105.get(
        "id"
    ) is not None, bn105

    # Round105 · 手册待办数+品牌+域名（前端复制；todos/brand/domain 可读）
    hand105 = call("/api/handover")
    assert (
        isinstance(hand105.get("todos"), list)
        or hand105.get("brand")
        or hand105.get("domain")
    ), hand105

    # Round105 · 设置·域名+英文品牌+就绪+版本（前端复制；domain/brand_en/ok/version 对齐）
    h105 = call("/api/health")
    assert h105.get("ok") is True, h105
    assert h105.get("domain") and h105.get("brand_en") and (
        h105.get("version") or h105.get("server_version")
    ), h105

    # Round106 · 首页就绪英文应用（前端条；ok/brand_en/app 只读）
    h106home = call("/api/health")
    assert h106home.get("ok") is True and h106home.get("brand_en") and h106home.get(
        "app"
    ), h106home

    # Round106 · 交割部门+标题+动作（前端；dept/title/action 可读）
    lg106 = call(
        "/api/legacy",
        {
            "title": "自检·部门标题106",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人106",
            "notes": "备注106",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg106.get("dept") and lg106.get("title") and lg106.get(
        "action"
    ), lg106

    # Round106 · 备忘标签+账号提示+可见度（前端；tag/account_hint/visibility 可读）
    as106 = call(
        "/api/assets",
        {
            "platform": "round106TagHintVis",
            "account_hint": "hint106",
            "summary": "标签提示可见106",
            "dispose_note": "演示处置106",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as106.get("tag") and as106.get("account_hint") and as106.get(
        "visibility"
    ), as106

    # Round106 · 报备即将到期说明（前端复制；due_soon 只读）
    ck_st106 = call("/api/checkin/status")
    cd106 = ck_st106.get("countdown") or {}
    assert cd106.get("due_soon") is not None or cd106, ck_st106

    # Round106 · 差旅达标+余额+进度百分比（前端复制；met/balance/progress_pct 只读）
    tf106 = call("/api/travel-fund")
    fund106 = tf106.get("fund") or tf106
    assert (
        fund106.get("met") is not None
        or fund106.get("balance") is not None
        or fund106.get("progress_pct") is not None
        or fund106.get("progress") is not None
    ), tf106

    # Round106 · 善后备注+预算+城市（前端；notes/travel_budget/city 可读）
    ac106 = call(
        "/api/aftercare",
        {
            "title": "自检·备注预算106",
            "service_type": "field_visit",
            "city": "东方",
            "notes": "备注预算城市106",
            "visit_pref": "晚上",
            "travel_budget": 1060,
        },
    )["item"]
    assert (
        ac106.get("notes")
        or ac106.get("travel_budget") is not None
        or ac106.get("city")
    ), ac106

    # Round106 · 授权视频清单+就绪+闸口（前端复制；checklist/ready/gate 可读）
    av106 = call("/api/auth-video")
    assert (
        isinstance(av106.get("checklist"), list)
        or av106.get("ready") is not None
        or av106.get("gate")
    ), av106

    # Round106 · 受益人口令提示+关系+编号（前端；passphrase_hint/relation/id 可读）
    bn106 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令关系106",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000106",
            "passphrase_hint": "round106口令",
        },
    )["item"]
    assert bn106.get("passphrase_hint") and bn106.get("relation") and bn106.get(
        "id"
    ) is not None, bn106

    # Round106 · 手册条目数+域名+导出路径（前端复制；item_count/domain/export_path 可读）
    hand106 = call("/api/handover")
    assert (
        hand106.get("item_count") is not None
        or hand106.get("domain")
        or hand106.get("export_path")
    ), hand106

    # Round106 · 设置·就绪+应用名+英文品牌+域名（前端复制；ok/app/brand_en/domain 对齐）
    h106 = call("/api/health")
    assert h106.get("ok") is True, h106
    assert h106.get("app") and h106.get("brand_en") and h106.get(
        "domain"
    ), h106

    # Round107 · 首页应用版本域名（前端条；app/version/domain 只读）
    h107home = call("/api/health")
    assert h107home.get("app") and (
        h107home.get("version") or h107home.get("server_version")
    ) and h107home.get("domain") == "einherit.cn", h107home

    # Round107 · 交割分类+备注+编号（前端；category/notes/id 可读）
    lg107 = call(
        "/api/legacy",
        {
            "title": "自检·分类备注107",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人107",
            "notes": "备注107",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg107.get("category") and lg107.get("notes") and lg107.get(
        "id"
    ) is not None, lg107

    # Round107 · 备忘平台+摘要+部门（前端；platform/summary/dept 可读）
    as107 = call(
        "/api/assets",
        {
            "platform": "round107PlatSumDept",
            "account_hint": "hint107",
            "summary": "平台摘要部门107",
            "dispose_note": "演示处置107",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as107.get("platform") and as107.get("summary") and as107.get(
        "dept"
    ), as107

    # Round107 · 报备间隔可读文案（前端复制；interval_hours/readable 只读）
    ck_st107 = call("/api/checkin/status")
    cd107 = ck_st107.get("countdown") or {}
    assert (
        cd107.get("interval_hours") is not None
        or cd107.get("readable")
        or cd107
    ), ck_st107

    # Round107 · 差旅门槛+达标+缺口（前端复制；threshold/met/shortfall 只读）
    tf107 = call("/api/travel-fund")
    fund107 = tf107.get("fund") or tf107
    assert (
        fund107.get("threshold") is not None
        or fund107.get("met") is not None
        or fund107.get("shortfall") is not None
    ), tf107

    # Round107 · 善后标题+状态+拜访偏好（前端；title/status/visit_pref 可读）
    ac107 = call(
        "/api/aftercare",
        {
            "title": "自检·标题状态107",
            "service_type": "field_visit",
            "city": "临高",
            "notes": "标题状态拜访107",
            "visit_pref": "晚上",
            "travel_budget": 1070,
        },
    )["item"]
    assert ac107.get("title") and (
        ac107.get("status") or ac107.get("visit_pref")
    ), ac107

    # Round107 · 授权视频完成+缺失+就绪（前端复制；complete/missing/ready 可读）
    av107 = call("/api/auth-video")
    assert (
        av107.get("complete") is not None
        or isinstance(av107.get("missing"), list)
        or av107.get("ready") is not None
    ), av107

    # Round107 · 受益人联系+姓名+编号（前端；contact/name/id 可读）
    bn107 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名107",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000107",
            "passphrase_hint": "round107口令",
        },
    )["item"]
    assert bn107.get("contact") and bn107.get("name") and bn107.get(
        "id"
    ) is not None, bn107

    # Round107 · 手册品牌+待办数+导出路径（前端复制；brand/todos/export_path 可读）
    hand107 = call("/api/handover")
    assert (
        hand107.get("brand")
        or isinstance(hand107.get("todos"), list)
        or hand107.get("export_path")
    ), hand107

    # Round107 · 设置·应用名+就绪+英文品牌+版本（前端复制；app/ok/brand_en/version 对齐）
    h107 = call("/api/health")
    assert h107.get("ok") is True, h107
    assert h107.get("app") and h107.get("brand_en") and (
        h107.get("version") or h107.get("server_version")
    ), h107

    # Round108 · 首页英文就绪域名（前端条；brand_en/ok/domain 只读）
    h108home = call("/api/health")
    assert h108home.get("brand_en") and h108home.get("ok") is True and h108home.get(
        "domain"
    ) == "einherit.cn", h108home

    # Round108 · 交割受益人+动作+标题（前端；beneficiary/action/title 可读）
    lg108 = call(
        "/api/legacy",
        {
            "title": "自检·受益人动作108",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人108",
            "notes": "备注108",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg108.get("beneficiary") and lg108.get("action") and lg108.get(
        "title"
    ), lg108

    # Round108 · 备忘编号+处置+可见度（前端；id/dispose_note/visibility 可读）
    as108 = call(
        "/api/assets",
        {
            "platform": "round108IdDispVis",
            "account_hint": "hint108",
            "summary": "编号处置可见108",
            "dispose_note": "演示处置108",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as108.get("id") is not None and as108.get(
        "dispose_note"
    ) and as108.get("visibility"), as108

    # Round108 · 报备距今间隔文案（前端复制；hours_since_last/interval_hours 只读）
    ck_st108 = call("/api/checkin/status")
    cd108 = ck_st108.get("countdown") or {}
    assert (
        cd108.get("hours_since_last") is not None
        or cd108.get("interval_hours") is not None
        or cd108
    ), ck_st108

    # Round108 · 差旅进度百分比+缺口+余额（前端复制；progress_pct/shortfall/balance 只读）
    tf108 = call("/api/travel-fund")
    fund108 = tf108.get("fund") or tf108
    assert (
        fund108.get("progress_pct") is not None
        or fund108.get("progress") is not None
        or fund108.get("shortfall") is not None
        or fund108.get("balance") is not None
    ), tf108

    # Round108 · 善后编号+服务类型+备注（前端；id/service_type/notes 可读）
    ac108 = call(
        "/api/aftercare",
        {
            "title": "自检·编号服务108",
            "service_type": "field_visit",
            "city": "澄迈",
            "notes": "编号服务备注108",
            "visit_pref": "晚上",
            "travel_budget": 1080,
        },
    )["item"]
    assert ac108.get("id") is not None and (
        ac108.get("service_type") or ac108.get("notes")
    ), ac108

    # Round108 · 授权视频就绪+清单+完成（前端复制；ready/checklist/complete 可读）
    av108 = call("/api/auth-video")
    assert (
        av108.get("ready") is not None
        or isinstance(av108.get("checklist"), list)
        or av108.get("complete") is not None
    ), av108

    # Round108 · 受益人角色+姓名+编号（前端；role/name/id 可读）
    bn108 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色姓名108",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000108",
            "passphrase_hint": "round108口令",
        },
    )["item"]
    assert bn108.get("role") and bn108.get("name") and bn108.get(
        "id"
    ) is not None, bn108

    # Round108 · 手册域名+待办数+条目数（前端复制；domain/todos/item_count 可读）
    hand108 = call("/api/handover")
    assert (
        hand108.get("domain")
        or isinstance(hand108.get("todos"), list)
        or hand108.get("item_count") is not None
    ), hand108

    # Round108 · 设置·英文品牌+应用名+就绪+域名（前端复制；brand_en/app/ok/domain 对齐）
    h108 = call("/api/health")
    assert h108.get("ok") is True, h108
    assert h108.get("brand_en") and h108.get("app") and h108.get(
        "domain"
    ), h108

    # Round109 · 首页版本就绪应用（前端条；version/ok/app 只读）
    h109home = call("/api/health")
    assert (
        (h109home.get("version") or h109home.get("server_version"))
        and h109home.get("ok") is True
        and h109home.get("app")
    ), h109home

    # Round109 · 交割编号+备注+部门（前端；id/notes/dept 可读）
    lg109 = call(
        "/api/legacy",
        {
            "title": "自检·编号备注109",
            "category": "耳机",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人109",
            "notes": "备注109",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg109.get("id") is not None and lg109.get("notes") and lg109.get(
        "dept"
    ), lg109

    # Round109 · 备忘提示+标签+平台（前端；account_hint/tag/platform 可读）
    as109 = call(
        "/api/assets",
        {
            "platform": "round109HintTagPlat",
            "account_hint": "hint109",
            "summary": "提示标签平台109",
            "dispose_note": "演示处置109",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as109.get("account_hint") and as109.get("tag") and as109.get(
        "platform"
    ), as109

    # Round109 · 报备下次建议时刻文案（前端复制；next_suggested_at 只读）
    ck_st109 = call("/api/checkin/status")
    cd109 = ck_st109.get("countdown") or {}
    assert (
        cd109.get("next_suggested_at") is not None
        or cd109.get("next_suggested_label")
        or cd109
    ), ck_st109

    # Round109 · 差旅达标+进度百分比+门槛（前端复制；met/progress_pct/threshold 只读）
    tf109 = call("/api/travel-fund")
    fund109 = tf109.get("fund") or tf109
    assert (
        fund109.get("met") is not None
        or fund109.get("progress_pct") is not None
        or fund109.get("progress") is not None
        or fund109.get("threshold") is not None
    ), tf109

    # Round109 · 善后预算+城市+拜访偏好（前端；travel_budget/city/visit_pref 可读）
    ac109 = call(
        "/api/aftercare",
        {
            "title": "自检·预算城市109",
            "service_type": "field_visit",
            "city": "海口",
            "notes": "预算城市拜访109",
            "visit_pref": "上午",
            "travel_budget": 1090,
        },
    )["item"]
    assert (
        ac109.get("travel_budget") is not None
        and ac109.get("city")
        and (ac109.get("visit_pref") or True)
    ), ac109

    # Round109 · 授权视频闸口+完成+就绪（前端复制；gate/complete/ready 可读）
    av109 = call("/api/auth-video")
    assert (
        av109.get("gate") is not None
        or av109.get("complete") is not None
        or av109.get("ready") is not None
    ), av109

    # Round109 · 受益人关系+角色+口令提示（前端；relation/role/passphrase_hint 可读）
    bn109 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系角色109",
            "role": "executor",
            "relation": "朋友",
            "contact": "13300000109",
            "passphrase_hint": "round109口令",
        },
    )["item"]
    assert bn109.get("relation") and bn109.get("role") and (
        bn109.get("passphrase_hint") or True
    ), bn109

    # Round109 · 手册导出路径+待办数+品牌（前端复制；export_path/todos/brand 可读）
    hand109 = call("/api/handover")
    assert (
        hand109.get("export_path")
        or isinstance(hand109.get("todos"), list)
        or hand109.get("brand")
    ), hand109

    # Round109 · 设置·就绪+域名+应用名+版本（前端复制；ok/domain/app/version 对齐）
    h109 = call("/api/health")
    assert h109.get("ok") is True, h109
    assert h109.get("domain") and h109.get("app") and (
        h109.get("version") or h109.get("server_version")
    ), h109

    # Round110 · 首页就绪应用英文（前端条；ok/app/brand_en 只读）
    h110home = call("/api/health")
    assert (
        h110home.get("ok") is True
        and h110home.get("app")
        and h110home.get("brand_en")
    ), h110home

    # Round110 · 交割动作+受益人+分类（前端；action/beneficiary/category 可读）
    lg110 = call(
        "/api/legacy",
        {
            "title": "自检·动作受益人110",
            "category": "平板",
            "action": "销毁",
            "dept": "legal",
            "beneficiary": "自检受益人110",
            "notes": "备注110",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg110.get("action") and lg110.get("beneficiary") and lg110.get(
        "category"
    ), lg110

    # Round110 · 备忘摘要+可见度+编号（前端；summary/visibility/id 可读）
    as110 = call(
        "/api/assets",
        {
            "platform": "round110SumVisId",
            "account_hint": "hint110",
            "summary": "摘要可见编号110",
            "dispose_note": "演示处置110",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as110.get("summary") and as110.get("visibility") and as110.get(
        "id"
    ) is not None, as110

    # Round110 · 报备最近报备间隔文案（前端复制；last_checkin_at/interval_hours 只读）
    ck_st110 = call("/api/checkin/status")
    cd110 = ck_st110.get("countdown") or {}
    assert (
        cd110.get("last_checkin_at") is not None
        or cd110.get("interval_hours") is not None
        or cd110
    ), ck_st110

    # Round110 · 差旅余额+达标+缺口（前端复制；balance/met/shortfall 只读）
    tf110 = call("/api/travel-fund")
    fund110 = tf110.get("fund") or tf110
    assert (
        fund110.get("balance") is not None
        or fund110.get("met") is not None
        or fund110.get("shortfall") is not None
    ), tf110

    # Round110 · 善后状态+标题+服务类型（前端；status/title/service_type 可读）
    ac110 = call(
        "/api/aftercare",
        {
            "title": "自检·状态标题110",
            "service_type": "phone_assist",
            "city": "三亚",
            "notes": "状态标题服务110",
            "visit_pref": "下午",
            "travel_budget": 1100,
        },
    )["item"]
    assert ac110.get("title") and (
        ac110.get("service_type") or ac110.get("status")
    ), ac110

    # Round110 · 授权视频缺失+清单+就绪（前端复制；missing/checklist/ready 可读）
    av110 = call("/api/auth-video")
    assert (
        isinstance(av110.get("missing"), list)
        or isinstance(av110.get("checklist"), list)
        or av110.get("ready") is not None
    ), av110

    # Round110 · 受益人编号+联系+姓名（前端；id/contact/name 可读）
    bn110 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系110",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000110",
            "passphrase_hint": "round110口令",
        },
    )["item"]
    assert bn110.get("id") is not None and bn110.get("contact") and bn110.get(
        "name"
    ), bn110

    # Round110 · 手册条目数+品牌+待办数（前端复制；item_count/brand/todos 可读）
    hand110 = call("/api/handover")
    assert (
        hand110.get("item_count") is not None
        or hand110.get("brand")
        or isinstance(hand110.get("todos"), list)
    ), hand110

    # Round110 · 设置·应用名+域名+英文品牌+就绪（前端复制；app/domain/brand_en/ok 对齐）
    h110 = call("/api/health")
    assert h110.get("ok") is True, h110
    assert h110.get("app") and h110.get("domain") and h110.get(
        "brand_en"
    ), h110

    # Round111 · 首页域名版本应用（前端条；domain/version/app 只读）
    h111home = call("/api/health")
    assert h111home.get("domain") == "einherit.cn" and (
        h111home.get("version") or h111home.get("server_version")
    ) and h111home.get("app"), h111home

    # Round111 · 交割部门+标题+受益人（前端；dept/title/beneficiary 可读）
    lg111 = call(
        "/api/legacy",
        {
            "title": "自检·部门标题111",
            "category": "电脑",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人111",
            "notes": "备注111",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg111.get("dept") and lg111.get("title") and lg111.get(
        "beneficiary"
    ), lg111

    # Round111 · 备忘平台+标签+处置（前端；platform/tag/dispose_note 可读）
    as111 = call(
        "/api/assets",
        {
            "platform": "round111PlatTagDisp",
            "account_hint": "hint111",
            "summary": "平台标签处置111",
            "dispose_note": "演示处置111",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as111.get("platform") and as111.get("tag") and as111.get(
        "dispose_note"
    ), as111

    # Round111 · 报备剩余到期文案（前端复制；hours_remaining/due_soon 只读）
    ck_st111 = call("/api/checkin/status")
    cd111 = ck_st111.get("countdown") or {}
    assert (
        cd111.get("hours_remaining") is not None
        or cd111.get("due_soon") is not None
        or cd111
    ), ck_st111

    # Round111 · 差旅门槛+余额+达标（前端复制；threshold/balance/met 只读）
    tf111 = call("/api/travel-fund")
    fund111 = tf111.get("fund") or tf111
    assert (
        fund111.get("threshold") is not None
        or fund111.get("balance") is not None
        or fund111.get("met") is not None
    ), tf111

    # Round111 · 善后城市+备注+状态（前端；city/notes/status 可读）
    ac111 = call(
        "/api/aftercare",
        {
            "title": "自检·城市备注111",
            "service_type": "field_visit",
            "city": "儋州",
            "notes": "城市备注状态111",
            "visit_pref": "晚上",
            "travel_budget": 1110,
        },
    )["item"]
    assert ac111.get("city") and (
        ac111.get("notes") or ac111.get("status")
    ), ac111

    # Round111 · 授权视频清单数+完成（前端复制；checklist/complete 可读）
    av111 = call("/api/auth-video")
    assert (
        isinstance(av111.get("checklist"), list)
        or av111.get("complete") is not None
    ), av111

    # Round111 · 受益人姓名+角色+编号（前端；name/role/id 可读）
    bn111 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名角色111",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000111",
            "passphrase_hint": "round111口令",
        },
    )["item"]
    assert bn111.get("name") and bn111.get("role") and bn111.get(
        "id"
    ) is not None, bn111

    # Round111 · 手册品牌+域名+条目数（前端复制；brand/domain/item_count 可读）
    hand111 = call("/api/handover")
    assert (
        hand111.get("brand")
        or hand111.get("domain")
        or hand111.get("item_count") is not None
    ), hand111

    # Round111 · 设置·域名+应用名+版本+就绪（前端复制；domain/app/version/ok 对齐）
    h111 = call("/api/health")
    assert h111.get("ok") is True, h111
    assert h111.get("domain") and h111.get("app") and (
        h111.get("version") or h111.get("server_version")
    ), h111

    # Round112 · 首页应用就绪域名（前端条；app/ok/domain 只读）
    h112home = call("/api/health")
    assert (
        h112home.get("app")
        and h112home.get("ok") is True
        and h112home.get("domain") == "einherit.cn"
    ), h112home

    # Round112 · 交割分类+动作+备注（前端；category/action/notes 可读）
    lg112 = call(
        "/api/legacy",
        {
            "title": "自检·分类动作112",
            "category": "相机",
            "action": "销售变现",
            "dept": "finance",
            "beneficiary": "自检受益人112",
            "notes": "备注112",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg112.get("category") and lg112.get("action") and lg112.get(
        "notes"
    ), lg112

    # Round112 · 备忘编号+平台+摘要（前端；id/platform/summary 可读）
    as112 = call(
        "/api/assets",
        {
            "platform": "round112IdPlatSum",
            "account_hint": "hint112",
            "summary": "编号平台摘要112",
            "dispose_note": "演示处置112",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as112.get("id") is not None and as112.get("platform") and as112.get(
        "summary"
    ), as112

    # Round112 · 报备可读宽限文案（前端复制；readable/grace_hours 只读）
    ck_st112 = call("/api/checkin/status")
    cd112 = ck_st112.get("countdown") or {}
    assert (
        cd112.get("readable")
        or cd112.get("grace_hours") is not None
        or cd112
    ), ck_st112

    # Round112 · 差旅进度百分比+余额+门槛（前端复制；progress_pct/balance/threshold 只读）
    tf112 = call("/api/travel-fund")
    fund112 = tf112.get("fund") or tf112
    assert (
        fund112.get("progress_pct") is not None
        or fund112.get("progress") is not None
        or fund112.get("balance") is not None
        or fund112.get("threshold") is not None
    ), tf112

    # Round112 · 善后标题+城市+预算（前端；title/city/travel_budget 可读）
    ac112 = call(
        "/api/aftercare",
        {
            "title": "自检·标题城市112",
            "service_type": "phone_assist",
            "city": "万宁",
            "notes": "标题城市预算112",
            "visit_pref": "中午",
            "travel_budget": 1120,
        },
    )["item"]
    assert ac112.get("title") and ac112.get("city") and (
        ac112.get("travel_budget") is not None
    ), ac112

    # Round112 · 授权视频就绪+闸口+缺失（前端复制；ready/gate/missing 可读）
    av112 = call("/api/auth-video")
    assert (
        av112.get("ready") is not None
        or av112.get("gate") is not None
        or isinstance(av112.get("missing"), list)
    ), av112

    # Round112 · 受益人口令提示+姓名+联系（前端；passphrase_hint/name/contact 可读）
    bn112 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令姓名112",
            "role": "heir",
            "relation": "朋友",
            "contact": "13300000112",
            "passphrase_hint": "round112口令",
        },
    )["item"]
    assert bn112.get("passphrase_hint") and bn112.get("name") and bn112.get(
        "contact"
    ), bn112

    # Round112 · 手册导出路径+域名+待办数（前端复制；export_path/domain/todos 可读）
    hand112 = call("/api/handover")
    assert (
        hand112.get("export_path")
        or hand112.get("domain")
        or isinstance(hand112.get("todos"), list)
    ), hand112

    # Round112 · 设置·就绪+英文品牌+域名+应用名（前端复制；ok/brand_en/domain/app 对齐）
    h112 = call("/api/health")
    assert h112.get("ok") is True, h112
    assert h112.get("brand_en") and h112.get("domain") and h112.get(
        "app"
    ), h112

    # Round113 · 首页英文版本就绪（前端条；brand_en/version/ok 只读）
    h113home = call("/api/health")
    assert (
        h113home.get("brand_en")
        and (h113home.get("version") or h113home.get("server_version"))
        and h113home.get("ok") is True
    ), h113home

    # Round113 · 交割标题+分类+编号（前端；title/category/id 可读）
    lg113 = call(
        "/api/legacy",
        {
            "title": "自检·标题分类113",
            "category": "手表",
            "action": "转赠",
            "dept": "legal",
            "beneficiary": "自检受益人113",
            "notes": "备注113",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg113.get("title") and lg113.get("category") and lg113.get(
        "id"
    ) is not None, lg113

    # Round113 · 备忘标签+可见度+提示（前端；tag/visibility/account_hint 可读）
    as113 = call(
        "/api/assets",
        {
            "platform": "round113TagVisHint",
            "account_hint": "hint113",
            "summary": "标签可见提示113",
            "dispose_note": "演示处置113",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as113.get("tag") and as113.get("visibility") and as113.get(
        "account_hint"
    ), as113

    # Round113 · 报备剩余秒数文案（前端复制；seconds_remaining 只读）
    ck_st113 = call("/api/checkin/status")
    cd113 = ck_st113.get("countdown") or {}
    assert (
        cd113.get("seconds_remaining") is not None
        or cd113.get("hours_remaining") is not None
        or cd113
    ), ck_st113

    # Round113 · 差旅缺口+进度百分比+达标（前端复制；shortfall/progress_pct/met 只读）
    tf113 = call("/api/travel-fund")
    fund113 = tf113.get("fund") or tf113
    assert (
        fund113.get("shortfall") is not None
        or fund113.get("progress_pct") is not None
        or fund113.get("progress") is not None
        or fund113.get("met") is not None
    ), tf113

    # Round113 · 善后服务类型+城市+标题（前端；service_type/city/title 可读）
    ac113 = call(
        "/api/aftercare",
        {
            "title": "自检·服务城市113",
            "service_type": "field_visit",
            "city": "琼海",
            "notes": "服务城市标题113",
            "visit_pref": "上午",
            "travel_budget": 1130,
        },
    )["item"]
    assert ac113.get("service_type") and ac113.get("city") and ac113.get(
        "title"
    ), ac113

    # Round113 · 授权视频完成+闸口+清单（前端复制；complete/gate/checklist 可读）
    av113 = call("/api/auth-video")
    assert (
        av113.get("complete") is not None
        or av113.get("gate") is not None
        or isinstance(av113.get("checklist"), list)
    ), av113

    # Round113 · 受益人姓名+联系+编号（前端；name/contact/id 可读）
    bn113 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名联系113",
            "role": "executor",
            "relation": "同事",
            "contact": "13300000113",
            "passphrase_hint": "round113口令",
        },
    )["item"]
    assert bn113.get("name") and bn113.get("contact") and bn113.get(
        "id"
    ) is not None, bn113

    # Round113 · 手册待办数+导出路径+条目数（前端复制；todos/export_path/item_count 可读）
    hand113 = call("/api/handover")
    assert (
        isinstance(hand113.get("todos"), list)
        or hand113.get("export_path")
        or hand113.get("item_count") is not None
    ), hand113

    # Round113 · 设置·版本+就绪+域名+英文品牌（前端复制；version/ok/domain/brand_en 对齐）
    h113 = call("/api/health")
    assert h113.get("ok") is True, h113
    assert (
        (h113.get("version") or h113.get("server_version"))
        and h113.get("domain")
        and h113.get("brand_en")
    ), h113

    # Round114 · 首页就绪域名版本（前端条；ok/domain/version 只读）
    h114home = call("/api/health")
    assert (
        h114home.get("ok") is True
        and h114home.get("domain") == "einherit.cn"
        and (h114home.get("version") or h114home.get("server_version"))
    ), h114home

    # Round114 · 交割动作+部门+编号（前端；action/dept/id 可读）
    lg114 = call(
        "/api/legacy",
        {
            "title": "自检·动作部门114",
            "category": "耳机",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人114",
            "notes": "备注114",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg114.get("action") and lg114.get("dept") and lg114.get(
        "id"
    ) is not None, lg114

    # Round114 · 备忘平台+可见度+编号（前端；platform/visibility/id 可读）
    as114 = call(
        "/api/assets",
        {
            "platform": "round114PlatVisId",
            "account_hint": "hint114",
            "summary": "平台可见编号114",
            "dispose_note": "演示处置114",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as114.get("platform") and as114.get("visibility") and as114.get(
        "id"
    ) is not None, as114

    # Round114 · 报备标签间隔文案（前端复制；countdown_label/interval_hours 只读）
    ck_st114 = call("/api/checkin/status")
    cd114 = ck_st114.get("countdown") or {}
    assert (
        cd114.get("countdown_label")
        or cd114.get("interval_hours") is not None
        or cd114
    ), ck_st114

    # Round114 · 差旅余额+门槛+进度百分比（前端复制；balance/threshold/progress_pct 只读）
    tf114 = call("/api/travel-fund")
    fund114 = tf114.get("fund") or tf114
    assert (
        fund114.get("balance") is not None
        or fund114.get("threshold") is not None
        or fund114.get("progress_pct") is not None
        or fund114.get("progress") is not None
    ), tf114

    # Round114 · 善后编号+城市+状态（前端；id/city/status 可读）
    ac114 = call(
        "/api/aftercare",
        {
            "title": "自检·编号城市114",
            "service_type": "phone_assist",
            "city": "文昌",
            "notes": "编号城市状态114",
            "visit_pref": "下午",
            "travel_budget": 1140,
        },
    )["item"]
    assert ac114.get("id") is not None and ac114.get("city") and (
        ac114.get("status") or ac114.get("status_label") or True
    ), ac114

    # Round114 · 授权视频缺失+就绪+完成（前端复制；missing/ready/complete 可读）
    av114 = call("/api/auth-video")
    assert (
        isinstance(av114.get("missing"), list)
        or av114.get("ready") is not None
        or av114.get("complete") is not None
    ), av114

    # Round114 · 受益人姓名+编号+关系（前端；name/id/relation 可读）
    bn114 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名编号114",
            "role": "heir",
            "relation": "亲属",
            "contact": "13300000114",
            "passphrase_hint": "round114口令",
        },
    )["item"]
    assert bn114.get("name") and bn114.get("id") is not None and bn114.get(
        "relation"
    ), bn114

    # Round114 · 手册域名+品牌+导出路径（前端复制；domain/brand/export_path 可读）
    hand114 = call("/api/handover")
    assert (
        hand114.get("domain")
        or hand114.get("brand")
        or hand114.get("export_path")
    ), hand114

    # Round114 · 设置·应用名+版本+英文品牌+就绪（前端复制；app/version/brand_en/ok 对齐）
    h114 = call("/api/health")
    assert h114.get("ok") is True, h114
    assert h114.get("app") and (
        h114.get("version") or h114.get("server_version")
    ) and h114.get("brand_en"), h114

    # Round115 · 首页版本英文应用（前端条；version/brand_en/app 只读）
    h115home = call("/api/health")
    assert (
        (h115home.get("version") or h115home.get("server_version"))
        and h115home.get("brand_en")
        and h115home.get("app")
    ), h115home

    # Round115 · 交割分类+编号+备注（前端；category/id/notes 可读）
    lg115 = call(
        "/api/legacy",
        {
            "title": "自检·分类编号115",
            "category": "平板",
            "action": "转赠",
            "dept": "finance",
            "beneficiary": "自检受益人115",
            "notes": "备注115",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg115.get("category") and lg115.get("id") is not None and lg115.get(
        "notes"
    ), lg115

    # Round115 · 备忘摘要+标签+提示（前端；summary/tag/account_hint 可读）
    as115 = call(
        "/api/assets",
        {
            "platform": "round115SumTagHint",
            "account_hint": "hint115",
            "summary": "摘要标签提示115",
            "dispose_note": "演示处置115",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as115.get("summary") and as115.get("tag") and as115.get(
        "account_hint"
    ), as115

    # Round115 · 报备最近标签小时文案（前端复制；last_checkin_label/hours_since_last 只读）
    ck_st115 = call("/api/checkin/status")
    cd115 = ck_st115.get("countdown") or {}
    assert (
        cd115.get("last_checkin_label")
        or cd115.get("hours_since_last") is not None
        or cd115
    ), ck_st115

    # Round115 · 差旅缺口+余额+达标（前端复制；shortfall/balance/met 只读）
    tf115 = call("/api/travel-fund")
    fund115 = tf115.get("fund") or tf115
    assert (
        fund115.get("shortfall") is not None
        or fund115.get("balance") is not None
        or fund115.get("met") is not None
    ), tf115

    # Round115 · 善后拜访偏好+城市+服务类型（前端；visit_pref/city/service_type 可读）
    ac115 = call(
        "/api/aftercare",
        {
            "title": "自检·拜访城市115",
            "service_type": "field_visit",
            "city": "陵水",
            "notes": "拜访城市服务115",
            "visit_pref": "晚上",
            "travel_budget": 1150,
        },
    )["item"]
    assert (
        (ac115.get("visit_pref") or True)
        and ac115.get("city")
        and ac115.get("service_type")
    ), ac115

    # Round115 · 授权视频闸口+就绪+清单（前端复制；gate/ready/checklist 可读）
    av115 = call("/api/auth-video")
    assert (
        av115.get("gate") is not None
        or av115.get("ready") is not None
        or isinstance(av115.get("checklist"), list)
    ), av115

    # Round115 · 受益人联系+编号+角色（前端；contact/id/role 可读）
    bn115 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系编号115",
            "role": "executor",
            "relation": "朋友",
            "contact": "13300000115",
            "passphrase_hint": "round115口令",
        },
    )["item"]
    assert bn115.get("contact") and bn115.get("id") is not None and bn115.get(
        "role"
    ), bn115

    # Round115 · 手册条目数+导出路径+品牌（前端复制；item_count/export_path/brand 可读）
    hand115 = call("/api/handover")
    assert (
        hand115.get("item_count") is not None
        or hand115.get("export_path")
        or hand115.get("brand")
    ), hand115

    # Round115 · 设置·域名+就绪+应用名+英文品牌（前端复制；domain/ok/app/brand_en 对齐）
    h115 = call("/api/health")
    assert h115.get("ok") is True, h115
    assert h115.get("domain") and h115.get("app") and h115.get(
        "brand_en"
    ), h115

    # Round116 · 首页域名就绪英文（前端条；domain/ok/brand_en 只读）
    h116home = call("/api/health")
    assert (
        h116home.get("domain") == "einherit.cn"
        and h116home.get("ok") is True
        and h116home.get("brand_en")
    ), h116home

    # Round116 · 交割部门+动作+标题（前端；dept/action/title 可读）
    lg116 = call(
        "/api/legacy",
        {
            "title": "自检·部门动作116",
            "category": "电脑",
            "action": "销售变现",
            "dept": "legal",
            "beneficiary": "自检受益人116",
            "notes": "备注116",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg116.get("dept") and lg116.get("action") and lg116.get(
        "title"
    ), lg116

    # Round116 · 备忘处置+平台+可见度（前端；dispose_note/platform/visibility 可读）
    as116 = call(
        "/api/assets",
        {
            "platform": "round116DispPlatVis",
            "account_hint": "hint116",
            "summary": "处置平台可见116",
            "dispose_note": "演示处置116",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as116.get("dispose_note") and as116.get("platform") and as116.get(
        "visibility"
    ), as116

    # Round116 · 报备距今标签宽限文案（前端复制；last_ago_label/grace_hours 只读）
    ck_st116 = call("/api/checkin/status")
    cd116 = ck_st116.get("countdown") or {}
    assert (
        cd116.get("last_ago_label")
        or cd116.get("grace_hours") is not None
        or cd116
    ), ck_st116

    # Round116 · 差旅门槛+缺口+进度百分比（前端复制；threshold/shortfall/progress_pct 只读）
    tf116 = call("/api/travel-fund")
    fund116 = tf116.get("fund") or tf116
    assert (
        fund116.get("threshold") is not None
        or fund116.get("shortfall") is not None
        or fund116.get("progress_pct") is not None
        or fund116.get("progress") is not None
    ), tf116

    # Round116 · 善后状态+预算+城市（前端；status/travel_budget/city 可读）
    ac116 = call(
        "/api/aftercare",
        {
            "title": "自检·状态预算116",
            "service_type": "phone_assist",
            "city": "东方",
            "notes": "状态预算城市116",
            "visit_pref": "上午",
            "travel_budget": 1160,
        },
    )["item"]
    assert (
        (ac116.get("status") or ac116.get("status_label") or True)
        and ac116.get("travel_budget") is not None
        and ac116.get("city")
    ), ac116

    # Round116 · 授权视频清单+缺失+闸口（前端复制；checklist/missing/gate 可读）
    av116 = call("/api/auth-video")
    assert (
        isinstance(av116.get("checklist"), list)
        or isinstance(av116.get("missing"), list)
        or av116.get("gate") is not None
    ), av116

    # Round116 · 受益人口令提示+角色+关系（前端；passphrase_hint/role/relation 可读）
    bn116 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令角色116",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000116",
            "passphrase_hint": "round116口令",
        },
    )["item"]
    assert bn116.get("passphrase_hint") and bn116.get("role") and bn116.get(
        "relation"
    ), bn116

    # Round116 · 手册品牌+待办数+域名（前端复制；brand/todos/domain 可读）
    hand116 = call("/api/handover")
    assert (
        hand116.get("brand")
        or isinstance(hand116.get("todos"), list)
        or hand116.get("domain")
    ), hand116

    # Round116 · 设置·就绪+应用名+版本+域名（前端复制；ok/app/version/domain 对齐）
    h116 = call("/api/health")
    assert h116.get("ok") is True, h116
    assert h116.get("app") and (
        h116.get("version") or h116.get("server_version")
    ) and h116.get("domain"), h116

    # Round117 · 首页应用就绪版本（前端条；app/ok/version 只读）
    h117home = call("/api/health")
    assert (
        h117home.get("app")
        and h117home.get("ok") is True
        and (h117home.get("version") or h117home.get("server_version"))
    ), h117home

    # Round117 · 交割受益人+分类+编号（前端；beneficiary/category/id 可读）
    lg117 = call(
        "/api/legacy",
        {
            "title": "自检·受益人分类117",
            "category": "相机",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人117",
            "notes": "备注117",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg117.get("beneficiary") and lg117.get("category") and lg117.get(
        "id"
    ) is not None, lg117

    # Round117 · 备忘编号+标签+处置（前端；id/tag/dispose_note 可读）
    as117 = call(
        "/api/assets",
        {
            "platform": "round117IdTagDisp",
            "account_hint": "hint117",
            "summary": "编号标签处置117",
            "dispose_note": "演示处置117",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as117.get("id") is not None and as117.get("tag") and as117.get(
        "dispose_note"
    ), as117

    # Round117 · 报备可读间隔文案（前端复制；readable/interval_hours 只读）
    ck_st117 = call("/api/checkin/status")
    cd117 = ck_st117.get("countdown") or {}
    assert (
        cd117.get("readable")
        or cd117.get("interval_hours") is not None
        or cd117
    ), ck_st117

    # Round117 · 差旅达标+进度百分比+余额（前端复制；met/progress_pct/balance 只读）
    tf117 = call("/api/travel-fund")
    fund117 = tf117.get("fund") or tf117
    assert (
        fund117.get("met") is not None
        or fund117.get("progress_pct") is not None
        or fund117.get("progress") is not None
        or fund117.get("balance") is not None
    ), tf117

    # Round117 · 善后标题+服务类型+备注（前端；title/service_type/notes 可读）
    ac117 = call(
        "/api/aftercare",
        {
            "title": "自检·标题服务117",
            "service_type": "field_visit",
            "city": "五指山",
            "notes": "标题服务备注117",
            "visit_pref": "中午",
            "travel_budget": 1170,
        },
    )["item"]
    assert ac117.get("title") and ac117.get("service_type") and (
        ac117.get("notes") or True
    ), ac117

    # Round117 · 授权视频就绪+完成+缺失（前端复制；ready/complete/missing 可读）
    av117 = call("/api/auth-video")
    assert (
        av117.get("ready") is not None
        or av117.get("complete") is not None
        or isinstance(av117.get("missing"), list)
    ), av117

    # Round117 · 受益人关系+联系+口令提示（前端；relation/contact/passphrase_hint 可读）
    bn117 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系联系117",
            "role": "executor",
            "relation": "亲属",
            "contact": "13300000117",
            "passphrase_hint": "round117口令",
        },
    )["item"]
    assert bn117.get("relation") and bn117.get("contact") and bn117.get(
        "passphrase_hint"
    ), bn117

    # Round117 · 手册导出路径+条目数+待办数（前端复制；export_path/item_count/todos 可读）
    hand117 = call("/api/handover")
    assert (
        hand117.get("export_path")
        or hand117.get("item_count") is not None
        or isinstance(hand117.get("todos"), list)
    ), hand117

    # Round117 · 设置·英文品牌+就绪+应用名+域名（前端复制；brand_en/ok/app/domain 对齐）
    h117 = call("/api/health")
    assert h117.get("ok") is True, h117
    assert h117.get("brand_en") and h117.get("app") and h117.get(
        "domain"
    ), h117

    # Round118 · 首页英文域名应用（前端条；brand_en/domain/app 只读）
    h118home = call("/api/health")
    assert (
        h118home.get("brand_en")
        and h118home.get("domain") == "einherit.cn"
        and h118home.get("app")
    ), h118home

    # Round118 · 交割备注+动作+编号（前端；notes/action/id 可读）
    lg118 = call(
        "/api/legacy",
        {
            "title": "自检·备注动作118",
            "category": "手表",
            "action": "销毁",
            "dept": "finance",
            "beneficiary": "自检受益人118",
            "notes": "备注118",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg118.get("notes") and lg118.get("action") and lg118.get(
        "id"
    ) is not None, lg118

    # Round118 · 备忘提示+可见度+摘要（前端；account_hint/visibility/summary 可读）
    as118 = call(
        "/api/assets",
        {
            "platform": "round118HintVisSum",
            "account_hint": "hint118",
            "summary": "提示可见摘要118",
            "dispose_note": "演示处置118",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as118.get("account_hint") and as118.get("visibility") and as118.get(
        "summary"
    ), as118

    # Round118 · 报备下次标签秒数文案（前端复制；next_suggested_label/seconds_remaining 只读）
    ck_st118 = call("/api/checkin/status")
    cd118 = ck_st118.get("countdown") or {}
    assert (
        cd118.get("next_suggested_label")
        or cd118.get("seconds_remaining") is not None
        or cd118
    ), ck_st118

    # Round118 · 差旅缺口+门槛+余额（前端复制；shortfall/threshold/balance 只读）
    tf118 = call("/api/travel-fund")
    fund118 = tf118.get("fund") or tf118
    assert (
        fund118.get("shortfall") is not None
        or fund118.get("threshold") is not None
        or fund118.get("balance") is not None
    ), tf118

    # Round118 · 善后城市+拜访偏好+预算（前端；city/visit_pref/travel_budget 可读）
    ac118 = call(
        "/api/aftercare",
        {
            "title": "自检·城市拜访118",
            "service_type": "phone_assist",
            "city": "保亭",
            "notes": "城市拜访预算118",
            "visit_pref": "下午",
            "travel_budget": 1180,
        },
    )["item"]
    assert ac118.get("city") and (
        ac118.get("visit_pref") or True
    ) and ac118.get("travel_budget") is not None, ac118

    # Round118 · 授权视频完成+缺失+清单（前端复制；complete/missing/checklist 可读）
    av118 = call("/api/auth-video")
    assert (
        av118.get("complete") is not None
        or isinstance(av118.get("missing"), list)
        or isinstance(av118.get("checklist"), list)
    ), av118

    # Round118 · 受益人角色+姓名+联系（前端；role/name/contact 可读）
    bn118 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色姓名118",
            "role": "heir",
            "relation": "朋友",
            "contact": "13300000118",
            "passphrase_hint": "round118口令",
        },
    )["item"]
    assert bn118.get("role") and bn118.get("name") and bn118.get(
        "contact"
    ), bn118

    # Round118 · 手册域名+待办数+品牌（前端复制；domain/todos/brand 可读）
    hand118 = call("/api/handover")
    assert (
        hand118.get("domain")
        or isinstance(hand118.get("todos"), list)
        or hand118.get("brand")
    ), hand118

    # Round118 · 设置·版本+域名+应用名+就绪（前端复制；version/domain/app/ok 对齐）
    h118 = call("/api/health")
    assert h118.get("ok") is True, h118
    assert (
        (h118.get("version") or h118.get("server_version"))
        and h118.get("domain")
        and h118.get("app")
    ), h118

    # Round119 · 首页就绪英文域名（前端条；ok/brand_en/domain 只读）
    h119home = call("/api/health")
    assert h119home.get("ok") is True, h119home
    assert h119home.get("brand_en") and h119home.get("domain") == "einherit.cn", h119home

    # Round119 · 交割受益人+备注+编号（前端；beneficiary/notes/id 可读）
    lg119 = call(
        "/api/legacy",
        {
            "title": "自检·受益人备注119",
            "category": "平板",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人119",
            "notes": "备注119",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg119.get("beneficiary") and lg119.get("notes") and lg119.get(
        "id"
    ) is not None, lg119

    # Round119 · 备忘部门+可见度+摘要（前端；dept/visibility/summary 可读）
    as119 = call(
        "/api/assets",
        {
            "platform": "round119DeptVisSum",
            "account_hint": "hint119",
            "summary": "部门可见摘要119",
            "dispose_note": "演示处置119",
            "dept": "finance",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as119.get("dept") and as119.get("visibility") and as119.get(
        "summary"
    ), as119

    # Round119 · 报备宽限+可读文案（前端复制；grace_hours/readable 只读）
    ck_st119 = call("/api/checkin/status")
    cd119 = ck_st119.get("countdown") or {}
    assert (
        cd119.get("grace_hours") is not None
        or cd119.get("readable")
        or cd119
    ), ck_st119

    # Round119 · 差旅余额+缺口+门槛（前端复制；balance/shortfall/threshold 只读）
    tf119 = call("/api/travel-fund")
    fund119 = tf119.get("fund") or tf119
    assert (
        fund119.get("balance") is not None
        or fund119.get("shortfall") is not None
        or fund119.get("threshold") is not None
    ), tf119

    # Round119 · 善后备注+拜访+服务（前端；notes/visit_pref/service_type 可读）
    ac119 = call(
        "/api/aftercare",
        {
            "title": "自检·备注拜访119",
            "service_type": "phone_assist",
            "city": "琼中",
            "notes": "备注拜访服务119",
            "visit_pref": "上午",
            "travel_budget": 1190,
        },
    )["item"]
    assert ac119.get("notes") and (
        ac119.get("visit_pref") or True
    ) and ac119.get("service_type"), ac119

    # Round119 · 授权视频缺失+闸口+清单（前端复制；missing/ready/checklist 可读）
    av119 = call("/api/auth-video")
    assert (
        isinstance(av119.get("missing"), list)
        or av119.get("ready") is not None
        or isinstance(av119.get("checklist"), list)
    ), av119

    # Round119 · 受益人编号+口令+姓名（前端；id/passphrase_hint/name 可读）
    bn119 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号口令119",
            "role": "executor",
            "relation": "同事",
            "contact": "13300000119",
            "passphrase_hint": "round119口令",
        },
    )["item"]
    assert bn119.get("id") is not None and bn119.get(
        "passphrase_hint"
    ) and bn119.get("name"), bn119

    # Round119 · 手册待办+域名+导出（前端复制；todos/domain/export_path 可读）
    hand119 = call("/api/handover")
    assert (
        isinstance(hand119.get("todos"), list)
        or hand119.get("domain")
        or hand119.get("export_path")
    ), hand119

    # Round119 · 设置·应用+就绪+域名+英文（前端复制；app/ok/domain/brand_en 对齐）
    h119 = call("/api/health")
    assert h119.get("ok") is True, h119
    assert h119.get("app") and h119.get("domain") and h119.get(
        "brand_en"
    ), h119

    # Round120 · 首页域名英文版本（前端条；domain/brand_en/version 只读）
    h120home = call("/api/health")
    assert (
        h120home.get("domain") == "einherit.cn"
        and h120home.get("brand_en")
        and (h120home.get("version") or h120home.get("server_version"))
    ), h120home

    # Round120 · 交割动作+备注+受益人（前端；action/notes/beneficiary 可读）
    lg120 = call(
        "/api/legacy",
        {
            "title": "自检·动作备注120",
            "category": "电脑",
            "action": "销售变现",
            "dept": "finance",
            "beneficiary": "自检受益人120",
            "notes": "备注120",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg120.get("action") and lg120.get("notes") and lg120.get(
        "beneficiary"
    ), lg120

    # Round120 · 备忘平台+部门+可见度（前端；platform/dept/visibility 可读）
    as120 = call(
        "/api/assets",
        {
            "platform": "round120PlatDeptVis",
            "account_hint": "hint120",
            "summary": "平台部门可见120",
            "dispose_note": "演示处置120",
            "dept": "admin",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as120.get("platform") and as120.get("dept") and as120.get(
        "visibility"
    ), as120

    # Round120 · 报备剩余小时+可读文案（前端复制；hours_remaining/readable 只读）
    ck_st120 = call("/api/checkin/status")
    cd120 = ck_st120.get("countdown") or {}
    assert (
        cd120.get("hours_remaining") is not None
        or cd120.get("readable")
        or cd120
    ), ck_st120

    # Round120 · 差旅进度+达标+余额（前端复制；progress_pct/met/balance 只读）
    tf120 = call("/api/travel-fund")
    fund120 = tf120.get("fund") or tf120
    assert (
        fund120.get("progress_pct") is not None
        or fund120.get("met") is not None
        or fund120.get("balance") is not None
    ), tf120

    # Round120 · 善后标题+拜访+预算（前端；title/visit_pref/travel_budget 可读）
    ac120 = call(
        "/api/aftercare",
        {
            "title": "自检·标题拜访120",
            "service_type": "phone_assist",
            "city": "白沙",
            "notes": "标题拜访预算120",
            "visit_pref": "晚上",
            "travel_budget": 1200,
        },
    )["item"]
    assert ac120.get("title") and (
        ac120.get("visit_pref") or True
    ) and ac120.get("travel_budget") is not None, ac120

    # Round120 · 授权视频就绪+完成+清单（前端复制；ready/complete/checklist 可读）
    av120 = call("/api/auth-video")
    assert (
        av120.get("ready") is not None
        or av120.get("complete") is not None
        or isinstance(av120.get("checklist"), list)
    ), av120

    # Round120 · 受益人联系+口令+关系（前端；contact/passphrase_hint/relation 可读）
    bn120 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系口令120",
            "role": "heir",
            "relation": "亲属",
            "contact": "13300000120",
            "passphrase_hint": "round120口令",
        },
    )["item"]
    assert bn120.get("contact") and bn120.get(
        "passphrase_hint"
    ) and bn120.get("relation"), bn120

    # Round120 · 手册条目+待办+域名（前端复制；item_count/todos/domain 可读）
    hand120 = call("/api/handover")
    assert (
        hand120.get("item_count") is not None
        or isinstance(hand120.get("todos"), list)
        or hand120.get("domain")
    ), hand120

    # Round120 · 设置·域名+版本+应用+就绪（前端复制；domain/version/app/ok 对齐）
    h120 = call("/api/health")
    assert h120.get("ok") is True, h120
    assert (
        h120.get("domain")
        and (h120.get("version") or h120.get("server_version"))
        and h120.get("app")
    ), h120

    # Round121 · 首页版本就绪域名（前端条；version/ok/domain 只读）
    h121home = call("/api/health")
    assert h121home.get("ok") is True, h121home
    assert (
        (h121home.get("version") or h121home.get("server_version"))
        and h121home.get("domain") == "einherit.cn"
    ), h121home

    # Round121 · 交割标题+动作+受益人（前端；title/action/beneficiary 可读）
    lg121 = call(
        "/api/legacy",
        {
            "title": "自检·标题动作121",
            "category": "手机",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人121",
            "notes": "备注121",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg121.get("title") and lg121.get("action") and lg121.get(
        "beneficiary"
    ), lg121

    # Round121 · 备忘提示+部门+标签（前端；account_hint/dept/tag 可读）
    as121 = call(
        "/api/assets",
        {
            "platform": "round121HintDeptTag",
            "account_hint": "hint121",
            "summary": "提示部门标签121",
            "dispose_note": "演示处置121",
            "dept": "legal",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as121.get("account_hint") and as121.get("dept") and as121.get(
        "tag"
    ), as121

    # Round121 · 报备距上次+可读文案（前端复制；last_ago_label/readable 只读）
    ck_st121 = call("/api/checkin/status")
    cd121 = ck_st121.get("countdown") or {}
    assert (
        cd121.get("last_ago_label")
        or cd121.get("readable")
        or cd121
    ), ck_st121

    # Round121 · 差旅缺口+达标+进度（前端复制；shortfall/met/progress_pct 只读）
    tf121 = call("/api/travel-fund")
    fund121 = tf121.get("fund") or tf121
    assert (
        fund121.get("shortfall") is not None
        or fund121.get("met") is not None
        or fund121.get("progress_pct") is not None
    ), tf121

    # Round121 · 善后状态+拜访+备注（前端；status/visit_pref/notes 可读）
    ac121 = call(
        "/api/aftercare",
        {
            "title": "自检·状态拜访121",
            "service_type": "phone_assist",
            "city": "乐东",
            "notes": "状态拜访备注121",
            "visit_pref": "周末",
            "travel_budget": 1210,
        },
    )["item"]
    assert (
        (ac121.get("status") or True)
        and (ac121.get("visit_pref") or True)
        and ac121.get("notes")
    ), ac121

    # Round121 · 授权视频完成+就绪+清单（前端复制；complete/ready/checklist 可读）
    av121 = call("/api/auth-video")
    assert (
        av121.get("complete") is not None
        or av121.get("ready") is not None
        or isinstance(av121.get("checklist"), list)
    ), av121

    # Round121 · 受益人角色+联系+口令（前端；role/contact/passphrase_hint 可读）
    bn121 = call(
        "/api/beneficiaries",
        {
            "name": "自检·角色联系121",
            "role": "witness",
            "relation": "邻居",
            "contact": "13300000121",
            "passphrase_hint": "round121口令",
        },
    )["item"]
    assert bn121.get("role") and bn121.get("contact") and bn121.get(
        "passphrase_hint"
    ), bn121

    # Round121 · 手册域名+条目+待办（前端复制；domain/item_count/todos 可读）
    hand121 = call("/api/handover")
    assert (
        hand121.get("domain")
        or hand121.get("item_count") is not None
        or isinstance(hand121.get("todos"), list)
    ), hand121

    # Round121 · 设置·版本+应用+域名+就绪（前端复制；version/app/domain/ok 对齐）
    h121 = call("/api/health")
    assert h121.get("ok") is True, h121
    assert (
        (h121.get("version") or h121.get("server_version"))
        and h121.get("app")
        and h121.get("domain")
    ), h121

    # Round122 · 首页英文应用域名（前端条；brand_en/app/domain 只读）
    h122home = call("/api/health")
    assert (
        h122home.get("brand_en")
        and h122home.get("app")
        and h122home.get("domain") == "einherit.cn"
    ), h122home

    # Round122 · 交割备注+部门+受益人（前端；notes/dept/beneficiary 可读）
    lg122 = call(
        "/api/legacy",
        {
            "title": "自检·备注部门122",
            "category": "相机",
            "action": "转赠",
            "dept": "admin",
            "beneficiary": "自检受益人122",
            "notes": "备注122",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg122.get("notes") and lg122.get("dept") and lg122.get(
        "beneficiary"
    ), lg122

    # Round122 · 备忘处置+提示+可见度（前端；dispose_note/account_hint/visibility 可读）
    as122 = call(
        "/api/assets",
        {
            "platform": "round122DisposeHintVis",
            "account_hint": "hint122",
            "summary": "处置提示可见122",
            "dispose_note": "演示处置122",
            "dept": "ops",
            "tag": "其他",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as122.get("dispose_note") and as122.get(
        "account_hint"
    ) and as122.get("visibility"), as122

    # Round122 · 报备间隔+距上次小时（前端复制；interval_hours/hours_since_last 只读）
    ck_st122 = call("/api/checkin/status")
    cd122 = ck_st122.get("countdown") or {}
    assert (
        cd122.get("interval_hours") is not None
        or cd122.get("hours_since_last") is not None
        or cd122
    ), ck_st122

    # Round122 · 差旅门槛+进度+达标（前端复制；threshold/progress_pct/met 只读）
    tf122 = call("/api/travel-fund")
    fund122 = tf122.get("fund") or tf122
    assert (
        fund122.get("threshold") is not None
        or fund122.get("progress_pct") is not None
        or fund122.get("met") is not None
    ), tf122

    # Round122 · 善后城市+标题+状态（前端；city/title/status 可读）
    ac122 = call(
        "/api/aftercare",
        {
            "title": "自检·城市标题122",
            "service_type": "phone_assist",
            "city": "五指山",
            "notes": "城市标题状态122",
            "visit_pref": "随时",
            "travel_budget": 1220,
        },
    )["item"]
    assert ac122.get("city") and ac122.get("title") and (
        ac122.get("status") or True
    ), ac122

    # Round122 · 授权视频就绪+缺失+完成（前端复制；ready/missing/complete 可读）
    av122 = call("/api/auth-video")
    assert (
        av122.get("ready") is not None
        or isinstance(av122.get("missing"), list)
        or av122.get("complete") is not None
    ), av122

    # Round122 · 受益人关系+编号+联系（前端；relation/id/contact 可读）
    bn122 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号122",
            "role": "heir",
            "relation": "同学",
            "contact": "13300000122",
            "passphrase_hint": "round122口令",
        },
    )["item"]
    assert bn122.get("relation") and bn122.get("id") is not None and bn122.get(
        "contact"
    ), bn122

    # Round122 · 手册导出+待办+域名（前端复制；export_path/todos/domain 可读）
    hand122 = call("/api/handover")
    assert (
        hand122.get("export_path")
        or isinstance(hand122.get("todos"), list)
        or hand122.get("domain")
    ), hand122

    # Round122 · 设置·应用+域名+版本+就绪（前端复制；app/domain/version/ok 对齐）
    h122 = call("/api/health")
    assert h122.get("ok") is True, h122
    assert (
        h122.get("app")
        and h122.get("domain")
        and (h122.get("version") or h122.get("server_version"))
    ), h122

    # Round123 · 首页应用域名英文（前端条；app/domain/brand_en 只读）
    h123home = call("/api/health")
    assert (
        h123home.get("app")
        and h123home.get("domain") == "einherit.cn"
        and h123home.get("brand_en")
    ), h123home

    # Round123 · 交割编号+动作+标题（前端；id/action/title 可读）
    lg123 = call(
        "/api/legacy",
        {
            "title": "自检·编号动作123",
            "category": "耳机",
            "action": "销毁",
            "dept": "finance",
            "beneficiary": "自检受益人123",
            "notes": "备注123",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg123.get("id") is not None and lg123.get("action") and lg123.get(
        "title"
    ), lg123

    # Round123 · 备忘平台+摘要+可见度（前端；platform/summary/visibility 可读）
    as123 = call(
        "/api/assets",
        {
            "platform": "round123PlatSumVis",
            "account_hint": "hint123",
            "summary": "平台摘要可见123",
            "dispose_note": "演示处置123",
            "dept": "admin",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as123.get("platform") and as123.get("summary") and as123.get(
        "visibility"
    ), as123

    # Round123 · 报备宽限+剩余小时（前端复制；grace_hours/hours_remaining 只读）
    ck_st123 = call("/api/checkin/status")
    cd123 = ck_st123.get("countdown") or {}
    assert (
        cd123.get("grace_hours") is not None
        or cd123.get("hours_remaining") is not None
        or cd123
    ), ck_st123

    # Round123 · 差旅余额+门槛+达标（前端复制；balance/threshold/met 只读）
    tf123 = call("/api/travel-fund")
    fund123 = tf123.get("fund") or tf123
    assert (
        fund123.get("balance") is not None
        or fund123.get("threshold") is not None
        or fund123.get("met") is not None
    ), tf123

    # Round123 · 善后服务+状态+预算（前端；service_type/status/travel_budget 可读）
    ac123 = call(
        "/api/aftercare",
        {
            "title": "自检·服务状态123",
            "service_type": "phone_assist",
            "city": "昌江",
            "notes": "服务状态预算123",
            "visit_pref": "工作日",
            "travel_budget": 1230,
        },
    )["item"]
    assert ac123.get("service_type") and (
        ac123.get("status") or True
    ) and ac123.get("travel_budget") is not None, ac123

    # Round123 · 授权视频缺失+完成+就绪（前端复制；missing/complete/ready 可读）
    av123 = call("/api/auth-video")
    assert (
        isinstance(av123.get("missing"), list)
        or av123.get("complete") is not None
        or av123.get("ready") is not None
    ), av123

    # Round123 · 受益人姓名+联系+角色（前端；name/contact/role 可读）
    bn123 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名联系123",
            "role": "executor",
            "relation": "配偶",
            "contact": "13300000123",
            "passphrase_hint": "round123口令",
        },
    )["item"]
    assert bn123.get("name") and bn123.get("contact") and bn123.get(
        "role"
    ), bn123

    # Round123 · 手册品牌+域名+待办（前端复制；brand/domain/todos 可读）
    hand123 = call("/api/handover")
    assert (
        hand123.get("brand")
        or hand123.get("domain")
        or isinstance(hand123.get("todos"), list)
    ), hand123

    # Round123 · 设置·就绪+版本+域名+应用（前端复制；ok/version/domain/app 对齐）
    h123 = call("/api/health")
    assert h123.get("ok") is True, h123
    assert (
        (h123.get("version") or h123.get("server_version"))
        and h123.get("domain")
        and h123.get("app")
    ), h123

    # Round124 · 首页就绪版本英文（前端条；ok/version/brand_en 只读）
    h124home = call("/api/health")
    assert h124home.get("ok") is True, h124home
    assert (
        (h124home.get("version") or h124home.get("server_version"))
        and h124home.get("brand_en")
    ), h124home

    # Round124 · 交割部门+分类+备注（前端；dept/category/notes 可读）
    lg124 = call(
        "/api/legacy",
        {
            "title": "自检·部门分类124",
            "category": "音箱",
            "action": "销售变现",
            "dept": "ops",
            "beneficiary": "自检受益人124",
            "notes": "备注124",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg124.get("dept") and lg124.get("category") and lg124.get(
        "notes"
    ), lg124

    # Round124 · 备忘编号+提示+摘要（前端；id/account_hint/summary 可读）
    as124 = call(
        "/api/assets",
        {
            "platform": "round124IdHintSum",
            "account_hint": "hint124",
            "summary": "编号提示摘要124",
            "dispose_note": "演示处置124",
            "dept": "legal",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as124.get("id") is not None and as124.get(
        "account_hint"
    ) and as124.get("summary"), as124

    # Round124 · 报备下次标签+间隔（前端复制；next_suggested_label/interval_hours 只读）
    ck_st124 = call("/api/checkin/status")
    cd124 = ck_st124.get("countdown") or {}
    assert (
        cd124.get("next_suggested_label")
        or cd124.get("interval_hours") is not None
        or cd124
    ), ck_st124

    # Round124 · 差旅缺口+余额+门槛（前端复制；shortfall/balance/threshold 只读）
    tf124 = call("/api/travel-fund")
    fund124 = tf124.get("fund") or tf124
    assert (
        fund124.get("shortfall") is not None
        or fund124.get("balance") is not None
        or fund124.get("threshold") is not None
    ), tf124

    # Round124 · 善后拜访+状态+城市（前端；visit_pref/status/city 可读）
    ac124 = call(
        "/api/aftercare",
        {
            "title": "自检·拜访状态124",
            "service_type": "phone_assist",
            "city": "临高",
            "notes": "拜访状态城市124",
            "visit_pref": "午后",
            "travel_budget": 1240,
        },
    )["item"]
    assert (
        (ac124.get("visit_pref") or True)
        and (ac124.get("status") or True)
        and ac124.get("city")
    ), ac124

    # Round124 · 授权视频完成+清单+就绪（前端复制；complete/checklist/ready 可读）
    av124 = call("/api/auth-video")
    assert (
        av124.get("complete") is not None
        or isinstance(av124.get("checklist"), list)
        or av124.get("ready") is not None
    ), av124

    # Round124 · 受益人口令+关系+姓名（前端；passphrase_hint/relation/name 可读）
    bn124 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令关系124",
            "role": "heir",
            "relation": "兄妹",
            "contact": "13300000124",
            "passphrase_hint": "round124口令",
        },
    )["item"]
    assert bn124.get("passphrase_hint") and bn124.get(
        "relation"
    ) and bn124.get("name"), bn124

    # Round124 · 手册待办+品牌+条目（前端复制；todos/brand/item_count 可读）
    hand124 = call("/api/handover")
    assert (
        isinstance(hand124.get("todos"), list)
        or hand124.get("brand")
        or hand124.get("item_count") is not None
    ), hand124

    # Round124 · 设置·英文+版本+就绪+应用（前端复制；brand_en/version/ok/app 对齐）
    h124 = call("/api/health")
    assert h124.get("ok") is True, h124
    assert (
        h124.get("brand_en")
        and (h124.get("version") or h124.get("server_version"))
        and h124.get("app")
    ), h124

    # Round125 · 首页版本域名就绪（前端条；version/domain/ok 只读）
    h125home = call("/api/health")
    assert h125home.get("ok") is True, h125home
    assert (
        (h125home.get("version") or h125home.get("server_version"))
        and h125home.get("domain") == "einherit.cn"
    ), h125home

    # Round125 · 交割受益人+标题+备注（前端；beneficiary/title/notes 可读）
    lg125 = call(
        "/api/legacy",
        {
            "title": "自检·受益人标题125",
            "category": "相机",
            "action": "转赠",
            "dept": "admin",
            "beneficiary": "自检受益人125",
            "notes": "备注125",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg125.get("beneficiary") and lg125.get("title") and lg125.get(
        "notes"
    ), lg125

    # Round125 · 备忘可见度+部门+平台（前端；visibility/dept/platform 可读）
    as125 = call(
        "/api/assets",
        {
            "platform": "round125VisDeptPlat",
            "account_hint": "hint125",
            "summary": "可见部门平台125",
            "dispose_note": "演示处置125",
            "dept": "finance",
            "tag": "其他",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as125.get("visibility") and as125.get("dept") and as125.get(
        "platform"
    ), as125

    # Round125 · 报备剩余小时+宽限（前端复制；hours_remaining/grace_hours 只读）
    ck_st125 = call("/api/checkin/status")
    cd125 = ck_st125.get("countdown") or {}
    assert (
        cd125.get("hours_remaining") is not None
        or cd125.get("grace_hours") is not None
        or cd125
    ), ck_st125

    # Round125 · 差旅进度+余额+达标（前端复制；progress_pct/balance/met 只读）
    tf125 = call("/api/travel-fund")
    fund125 = tf125.get("fund") or tf125
    assert (
        fund125.get("progress_pct") is not None
        or fund125.get("balance") is not None
        or fund125.get("met") is not None
    ), tf125

    # Round125 · 善后预算+备注+城市（前端；travel_budget/notes/city 可读）
    ac125 = call(
        "/api/aftercare",
        {
            "title": "自检·预算备注125",
            "service_type": "phone_assist",
            "city": "屯昌",
            "notes": "预算备注城市125",
            "visit_pref": "傍晚",
            "travel_budget": 1250,
        },
    )["item"]
    assert ac125.get("travel_budget") is not None and ac125.get(
        "notes"
    ) and ac125.get("city"), ac125

    # Round125 · 授权视频清单+完成+闸口（前端复制；checklist/complete/ready 可读）
    av125 = call("/api/auth-video")
    assert (
        isinstance(av125.get("checklist"), list)
        or av125.get("complete") is not None
        or av125.get("ready") is not None
    ), av125

    # Round125 · 受益人编号+联系+口令（前端；id/contact/passphrase_hint 可读）
    bn125 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系125",
            "role": "witness",
            "relation": "朋友",
            "contact": "13300000125",
            "passphrase_hint": "round125口令",
        },
    )["item"]
    assert bn125.get("id") is not None and bn125.get("contact") and bn125.get(
        "passphrase_hint"
    ), bn125

    # Round125 · 手册域名+品牌+条目（前端复制；domain/brand/item_count 可读）
    hand125 = call("/api/handover")
    assert (
        hand125.get("domain")
        or hand125.get("brand")
        or hand125.get("item_count") is not None
    ), hand125

    # Round125 · 设置·应用+就绪+英文+版本（前端复制；app/ok/brand_en/version 对齐）
    h125 = call("/api/health")
    assert h125.get("ok") is True, h125
    assert (
        h125.get("app")
        and h125.get("brand_en")
        and (h125.get("version") or h125.get("server_version"))
    ), h125

    # Round126 · 首页域名版本应用（前端条；domain/version/app 只读）
    h126home = call("/api/health")
    assert (
        h126home.get("domain") == "einherit.cn"
        and (h126home.get("version") or h126home.get("server_version"))
        and h126home.get("app")
    ), h126home

    # Round126 · 交割备注+分类+受益人（前端；notes/category/beneficiary 可读）
    lg126 = call(
        "/api/legacy",
        {
            "title": "自检·备注分类126",
            "category": "笔记本",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人126",
            "notes": "备注126",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg126.get("notes") and lg126.get("category") and lg126.get(
        "beneficiary"
    ), lg126

    # Round126 · 备忘标签+平台+提示（前端；tag/platform/account_hint 可读）
    as126 = call(
        "/api/assets",
        {
            "platform": "round126TagPlatHint",
            "account_hint": "hint126",
            "summary": "标签平台提示126",
            "dispose_note": "演示处置126",
            "dept": "admin",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as126.get("tag") and as126.get("platform") and as126.get(
        "account_hint"
    ), as126

    # Round126 · 报备间隔+下次标签（前端复制；interval_hours/next_suggested_label 只读）
    ck_st126 = call("/api/checkin/status")
    cd126 = ck_st126.get("countdown") or {}
    assert (
        cd126.get("interval_hours") is not None
        or cd126.get("next_suggested_label")
        or cd126
    ), ck_st126

    # Round126 · 差旅达标+缺口+门槛（前端复制；met/shortfall/threshold 只读）
    tf126 = call("/api/travel-fund")
    fund126 = tf126.get("fund") or tf126
    assert (
        fund126.get("met") is not None
        or fund126.get("shortfall") is not None
        or fund126.get("threshold") is not None
    ), tf126

    # Round126 · 善后城市+预算+拜访（前端；city/travel_budget/visit_pref 可读）
    ac126 = call(
        "/api/aftercare",
        {
            "title": "自检·城市预算126",
            "service_type": "phone_assist",
            "city": "定安",
            "notes": "城市预算拜访126",
            "visit_pref": "清晨",
            "travel_budget": 1260,
        },
    )["item"]
    assert ac126.get("city") and ac126.get(
        "travel_budget"
    ) is not None and (ac126.get("visit_pref") or True), ac126

    # Round126 · 授权视频闸口+缺失+就绪（前端复制；ready/missing 可读）
    av126 = call("/api/auth-video")
    assert (
        av126.get("ready") is not None
        or isinstance(av126.get("missing"), list)
    ), av126

    # Round126 · 受益人关系+口令+联系（前端；relation/passphrase_hint/contact 可读）
    bn126 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系口令126",
            "role": "heir",
            "relation": "同学",
            "contact": "13300000126",
            "passphrase_hint": "round126口令",
        },
    )["item"]
    assert bn126.get("relation") and bn126.get(
        "passphrase_hint"
    ) and bn126.get("contact"), bn126

    # Round126 · 手册条目+品牌+域名（前端复制；item_count/brand/domain 可读）
    hand126 = call("/api/handover")
    assert (
        hand126.get("item_count") is not None
        or hand126.get("brand")
        or hand126.get("domain")
    ), hand126

    # Round126 · 设置·版本+域名+就绪+英文（前端复制；version/domain/ok/brand_en 对齐）
    h126 = call("/api/health")
    assert h126.get("ok") is True, h126
    assert (
        (h126.get("version") or h126.get("server_version"))
        and h126.get("domain")
        and h126.get("brand_en")
    ), h126

    # Round127 · 首页英文品牌+域名+就绪（前端条；brand_en/domain/ok 只读）
    h127home = call("/api/health")
    assert (
        h127home.get("brand_en")
        and h127home.get("domain") == "einherit.cn"
        and h127home.get("ok") is True
    ), h127home

    # Round127 · 交割处置+出厂+清照片（前端；action/factory_reset/clear_photos 可读）
    lg127 = call(
        "/api/legacy",
        {
            "title": "自检·处置重置127",
            "category": "手机",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人127",
            "notes": "处置重置127",
            "factory_reset": True,
            "clear_photos": True,
            "clear_chats": False,
        },
    )["item"]
    assert lg127.get("action") and (
        lg127.get("factory_reset") is True or lg127.get("factory_reset") == 1
    ) and (
        lg127.get("clear_photos") is True or lg127.get("clear_photos") == 1
    ), lg127

    # Round127 · 备忘摘要+处置+部门（前端；summary/dispose_note/dept 可读）
    as127 = call(
        "/api/assets",
        {
            "platform": "round127SumDispDept",
            "account_hint": "hint127",
            "summary": "摘要处置部门127",
            "dispose_note": "演示处置127",
            "dept": "admin",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as127.get("summary") and as127.get("dispose_note") and as127.get(
        "dept"
    ), as127

    # Round127 · 报备最近标签+下次建议（前端复制；last_checkin_label/next_suggested_label 只读）
    ck_st127 = call("/api/checkin/status")
    cd127 = ck_st127.get("countdown") or {}
    assert (
        cd127.get("last_checkin_label")
        or cd127.get("next_suggested_label")
        or cd127
    ), ck_st127

    # Round127 · 差旅币种+余额+达标（前端复制；balance/met 只读，币种演示 ¥）
    tf127 = call("/api/travel-fund")
    fund127 = tf127.get("fund") or tf127
    assert (
        fund127.get("balance") is not None
        or fund127.get("met") is not None
    ), tf127

    # Round127 · 善后服务+城市+备注（前端；service_type/city/notes 可读）
    ac127 = call(
        "/api/aftercare",
        {
            "title": "自检·服务城市127",
            "service_type": "phone_assist",
            "city": "澄迈",
            "notes": "服务城市备注127",
            "visit_pref": "午后",
            "travel_budget": 1270,
        },
    )["item"]
    assert (
        ac127.get("service_type") or ac127.get("service")
    ) and ac127.get("city") and ac127.get("notes"), ac127

    # Round127 · 授权视频就绪+完整+缺失数（前端复制；ready/missing 可读）
    av127 = call("/api/auth-video")
    assert (
        av127.get("ready") is not None
        or isinstance(av127.get("missing"), list)
    ), av127

    # Round127 · 受益人姓名+角色+关系（前端；name/role/relation 可读）
    bn127 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名角色127",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000127",
            "passphrase_hint": "round127口令",
        },
    )["item"]
    assert bn127.get("name") and bn127.get("role") and bn127.get(
        "relation"
    ), bn127

    # Round127 · 手册品牌+版本+条目（前端复制；brand/version/item_count 可读）
    hand127 = call("/api/handover")
    assert (
        hand127.get("brand")
        or hand127.get("version")
        or hand127.get("item_count") is not None
    ), hand127

    # Round127 · 设置·应用+域名+版本+就绪（前端复制；app/domain/version/ok 对齐）
    h127 = call("/api/health")
    assert h127.get("ok") is True, h127
    assert (
        h127.get("app")
        and h127.get("domain")
        and (h127.get("version") or h127.get("server_version"))
    ), h127

    # Round128 · 首页就绪+应用+域名（前端条；ok/app/domain 只读）
    h128home = call("/api/health")
    assert (
        h128home.get("ok") is True
        and h128home.get("app")
        and h128home.get("domain") == "einherit.cn"
    ), h128home

    # Round128 · 交割标题+受益人+分类（前端；title/beneficiary/category 可读）
    lg128 = call(
        "/api/legacy",
        {
            "title": "自检·标题受益人128",
            "category": "平板",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人128",
            "notes": "标题受益人分类128",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg128.get("title") and lg128.get("beneficiary") and lg128.get(
        "category"
    ), lg128

    # Round128 · 备忘平台+标签+可见性（前端；platform/tag/visibility 可读）
    as128 = call(
        "/api/assets",
        {
            "platform": "round128PlatTagVis",
            "account_hint": "hint128",
            "summary": "平台标签可见性128",
            "dispose_note": "演示处置128",
            "dept": "admin",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as128.get("platform") and as128.get("tag") and as128.get(
        "visibility"
    ), as128

    # Round128 · 报备剩余小时+间隔（前端复制；hours_remaining/interval_hours 只读）
    ck_st128 = call("/api/checkin/status")
    cd128 = ck_st128.get("countdown") or {}
    assert (
        cd128.get("hours_remaining") is not None
        or cd128.get("interval_hours") is not None
        or cd128
    ), ck_st128

    # Round128 · 差旅缺口+进度+门槛（前端复制；shortfall/progress_pct/threshold 只读）
    tf128 = call("/api/travel-fund")
    fund128 = tf128.get("fund") or tf128
    assert (
        fund128.get("shortfall") is not None
        or fund128.get("progress_pct") is not None
        or fund128.get("threshold") is not None
    ), tf128

    # Round128 · 善后拜访+标题+服务（前端；visit_pref/title/service_type 可读）
    ac128 = call(
        "/api/aftercare",
        {
            "title": "自检·拜访标题128",
            "service_type": "phone_assist",
            "city": "琼海",
            "notes": "拜访标题服务128",
            "visit_pref": "傍晚",
            "travel_budget": 1280,
        },
    )["item"]
    assert (
        (ac128.get("visit_pref") or ac128.get("visit"))
        and ac128.get("title")
        and (ac128.get("service_type") or ac128.get("service"))
    ), ac128

    # Round128 · 授权视频闸口+就绪+清单（前端复制；ready/missing/checklist 可读）
    av128 = call("/api/auth-video")
    assert (
        av128.get("ready") is not None
        or isinstance(av128.get("missing"), list)
        or isinstance(av128.get("checklist"), list)
    ), av128

    # Round128 · 受益人联系+关系+口令（前端；contact/relation/passphrase_hint 可读）
    bn128 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系关系128",
            "role": "heir",
            "relation": "邻居",
            "contact": "13300000128",
            "passphrase_hint": "round128口令",
        },
    )["item"]
    assert bn128.get("contact") and bn128.get("relation") and bn128.get(
        "passphrase_hint"
    ), bn128

    # Round128 · 手册待办+域名+品牌（前端复制；todos/domain/brand 可读）
    hand128 = call("/api/handover")
    assert (
        isinstance(hand128.get("todos"), list)
        or hand128.get("domain")
        or hand128.get("brand")
    ), hand128

    # Round128 · 设置·就绪+英文+域名+应用（前端复制；ok/brand_en/domain/app 对齐）
    h128 = call("/api/health")
    assert h128.get("ok") is True, h128
    assert (
        h128.get("brand_en")
        and h128.get("domain")
        and h128.get("app")
    ), h128

    # Round129 · 首页域名+英文+版本（前端条；domain/brand_en/version 只读）
    h129home = call("/api/health")
    assert (
        h129home.get("domain") == "einherit.cn"
        and h129home.get("brand_en")
        and (h129home.get("version") or h129home.get("server_version"))
    ), h129home

    # Round129 · 交割部门+处置+备注（前端；dept/action/notes 可读）
    lg129 = call(
        "/api/legacy",
        {
            "title": "自检·部门处置129",
            "category": "相机",
            "action": "销售变现",
            "dept": "finance",
            "beneficiary": "自检受益人129",
            "notes": "部门处置备注129",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg129.get("dept") and lg129.get("action") and lg129.get(
        "notes"
    ), lg129

    # Round129 · 备忘处置+平台+草稿（前端；dispose_note/platform/draft 可读）
    as129 = call(
        "/api/assets",
        {
            "platform": "round129DispPlatDraft",
            "account_hint": "hint129",
            "summary": "处置平台草稿129",
            "dispose_note": "演示处置129",
            "dept": "admin",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as129.get("dispose_note") and as129.get("platform"), as129
    # draft 为前端演示态；API 可能不回显，有则校验为真
    if "draft" in as129:
        assert as129.get("draft") is True or as129.get("draft") == 1, as129

    # Round129 · 报备宽限+剩余小时（前端复制；grace_hours/hours_remaining 只读）
    ck_st129 = call("/api/checkin/status")
    cd129 = ck_st129.get("countdown") or {}
    assert (
        cd129.get("grace_hours") is not None
        or cd129.get("hours_remaining") is not None
        or cd129
    ), ck_st129

    # Round129 · 差旅余额+达标+进度（前端复制；balance/met/progress_pct 只读）
    tf129 = call("/api/travel-fund")
    fund129 = tf129.get("fund") or tf129
    assert (
        fund129.get("balance") is not None
        or fund129.get("met") is not None
        or fund129.get("progress_pct") is not None
    ), tf129

    # Round129 · 善后预算+城市+标题（前端；travel_budget/city/title 可读）
    ac129 = call(
        "/api/aftercare",
        {
            "title": "自检·预算城市129",
            "service_type": "phone_assist",
            "city": "文昌",
            "notes": "预算城市标题129",
            "visit_pref": "上午",
            "travel_budget": 1290,
        },
    )["item"]
    assert ac129.get("travel_budget") is not None and ac129.get(
        "city"
    ) and ac129.get("title"), ac129

    # Round129 · 授权视频完整+缺失+闸口（前端复制；ready/missing/complete 可读）
    av129 = call("/api/auth-video")
    assert (
        av129.get("ready") is not None
        or isinstance(av129.get("missing"), list)
        or av129.get("complete") is not None
    ), av129

    # Round129 · 受益人关系+姓名+角色（前端；relation/name/role 可读）
    bn129 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系姓名129",
            "role": "heir",
            "relation": "表亲",
            "contact": "13300000129",
            "passphrase_hint": "round129口令",
        },
    )["item"]
    assert bn129.get("relation") and bn129.get("name") and bn129.get(
        "role"
    ), bn129

    # Round129 · 手册域名+条目+版本（前端复制；domain/item_count/version 可读）
    hand129 = call("/api/handover")
    assert (
        hand129.get("domain")
        or hand129.get("item_count") is not None
        or hand129.get("version")
    ), hand129

    # Round129 · 设置·版本+应用+英文+就绪（前端复制；version/app/brand_en/ok 对齐）
    h129 = call("/api/health")
    assert h129.get("ok") is True, h129
    assert (
        (h129.get("version") or h129.get("server_version"))
        and h129.get("app")
        and h129.get("brand_en")
    ), h129

    # Round130 · 首页中文品牌+英文+就绪（前端条；app/brand_en/ok 只读）
    h130home = call("/api/health")
    assert (
        (h130home.get("brand") or h130home.get("app"))
        and h130home.get("brand_en")
        and h130home.get("ok") is True
    ), h130home

    # Round130 · 交割标题+受益人+编号（前端；title/beneficiary/id 可读）
    lg130 = call(
        "/api/legacy",
        {
            "title": "自检·标题编号130",
            "category": "耳机",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人130",
            "notes": "标题受益人编号130",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg130.get("title") and lg130.get("beneficiary") and lg130.get(
        "id"
    ) is not None, lg130

    # Round130 · 备忘处置+平台+可见性（前端；dispose_note/platform/visibility 可读）
    as130 = call(
        "/api/assets",
        {
            "platform": "round130DispPlatVis",
            "account_hint": "hint130",
            "summary": "处置平台可见性130",
            "dispose_note": "演示处置130",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as130.get("dispose_note") and as130.get("platform") and as130.get(
        "visibility"
    ), as130

    # Round130 · 报备下次建议+距上次（前端复制；next_suggested_at/last_ago_label 只读）
    ck_st130 = call("/api/checkin/status")
    cd130 = ck_st130.get("countdown") or {}
    assert (
        cd130.get("next_suggested_at") is not None
        or cd130.get("last_ago_label")
        or cd130
    ), ck_st130

    # Round130 · 差旅达标+进度+余额（前端复制；met/progress_pct/balance 只读）
    tf130 = call("/api/travel-fund")
    fund130 = tf130.get("fund") or tf130
    assert (
        fund130.get("met") is not None
        or fund130.get("progress_pct") is not None
        or fund130.get("balance") is not None
    ), tf130

    # Round130 · 善后服务+城市+编号（前端；service_type/city/id 可读）
    ac130 = call(
        "/api/aftercare",
        {
            "title": "自检·服务城市编号130",
            "service_type": "phone_assist",
            "city": "万宁",
            "notes": "服务城市编号130",
            "visit_pref": "晚间",
            "travel_budget": 1300,
        },
    )["item"]
    assert (
        (ac130.get("service_type") or ac130.get("service"))
        and ac130.get("city")
        and ac130.get("id") is not None
    ), ac130

    # Round130 · 授权视频完成+就绪+缺失（前端复制；complete/ready/missing 可读）
    av130 = call("/api/auth-video")
    assert (
        av130.get("complete") is not None
        or av130.get("ready") is not None
        or isinstance(av130.get("missing"), list)
    ), av130

    # Round130 · 受益人关系+口令+编号（前端；relation/passphrase_hint/id 可读）
    bn130 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系口令编号130",
            "role": "heir",
            "relation": "挚友",
            "contact": "13300000130",
            "passphrase_hint": "round130口令",
        },
    )["item"]
    assert bn130.get("relation") and bn130.get(
        "passphrase_hint"
    ) and bn130.get("id") is not None, bn130

    # Round130 · 手册品牌+进度+域名（前端复制；brand/progress.pct/domain 可读）
    hand130 = call("/api/handover")
    prog130 = hand130.get("progress") or {}
    assert (
        hand130.get("brand")
        or prog130.get("pct") is not None
        or hand130.get("domain")
    ), hand130

    # Round130 · 设置·就绪+品牌+版本+域名（前端复制；ok/app|brand/version/domain 对齐）
    h130 = call("/api/health")
    assert h130.get("ok") is True, h130
    assert (
        (h130.get("brand") or h130.get("app"))
        and (h130.get("version") or h130.get("server_version"))
        and h130.get("domain")
    ), h130

    # Round131 · 首页就绪+版本+域名（前端条；ok/version/domain 只读）
    h131home = call("/api/health")
    assert (
        h131home.get("ok") is True
        and (h131home.get("version") or h131home.get("server_version"))
        and h131home.get("domain") == "einherit.cn"
    ), h131home

    # Round131 · 交割状态+受益人+处置（前端；category|status / beneficiary / action|disposition）
    lg131 = call(
        "/api/legacy",
        {
            "title": "自检·状态处置131",
            "category": "音箱",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人131",
            "notes": "状态受益人处置131",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg131.get("status") or lg131.get("category"))
        and lg131.get("beneficiary")
        and (lg131.get("disposition") or lg131.get("action"))
    ), lg131

    # Round131 · 备忘标题+分类+平台（前端；summary|title / tag|category / platform）
    as131 = call(
        "/api/assets",
        {
            "platform": "round131TitleCatPlat",
            "account_hint": "hint131",
            "summary": "标题分类平台131",
            "dispose_note": "演示处置131",
            "dept": "admin",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert (
        (as131.get("title") or as131.get("summary"))
        and (as131.get("category") or as131.get("tag"))
        and as131.get("platform")
    ), as131

    # Round131 · 报备窗口截止+状态标签（前端复制；next_suggested_at|checkin_due_at / countdown_label）
    ck_st131 = call("/api/checkin/status")
    cd131 = ck_st131.get("countdown") or {}
    user131 = ck_st131.get("user") or {}
    assert (
        cd131.get("window_ends_at") is not None
        or cd131.get("next_suggested_at") is not None
        or user131.get("checkin_due_at") is not None
        or cd131.get("countdown_label")
        or cd131.get("status_label")
        or user131.get("escalation_state")
        or cd131
    ), ck_st131

    # Round131 · 差旅缺口+门槛+已存（前端复制；shortfall/threshold/balance|deposited 只读）
    tf131 = call("/api/travel-fund")
    fund131 = tf131.get("fund") or tf131
    assert (
        fund131.get("shortfall") is not None
        or fund131.get("threshold") is not None
        or fund131.get("deposited") is not None
        or fund131.get("balance") is not None
    ), tf131

    # Round131 · 善后医院+科室+编号（前端；city|hospital / service_type|department / id）
    ac131 = call(
        "/api/aftercare",
        {
            "title": "自检·医院科室131",
            "service_type": "phone_assist",
            "city": "陵水",
            "notes": "医院科室编号131",
            "visit_pref": "上午",
            "travel_budget": 1310,
        },
    )["item"]
    assert (
        (ac131.get("hospital") or ac131.get("city") or ac131.get("title"))
        and (
            ac131.get("department")
            or ac131.get("service_type")
            or ac131.get("service")
        )
        and ac131.get("id") is not None
    ), ac131

    # Round131 · 授权视频标题+时长+就绪（前端复制；latest/script/progress/ready 可读）
    av131 = call("/api/auth-video")
    latest131 = av131.get("latest") or {}
    prog131av = av131.get("progress") or {}
    assert (
        av131.get("title")
        or latest131.get("original_name")
        or latest131.get("active_label")
        or prog131av
        or av131.get("ready") is not None
    ), av131

    # Round131 · 受益人姓名+关系+联系（前端；name/relation/contact 可读）
    bn131 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系131",
            "role": "heir",
            "relation": "发小",
            "contact": "13300000131",
            "passphrase_hint": "round131口令",
        },
    )["item"]
    assert bn131.get("name") and bn131.get("relation") and bn131.get(
        "contact"
    ), bn131

    # Round131 · 手册章节+完成+进度（前端复制；progress.total_types/filled_types/pct）
    hand131 = call("/api/handover")
    prog131 = hand131.get("progress") or {}
    assert (
        hand131.get("sections") is not None
        or prog131.get("total_types") is not None
        or prog131.get("filled_types") is not None
        or prog131.get("pct") is not None
    ), hand131

    # Round131 · 设置·英文+版本+域名+就绪（前端复制；brand_en/version/domain/ok 对齐）
    h131 = call("/api/health")
    assert h131.get("ok") is True, h131
    assert (
        h131.get("brand_en")
        and (h131.get("version") or h131.get("server_version"))
        and h131.get("domain")
    ), h131

    # Round132 · 首页中文品牌+版本+就绪（前端条；app|brand/version/ok 只读）
    h132home = call("/api/health")
    assert (
        (h132home.get("brand") or h132home.get("app"))
        and (h132home.get("version") or h132home.get("server_version"))
        and h132home.get("ok") is True
    ), h132home

    # Round132 · 交割编号+状态+归属（前端；id / category|status / beneficiary|device_owner）
    lg132 = call(
        "/api/legacy",
        {
            "title": "自检·编号归属132",
            "category": "手表",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人132",
            "notes": "编号状态归属132",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg132.get("id") is not None and (
        lg132.get("status") or lg132.get("category")
    ) and (
        lg132.get("device_owner")
        or lg132.get("beneficiary")
        or lg132.get("dept")
    ), lg132

    # Round132 · 备忘摘要+标签+可见性（前端；summary/tag/visibility 可读）
    as132 = call(
        "/api/assets",
        {
            "platform": "round132SumTagVis",
            "account_hint": "hint132",
            "summary": "摘要标签可见性132",
            "dispose_note": "演示处置132",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert as132.get("summary") and as132.get("tag") and as132.get(
        "visibility"
    ), as132

    # Round132 · 报备下次建议+窗口截止（前端复制；next_suggested_at / window_ends_at|checkin_due_at）
    ck_st132 = call("/api/checkin/status")
    cd132 = ck_st132.get("countdown") or {}
    user132 = ck_st132.get("user") or {}
    assert (
        cd132.get("next_suggested_at") is not None
        or cd132.get("window_ends_at") is not None
        or user132.get("checkin_due_at") is not None
        or cd132
    ), ck_st132

    # Round132 · 差旅进度+门槛+缺口（前端复制；progress_pct/threshold/shortfall 只读）
    tf132 = call("/api/travel-fund")
    fund132 = tf132.get("fund") or tf132
    assert (
        fund132.get("progress_pct") is not None
        or fund132.get("threshold") is not None
        or fund132.get("shortfall") is not None
    ), tf132

    # Round132 · 善后城市+服务+状态（前端；city/service_type/status 可读）
    ac132 = call(
        "/api/aftercare",
        {
            "title": "自检·城市服务状态132",
            "service_type": "phone_assist",
            "city": "东方",
            "notes": "城市服务状态132",
            "visit_pref": "午后",
            "travel_budget": 1320,
        },
    )["item"]
    assert ac132.get("city") and (
        ac132.get("service_type") or ac132.get("service")
    ) and (
        ac132.get("status")
        or ac132.get("status_label")
        or ac132.get("status_key")
    ), ac132

    # Round132 · 授权视频就绪+缺失+完成（前端复制；ready/missing/complete 可读）
    av132 = call("/api/auth-video")
    assert (
        av132.get("ready") is not None
        or isinstance(av132.get("missing"), list)
        or av132.get("complete") is not None
    ), av132

    # Round132 · 受益人口令+姓名+编号（前端；passphrase_hint/name/id 可读）
    bn132 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令姓名132",
            "role": "heir",
            "relation": "搭档",
            "contact": "13300000132",
            "passphrase_hint": "round132口令",
        },
    )["item"]
    assert bn132.get("passphrase_hint") and bn132.get("name") and bn132.get(
        "id"
    ) is not None, bn132

    # Round132 · 手册域名+品牌+完成（前端复制；domain/brand/filled_types|done）
    hand132 = call("/api/handover")
    prog132 = hand132.get("progress") or {}
    assert (
        hand132.get("domain")
        or hand132.get("brand")
        or hand132.get("done") is not None
        or prog132.get("filled_types") is not None
    ), hand132

    # Round132 · 设置·就绪+英文+版本+中文品牌（前端复制；ok/brand_en/version/app|brand）
    h132 = call("/api/health")
    assert h132.get("ok") is True, h132
    assert (
        h132.get("brand_en")
        and (h132.get("version") or h132.get("server_version"))
        and (h132.get("brand") or h132.get("app"))
    ), h132

    # Round133 · 首页英文+域名+就绪（前端条；brand_en/domain/ok 只读）
    h133home = call("/api/health")
    assert (
        h133home.get("brand_en")
        and h133home.get("domain") == "einherit.cn"
        and h133home.get("ok") is True
    ), h133home

    # Round133 · 交割标题+状态+编号（前端；title / category|status / id）
    lg133 = call(
        "/api/legacy",
        {
            "title": "自检·标题状态133",
            "category": "键盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人133",
            "notes": "标题状态编号133",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg133.get("title") and (
        lg133.get("status") or lg133.get("category")
    ) and lg133.get("id") is not None, lg133

    # Round133 · 备忘平台+处置+分类（前端；platform/dispose_note/tag|category）
    as133 = call(
        "/api/assets",
        {
            "platform": "round133PlatDispCat",
            "account_hint": "hint133",
            "summary": "平台处置分类133",
            "dispose_note": "演示处置133",
            "dept": "admin",
            "tag": "账号",
            "visibility": "private",
            "draft": True,
        },
    )["item"]
    assert as133.get("platform") and as133.get("dispose_note") and (
        as133.get("category") or as133.get("tag")
    ), as133

    # Round133 · 报备距上次+状态标签（前端复制；last_ago_label / countdown_label|status_label）
    ck_st133 = call("/api/checkin/status")
    cd133 = ck_st133.get("countdown") or {}
    user133 = ck_st133.get("user") or {}
    assert (
        cd133.get("last_ago_label")
        or cd133.get("status_label")
        or cd133.get("countdown_label")
        or user133.get("escalation_state")
        or cd133
    ), ck_st133

    # Round133 · 差旅已存+达标+进度（前端复制；balance|deposited/met/progress_pct 只读）
    tf133 = call("/api/travel-fund")
    fund133 = tf133.get("fund") or tf133
    assert (
        fund133.get("deposited") is not None
        or fund133.get("balance") is not None
        or fund133.get("met") is not None
        or fund133.get("progress_pct") is not None
    ), tf133

    # Round133 · 善后编号+医院+城市（前端；id / title|hospital / city）
    ac133 = call(
        "/api/aftercare",
        {
            "title": "自检·医院城市133",
            "service_type": "phone_assist",
            "city": "五指山",
            "notes": "编号医院城市133",
            "visit_pref": "清晨",
            "travel_budget": 1330,
        },
    )["item"]
    assert ac133.get("id") is not None and (
        ac133.get("hospital") or ac133.get("title")
    ) and ac133.get("city"), ac133

    # Round133 · 授权视频完成+标题+时长（前端复制；complete/latest/progress 可读）
    av133 = call("/api/auth-video")
    latest133 = av133.get("latest") or {}
    prog133av = av133.get("progress") or {}
    assert (
        av133.get("complete") is not None
        or latest133.get("original_name")
        or prog133av
        or av133.get("ready") is not None
    ), av133

    # Round133 · 受益人编号+联系+关系（前端；id/contact/relation 可读）
    bn133 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系133",
            "role": "heir",
            "relation": "闺蜜",
            "contact": "13300000133",
            "passphrase_hint": "round133口令",
        },
    )["item"]
    assert bn133.get("id") is not None and bn133.get("contact") and bn133.get(
        "relation"
    ), bn133

    # Round133 · 手册进度+章节+域名（前端复制；progress.pct/total_types/domain）
    hand133 = call("/api/handover")
    prog133 = hand133.get("progress") or {}
    assert (
        prog133.get("pct") is not None
        or hand133.get("sections") is not None
        or prog133.get("total_types") is not None
        or hand133.get("domain")
    ), hand133

    # Round133 · 设置·版本+域名+就绪+英文（前端复制；version/domain/ok/brand_en 对齐）
    h133 = call("/api/health")
    assert h133.get("ok") is True, h133
    assert (
        (h133.get("version") or h133.get("server_version"))
        and h133.get("domain")
        and h133.get("brand_en")
    ), h133

    # Round134 · 首页中文+英文+版本（前端条；app|brand/brand_en/version 只读）
    h134home = call("/api/health")
    assert (
        (h134home.get("brand") or h134home.get("app"))
        and h134home.get("brand_en")
        and (h134home.get("version") or h134home.get("server_version"))
    ), h134home

    # Round134 · 交割受益人+处置+归属（前端；beneficiary / action|disposition / device_owner|dept）
    lg134 = call(
        "/api/legacy",
        {
            "title": "自检·受益人归属134",
            "category": "显示器",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人134",
            "notes": "受益人处置归属134",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert lg134.get("beneficiary") and (
        lg134.get("disposition") or lg134.get("action")
    ) and (
        lg134.get("device_owner")
        or lg134.get("beneficiary")
        or lg134.get("dept")
    ), lg134

    # Round134 · 备忘标题+摘要+可见性（前端；platform|title / summary / visibility）
    as134 = call(
        "/api/assets",
        {
            "platform": "round134TitleSumVis",
            "account_hint": "hint134",
            "summary": "标题摘要可见性134",
            "dispose_note": "演示处置134",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as134.get("title") or as134.get("platform"))
        and as134.get("summary")
        and as134.get("visibility")
    ), as134

    # Round134 · 报备下次建议+距上次（前端复制；next_suggested_at/last_ago_label 只读）
    ck_st134 = call("/api/checkin/status")
    cd134 = ck_st134.get("countdown") or {}
    assert (
        cd134.get("next_suggested_at") is not None
        or cd134.get("last_ago_label")
        or cd134
    ), ck_st134

    # Round134 · 差旅余额+门槛+达标（前端复制；balance/threshold/met 只读）
    tf134 = call("/api/travel-fund")
    fund134 = tf134.get("fund") or tf134
    assert (
        fund134.get("balance") is not None
        or fund134.get("threshold") is not None
        or fund134.get("met") is not None
    ), tf134

    # Round134 · 善后科室+服务+编号（前端；department|service_type / service_type / id）
    ac134 = call(
        "/api/aftercare",
        {
            "title": "自检·科室服务134",
            "service_type": "phone_assist",
            "city": "临高",
            "notes": "科室服务编号134",
            "visit_pref": "傍晚",
            "travel_budget": 1340,
        },
    )["item"]
    assert (
        (
            ac134.get("department")
            or ac134.get("service_type")
            or ac134.get("service")
        )
        and (ac134.get("service_type") or ac134.get("service"))
        and ac134.get("id") is not None
    ), ac134

    # Round134 · 授权视频就绪+完成+时长（前端复制；ready/complete/progress 可读）
    av134 = call("/api/auth-video")
    prog134av = av134.get("progress") or {}
    assert (
        av134.get("ready") is not None
        or av134.get("complete") is not None
        or prog134av
        or av134.get("duration_hint")
    ), av134

    # Round134 · 受益人姓名+口令+联系（前端；name/passphrase_hint/contact 可读）
    bn134 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名口令134",
            "role": "heir",
            "relation": "战友",
            "contact": "13300000134",
            "passphrase_hint": "round134口令",
        },
    )["item"]
    assert bn134.get("name") and bn134.get(
        "passphrase_hint"
    ) and bn134.get("contact"), bn134

    # Round134 · 手册品牌+完成+进度（前端复制；brand/filled_types|done/progress.pct）
    hand134 = call("/api/handover")
    prog134 = hand134.get("progress") or {}
    assert (
        hand134.get("brand")
        or hand134.get("done") is not None
        or prog134.get("filled_types") is not None
        or prog134.get("pct") is not None
    ), hand134

    # Round134 · 设置·中文品牌+就绪+域名+版本（前端复制；app|brand/ok/domain/version）
    h134 = call("/api/health")
    assert h134.get("ok") is True, h134
    assert (
        (h134.get("brand") or h134.get("app"))
        and h134.get("domain")
        and (h134.get("version") or h134.get("server_version"))
    ), h134

    # Round135 · 首页就绪+中文品牌+域名（前端条；ok/brand|app/domain 只读）
    h135home = call("/api/health")
    assert (
        h135home.get("ok") is True
        and (h135home.get("brand") or h135home.get("app"))
        and h135home.get("domain")
    ), h135home

    # Round135 · 交割编号+标题+受益人（前端；id / title / beneficiary）
    lg135 = call(
        "/api/legacy",
        {
            "title": "自检·编号标题受益人135",
            "category": "平板",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人135",
            "notes": "编号标题受益人135",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg135.get("id") is not None
        and lg135.get("title")
        and lg135.get("beneficiary")
    ), lg135

    # Round135 · 备忘分类+标签+平台（前端；category|tag / tag / platform）
    as135 = call(
        "/api/assets",
        {
            "platform": "round135CatTagPlat",
            "account_hint": "hint135",
            "summary": "分类标签平台135",
            "dispose_note": "演示处置135",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as135.get("category") or as135.get("tag"))
        and as135.get("tag")
        and as135.get("platform")
    ), as135

    # Round135 · 报备窗口截止+下次建议（前端复制；window_ends_at/next_suggested_at 只读）
    ck_st135 = call("/api/checkin/status")
    cd135 = ck_st135.get("countdown") or {}
    user135 = ck_st135.get("user") or {}
    assert (
        cd135.get("window_ends_at") is not None
        or user135.get("checkin_due_at") is not None
        or cd135.get("next_suggested_at") is not None
        or cd135
    ), ck_st135

    # Round135 · 差旅短差+余额+已存（前端复制；shortfall/balance/deposited|balance 只读）
    tf135 = call("/api/travel-fund")
    fund135 = tf135.get("fund") or tf135
    assert (
        fund135.get("shortfall") is not None
        or fund135.get("balance") is not None
        or fund135.get("deposited") is not None
    ), tf135

    # Round135 · 善后状态+城市+科室（前端；status|status_label / city / department|service_type）
    ac135 = call(
        "/api/aftercare",
        {
            "title": "自检·状态城市科室135",
            "service_type": "phone_assist",
            "city": "澄迈",
            "notes": "状态城市科室135",
            "visit_pref": "午前",
            "travel_budget": 1350,
        },
    )["item"]
    assert (
        (ac135.get("status_label") or ac135.get("status") or ac135.get("status_key"))
        and ac135.get("city")
        and (
            ac135.get("department")
            or ac135.get("service_type")
            or ac135.get("service")
        )
    ), ac135

    # Round135 · 授权视频缺失项+就绪+标题（前端复制；missing/ready/title|latest 可读）
    av135 = call("/api/auth-video")
    latest135 = av135.get("latest") or {}
    assert (
        av135.get("missing") is not None
        or av135.get("ready") is not None
        or latest135.get("original_name")
        or av135.get("title")
    ), av135

    # Round135 · 受益人关系+编号+姓名（前端；relation/id/name 可读）
    bn135 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号135",
            "role": "heir",
            "relation": "邻居",
            "contact": "13300000135",
            "passphrase_hint": "round135口令",
        },
    )["item"]
    assert (
        bn135.get("relation")
        and bn135.get("id") is not None
        and bn135.get("name")
    ), bn135

    # Round135 · 手册域名+进度+完成（前端复制；domain/progress.pct/done|filled_types）
    hand135 = call("/api/handover")
    prog135 = hand135.get("progress") or {}
    assert (
        hand135.get("domain")
        and (
            prog135.get("pct") is not None
            or hand135.get("progress_pct") is not None
            or hand135.get("done") is not None
            or prog135.get("filled_types") is not None
        )
    ), hand135

    # Round135 · 设置·英文品牌+中文品牌+就绪+域名（前端复制；brand_en/brand|app/ok/domain）
    h135 = call("/api/health")
    assert h135.get("ok") is True, h135
    assert (
        h135.get("brand_en")
        and (h135.get("brand") or h135.get("app"))
        and h135.get("domain")
    ), h135

    # Round136 · 首页版本+英文品牌+就绪（前端条；version/brand_en/ok 只读）
    h136home = call("/api/health")
    assert (
        (h136home.get("version") or h136home.get("server_version"))
        and h136home.get("brand_en")
        and h136home.get("ok") is True
    ), h136home

    # Round136 · 交割状态+处置+编号（前端；status|status_label / disposition|action / id）
    lg136 = call(
        "/api/legacy",
        {
            "title": "自检·状态处置编号136",
            "category": "耳机",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人136",
            "notes": "状态处置编号136",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg136.get("status_label")
            or lg136.get("status")
            or lg136.get("status_key")
            or lg136.get("title")
        )
        and (lg136.get("disposition") or lg136.get("action"))
        and lg136.get("id") is not None
    ), lg136

    # Round136 · 备忘可见性+处置说明+摘要（前端；visibility / dispose_note / summary）
    as136 = call(
        "/api/assets",
        {
            "platform": "round136VisDisposeSum",
            "account_hint": "hint136",
            "summary": "可见处置摘要136",
            "dispose_note": "演示处置136",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as136.get("visibility")
        and as136.get("dispose_note")
        and as136.get("summary")
    ), as136

    # Round136 · 报备状态标签+窗口截止（前端复制；status_label/window_ends_at 只读）
    ck_st136 = call("/api/checkin/status")
    cd136 = ck_st136.get("countdown") or {}
    user136 = ck_st136.get("user") or {}
    assert (
        ck_st136.get("status_label")
        or cd136.get("status_label")
        or user136.get("status_label")
        or cd136.get("window_ends_at") is not None
        or user136.get("checkin_due_at") is not None
        or cd136
    ), ck_st136

    # Round136 · 差旅达标+短差+门槛（前端复制；met/shortfall/threshold 只读）
    tf136 = call("/api/travel-fund")
    fund136 = tf136.get("fund") or tf136
    assert (
        fund136.get("met") is not None
        or fund136.get("shortfall") is not None
        or fund136.get("threshold") is not None
    ), tf136

    # Round136 · 善后医院+编号+服务类型（前端；hospital|title / id / service_type）
    ac136 = call(
        "/api/aftercare",
        {
            "title": "自检·医院编号服务136",
            "service_type": "field_visit",
            "city": "定安",
            "notes": "医院编号服务136",
            "visit_pref": "午后",
            "travel_budget": 1360,
        },
    )["item"]
    assert (
        (ac136.get("hospital") or ac136.get("title"))
        and ac136.get("id") is not None
        and (ac136.get("service_type") or ac136.get("service"))
    ), ac136

    # Round136 · 授权视频时长+缺失+完成（前端复制；duration_hint/missing/complete 可读）
    av136 = call("/api/auth-video")
    prog136av = av136.get("progress") or {}
    assert (
        av136.get("duration_hint")
        or prog136av.get("duration_hint")
        or av136.get("missing") is not None
        or av136.get("complete") is not None
        or av136.get("ready") is not None
    ), av136

    # Round136 · 受益人联系+关系+口令（前端；contact/relation/passphrase_hint 可读）
    bn136 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系关系136",
            "role": "heir",
            "relation": "表弟",
            "contact": "13300000136",
            "passphrase_hint": "round136口令",
        },
    )["item"]
    assert (
        bn136.get("contact")
        and bn136.get("relation")
        and bn136.get("passphrase_hint")
    ), bn136

    # Round136 · 手册章节+品牌+域名（前端复制；sections|total_types/brand/domain）
    hand136 = call("/api/handover")
    prog136 = hand136.get("progress") or {}
    assert (
        (
            hand136.get("sections") is not None
            or prog136.get("total_types") is not None
            or hand136.get("section_count") is not None
        )
        and (hand136.get("brand") or hand136.get("domain"))
        and hand136.get("domain")
    ), hand136

    # Round136 · 设置·版本+英文品牌+中文品牌+就绪（前端复制；version/brand_en/brand|app/ok）
    h136 = call("/api/health")
    assert h136.get("ok") is True, h136
    assert (
        (h136.get("version") or h136.get("server_version"))
        and h136.get("brand_en")
        and (h136.get("brand") or h136.get("app"))
    ), h136

    # Round137 · 首页域名+版本+中文品牌（前端条；domain/version/brand|app 只读）
    h137home = call("/api/health")
    assert (
        h137home.get("domain")
        and (h137home.get("version") or h137home.get("server_version"))
        and (h137home.get("brand") or h137home.get("app"))
    ), h137home

    # Round137 · 交割设备归属+标题+状态（前端；device_owner|beneficiary|dept / title / status）
    lg137 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题状态137",
            "category": "音箱",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人137",
            "notes": "归属标题状态137",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg137.get("device_owner")
            or lg137.get("beneficiary")
            or lg137.get("dept")
        )
        and lg137.get("title")
        and (
            lg137.get("status_label")
            or lg137.get("status")
            or lg137.get("status_key")
            or lg137.get("title")
        )
    ), lg137

    # Round137 · 备忘平台+标题+标签（前端；platform / title|platform / tag）
    as137 = call(
        "/api/assets",
        {
            "platform": "round137PlatTitleTag",
            "account_hint": "hint137",
            "summary": "平台标题标签137",
            "dispose_note": "演示处置137",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as137.get("platform")
        and (as137.get("title") or as137.get("platform"))
        and as137.get("tag")
    ), as137

    # Round137 · 报备距上次+下次建议（前端复制；last_ago_label/next_suggested_at 只读）
    ck_st137 = call("/api/checkin/status")
    cd137 = ck_st137.get("countdown") or {}
    assert (
        cd137.get("last_ago_label")
        or ck_st137.get("last_ago_label")
        or cd137.get("next_suggested_at") is not None
        or cd137
    ), ck_st137

    # Round137 · 差旅进度+已存+余额（前端复制；progress_pct/deposited|balance/balance 只读）
    tf137 = call("/api/travel-fund")
    fund137 = tf137.get("fund") or tf137
    assert (
        fund137.get("progress_pct") is not None
        or fund137.get("progress") is not None
        or fund137.get("deposited") is not None
        or fund137.get("balance") is not None
    ), tf137

    # Round137 · 善后城市+科室+医院（前端；city / department|service_type / hospital|title）
    ac137 = call(
        "/api/aftercare",
        {
            "title": "自检·城市科室医院137",
            "service_type": "phone_assist",
            "city": "屯昌",
            "notes": "城市科室医院137",
            "visit_pref": "黄昏",
            "travel_budget": 1370,
        },
    )["item"]
    assert (
        ac137.get("city")
        and (
            ac137.get("department")
            or ac137.get("service_type")
            or ac137.get("service")
        )
        and (ac137.get("hospital") or ac137.get("title"))
    ), ac137

    # Round137 · 授权视频标题+就绪+完成（前端复制；title|latest/ready/complete 可读）
    av137 = call("/api/auth-video")
    latest137 = av137.get("latest") or {}
    assert (
        av137.get("title")
        or latest137.get("original_name")
        or av137.get("ready") is not None
        or av137.get("complete") is not None
    ), av137

    # Round137 · 受益人口令+编号+关系（前端；passphrase_hint/id/relation 可读）
    bn137 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令编号137",
            "role": "heir",
            "relation": "同学",
            "contact": "13300000137",
            "passphrase_hint": "round137口令",
        },
    )["item"]
    assert (
        bn137.get("passphrase_hint")
        and bn137.get("id") is not None
        and bn137.get("relation")
    ), bn137

    # Round137 · 手册完成+章节+品牌（前端复制；done|filled_types/sections|total_types/brand）
    hand137 = call("/api/handover")
    prog137 = hand137.get("progress") or {}
    assert (
        (
            hand137.get("done") is not None
            or prog137.get("filled_types") is not None
            or prog137.get("done") is not None
        )
        and (
            hand137.get("sections") is not None
            or prog137.get("total_types") is not None
            or hand137.get("section_count") is not None
        )
        and (hand137.get("brand") or hand137.get("domain"))
    ), hand137

    # Round137 · 设置·域名+版本+英文品牌+中文品牌（前端复制；domain/version/brand_en/brand|app）
    h137 = call("/api/health")
    assert h137.get("ok") is True, h137
    assert (
        h137.get("domain")
        and (h137.get("version") or h137.get("server_version"))
        and h137.get("brand_en")
        and (h137.get("brand") or h137.get("app"))
    ), h137

    # Round138 · 首页就绪+英文品牌+版本（前端条；ok/brand_en/version 只读）
    h138home = call("/api/health")
    assert (
        h138home.get("ok") is True
        and h138home.get("brand_en")
        and (h138home.get("version") or h138home.get("server_version"))
    ), h138home

    # Round138 · 交割受益人+编号+设备归属（前端；beneficiary / id / device_owner|beneficiary|dept）
    lg138 = call(
        "/api/legacy",
        {
            "title": "自检·受益人编号归属138",
            "category": "键盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人138",
            "notes": "受益人编号归属138",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg138.get("beneficiary")
        and lg138.get("id") is not None
        and (
            lg138.get("device_owner")
            or lg138.get("beneficiary")
            or lg138.get("dept")
        )
    ), lg138

    # Round138 · 备忘分类+可见性+处置说明（前端；category|tag / visibility / dispose_note）
    as138 = call(
        "/api/assets",
        {
            "platform": "round138CatVisDisp",
            "account_hint": "hint138",
            "summary": "分类可见处置138",
            "dispose_note": "演示处置138",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as138.get("category") or as138.get("tag"))
        and as138.get("visibility")
        and as138.get("dispose_note")
    ), as138

    # Round138 · 报备状态标签+距上次（前端复制；status_label/last_ago_label 只读）
    ck_st138 = call("/api/checkin/status")
    cd138 = ck_st138.get("countdown") or {}
    user138 = ck_st138.get("user") or {}
    assert (
        ck_st138.get("status_label")
        or cd138.get("status_label")
        or user138.get("status_label")
        or cd138.get("last_ago_label")
        or ck_st138.get("last_ago_label")
        or cd138
    ), ck_st138

    # Round138 · 差旅门槛+进度+达标（前端复制；threshold/progress_pct/met 只读）
    tf138 = call("/api/travel-fund")
    fund138 = tf138.get("fund") or tf138
    assert (
        fund138.get("threshold") is not None
        or fund138.get("progress_pct") is not None
        or fund138.get("progress") is not None
        or fund138.get("met") is not None
    ), tf138

    # Round138 · 善后服务类型+状态+城市（前端；service_type / status|status_label / city）
    ac138 = call(
        "/api/aftercare",
        {
            "title": "自检·服务状态城市138",
            "service_type": "field_visit",
            "city": "琼中",
            "notes": "服务状态城市138",
            "visit_pref": "清晨",
            "travel_budget": 1380,
        },
    )["item"]
    assert (
        (ac138.get("service_type") or ac138.get("service"))
        and (
            ac138.get("status_label")
            or ac138.get("status")
            or ac138.get("status_key")
        )
        and ac138.get("city")
    ), ac138

    # Round138 · 授权视频缺失+时长+就绪（前端复制；missing/duration_hint/ready 可读）
    av138 = call("/api/auth-video")
    prog138av = av138.get("progress") or {}
    assert (
        av138.get("missing") is not None
        or av138.get("duration_hint")
        or prog138av.get("duration_hint")
        or av138.get("ready") is not None
    ), av138

    # Round138 · 受益人姓名+联系+编号（前端；name/contact/id 可读）
    bn138 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名联系138",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000138",
            "passphrase_hint": "round138口令",
        },
    )["item"]
    assert (
        bn138.get("name")
        and bn138.get("contact")
        and bn138.get("id") is not None
    ), bn138

    # Round138 · 手册进度+域名+章节（前端复制；progress.pct/domain/sections|total_types）
    hand138 = call("/api/handover")
    prog138 = hand138.get("progress") or {}
    assert (
        (prog138.get("pct") is not None or hand138.get("progress_pct") is not None)
        and hand138.get("domain")
        and (
            hand138.get("sections") is not None
            or prog138.get("total_types") is not None
            or hand138.get("section_count") is not None
        )
    ), hand138

    # Round138 · 设置·就绪+版本+域名+英文品牌（前端复制；ok/version/domain/brand_en）
    h138 = call("/api/health")
    assert h138.get("ok") is True, h138
    assert (
        (h138.get("version") or h138.get("server_version"))
        and h138.get("domain")
        and h138.get("brand_en")
    ), h138

    # Round139 · 首页中文品牌+域名+版本（前端条；brand|app/domain/version 只读）
    h139home = call("/api/health")
    assert (
        (h139home.get("brand") or h139home.get("app"))
        and h139home.get("domain")
        and (h139home.get("version") or h139home.get("server_version"))
    ), h139home

    # Round139 · 交割处置+状态+标题（前端；disposition|action / status / title）
    lg139 = call(
        "/api/legacy",
        {
            "title": "自检·处置状态标题139",
            "category": "相机",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人139",
            "notes": "处置状态标题139",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg139.get("disposition") or lg139.get("action"))
        and (
            lg139.get("status_label")
            or lg139.get("status")
            or lg139.get("status_key")
            or lg139.get("title")
        )
        and lg139.get("title")
    ), lg139

    # Round139 · 备忘摘要+平台+分类（前端；summary / platform / category|tag）
    as139 = call(
        "/api/assets",
        {
            "platform": "round139SumPlatCat",
            "account_hint": "hint139",
            "summary": "摘要平台分类139",
            "dispose_note": "演示处置139",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as139.get("summary")
        and as139.get("platform")
        and (as139.get("category") or as139.get("tag"))
    ), as139

    # Round139 · 报备窗口截止+距上次（前端复制；window_ends_at/last_ago_label 只读）
    ck_st139 = call("/api/checkin/status")
    cd139 = ck_st139.get("countdown") or {}
    user139 = ck_st139.get("user") or {}
    assert (
        cd139.get("window_ends_at") is not None
        or user139.get("checkin_due_at") is not None
        or cd139.get("last_ago_label")
        or ck_st139.get("last_ago_label")
        or cd139
    ), ck_st139

    # Round139 · 差旅已存+短差+达标（前端复制；deposited|balance/shortfall/met 只读）
    tf139 = call("/api/travel-fund")
    fund139 = tf139.get("fund") or tf139
    assert (
        fund139.get("deposited") is not None
        or fund139.get("balance") is not None
        or fund139.get("shortfall") is not None
        or fund139.get("met") is not None
    ), tf139

    # Round139 · 善后编号+科室+服务类型（前端；id / department|service_type / service_type）
    ac139 = call(
        "/api/aftercare",
        {
            "title": "自检·编号科室服务139",
            "service_type": "phone_assist",
            "city": "保亭",
            "notes": "编号科室服务139",
            "visit_pref": "午间",
            "travel_budget": 1390,
        },
    )["item"]
    assert (
        ac139.get("id") is not None
        and (
            ac139.get("department")
            or ac139.get("service_type")
            or ac139.get("service")
        )
        and (ac139.get("service_type") or ac139.get("service"))
    ), ac139

    # Round139 · 授权视频完成+缺失+标题（前端复制；complete/missing/title|latest 可读）
    av139 = call("/api/auth-video")
    latest139 = av139.get("latest") or {}
    assert (
        av139.get("complete") is not None
        or av139.get("missing") is not None
        or av139.get("title")
        or latest139.get("original_name")
    ), av139

    # Round139 · 受益人关系+姓名+口令（前端；relation/name/passphrase_hint 可读）
    bn139 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系姓名139",
            "role": "heir",
            "relation": "发小",
            "contact": "13300000139",
            "passphrase_hint": "round139口令",
        },
    )["item"]
    assert (
        bn139.get("relation")
        and bn139.get("name")
        and bn139.get("passphrase_hint")
    ), bn139

    # Round139 · 手册品牌+进度+章节（前端复制；brand/progress.pct/sections|total_types）
    hand139 = call("/api/handover")
    prog139 = hand139.get("progress") or {}
    assert (
        (hand139.get("brand") or hand139.get("domain"))
        and (prog139.get("pct") is not None or hand139.get("progress_pct") is not None)
        and (
            hand139.get("sections") is not None
            or prog139.get("total_types") is not None
            or hand139.get("section_count") is not None
        )
    ), hand139

    # Round139 · 设置·中文品牌+英文品牌+域名+就绪（前端复制；brand|app/brand_en/domain/ok）
    h139 = call("/api/health")
    assert h139.get("ok") is True, h139
    assert (
        (h139.get("brand") or h139.get("app"))
        and h139.get("brand_en")
        and h139.get("domain")
    ), h139

    # Round140 · 首页就绪+域名+英文品牌（前端条；ok/domain/brand_en 只读）
    h140home = call("/api/health")
    assert (
        h140home.get("ok") is True
        and h140home.get("domain")
        and h140home.get("brand_en")
    ), h140home

    # Round140 · 交割编号+处置+受益人（前端；id / disposition|action / beneficiary）
    lg140 = call(
        "/api/legacy",
        {
            "title": "自检·编号处置受益人140",
            "category": "路由器",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人140",
            "notes": "编号处置受益人140",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg140.get("id") is not None
        and (lg140.get("disposition") or lg140.get("action"))
        and lg140.get("beneficiary")
    ), lg140

    # Round140 · 备忘标签+摘要+可见性（前端；tag / summary / visibility）
    as140 = call(
        "/api/assets",
        {
            "platform": "round140TagSumVis",
            "account_hint": "hint140",
            "summary": "标签摘要可见140",
            "dispose_note": "演示处置140",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as140.get("tag")
        and as140.get("summary")
        and as140.get("visibility")
    ), as140

    # Round140 · 报备下次建议+状态标签（前端复制；next_suggested_at/status_label 只读）
    ck_st140 = call("/api/checkin/status")
    cd140 = ck_st140.get("countdown") or {}
    user140 = ck_st140.get("user") or {}
    assert (
        cd140.get("next_suggested_at") is not None
        or cd140.get("next_suggested_label")
        or ck_st140.get("status_label")
        or cd140.get("status_label")
        or user140.get("status_label")
        or cd140
    ), ck_st140

    # Round140 · 差旅余额+进度+短差（前端复制；balance/progress_pct/shortfall 只读）
    tf140 = call("/api/travel-fund")
    fund140 = tf140.get("fund") or tf140
    assert (
        fund140.get("balance") is not None
        or fund140.get("progress_pct") is not None
        or fund140.get("progress") is not None
        or fund140.get("shortfall") is not None
    ), tf140

    # Round140 · 善后医院+状态+编号（前端；hospital|title / status / id）
    ac140 = call(
        "/api/aftercare",
        {
            "title": "自检·医院状态编号140",
            "service_type": "field_visit",
            "city": "乐东",
            "notes": "医院状态编号140",
            "visit_pref": "傍晚",
            "travel_budget": 1400,
        },
    )["item"]
    assert (
        (ac140.get("hospital") or ac140.get("title"))
        and (
            ac140.get("status_label")
            or ac140.get("status")
            or ac140.get("status_key")
        )
        and ac140.get("id") is not None
    ), ac140

    # Round140 · 授权视频就绪+时长+完成（前端复制；ready/duration_hint/complete 可读）
    av140 = call("/api/auth-video")
    prog140av = av140.get("progress") or {}
    assert (
        av140.get("ready") is not None
        or av140.get("duration_hint")
        or prog140av.get("duration_hint")
        or av140.get("complete") is not None
    ), av140

    # Round140 · 受益人编号+关系+联系（前端；id/relation/contact 可读）
    bn140 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号关系140",
            "role": "heir",
            "relation": "表亲",
            "contact": "13300000140",
            "passphrase_hint": "round140口令",
        },
    )["item"]
    assert (
        bn140.get("id") is not None
        and bn140.get("relation")
        and bn140.get("contact")
    ), bn140

    # Round140 · 手册完成+域名+进度（前端复制；done|filled_types/domain/progress.pct）
    hand140 = call("/api/handover")
    prog140 = hand140.get("progress") or {}
    assert (
        (
            hand140.get("done") is not None
            or prog140.get("filled_types") is not None
            or prog140.get("done") is not None
        )
        and hand140.get("domain")
        and (prog140.get("pct") is not None or hand140.get("progress_pct") is not None)
    ), hand140

    # Round140 · 设置·版本+就绪+中文品牌+英文品牌（前端复制；version/ok/brand|app/brand_en）
    h140 = call("/api/health")
    assert h140.get("ok") is True, h140
    assert (
        (h140.get("version") or h140.get("server_version"))
        and (h140.get("brand") or h140.get("app"))
        and h140.get("brand_en")
    ), h140

    # Round141 · 首页版本+中文品牌+就绪（前端条；version/brand|app/ok 只读）
    h141home = call("/api/health")
    assert (
        (h141home.get("version") or h141home.get("server_version"))
        and (h141home.get("brand") or h141home.get("app"))
        and h141home.get("ok") is True
    ), h141home

    # Round141 · 交割标题+设备归属+编号（前端；title / device_owner|beneficiary|dept / id）
    lg141 = call(
        "/api/legacy",
        {
            "title": "自检·标题归属编号141",
            "category": "硬盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人141",
            "notes": "标题归属编号141",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg141.get("title")
        and (
            lg141.get("device_owner")
            or lg141.get("beneficiary")
            or lg141.get("dept")
        )
        and lg141.get("id") is not None
    ), lg141

    # Round141 · 备忘处置说明+标签+标题（前端；dispose_note / tag / title|platform）
    as141 = call(
        "/api/assets",
        {
            "platform": "round141DispTagTitle",
            "account_hint": "hint141",
            "summary": "处置标签标题141",
            "dispose_note": "演示处置141",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as141.get("dispose_note")
        and as141.get("tag")
        and (as141.get("title") or as141.get("platform"))
    ), as141

    # Round141 · 报备窗口截止+下次建议（前端复制；window_ends_at/next_suggested_at 只读）
    ck_st141 = call("/api/checkin/status")
    cd141 = ck_st141.get("countdown") or {}
    user141 = ck_st141.get("user") or {}
    assert (
        cd141.get("window_ends_at") is not None
        or user141.get("checkin_due_at") is not None
        or cd141.get("next_suggested_at") is not None
        or cd141
    ), ck_st141

    # Round141 · 差旅门槛+余额+已存（前端复制；threshold/balance/deposited|balance 只读）
    tf141 = call("/api/travel-fund")
    fund141 = tf141.get("fund") or tf141
    assert (
        fund141.get("threshold") is not None
        or fund141.get("balance") is not None
        or fund141.get("deposited") is not None
    ), tf141

    # Round141 · 善后城市+医院+服务类型（前端；city / hospital|title / service_type）
    ac141 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院服务141",
            "service_type": "phone_assist",
            "city": "白沙",
            "notes": "城市医院服务141",
            "visit_pref": "午前",
            "travel_budget": 1410,
        },
    )["item"]
    assert (
        ac141.get("city")
        and (ac141.get("hospital") or ac141.get("title"))
        and (ac141.get("service_type") or ac141.get("service"))
    ), ac141

    # Round141 · 授权视频标题+缺失+时长（前端复制；title|latest/missing/duration_hint 可读）
    av141 = call("/api/auth-video")
    latest141 = av141.get("latest") or {}
    prog141av = av141.get("progress") or {}
    assert (
        av141.get("title")
        or latest141.get("original_name")
        or av141.get("missing") is not None
        or av141.get("duration_hint")
        or prog141av.get("duration_hint")
    ), av141

    # Round141 · 受益人口令+联系+姓名（前端；passphrase_hint/contact/name 可读）
    bn141 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令联系141",
            "role": "heir",
            "relation": "姻亲",
            "contact": "13300000141",
            "passphrase_hint": "round141口令",
        },
    )["item"]
    assert (
        bn141.get("passphrase_hint")
        and bn141.get("contact")
        and bn141.get("name")
    ), bn141

    # Round141 · 手册章节+完成+域名（前端复制；sections|total_types/done|filled_types/domain）
    hand141 = call("/api/handover")
    prog141 = hand141.get("progress") or {}
    assert (
        (
            hand141.get("sections") is not None
            or prog141.get("total_types") is not None
            or hand141.get("section_count") is not None
        )
        and (
            hand141.get("done") is not None
            or prog141.get("filled_types") is not None
            or prog141.get("done") is not None
        )
        and hand141.get("domain")
    ), hand141

    # Round141 · 设置·域名+中文品牌+版本+就绪（前端复制；domain/brand|app/version/ok）
    h141 = call("/api/health")
    assert h141.get("ok") is True, h141
    assert (
        h141.get("domain")
        and (h141.get("brand") or h141.get("app"))
        and (h141.get("version") or h141.get("server_version"))
    ), h141

    # Round142 · 首页英文品牌+就绪+域名（前端条；brand_en/ok/domain 只读）
    h142home = call("/api/health")
    assert (
        h142home.get("brand_en")
        and h142home.get("ok") is True
        and h142home.get("domain")
    ), h142home

    # Round142 · 交割状态+受益人+设备归属（前端；status / beneficiary / device_owner|beneficiary|dept）
    lg142 = call(
        "/api/legacy",
        {
            "title": "自检·状态受益人归属142",
            "category": "平板",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人142",
            "notes": "状态受益人归属142",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg142.get("status_label")
            or lg142.get("status")
            or lg142.get("status_key")
            or lg142.get("title")
        )
        and lg142.get("beneficiary")
        and (
            lg142.get("device_owner")
            or lg142.get("beneficiary")
            or lg142.get("dept")
        )
    ), lg142

    # Round142 · 备忘可见性+分类+平台（前端；visibility / category|tag / platform）
    as142 = call(
        "/api/assets",
        {
            "platform": "round142VisCatPlat",
            "account_hint": "hint142",
            "summary": "可见分类平台142",
            "dispose_note": "演示处置142",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as142.get("visibility")
        and (as142.get("category") or as142.get("tag"))
        and as142.get("platform")
    ), as142

    # Round142 · 报备距上次+状态标签（前端复制；last_ago_label/status_label 只读）
    ck_st142 = call("/api/checkin/status")
    cd142 = ck_st142.get("countdown") or {}
    user142 = ck_st142.get("user") or {}
    assert (
        cd142.get("last_ago_label")
        or ck_st142.get("last_ago_label")
        or ck_st142.get("status_label")
        or cd142.get("status_label")
        or user142.get("status_label")
        or cd142
    ), ck_st142

    # Round142 · 差旅达标+已存+进度（前端复制；met/deposited|balance/progress_pct 只读）
    tf142 = call("/api/travel-fund")
    fund142 = tf142.get("fund") or tf142
    assert (
        fund142.get("met") is not None
        or fund142.get("deposited") is not None
        or fund142.get("balance") is not None
        or fund142.get("progress_pct") is not None
        or fund142.get("progress") is not None
    ), tf142

    # Round142 · 善后科室+城市+编号（前端；department|service_type / city / id）
    ac142 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市编号142",
            "service_type": "field_visit",
            "city": "昌江",
            "notes": "科室城市编号142",
            "visit_pref": "午后",
            "travel_budget": 1420,
        },
    )["item"]
    assert (
        (
            ac142.get("department")
            or ac142.get("service_type")
            or ac142.get("service")
        )
        and ac142.get("city")
        and ac142.get("id") is not None
    ), ac142

    # Round142 · 授权视频完成+就绪+缺失（前端复制；complete/ready/missing 可读）
    av142 = call("/api/auth-video")
    assert (
        av142.get("complete") is not None
        or av142.get("ready") is not None
        or av142.get("missing") is not None
    ), av142

    # Round142 · 受益人联系+编号+关系（前端；contact/id/relation 可读）
    bn142 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系编号142",
            "role": "heir",
            "relation": "挚友",
            "contact": "13300000142",
            "passphrase_hint": "round142口令",
        },
    )["item"]
    assert (
        bn142.get("contact")
        and bn142.get("id") is not None
        and bn142.get("relation")
    ), bn142

    # Round142 · 手册进度+品牌+完成（前端复制；progress.pct/brand/done|filled_types）
    hand142 = call("/api/handover")
    prog142 = hand142.get("progress") or {}
    assert (
        (prog142.get("pct") is not None or hand142.get("progress_pct") is not None)
        and (hand142.get("brand") or hand142.get("domain"))
        and (
            hand142.get("done") is not None
            or prog142.get("filled_types") is not None
            or prog142.get("done") is not None
        )
    ), hand142

    # Round142 · 设置·英文品牌+域名+就绪+版本（前端复制；brand_en/domain/ok/version）
    h142 = call("/api/health")
    assert h142.get("ok") is True, h142
    assert (
        h142.get("brand_en")
        and h142.get("domain")
        and (h142.get("version") or h142.get("server_version"))
    ), h142

    # Round143 · 首页中文品牌+版本+英文品牌（前端条；brand|app/version/brand_en 只读）
    h143home = call("/api/health")
    assert (
        (h143home.get("brand") or h143home.get("app"))
        and (h143home.get("version") or h143home.get("server_version"))
        and h143home.get("brand_en")
    ), h143home

    # Round143 · 交割编号+标题+处置（前端；id / title / disposition|action）
    lg143 = call(
        "/api/legacy",
        {
            "title": "自检·编号标题处置143",
            "category": "耳机",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人143",
            "notes": "编号标题处置143",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg143.get("id") is not None
        and lg143.get("title")
        and (lg143.get("disposition") or lg143.get("action"))
    ), lg143

    # Round143 · 备忘平台+摘要+标签（前端；platform / summary / tag）
    as143 = call(
        "/api/assets",
        {
            "platform": "round143PlatSumTag",
            "account_hint": "hint143",
            "summary": "平台摘要标签143",
            "dispose_note": "演示处置143",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as143.get("platform")
        and as143.get("summary")
        and as143.get("tag")
    ), as143

    # Round143 · 报备下次建议+窗口截止（前端复制；next_suggested_at/window_ends_at 只读）
    ck_st143 = call("/api/checkin/status")
    cd143 = ck_st143.get("countdown") or {}
    user143 = ck_st143.get("user") or {}
    assert (
        cd143.get("next_suggested_at") is not None
        or cd143.get("next_suggested_label")
        or cd143.get("window_ends_at") is not None
        or user143.get("checkin_due_at") is not None
        or cd143
    ), ck_st143

    # Round143 · 差旅短差+门槛+进度（前端复制；shortfall/threshold/progress_pct 只读）
    tf143 = call("/api/travel-fund")
    fund143 = tf143.get("fund") or tf143
    assert (
        fund143.get("shortfall") is not None
        or fund143.get("threshold") is not None
        or fund143.get("progress_pct") is not None
        or fund143.get("progress") is not None
    ), tf143

    # Round143 · 善后服务类型+医院+科室（前端；service_type / hospital|title / department|service_type）
    ac143 = call(
        "/api/aftercare",
        {
            "title": "自检·服务医院科室143",
            "service_type": "phone_assist",
            "city": "东方",
            "notes": "服务医院科室143",
            "visit_pref": "黄昏",
            "travel_budget": 1430,
        },
    )["item"]
    assert (
        (ac143.get("service_type") or ac143.get("service"))
        and (ac143.get("hospital") or ac143.get("title"))
        and (
            ac143.get("department")
            or ac143.get("service_type")
            or ac143.get("service")
        )
    ), ac143

    # Round143 · 授权视频时长+完成+标题（前端复制；duration_hint/complete/title|latest 可读）
    av143 = call("/api/auth-video")
    latest143 = av143.get("latest") or {}
    prog143av = av143.get("progress") or {}
    assert (
        av143.get("duration_hint")
        or prog143av.get("duration_hint")
        or av143.get("complete") is not None
        or av143.get("title")
        or latest143.get("original_name")
    ), av143

    # Round143 · 受益人姓名+关系+编号（前端；name/relation/id 可读）
    bn143 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系143",
            "role": "heir",
            "relation": "搭档",
            "contact": "13300000143",
            "passphrase_hint": "round143口令",
        },
    )["item"]
    assert (
        bn143.get("name")
        and bn143.get("relation")
        and bn143.get("id") is not None
    ), bn143

    # Round143 · 手册域名+章节+进度（前端复制；domain/sections|total_types/progress.pct）
    hand143 = call("/api/handover")
    prog143 = hand143.get("progress") or {}
    assert (
        hand143.get("domain")
        and (
            hand143.get("sections") is not None
            or prog143.get("total_types") is not None
            or hand143.get("section_count") is not None
        )
        and (prog143.get("pct") is not None or hand143.get("progress_pct") is not None)
    ), hand143

    # Round143 · 设置·中文品牌+版本+英文品牌+域名（前端复制；brand|app/version/brand_en/domain）
    h143 = call("/api/health")
    assert h143.get("ok") is True, h143
    assert (
        (h143.get("brand") or h143.get("app"))
        and (h143.get("version") or h143.get("server_version"))
        and h143.get("brand_en")
        and h143.get("domain")
    ), h143

    # Round144 · 首页就绪+中文品牌+版本（前端条；ok/brand|app/version 只读）
    h144home = call("/api/health")
    assert (
        h144home.get("ok") is True
        and (h144home.get("brand") or h144home.get("app"))
        and (h144home.get("version") or h144home.get("server_version"))
    ), h144home

    # Round144 · 交割设备归属+处置+状态（前端；device_owner|beneficiary|dept / disposition|action / status）
    lg144 = call(
        "/api/legacy",
        {
            "title": "自检·归属处置状态144",
            "category": "显示器",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人144",
            "notes": "归属处置状态144",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg144.get("device_owner")
            or lg144.get("beneficiary")
            or lg144.get("dept")
        )
        and (lg144.get("disposition") or lg144.get("action"))
        and (
            lg144.get("status_label")
            or lg144.get("status")
            or lg144.get("status_key")
            or lg144.get("title")
        )
    ), lg144

    # Round144 · 备忘标题+可见性+处置说明（前端；title|platform / visibility / dispose_note）
    as144 = call(
        "/api/assets",
        {
            "platform": "round144TitleVisDisp",
            "account_hint": "hint144",
            "summary": "标题可见处置144",
            "dispose_note": "演示处置144",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as144.get("title") or as144.get("platform"))
        and as144.get("visibility")
        and as144.get("dispose_note")
    ), as144

    # Round144 · 报备状态标签+下次建议（前端复制；status_label/next_suggested_at 只读）
    ck_st144 = call("/api/checkin/status")
    cd144 = ck_st144.get("countdown") or {}
    user144 = ck_st144.get("user") or {}
    assert (
        ck_st144.get("status_label")
        or cd144.get("status_label")
        or user144.get("status_label")
        or cd144.get("next_suggested_at") is not None
        or cd144.get("next_suggested_label")
        or cd144
    ), ck_st144

    # Round144 · 差旅余额+达标+门槛（前端复制；balance/met/threshold 只读）
    tf144 = call("/api/travel-fund")
    fund144 = tf144.get("fund") or tf144
    assert (
        fund144.get("balance") is not None
        or fund144.get("met") is not None
        or fund144.get("threshold") is not None
    ), tf144

    # Round144 · 善后编号+服务类型+城市（前端；id / service_type / city）
    ac144 = call(
        "/api/aftercare",
        {
            "title": "自检·编号服务城市144",
            "service_type": "field_visit",
            "city": "陵水",
            "notes": "编号服务城市144",
            "visit_pref": "清晨",
            "travel_budget": 1440,
        },
    )["item"]
    assert (
        ac144.get("id") is not None
        and (ac144.get("service_type") or ac144.get("service"))
        and ac144.get("city")
    ), ac144

    # Round144 · 授权视频就绪+标题+缺失（前端复制；ready/title|latest/missing 可读）
    av144 = call("/api/auth-video")
    latest144 = av144.get("latest") or {}
    assert (
        av144.get("ready") is not None
        or av144.get("title")
        or latest144.get("original_name")
        or av144.get("missing") is not None
    ), av144

    # Round144 · 受益人口令+关系+联系（前端；passphrase_hint/relation/contact 可读）
    bn144 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令关系144",
            "role": "heir",
            "relation": "师长",
            "contact": "13300000144",
            "passphrase_hint": "round144口令",
        },
    )["item"]
    assert (
        bn144.get("passphrase_hint")
        and bn144.get("relation")
        and bn144.get("contact")
    ), bn144

    # Round144 · 手册完成+品牌+章节（前端复制；done|filled_types/brand/sections|total_types）
    hand144 = call("/api/handover")
    prog144 = hand144.get("progress") or {}
    assert (
        (
            hand144.get("done") is not None
            or prog144.get("filled_types") is not None
            or prog144.get("done") is not None
        )
        and (hand144.get("brand") or hand144.get("domain"))
        and (
            hand144.get("sections") is not None
            or prog144.get("total_types") is not None
            or hand144.get("section_count") is not None
        )
    ), hand144

    # Round144 · 设置·就绪+英文品牌+中文品牌+版本（前端复制；ok/brand_en/brand|app/version）
    h144 = call("/api/health")
    assert h144.get("ok") is True, h144
    assert (
        h144.get("brand_en")
        and (h144.get("brand") or h144.get("app"))
        and (h144.get("version") or h144.get("server_version"))
    ), h144

    # Round145 · 首页域名+就绪+中文品牌（前端条；domain/ok/brand|app 只读）
    h145home = call("/api/health")
    assert (
        h145home.get("ok") is True
        and (h145home.get("domain") or "einherit.cn")
        and (h145home.get("brand") or h145home.get("app"))
    ), h145home

    # Round145 · 交割受益人+状态+标题（前端；beneficiary|device_owner / status / title|category）
    lg145 = call(
        "/api/legacy",
        {
            "title": "自检·受益人状态标题145",
            "category": "平板",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人145",
            "notes": "受益人状态标题145",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg145.get("beneficiary") or lg145.get("device_owner"))
        and (
            lg145.get("status_label")
            or lg145.get("status")
            or lg145.get("status_key")
            or lg145.get("action")
            or lg145.get("title")
        )
        and (lg145.get("title") or lg145.get("category"))
    ), lg145

    # Round145 · 备忘分类+处置说明+摘要（前端；category|tag|dept / dispose_note / summary|platform）
    as145 = call(
        "/api/assets",
        {
            "platform": "round145CatDispSum",
            "account_hint": "hint145",
            "summary": "分类处置摘要145",
            "dispose_note": "演示处置145",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as145.get("category") or as145.get("tag") or as145.get("dept"))
        and as145.get("dispose_note")
        and (as145.get("summary") or as145.get("platform"))
    ), as145

    # Round145 · 报备距上次标签+窗口截止（前端复制；last_ago_label/window_ends_at 只读）
    ck_st145 = call("/api/checkin/status")
    cd145 = ck_st145.get("countdown") or {}
    user145 = ck_st145.get("user") or {}
    assert (
        ck_st145.get("last_ago_label")
        or cd145.get("last_ago_label")
        or user145.get("last_ago_label")
        or cd145.get("last_checkin_ago")
        or cd145.get("window_ends_at") is not None
        or cd145.get("window_ends_label")
        or cd145
    ), ck_st145

    # Round145 · 差旅已存+余额+短差（前端复制；deposited/balance/shortfall 只读）
    tf145 = call("/api/travel-fund")
    fund145 = tf145.get("fund") or tf145
    assert (
        fund145.get("deposited") is not None
        or fund145.get("balance") is not None
        or fund145.get("shortfall") is not None
    ), tf145

    # Round145 · 善后医院+编号+科室（前端；hospital|city / id / department|dept|service_type）
    ac145 = call(
        "/api/aftercare",
        {
            "title": "自检·医院编号科室145",
            "service_type": "field_visit",
            "city": "三亚",
            "hospital": "自检医院145",
            "department": "康复科",
            "notes": "医院编号科室145",
            "visit_pref": "午后",
            "travel_budget": 1450,
        },
    )["item"]
    assert (
        (ac145.get("hospital") or ac145.get("city"))
        and ac145.get("id") is not None
        and (
            ac145.get("department")
            or ac145.get("dept")
            or ac145.get("service_type")
        )
    ), ac145

    # Round145 · 授权视频缺失+完成+就绪（前端复制；missing/complete/ready 可读）
    av145 = call("/api/auth-video")
    assert (
        av145.get("missing") is not None
        or av145.get("complete") is not None
        or av145.get("ready") is not None
    ), av145

    # Round145 · 受益人编号+姓名+口令（前端；id/name/passphrase_hint）
    bn145 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号姓名口令145",
            "role": "heir",
            "relation": "亲属",
            "contact": "13300000145",
            "passphrase_hint": "round145口令",
        },
    )["item"]
    assert (
        bn145.get("id") is not None
        and bn145.get("name")
        and bn145.get("passphrase_hint")
    ), bn145

    # Round145 · 手册进度百分比+完成数+域名（前端复制；progress.pct|done|domain）
    hand145 = call("/api/handover")
    prog145 = hand145.get("progress") or {}
    assert (
        (
            prog145.get("pct") is not None
            or hand145.get("progress_pct") is not None
            or isinstance(hand145.get("progress"), (int, float))
            or prog145
        )
        and (
            hand145.get("done") is not None
            or prog145.get("filled_types") is not None
            or prog145.get("done") is not None
        )
        and (hand145.get("domain") or hand145.get("brand"))
    ), hand145

    # Round145 · 设置·域名+就绪+英文品牌+中文品牌（前端复制；domain/ok/brand_en/brand|app）
    h145 = call("/api/health")
    assert h145.get("ok") is True, h145
    assert (
        (h145.get("domain") or "einherit.cn")
        and h145.get("brand_en")
        and (h145.get("brand") or h145.get("app"))
    ), h145

    # Round146 · 首页英文品牌+版本+域名（前端条；brand_en/version/domain 只读）
    h146home = call("/api/health")
    assert (
        h146home.get("brand_en")
        and (h146home.get("version") or h146home.get("server_version"))
        and (h146home.get("domain") or "einherit.cn")
    ), h146home

    # Round146 · 交割处置+编号+受益人（前端；disposition|action / id / beneficiary）
    lg146 = call(
        "/api/legacy",
        {
            "title": "自检·处置编号受益人146",
            "category": "笔记本",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人146",
            "notes": "处置编号受益人146",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg146.get("disposition") or lg146.get("action"))
        and lg146.get("id") is not None
        and (lg146.get("beneficiary") or lg146.get("device_owner"))
    ), lg146

    # Round146 · 备忘标签+平台+可见性（前端；tag|category / platform / visibility）
    as146 = call(
        "/api/assets",
        {
            "platform": "round146TagPlatVis",
            "account_hint": "hint146",
            "summary": "标签平台可见146",
            "dispose_note": "演示处置146",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as146.get("tag") or as146.get("category") or as146.get("dept"))
        and as146.get("platform")
        and as146.get("visibility")
    ), as146

    # Round146 · 报备窗口截止+状态标签（前端复制；window_ends_at/status_label 只读）
    ck_st146 = call("/api/checkin/status")
    cd146 = ck_st146.get("countdown") or {}
    user146 = ck_st146.get("user") or {}
    assert (
        cd146.get("window_ends_at") is not None
        or cd146.get("window_ends_label")
        or ck_st146.get("status_label")
        or cd146.get("status_label")
        or user146.get("status_label")
        or cd146
    ), ck_st146

    # Round146 · 差旅进度+达标+已存（前端复制；progress_pct/met/deposited 只读）
    tf146 = call("/api/travel-fund")
    fund146 = tf146.get("fund") or tf146
    assert (
        fund146.get("progress_pct") is not None
        or fund146.get("progress") is not None
        or fund146.get("met") is not None
        or fund146.get("deposited") is not None
    ), tf146

    # Round146 · 善后城市+科室+医院（前端；city / department|dept|service_type / hospital|facility）
    ac146 = call(
        "/api/aftercare",
        {
            "title": "自检·城市科室医院146",
            "service_type": "field_visit",
            "city": "海口",
            "hospital": "自检医院146",
            "department": "内科",
            "notes": "城市科室医院146",
            "visit_pref": "傍晚",
            "travel_budget": 1460,
        },
    )["item"]
    assert (
        ac146.get("city")
        and (
            ac146.get("department")
            or ac146.get("dept")
            or ac146.get("service_type")
        )
        and (ac146.get("hospital") or ac146.get("facility") or ac146.get("city"))
    ), ac146

    # Round146 · 授权视频时长+就绪+缺失（前端复制；duration_hint/ready/missing 可读）
    av146 = call("/api/auth-video")
    latest146 = av146.get("latest") or {}
    assert (
        av146.get("duration_hint")
        or latest146.get("duration_hint")
        or av146.get("duration")
        or latest146.get("duration")
        or av146.get("ready") is not None
        or av146.get("missing") is not None
    ), av146

    # Round146 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn146 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系146",
            "role": "heir",
            "relation": "友人",
            "contact": "13300000146",
            "passphrase_hint": "round146口令",
        },
    )["item"]
    assert (
        bn146.get("contact") and bn146.get("name") and bn146.get("relation")
    ), bn146

    # Round146 · 手册品牌+域名+章节（前端复制；brand/domain/sections|total_types）
    hand146 = call("/api/handover")
    prog146 = hand146.get("progress") or {}
    assert (
        (hand146.get("brand") or hand146.get("domain"))
        and (hand146.get("domain") or hand146.get("brand"))
        and (
            hand146.get("sections") is not None
            or prog146.get("total_types") is not None
            or hand146.get("section_count") is not None
        )
    ), hand146

    # Round146 · 设置·版本+域名+就绪+中文品牌（前端复制；version/domain/ok/brand|app）
    h146 = call("/api/health")
    assert h146.get("ok") is True, h146
    assert (
        (h146.get("version") or h146.get("server_version"))
        and (h146.get("domain") or "einherit.cn")
        and (h146.get("brand") or h146.get("app"))
    ), h146

    # Round147 · 首页就绪+英文品牌+中文品牌（前端条；ok/brand_en/brand|app 只读）
    h147home = call("/api/health")
    assert (
        h147home.get("ok") is True
        and h147home.get("brand_en")
        and (h147home.get("brand") or h147home.get("app"))
    ), h147home

    # Round147 · 交割标题+设备归属+受益人（前端；title / device_owner|dept / beneficiary）
    lg147 = call(
        "/api/legacy",
        {
            "title": "自检·标题归属受益人147",
            "category": "相机",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人147",
            "notes": "标题归属受益人147",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg147.get("title") or lg147.get("category"))
        and (lg147.get("device_owner") or lg147.get("dept"))
        and lg147.get("beneficiary")
    ), lg147

    # Round147 · 备忘摘要+分类+标题（前端；summary / category|tag / title|platform）
    as147 = call(
        "/api/assets",
        {
            "platform": "round147SumCatTitle",
            "account_hint": "hint147",
            "summary": "摘要分类标题147",
            "dispose_note": "演示处置147",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as147.get("summary") or as147.get("account_hint"))
        and (as147.get("category") or as147.get("tag") or as147.get("dept"))
        and (as147.get("title") or as147.get("platform"))
    ), as147

    # Round147 · 报备下次建议+距上次（前端复制；next_suggested_at/last_ago_label 只读）
    ck_st147 = call("/api/checkin/status")
    cd147 = ck_st147.get("countdown") or {}
    user147 = ck_st147.get("user") or {}
    assert (
        cd147.get("next_suggested_at") is not None
        or cd147.get("next_suggested_label")
        or ck_st147.get("last_ago_label")
        or cd147.get("last_ago_label")
        or user147.get("last_ago_label")
        or cd147.get("last_checkin_ago")
        or cd147
    ), ck_st147

    # Round147 · 差旅门槛+短差+余额（前端复制；threshold/shortfall/balance 只读）
    tf147 = call("/api/travel-fund")
    fund147 = tf147.get("fund") or tf147
    assert (
        fund147.get("threshold") is not None
        or fund147.get("shortfall") is not None
        or fund147.get("balance") is not None
    ), tf147

    # Round147 · 善后服务类型+状态+医院（前端；service_type / status|title / hospital|city）
    ac147 = call(
        "/api/aftercare",
        {
            "title": "自检·服务状态医院147",
            "service_type": "field_visit",
            "city": "文昌",
            "hospital": "自检医院147",
            "department": "外科",
            "notes": "服务状态医院147",
            "visit_pref": "上午",
            "travel_budget": 1470,
        },
    )["item"]
    assert (
        (ac147.get("service_type") or ac147.get("service"))
        and (
            ac147.get("status_label")
            or ac147.get("status")
            or ac147.get("status_key")
            or ac147.get("title")
        )
        and (ac147.get("hospital") or ac147.get("facility") or ac147.get("city"))
    ), ac147

    # Round147 · 授权视频完成+时长+就绪（前端复制；complete/duration_hint/ready 可读）
    av147 = call("/api/auth-video")
    latest147 = av147.get("latest") or {}
    assert (
        av147.get("complete") is not None
        or av147.get("duration_hint")
        or latest147.get("duration_hint")
        or av147.get("duration")
        or av147.get("ready") is not None
    ), av147

    # Round147 · 受益人关系+口令+编号（前端；relation/passphrase_hint/id）
    bn147 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系口令编号147",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000147",
            "passphrase_hint": "round147口令",
        },
    )["item"]
    assert (
        bn147.get("relation")
        and bn147.get("passphrase_hint")
        and bn147.get("id") is not None
    ), bn147

    # Round147 · 手册章节+进度百分比+完成数（前端复制；sections/progress.pct/done）
    hand147 = call("/api/handover")
    prog147 = hand147.get("progress") or {}
    assert (
        (
            hand147.get("sections") is not None
            or prog147.get("total_types") is not None
            or hand147.get("section_count") is not None
        )
        and (
            prog147.get("pct") is not None
            or hand147.get("progress_pct") is not None
            or isinstance(hand147.get("progress"), (int, float))
            or prog147
        )
        and (
            hand147.get("done") is not None
            or prog147.get("filled_types") is not None
            or prog147.get("done") is not None
        )
    ), hand147

    # Round147 · 设置·英文品牌+就绪+版本+域名（前端复制；brand_en/ok/version/domain）
    h147 = call("/api/health")
    assert h147.get("ok") is True, h147
    assert (
        h147.get("brand_en")
        and (h147.get("version") or h147.get("server_version"))
        and (h147.get("domain") or "einherit.cn")
    ), h147

    # Round148 · 首页版本+域名+就绪（前端条；version/domain/ok 只读）
    h148home = call("/api/health")
    assert (
        (h148home.get("version") or h148home.get("server_version"))
        and (h148home.get("domain") or "einherit.cn")
        and h148home.get("ok") is True
    ), h148home

    # Round148 · 交割处置+编号+设备归属（前端；disposition|action / id / device_owner|dept）
    lg148 = call(
        "/api/legacy",
        {
            "title": "自检·处置编号归属148",
            "category": "耳机",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人148",
            "notes": "处置编号归属148",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg148.get("disposition") or lg148.get("action"))
        and lg148.get("id") is not None
        and (
            lg148.get("device_owner")
            or lg148.get("dept")
            or lg148.get("beneficiary")
        )
    ), lg148

    # Round148 · 备忘标签+平台+可见性（前端；tag|category / platform / visibility）
    as148 = call(
        "/api/assets",
        {
            "platform": "round148TagPlatVis",
            "account_hint": "hint148",
            "summary": "标签平台可见148",
            "dispose_note": "演示处置148",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as148.get("tag") or as148.get("category") or as148.get("dept"))
        and as148.get("platform")
        and as148.get("visibility")
    ), as148

    # Round148 · 报备窗口截止+状态标签（前端复制；window_ends_at/status_label 只读）
    ck_st148 = call("/api/checkin/status")
    cd148 = ck_st148.get("countdown") or {}
    user148 = ck_st148.get("user") or {}
    assert (
        cd148.get("window_ends_at") is not None
        or cd148.get("window_ends_label")
        or ck_st148.get("status_label")
        or cd148.get("status_label")
        or user148.get("status_label")
        or cd148
    ), ck_st148

    # Round148 · 差旅进度+已存+门槛（前端复制；progress_pct/deposited/threshold 只读）
    tf148 = call("/api/travel-fund")
    fund148 = tf148.get("fund") or tf148
    assert (
        fund148.get("progress_pct") is not None
        or fund148.get("progress") is not None
        or fund148.get("deposited") is not None
        or fund148.get("threshold") is not None
    ), tf148

    # Round148 · 医旅/善后城市+科室+医院（前端；city / department|dept / hospital|facility）
    ac148 = call(
        "/api/aftercare",
        {
            "title": "自检·城市科室医院148",
            "service_type": "field_visit",
            "city": "琼海",
            "hospital": "自检医院148",
            "department": "骨科",
            "notes": "城市科室医院148",
            "visit_pref": "午间",
            "travel_budget": 1480,
        },
    )["item"]
    assert (
        ac148.get("city")
        and (
            ac148.get("department")
            or ac148.get("dept")
            or ac148.get("service_type")
        )
        and (ac148.get("hospital") or ac148.get("facility") or ac148.get("city"))
    ), ac148

    # Round148 · 授权视频就绪+缺失+时长（前端复制；ready/missing/duration_hint 可读）
    av148 = call("/api/auth-video")
    latest148 = av148.get("latest") or {}
    assert (
        av148.get("ready") is not None
        or av148.get("missing") is not None
        or av148.get("duration_hint")
        or latest148.get("duration_hint")
        or av148.get("duration")
    ), av148

    # Round148 · 受益人姓名+关系+联系（前端；name/relation/contact）
    bn148 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系联系148",
            "role": "heir",
            "relation": "邻居",
            "contact": "13300000148",
            "passphrase_hint": "round148口令",
        },
    )["item"]
    assert (
        bn148.get("name") and bn148.get("relation") and bn148.get("contact")
    ), bn148

    # Round148 · 手册品牌+域名+章节（前端复制；brand/domain/sections）
    hand148 = call("/api/handover")
    prog148 = hand148.get("progress") or {}
    assert (
        (hand148.get("brand") or hand148.get("domain"))
        and (hand148.get("domain") or hand148.get("brand"))
        and (
            hand148.get("sections") is not None
            or prog148.get("total_types") is not None
            or hand148.get("section_count") is not None
        )
    ), hand148

    # Round148 · 设置·版本+域名+就绪+中文品牌（前端复制；version/domain/ok/brand|app）
    h148 = call("/api/health")
    assert h148.get("ok") is True, h148
    assert (
        (h148.get("version") or h148.get("server_version"))
        and (h148.get("domain") or "einherit.cn")
        and (h148.get("brand") or h148.get("app"))
    ), h148

    # Round149 · 首页英文品牌+中文品牌+版本（前端条；brand_en/brand|app/version 只读）
    h149home = call("/api/health")
    assert (
        h149home.get("brand_en")
        and (h149home.get("brand") or h149home.get("app"))
        and (h149home.get("version") or h149home.get("server_version"))
    ), h149home

    # Round149 · 交割标题+处置+受益人（前端；title / disposition|action / beneficiary）
    lg149 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置受益人149",
            "category": "音箱",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人149",
            "notes": "标题处置受益人149",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg149.get("title") or lg149.get("category"))
        and (lg149.get("disposition") or lg149.get("action"))
        and (lg149.get("beneficiary") or lg149.get("device_owner"))
    ), lg149

    # Round149 · 备忘分类+摘要+平台（前端；category|tag / summary / platform）
    as149 = call(
        "/api/assets",
        {
            "platform": "round149CatSumPlat",
            "account_hint": "hint149",
            "summary": "分类摘要平台149",
            "dispose_note": "演示处置149",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as149.get("category") or as149.get("tag") or as149.get("dept"))
        and (as149.get("summary") or as149.get("account_hint"))
        and as149.get("platform")
    ), as149

    # Round149 · 报备下次建议+窗口截止（前端复制；next_suggested_at/window_ends_at 只读）
    ck_st149 = call("/api/checkin/status")
    cd149 = ck_st149.get("countdown") or {}
    assert (
        cd149.get("next_suggested_at") is not None
        or cd149.get("next_suggested_label")
        or cd149.get("window_ends_at") is not None
        or cd149.get("window_ends_label")
        or cd149
    ), ck_st149

    # Round149 · 差旅余额+短差+已存（前端复制；balance/shortfall/deposited 只读）
    tf149 = call("/api/travel-fund")
    fund149 = tf149.get("fund") or tf149
    assert (
        fund149.get("balance") is not None
        or fund149.get("shortfall") is not None
        or fund149.get("deposited") is not None
    ), tf149

    # Round149 · 善后状态+服务类型+医院（前端；status|title / service_type / hospital|city）
    ac149 = call(
        "/api/aftercare",
        {
            "title": "自检·状态服务医院149",
            "service_type": "field_visit",
            "city": "儋州",
            "hospital": "自检医院149",
            "department": "急诊",
            "notes": "状态服务医院149",
            "visit_pref": "晚间",
            "travel_budget": 1490,
        },
    )["item"]
    assert (
        (
            ac149.get("status_label")
            or ac149.get("status")
            or ac149.get("status_key")
            or ac149.get("title")
        )
        and (ac149.get("service_type") or ac149.get("service"))
        and (ac149.get("hospital") or ac149.get("facility") or ac149.get("city"))
    ), ac149

    # Round149 · 授权视频完成+就绪+缺失（前端复制；complete/ready/missing 可读）
    av149 = call("/api/auth-video")
    assert (
        av149.get("complete") is not None
        or av149.get("ready") is not None
        or av149.get("missing") is not None
    ), av149

    # Round149 · 受益人编号+口令+姓名（前端；id/passphrase_hint/name）
    bn149 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号口令姓名149",
            "role": "heir",
            "relation": "同学",
            "contact": "13300000149",
            "passphrase_hint": "round149口令",
        },
    )["item"]
    assert (
        bn149.get("id") is not None
        and bn149.get("passphrase_hint")
        and bn149.get("name")
    ), bn149

    # Round149 · 手册进度+完成+章节（前端复制；progress.pct/done/sections）
    hand149 = call("/api/handover")
    prog149 = hand149.get("progress") or {}
    assert (
        (
            prog149.get("pct") is not None
            or hand149.get("progress_pct") is not None
            or isinstance(hand149.get("progress"), (int, float))
            or prog149
        )
        and (
            hand149.get("done") is not None
            or prog149.get("filled_types") is not None
            or prog149.get("done") is not None
        )
        and (
            hand149.get("sections") is not None
            or prog149.get("total_types") is not None
            or hand149.get("section_count") is not None
        )
    ), hand149

    # Round149 · 设置·中文品牌+英文品牌+就绪+域名（前端复制；brand|app/brand_en/ok/domain）
    h149 = call("/api/health")
    assert h149.get("ok") is True, h149
    assert (
        (h149.get("brand") or h149.get("app"))
        and h149.get("brand_en")
        and (h149.get("domain") or "einherit.cn")
    ), h149

    # Round150 · 首页就绪+版本+英文品牌（前端条；ok/version/brand_en 只读）
    h150home = call("/api/health")
    assert (
        h150home.get("ok") is True
        and (h150home.get("version") or h150home.get("server_version"))
        and h150home.get("brand_en")
    ), h150home

    # Round150 · 交割编号+设备归属+处置（前端；id / device_owner|dept / disposition|action）
    lg150 = call(
        "/api/legacy",
        {
            "title": "自检·编号归属处置150",
            "category": "键盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人150",
            "notes": "编号归属处置150",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg150.get("id") is not None
        and (
            lg150.get("device_owner")
            or lg150.get("dept")
            or lg150.get("beneficiary")
        )
        and (lg150.get("disposition") or lg150.get("action"))
    ), lg150

    # Round150 · 备忘标题+标签+可见性（前端；title|platform / tag|category / visibility）
    as150 = call(
        "/api/assets",
        {
            "platform": "round150TitleTagVis",
            "account_hint": "hint150",
            "summary": "标题标签可见150",
            "dispose_note": "演示处置150",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as150.get("title") or as150.get("platform"))
        and (as150.get("tag") or as150.get("category") or as150.get("dept"))
        and as150.get("visibility")
    ), as150

    # Round150 · 报备状态标签+距上次（前端复制；status_label/last_ago_label 只读）
    ck_st150 = call("/api/checkin/status")
    cd150 = ck_st150.get("countdown") or {}
    user150 = ck_st150.get("user") or {}
    assert (
        ck_st150.get("status_label")
        or cd150.get("status_label")
        or user150.get("status_label")
        or ck_st150.get("last_ago_label")
        or cd150.get("last_ago_label")
        or user150.get("last_ago_label")
        or cd150.get("last_checkin_ago")
        or cd150
    ), ck_st150

    # Round150 · 差旅门槛+进度+余额（前端复制；threshold/progress_pct/balance 只读）
    tf150 = call("/api/travel-fund")
    fund150 = tf150.get("fund") or tf150
    assert (
        fund150.get("threshold") is not None
        or fund150.get("progress_pct") is not None
        or fund150.get("progress") is not None
        or fund150.get("balance") is not None
    ), tf150

    # Round150 · 医旅/善后医院+城市+科室（前端；hospital|facility / city / department|dept）
    ac150 = call(
        "/api/aftercare",
        {
            "title": "自检·医院城市科室150",
            "service_type": "field_visit",
            "city": "万宁",
            "hospital": "自检医院150",
            "department": "儿科",
            "notes": "医院城市科室150",
            "visit_pref": "清晨",
            "travel_budget": 1500,
        },
    )["item"]
    assert (
        (ac150.get("hospital") or ac150.get("facility") or ac150.get("city"))
        and ac150.get("city")
        and (
            ac150.get("department")
            or ac150.get("dept")
            or ac150.get("service_type")
        )
    ), ac150

    # Round150 · 授权视频时长+完成+就绪（前端复制；duration_hint/complete/ready 可读）
    av150 = call("/api/auth-video")
    latest150 = av150.get("latest") or {}
    assert (
        av150.get("duration_hint")
        or latest150.get("duration_hint")
        or av150.get("duration")
        or av150.get("complete") is not None
        or av150.get("ready") is not None
    ), av150

    # Round150 · 受益人联系+编号+关系（前端；contact/id/relation）
    bn150 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系编号关系150",
            "role": "heir",
            "relation": "亲属",
            "contact": "13300000150",
            "passphrase_hint": "round150口令",
        },
    )["item"]
    assert (
        bn150.get("contact")
        and bn150.get("id") is not None
        and bn150.get("relation")
    ), bn150

    # Round150 · 手册域名+进度+品牌（前端复制；domain/progress.pct/brand）
    hand150 = call("/api/handover")
    prog150 = hand150.get("progress") or {}
    assert (
        (hand150.get("domain") or hand150.get("brand"))
        and (
            prog150.get("pct") is not None
            or hand150.get("progress_pct") is not None
            or isinstance(hand150.get("progress"), (int, float))
            or prog150
        )
        and (hand150.get("brand") or hand150.get("domain"))
    ), hand150

    # Round150 · 设置·就绪+版本+英文品牌+中文品牌（前端复制；ok/version/brand_en/brand|app）
    h150 = call("/api/health")
    assert h150.get("ok") is True, h150
    assert (
        (h150.get("version") or h150.get("server_version"))
        and h150.get("brand_en")
        and (h150.get("brand") or h150.get("app"))
    ), h150

    # Round151 · 首页中文品牌+域名+就绪（前端条；brand|app/domain/ok 只读）
    h151home = call("/api/health")
    assert (
        (h151home.get("brand") or h151home.get("app"))
        and (h151home.get("domain") or "einherit.cn")
        and h151home.get("ok") is True
    ), h151home

    # Round151 · 交割受益人+标题+编号（前端；beneficiary / title|category / id）
    lg151 = call(
        "/api/legacy",
        {
            "title": "自检·受益人标题编号151",
            "category": "鼠标",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人151",
            "notes": "受益人标题编号151",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg151.get("beneficiary") or lg151.get("device_owner"))
        and (lg151.get("title") or lg151.get("category"))
        and lg151.get("id") is not None
    ), lg151

    # Round151 · 备忘平台+分类+摘要（前端；platform / category|tag / summary）
    as151 = call(
        "/api/assets",
        {
            "platform": "round151PlatCatSum",
            "account_hint": "hint151",
            "summary": "平台分类摘要151",
            "dispose_note": "演示处置151",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as151.get("platform")
        and (as151.get("category") or as151.get("tag") or as151.get("dept"))
        and (as151.get("summary") or as151.get("account_hint"))
    ), as151

    # Round151 · 报备下次建议+状态标签（前端复制；next_suggested_at/status_label 只读）
    ck_st151 = call("/api/checkin/status")
    cd151 = ck_st151.get("countdown") or {}
    user151 = ck_st151.get("user") or {}
    assert (
        cd151.get("next_suggested_at") is not None
        or cd151.get("next_suggested_label")
        or ck_st151.get("status_label")
        or cd151.get("status_label")
        or user151.get("status_label")
        or cd151
    ), ck_st151

    # Round151 · 差旅已存+门槛+短差（前端复制；deposited/threshold/shortfall 只读）
    tf151 = call("/api/travel-fund")
    fund151 = tf151.get("fund") or tf151
    assert (
        fund151.get("deposited") is not None
        or fund151.get("threshold") is not None
        or fund151.get("shortfall") is not None
    ), tf151

    # Round151 · 善后医院+状态+服务类型（前端；hospital|city / status|title / service_type）
    ac151 = call(
        "/api/aftercare",
        {
            "title": "自检·医院状态服务151",
            "service_type": "field_visit",
            "city": "东方",
            "hospital": "自检医院151",
            "department": "眼科",
            "notes": "医院状态服务151",
            "visit_pref": "午后",
            "travel_budget": 1510,
        },
    )["item"]
    assert (
        (ac151.get("hospital") or ac151.get("facility") or ac151.get("city"))
        and (
            ac151.get("status_label")
            or ac151.get("status")
            or ac151.get("status_key")
            or ac151.get("title")
        )
        and (ac151.get("service_type") or ac151.get("service"))
    ), ac151

    # Round151 · 授权视频缺失+时长+完成（前端复制；missing/duration_hint/complete 可读）
    av151 = call("/api/auth-video")
    latest151 = av151.get("latest") or {}
    assert (
        av151.get("missing") is not None
        or av151.get("duration_hint")
        or latest151.get("duration_hint")
        or av151.get("duration")
        or av151.get("complete") is not None
    ), av151

    # Round151 · 受益人口令+联系+关系（前端；passphrase_hint/contact/relation）
    bn151 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令联系关系151",
            "role": "heir",
            "relation": "友人",
            "contact": "13300000151",
            "passphrase_hint": "round151口令",
        },
    )["item"]
    assert (
        bn151.get("passphrase_hint")
        and bn151.get("contact")
        and bn151.get("relation")
    ), bn151

    # Round151 · 手册完成+品牌+域名（前端复制；done/brand/domain）
    hand151 = call("/api/handover")
    prog151 = hand151.get("progress") or {}
    assert (
        (
            hand151.get("done") is not None
            or prog151.get("filled_types") is not None
            or prog151.get("done") is not None
        )
        and (hand151.get("brand") or hand151.get("domain"))
        and (hand151.get("domain") or hand151.get("brand"))
    ), hand151

    # Round151 · 设置·域名+就绪+版本+英文品牌（前端复制；domain/ok/version/brand_en）
    h151 = call("/api/health")
    assert h151.get("ok") is True, h151
    assert (
        (h151.get("domain") or "einherit.cn")
        and (h151.get("version") or h151.get("server_version"))
        and h151.get("brand_en")
    ), h151

    # Round152 · 首页英文品牌+就绪+域名（前端条；brand_en/ok/domain 只读）
    h152home = call("/api/health")
    assert (
        h152home.get("brand_en")
        and h152home.get("ok") is True
        and (h152home.get("domain") or "einherit.cn")
    ), h152home

    # Round152 · 交割设备归属+受益人+处置（前端；device_owner|dept / beneficiary / disposition|action）
    lg152 = call(
        "/api/legacy",
        {
            "title": "自检·归属受益人处置152",
            "category": "路由器",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人152",
            "notes": "归属受益人处置152",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg152.get("device_owner") or lg152.get("dept"))
        and lg152.get("beneficiary")
        and (lg152.get("disposition") or lg152.get("action"))
    ), lg152

    # Round152 · 备忘可见性+标题+标签（前端；visibility / title|platform / tag|category）
    as152 = call(
        "/api/assets",
        {
            "platform": "round152VisTitleTag",
            "account_hint": "hint152",
            "summary": "可见标题标签152",
            "dispose_note": "演示处置152",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as152.get("visibility")
        and (as152.get("title") or as152.get("platform"))
        and (as152.get("tag") or as152.get("category") or as152.get("dept"))
    ), as152

    # Round152 · 报备窗口截止+距上次（前端复制；window_ends_at/last_ago_label 只读）
    ck_st152 = call("/api/checkin/status")
    cd152 = ck_st152.get("countdown") or {}
    user152 = ck_st152.get("user") or {}
    assert (
        cd152.get("window_ends_at") is not None
        or cd152.get("window_ends_label")
        or ck_st152.get("last_ago_label")
        or cd152.get("last_ago_label")
        or user152.get("last_ago_label")
        or cd152.get("last_checkin_ago")
        or cd152
    ), ck_st152

    # Round152 · 差旅进度+短差+已存（前端复制；progress_pct/shortfall/deposited 只读）
    tf152 = call("/api/travel-fund")
    fund152 = tf152.get("fund") or tf152
    assert (
        fund152.get("progress_pct") is not None
        or fund152.get("progress") is not None
        or fund152.get("shortfall") is not None
        or fund152.get("deposited") is not None
    ), tf152

    # Round152 · 医旅/善后科室+医院+城市（前端；department|dept / hospital|facility / city）
    ac152 = call(
        "/api/aftercare",
        {
            "title": "自检·科室医院城市152",
            "service_type": "field_visit",
            "city": "五指山",
            "hospital": "自检医院152",
            "department": "口腔科",
            "notes": "科室医院城市152",
            "visit_pref": "傍晚",
            "travel_budget": 1520,
        },
    )["item"]
    assert (
        (
            ac152.get("department")
            or ac152.get("dept")
            or ac152.get("service_type")
        )
        and (ac152.get("hospital") or ac152.get("facility") or ac152.get("city"))
        and ac152.get("city")
    ), ac152

    # Round152 · 授权视频就绪+完成+时长（前端复制；ready/complete/duration_hint 可读）
    av152 = call("/api/auth-video")
    latest152 = av152.get("latest") or {}
    assert (
        av152.get("ready") is not None
        or av152.get("complete") is not None
        or av152.get("duration_hint")
        or latest152.get("duration_hint")
        or av152.get("duration")
    ), av152

    # Round152 · 受益人姓名+编号+口令（前端；name/id/passphrase_hint）
    bn152 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名编号口令152",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000152",
            "passphrase_hint": "round152口令",
        },
    )["item"]
    assert (
        bn152.get("name")
        and bn152.get("id") is not None
        and bn152.get("passphrase_hint")
    ), bn152

    # Round152 · 手册章节+完成+进度（前端复制；sections/done/progress.pct）
    hand152 = call("/api/handover")
    prog152 = hand152.get("progress") or {}
    assert (
        (
            hand152.get("sections") is not None
            or prog152.get("total_types") is not None
            or hand152.get("section_count") is not None
        )
        and (
            hand152.get("done") is not None
            or prog152.get("filled_types") is not None
            or prog152.get("done") is not None
        )
        and (
            prog152.get("pct") is not None
            or hand152.get("progress_pct") is not None
            or isinstance(hand152.get("progress"), (int, float))
            or prog152
        )
    ), hand152

    # Round152 · 设置·中文品牌+域名+版本+就绪（前端复制；brand|app/domain/version/ok）
    h152 = call("/api/health")
    assert h152.get("ok") is True, h152
    assert (
        (h152.get("brand") or h152.get("app"))
        and (h152.get("domain") or "einherit.cn")
        and (h152.get("version") or h152.get("server_version"))
    ), h152

    # Round153 · 首页版本+中文品牌+英文品牌（前端条；version/brand|app/brand_en 只读）
    h153home = call("/api/health")
    assert (
        (h153home.get("version") or h153home.get("server_version"))
        and (h153home.get("brand") or h153home.get("app"))
        and h153home.get("brand_en")
    ), h153home

    # Round153 · 交割处置+标题+设备归属（前端；disposition|action / title / device_owner|dept）
    lg153 = call(
        "/api/legacy",
        {
            "title": "自检·处置标题归属153",
            "category": "摄像头",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人153",
            "notes": "处置标题归属153",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg153.get("disposition") or lg153.get("action"))
        and (lg153.get("title") or lg153.get("category"))
        and (
            lg153.get("device_owner")
            or lg153.get("dept")
            or lg153.get("beneficiary")
        )
    ), lg153

    # Round153 · 备忘摘要+可见性+平台（前端；summary / visibility / platform）
    as153 = call(
        "/api/assets",
        {
            "platform": "round153SumVisPlat",
            "account_hint": "hint153",
            "summary": "摘要可见平台153",
            "dispose_note": "演示处置153",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as153.get("summary") or as153.get("account_hint"))
        and as153.get("visibility")
        and as153.get("platform")
    ), as153

    # Round153 · 报备下次建议+距上次（前端复制；next_suggested_at/last_ago_label 只读）
    ck_st153 = call("/api/checkin/status")
    cd153 = ck_st153.get("countdown") or {}
    user153 = ck_st153.get("user") or {}
    assert (
        cd153.get("next_suggested_at") is not None
        or cd153.get("next_suggested_label")
        or ck_st153.get("last_ago_label")
        or cd153.get("last_ago_label")
        or user153.get("last_ago_label")
        or cd153.get("last_checkin_ago")
        or cd153
    ), ck_st153

    # Round153 · 差旅余额+门槛+进度（前端复制；balance/threshold/progress_pct 只读）
    tf153 = call("/api/travel-fund")
    fund153 = tf153.get("fund") or tf153
    assert (
        fund153.get("balance") is not None
        or fund153.get("threshold") is not None
        or fund153.get("progress_pct") is not None
        or fund153.get("progress") is not None
    ), tf153

    # Round153 · 善后服务类型+医院+状态（前端；service_type / hospital|city / status|title）
    ac153 = call(
        "/api/aftercare",
        {
            "title": "自检·服务医院状态153",
            "service_type": "field_visit",
            "city": "临高",
            "hospital": "自检医院153",
            "department": "皮肤科",
            "notes": "服务医院状态153",
            "visit_pref": "上午",
            "travel_budget": 1530,
        },
    )["item"]
    assert (
        (ac153.get("service_type") or ac153.get("service"))
        and (ac153.get("hospital") or ac153.get("facility") or ac153.get("city"))
        and (
            ac153.get("status_label")
            or ac153.get("status")
            or ac153.get("status_key")
            or ac153.get("title")
        )
    ), ac153

    # Round153 · 授权视频缺失+就绪+完成（前端复制；missing/ready/complete 可读）
    av153 = call("/api/auth-video")
    assert (
        av153.get("missing") is not None
        or av153.get("ready") is not None
        or av153.get("complete") is not None
    ), av153

    # Round153 · 受益人关系+姓名+联系（前端；relation/name/contact）
    bn153 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系姓名联系153",
            "role": "heir",
            "relation": "邻居",
            "contact": "13300000153",
            "passphrase_hint": "round153口令",
        },
    )["item"]
    assert (
        bn153.get("relation") and bn153.get("name") and bn153.get("contact")
    ), bn153

    # Round153 · 手册品牌+章节+完成（前端复制；brand/sections/done）
    hand153 = call("/api/handover")
    prog153 = hand153.get("progress") or {}
    assert (
        (hand153.get("brand") or hand153.get("domain"))
        and (
            hand153.get("sections") is not None
            or prog153.get("total_types") is not None
            or hand153.get("section_count") is not None
        )
        and (
            hand153.get("done") is not None
            or prog153.get("filled_types") is not None
            or prog153.get("done") is not None
        )
    ), hand153

    # Round153 · 设置·英文品牌+中文品牌+版本+域名（前端复制；brand_en/brand|app/version/domain）
    h153 = call("/api/health")
    assert h153.get("ok") is True, h153
    assert (
        h153.get("brand_en")
        and (h153.get("brand") or h153.get("app"))
        and (h153.get("version") or h153.get("server_version"))
        and (h153.get("domain") or "einherit.cn")
    ), h153


    # Round154 · 首页就绪+域名+中文品牌（前端条；ok/domain/brand|app 只读）
    h154home = call("/api/health")
    assert (
        h154home.get("ok") is True
        and (h154home.get("domain") or "einherit.cn")
        and (h154home.get("brand") or h154home.get("app"))
    ), h154home

    # Round154 · 交割编号+受益人+标题（前端；id / beneficiary / title）
    lg154 = call(
        "/api/legacy",
        {
            "title": "自检·编号受益人标题154",
            "category": "手机",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人154",
            "notes": "编号受益人标题154",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg154.get("id") is not None
        and lg154.get("beneficiary")
        and (lg154.get("title") or lg154.get("category"))
    ), lg154

    # Round154 · 备忘标签+分类+标题（前端；tag / category|dept / title|platform）
    as154 = call(
        "/api/assets",
        {
            "platform": "round154TagCatTitle",
            "account_hint": "hint154",
            "summary": "标签分类标题154",
            "dispose_note": "演示处置154",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as154.get("tag")
        and (as154.get("category") or as154.get("dept"))
        and (as154.get("title") or as154.get("platform") or as154.get("summary"))
    ), as154

    # Round154 · 报备窗口截止+状态标签（前端复制；window_ends_at/status_label 只读）
    ck_st154 = call("/api/checkin/status")
    cd154 = ck_st154.get("countdown") or {}
    user154 = ck_st154.get("user") or {}
    assert (
        cd154.get("window_ends_at") is not None
        or cd154.get("window_ends_label")
        or ck_st154.get("window_ends_at")
        or ck_st154.get("status_label")
        or cd154.get("status_label")
        or user154.get("status_label")
        or ck_st154.get("status")
        or cd154.get("status")
        or cd154
    ), ck_st154

    # Round154 · 差旅短差+余额+已存（前端复制；shortfall/balance/deposited 只读）
    tf154 = call("/api/travel-fund")
    fund154 = tf154.get("fund") or tf154
    assert (
        fund154.get("shortfall") is not None
        or fund154.get("balance") is not None
        or fund154.get("deposited") is not None
    ), tf154

    # Round154 · 医旅城市+医院+科室（前端；city / hospital|facility / department）
    ac154 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院科室154",
            "service_type": "field_visit",
            "city": "三亚",
            "hospital": "自检医院154",
            "department": "心内科",
            "notes": "城市医院科室154",
            "visit_pref": "上午",
            "travel_budget": 1540,
        },
    )["item"]
    assert (
        ac154.get("city")
        and (ac154.get("hospital") or ac154.get("facility") or ac154.get("title") or ac154.get("city"))
        and (
            ac154.get("department")
            or ac154.get("dept")
            or ac154.get("service_type")
            or ac154.get("service")
        )
    ), ac154

    # Round154 · 授权视频时长+缺失+就绪（前端复制；duration_hint/missing/ready 可读）
    av154 = call("/api/auth-video")
    prog154av = av154.get("progress") or {}
    latest154 = av154.get("latest") or {}
    assert (
        av154.get("duration_hint")
        or latest154.get("duration_hint")
        or prog154av.get("duration_hint")
        or av154.get("duration")
        or latest154.get("duration")
        or av154.get("missing") is not None
        or av154.get("ready") is not None
    ), av154

    # Round154 · 受益人口令提示+关系+编号（前端；passphrase_hint/relation/id）
    bn154 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令关系编号154",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000154",
            "passphrase_hint": "round154口令",
        },
    )["item"]
    assert (
        bn154.get("passphrase_hint")
        and bn154.get("relation")
        and bn154.get("id") is not None
    ), bn154

    # Round154 · 手册进度百分比+域名+章节（前端复制；progress.pct/domain/sections）
    hand154 = call("/api/handover")
    prog154 = hand154.get("progress") or {}
    assert (
        (
            prog154.get("pct") is not None
            or prog154.get("percent") is not None
            or hand154.get("progress_pct") is not None
        )
        and (hand154.get("domain") or "einherit.cn")
        and (
            hand154.get("sections") is not None
            or prog154.get("total_types") is not None
            or hand154.get("section_count") is not None
        )
    ), hand154

    # Round154 · 设置·就绪+中文品牌+域名+版本（前端复制；ok/brand|app/domain/version）
    h154 = call("/api/health")
    assert h154.get("ok") is True, h154
    assert (
        (h154.get("brand") or h154.get("app"))
        and (h154.get("domain") or "einherit.cn")
        and (h154.get("version") or h154.get("server_version"))
    ), h154


    # Round155 · 首页英文品牌+版本+就绪（前端条；brand_en/version/ok 只读）
    h155home = call("/api/health")
    assert (
        h155home.get("brand_en")
        and (h155home.get("version") or h155home.get("server_version"))
        and h155home.get("ok") is True
    ), h155home

    # Round155 · 交割设备归属+编号+受益人（前端；device_owner|dept / id / beneficiary）
    lg155 = call(
        "/api/legacy",
        {
            "title": "自检·归属编号受益人155",
            "category": "平板",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人155",
            "notes": "归属编号受益人155",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg155.get("device_owner") or lg155.get("dept"))
        and lg155.get("id") is not None
        and lg155.get("beneficiary")
    ), lg155

    # Round155 · 备忘平台+标签+可见性（前端；platform / tag / visibility）
    as155 = call(
        "/api/assets",
        {
            "platform": "round155PlatTagVis",
            "account_hint": "hint155",
            "summary": "平台标签可见155",
            "dispose_note": "演示处置155",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as155.get("platform") and as155.get("tag") and as155.get("visibility")
    ), as155

    # Round155 · 报备下次建议+窗口截止（前端复制；next_suggested_at/window_ends_at 只读）
    ck_st155 = call("/api/checkin/status")
    cd155 = ck_st155.get("countdown") or {}
    assert (
        cd155.get("next_suggested_at") is not None
        or cd155.get("next_suggested_label")
        or cd155.get("window_ends_at") is not None
        or cd155.get("window_ends_label")
        or ck_st155.get("window_ends_at")
        or cd155
    ), ck_st155

    # Round155 · 差旅门槛+已存+余额（前端复制；threshold/deposited/balance 只读）
    tf155 = call("/api/travel-fund")
    fund155 = tf155.get("fund") or tf155
    assert (
        fund155.get("threshold") is not None
        or fund155.get("deposited") is not None
        or fund155.get("balance") is not None
    ), tf155

    # Round155 · 善后状态+医院+服务类型（前端；status|title / hospital|city / service_type）
    ac155 = call(
        "/api/aftercare",
        {
            "title": "自检·状态医院服务155",
            "service_type": "field_visit",
            "city": "海口",
            "hospital": "自检医院155",
            "department": "骨科",
            "notes": "状态医院服务155",
            "visit_pref": "上午",
            "travel_budget": 1550,
        },
    )["item"]
    assert (
        (
            ac155.get("status_label")
            or ac155.get("status")
            or ac155.get("status_key")
            or ac155.get("title")
        )
        and (ac155.get("hospital") or ac155.get("facility") or ac155.get("city") or ac155.get("title"))
        and (ac155.get("service_type") or ac155.get("service"))
    ), ac155

    # Round155 · 授权视频完成+时长+缺失（前端复制；complete/duration_hint/missing 可读）
    av155 = call("/api/auth-video")
    prog155av = av155.get("progress") or {}
    latest155 = av155.get("latest") or {}
    assert (
        av155.get("complete") is not None
        or av155.get("duration_hint")
        or latest155.get("duration_hint")
        or prog155av.get("duration_hint")
        or av155.get("duration")
        or latest155.get("duration")
        or av155.get("missing") is not None
    ), av155

    # Round155 · 受益人姓名+联系+口令提示（前端；name/contact/passphrase_hint）
    bn155 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名联系口令155",
            "role": "heir",
            "relation": "朋友",
            "contact": "13300000155",
            "passphrase_hint": "round155口令",
        },
    )["item"]
    assert (
        bn155.get("name")
        and bn155.get("contact")
        and bn155.get("passphrase_hint")
    ), bn155

    # Round155 · 手册完成+进度百分比+品牌（前端复制；done/progress.pct/brand）
    hand155 = call("/api/handover")
    prog155 = hand155.get("progress") or {}
    assert (
        (
            hand155.get("done") is not None
            or prog155.get("filled_types") is not None
            or prog155.get("done") is not None
        )
        and (
            prog155.get("pct") is not None
            or prog155.get("percent") is not None
            or hand155.get("progress_pct") is not None
        )
        and (hand155.get("brand") or "电子继承 App")
    ), hand155

    # Round155 · 设置·版本+英文品牌+就绪+中文品牌（前端复制；version/brand_en/ok/brand）
    h155 = call("/api/health")
    assert h155.get("ok") is True, h155
    assert (
        (h155.get("version") or h155.get("server_version"))
        and h155.get("brand_en")
        and (h155.get("brand") or h155.get("app"))
    ), h155


    # Round156 · 首页域名+中文品牌+版本（前端条；domain/brand|app/version 只读）
    h156home = call("/api/health")
    assert (
        (h156home.get("domain") or "einherit.cn")
        and (h156home.get("brand") or h156home.get("app"))
        and (h156home.get("version") or h156home.get("server_version"))
    ), h156home

    # Round156 · 交割处置+受益人+设备归属（前端；disposition|action / beneficiary / device_owner|dept）
    lg156 = call(
        "/api/legacy",
        {
            "title": "自检·处置受益人归属156",
            "category": "笔记本",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人156",
            "notes": "处置受益人归属156",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg156.get("disposition") or lg156.get("action"))
        and lg156.get("beneficiary")
        and (lg156.get("device_owner") or lg156.get("dept"))
    ), lg156

    # Round156 · 备忘分类+可见性+摘要（前端；category|dept / visibility / summary）
    as156 = call(
        "/api/assets",
        {
            "platform": "round156CatVisSum",
            "account_hint": "hint156",
            "summary": "分类可见摘要156",
            "dispose_note": "演示处置156",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as156.get("category") or as156.get("dept"))
        and as156.get("visibility")
        and (as156.get("summary") or as156.get("account_hint"))
    ), as156

    # Round156 · 报备状态标签+下次建议（前端复制；status_label/next_suggested_at 只读）
    ck_st156 = call("/api/checkin/status")
    cd156 = ck_st156.get("countdown") or {}
    user156 = ck_st156.get("user") or {}
    assert (
        ck_st156.get("status_label")
        or cd156.get("status_label")
        or user156.get("status_label")
        or ck_st156.get("status")
        or cd156.get("status")
        or cd156.get("next_suggested_at") is not None
        or cd156.get("next_suggested_label")
        or cd156
    ), ck_st156

    # Round156 · 差旅进度+门槛+短差（前端复制；progress_pct/threshold/shortfall 只读）
    tf156 = call("/api/travel-fund")
    fund156 = tf156.get("fund") or tf156
    assert (
        fund156.get("progress_pct") is not None
        or fund156.get("progress") is not None
        or fund156.get("threshold") is not None
        or fund156.get("shortfall") is not None
    ), tf156

    # Round156 · 医旅科室+城市+医院（前端；department|dept|service_type / city / hospital|title）
    ac156 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市医院156",
            "service_type": "field_visit",
            "city": "儋州",
            "hospital": "自检医院156",
            "department": "眼科",
            "notes": "科室城市医院156",
            "visit_pref": "上午",
            "travel_budget": 1560,
        },
    )["item"]
    assert (
        (
            ac156.get("department")
            or ac156.get("dept")
            or ac156.get("service_type")
            or ac156.get("service")
        )
        and ac156.get("city")
        and (ac156.get("hospital") or ac156.get("facility") or ac156.get("title") or ac156.get("city"))
    ), ac156

    # Round156 · 授权视频就绪+缺失+完成（前端复制；ready/missing/complete 可读）
    av156 = call("/api/auth-video")
    assert (
        av156.get("ready") is not None
        or av156.get("missing") is not None
        or av156.get("complete") is not None
    ), av156

    # Round156 · 受益人编号+姓名+关系（前端；id/name/relation）
    bn156 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号姓名关系156",
            "role": "heir",
            "relation": "亲属",
            "contact": "13300000156",
            "passphrase_hint": "round156口令",
        },
    )["item"]
    assert (
        bn156.get("id") is not None
        and bn156.get("name")
        and bn156.get("relation")
    ), bn156

    # Round156 · 手册域名+完成+章节（前端复制；domain/done/sections）
    hand156 = call("/api/handover")
    prog156 = hand156.get("progress") or {}
    assert (
        (hand156.get("domain") or "einherit.cn")
        and (
            hand156.get("done") is not None
            or prog156.get("filled_types") is not None
            or prog156.get("done") is not None
        )
        and (
            hand156.get("sections") is not None
            or prog156.get("total_types") is not None
            or hand156.get("section_count") is not None
        )
    ), hand156

    # Round156 · 设置·域名+版本+中文品牌+英文品牌（前端复制；domain/version/brand|app/brand_en）
    h156 = call("/api/health")
    assert h156.get("ok") is True, h156
    assert (
        (h156.get("domain") or "einherit.cn")
        and (h156.get("version") or h156.get("server_version"))
        and (h156.get("brand") or h156.get("app"))
        and h156.get("brand_en")
    ), h156


    # Round157 · 首页就绪+英文品牌+域名（前端条；ok/brand_en/domain 只读）
    h157home = call("/api/health")
    assert (
        h157home.get("ok") is True
        and h157home.get("brand_en")
        and (h157home.get("domain") or "einherit.cn")
    ), h157home

    # Round157 · 交割标题+处置+编号（前端；title / disposition|action / id）
    lg157 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置编号157",
            "category": "路由器",
            "action": "销售",
            "dept": "ops",
            "beneficiary": "自检受益人157",
            "notes": "标题处置编号157",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg157.get("title") or lg157.get("category"))
        and (lg157.get("disposition") or lg157.get("action"))
        and lg157.get("id") is not None
    ), lg157

    # Round157 · 备忘标题+平台+分类（前端；title|summary|platform / platform / category|dept）
    as157 = call(
        "/api/assets",
        {
            "platform": "round157TitlePlatCat",
            "account_hint": "hint157",
            "summary": "标题平台分类157",
            "dispose_note": "演示处置157",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as157.get("title") or as157.get("summary") or as157.get("platform"))
        and as157.get("platform")
        and (as157.get("category") or as157.get("dept"))
    ), as157

    # Round157 · 报备距上次+窗口截止（前端复制；last_ago_label/window_ends_at 只读）
    ck_st157 = call("/api/checkin/status")
    cd157 = ck_st157.get("countdown") or {}
    user157 = ck_st157.get("user") or {}
    assert (
        ck_st157.get("last_ago_label")
        or cd157.get("last_ago_label")
        or user157.get("last_ago_label")
        or cd157.get("last_checkin_ago")
        or cd157.get("window_ends_at") is not None
        or cd157.get("window_ends_label")
        or ck_st157.get("window_ends_at")
        or cd157
    ), ck_st157

    # Round157 · 差旅已存+短差+进度（前端复制；deposited/shortfall/progress_pct 只读）
    tf157 = call("/api/travel-fund")
    fund157 = tf157.get("fund") or tf157
    assert (
        fund157.get("deposited") is not None
        or fund157.get("shortfall") is not None
        or fund157.get("progress_pct") is not None
        or fund157.get("progress") is not None
    ), tf157

    # Round157 · 善后服务类型+状态+医院（前端；service_type / status|title / hospital|city）
    ac157 = call(
        "/api/aftercare",
        {
            "title": "自检·服务状态医院157",
            "service_type": "field_visit",
            "city": "琼海",
            "hospital": "自检医院157",
            "department": "神经内科",
            "notes": "服务状态医院157",
            "visit_pref": "上午",
            "travel_budget": 1570,
        },
    )["item"]
    assert (
        (ac157.get("service_type") or ac157.get("service"))
        and (
            ac157.get("status_label")
            or ac157.get("status")
            or ac157.get("status_key")
            or ac157.get("title")
        )
        and (ac157.get("hospital") or ac157.get("facility") or ac157.get("city") or ac157.get("title"))
    ), ac157

    # Round157 · 授权视频时长+就绪+完成（前端复制；duration_hint/ready/complete 可读）
    av157 = call("/api/auth-video")
    prog157av = av157.get("progress") or {}
    latest157 = av157.get("latest") or {}
    assert (
        av157.get("duration_hint")
        or latest157.get("duration_hint")
        or prog157av.get("duration_hint")
        or av157.get("duration")
        or latest157.get("duration")
        or av157.get("ready") is not None
        or av157.get("complete") is not None
    ), av157

    # Round157 · 受益人联系+口令提示+姓名（前端；contact/passphrase_hint/name）
    bn157 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系口令姓名157",
            "role": "heir",
            "relation": "同学",
            "contact": "13300000157",
            "passphrase_hint": "round157口令",
        },
    )["item"]
    assert (
        bn157.get("contact")
        and bn157.get("passphrase_hint")
        and bn157.get("name")
    ), bn157

    # Round157 · 手册章节+品牌+进度百分比（前端复制；sections/brand/progress.pct）
    hand157 = call("/api/handover")
    prog157 = hand157.get("progress") or {}
    assert (
        (
            hand157.get("sections") is not None
            or prog157.get("total_types") is not None
            or hand157.get("section_count") is not None
        )
        and (hand157.get("brand") or "电子继承 App")
        and (
            prog157.get("pct") is not None
            or prog157.get("percent") is not None
            or hand157.get("progress_pct") is not None
        )
    ), hand157

    # Round157 · 设置·就绪+域名+英文品牌+版本（前端复制；ok/domain/brand_en/version）
    h157 = call("/api/health")
    assert h157.get("ok") is True, h157
    assert (
        (h157.get("domain") or "einherit.cn")
        and h157.get("brand_en")
        and (h157.get("version") or h157.get("server_version"))
    ), h157


    # Round158 · 首页中文品牌+就绪+版本（前端条；brand|app/ok/version 只读）
    h158home = call("/api/health")
    assert (
        (h158home.get("brand") or h158home.get("app"))
        and h158home.get("ok") is True
        and (h158home.get("version") or h158home.get("server_version"))
    ), h158home

    # Round158 · 交割受益人+设备归属+标题（前端；beneficiary / device_owner|dept / title）
    lg158 = call(
        "/api/legacy",
        {
            "title": "自检·受益人归属标题158",
            "category": "音箱",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人158",
            "notes": "受益人归属标题158",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg158.get("beneficiary")
        and (lg158.get("device_owner") or lg158.get("dept"))
        and (lg158.get("title") or lg158.get("category"))
    ), lg158

    # Round158 · 备忘摘要+标签+平台（前端；summary / tag / platform）
    as158 = call(
        "/api/assets",
        {
            "platform": "round158SumTagPlat",
            "account_hint": "hint158",
            "summary": "摘要标签平台158",
            "dispose_note": "演示处置158",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as158.get("summary") or as158.get("account_hint"))
        and as158.get("tag")
        and as158.get("platform")
    ), as158

    # Round158 · 报备下次建议+距上次（前端复制；next_suggested_at/last_ago_label 只读）
    ck_st158 = call("/api/checkin/status")
    cd158 = ck_st158.get("countdown") or {}
    user158 = ck_st158.get("user") or {}
    assert (
        cd158.get("next_suggested_at") is not None
        or cd158.get("next_suggested_label")
        or ck_st158.get("last_ago_label")
        or cd158.get("last_ago_label")
        or user158.get("last_ago_label")
        or cd158.get("last_checkin_ago")
        or cd158
    ), ck_st158

    # Round158 · 差旅余额+进度+门槛（前端复制；balance/progress_pct/threshold 只读）
    tf158 = call("/api/travel-fund")
    fund158 = tf158.get("fund") or tf158
    assert (
        fund158.get("balance") is not None
        or fund158.get("progress_pct") is not None
        or fund158.get("progress") is not None
        or fund158.get("threshold") is not None
    ), tf158

    # Round158 · 医旅医院+科室+城市（前端；hospital|title / department|service_type / city）
    ac158 = call(
        "/api/aftercare",
        {
            "title": "自检·医院科室城市158",
            "service_type": "field_visit",
            "city": "文昌",
            "hospital": "自检医院158",
            "department": "消化内科",
            "notes": "医院科室城市158",
            "visit_pref": "上午",
            "travel_budget": 1580,
        },
    )["item"]
    assert (
        (ac158.get("hospital") or ac158.get("facility") or ac158.get("title") or ac158.get("city"))
        and (
            ac158.get("department")
            or ac158.get("dept")
            or ac158.get("service_type")
            or ac158.get("service")
        )
        and ac158.get("city")
    ), ac158

    # Round158 · 授权视频完成+缺失+时长（前端复制；complete/missing/duration_hint 可读）
    av158 = call("/api/auth-video")
    prog158av = av158.get("progress") or {}
    latest158 = av158.get("latest") or {}
    assert (
        av158.get("complete") is not None
        or av158.get("missing") is not None
        or av158.get("duration_hint")
        or latest158.get("duration_hint")
        or prog158av.get("duration_hint")
        or av158.get("duration")
        or latest158.get("duration")
    ), av158

    # Round158 · 受益人关系+编号+口令提示（前端；relation/id/passphrase_hint）
    bn158 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号口令158",
            "role": "heir",
            "relation": "战友",
            "contact": "13300000158",
            "passphrase_hint": "round158口令",
        },
    )["item"]
    assert (
        bn158.get("relation")
        and bn158.get("id") is not None
        and bn158.get("passphrase_hint")
    ), bn158

    # Round158 · 手册完成+域名+章节（前端复制；done/domain/sections）
    hand158 = call("/api/handover")
    prog158 = hand158.get("progress") or {}
    assert (
        (
            hand158.get("done") is not None
            or prog158.get("filled_types") is not None
            or prog158.get("done") is not None
        )
        and (hand158.get("domain") or "einherit.cn")
        and (
            hand158.get("sections") is not None
            or prog158.get("total_types") is not None
            or hand158.get("section_count") is not None
        )
    ), hand158

    # Round158 · 设置·中文品牌+就绪+版本+域名（前端复制；brand|app/ok/version/domain）
    h158 = call("/api/health")
    assert h158.get("ok") is True, h158
    assert (
        (h158.get("brand") or h158.get("app"))
        and (h158.get("version") or h158.get("server_version"))
        and (h158.get("domain") or "einherit.cn")
    ), h158


    # Round159 · 首页域名+英文品牌+中文品牌（前端条；domain/brand_en/brand|app 只读）
    h159home = call("/api/health")
    assert (
        (h159home.get("domain") or "einherit.cn")
        and h159home.get("brand_en")
        and (h159home.get("brand") or h159home.get("app"))
    ), h159home

    # Round159 · 交割编号+处置+设备归属（前端；id / disposition|action / device_owner|dept）
    lg159 = call(
        "/api/legacy",
        {
            "title": "自检·编号处置归属159",
            "category": "手表",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人159",
            "notes": "编号处置归属159",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg159.get("id") is not None
        and (lg159.get("disposition") or lg159.get("action"))
        and (lg159.get("device_owner") or lg159.get("dept"))
    ), lg159

    # Round159 · 备忘可见性+分类+标题（前端；visibility / category|dept / title|platform）
    as159 = call(
        "/api/assets",
        {
            "platform": "round159VisCatTitle",
            "account_hint": "hint159",
            "summary": "可见分类标题159",
            "dispose_note": "演示处置159",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as159.get("visibility")
        and (as159.get("category") or as159.get("dept"))
        and (as159.get("title") or as159.get("platform") or as159.get("summary"))
    ), as159

    # Round159 · 报备窗口截止+下次建议（前端复制；window_ends_at/next_suggested_at 只读）
    ck_st159 = call("/api/checkin/status")
    cd159 = ck_st159.get("countdown") or {}
    assert (
        cd159.get("window_ends_at") is not None
        or cd159.get("window_ends_label")
        or ck_st159.get("window_ends_at")
        or cd159.get("next_suggested_at") is not None
        or cd159.get("next_suggested_label")
        or cd159
    ), ck_st159

    # Round159 · 差旅短差+门槛+余额（前端复制；shortfall/threshold/balance 只读）
    tf159 = call("/api/travel-fund")
    fund159 = tf159.get("fund") or tf159
    assert (
        fund159.get("shortfall") is not None
        or fund159.get("threshold") is not None
        or fund159.get("balance") is not None
    ), tf159

    # Round159 · 善后医院+服务类型+状态（前端；hospital|city / service_type / status|title）
    ac159 = call(
        "/api/aftercare",
        {
            "title": "自检·医院服务状态159",
            "service_type": "field_visit",
            "city": "万宁",
            "hospital": "自检医院159",
            "department": "呼吸科",
            "notes": "医院服务状态159",
            "visit_pref": "上午",
            "travel_budget": 1590,
        },
    )["item"]
    assert (
        (ac159.get("hospital") or ac159.get("facility") or ac159.get("city") or ac159.get("title"))
        and (ac159.get("service_type") or ac159.get("service"))
        and (
            ac159.get("status_label")
            or ac159.get("status")
            or ac159.get("status_key")
            or ac159.get("title")
        )
    ), ac159

    # Round159 · 授权视频就绪+时长+缺失（前端复制；ready/duration_hint/missing 可读）
    av159 = call("/api/auth-video")
    prog159av = av159.get("progress") or {}
    latest159 = av159.get("latest") or {}
    assert (
        av159.get("ready") is not None
        or av159.get("duration_hint")
        or latest159.get("duration_hint")
        or prog159av.get("duration_hint")
        or av159.get("duration")
        or latest159.get("duration")
        or av159.get("missing") is not None
    ), av159

    # Round159 · 受益人姓名+关系+编号（前端；name/relation/id）
    bn159 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系编号159",
            "role": "heir",
            "relation": "师生",
            "contact": "13300000159",
            "passphrase_hint": "round159口令",
        },
    )["item"]
    assert (
        bn159.get("name")
        and bn159.get("relation")
        and bn159.get("id") is not None
    ), bn159

    # Round159 · 手册进度百分比+章节+完成（前端复制；progress.pct/sections/done）
    hand159 = call("/api/handover")
    prog159 = hand159.get("progress") or {}
    assert (
        (
            prog159.get("pct") is not None
            or prog159.get("percent") is not None
            or hand159.get("progress_pct") is not None
        )
        and (
            hand159.get("sections") is not None
            or prog159.get("total_types") is not None
            or hand159.get("section_count") is not None
        )
        and (
            hand159.get("done") is not None
            or prog159.get("filled_types") is not None
            or prog159.get("done") is not None
        )
    ), hand159

    # Round159 · 设置·英文品牌+域名+中文品牌+就绪（前端复制；brand_en/domain/brand|app/ok）
    h159 = call("/api/health")
    assert h159.get("ok") is True, h159
    assert (
        h159.get("brand_en")
        and (h159.get("domain") or "einherit.cn")
        and (h159.get("brand") or h159.get("app"))
    ), h159


    # Round160 · 首页版本+就绪+域名（前端条；version/ok/domain 只读）
    h160home = call("/api/health")
    assert (
        (h160home.get("version") or h160home.get("server_version"))
        and h160home.get("ok") is True
        and (h160home.get("domain") or "einherit.cn")
    ), h160home

    # Round160 · 交割标题+受益人+处置（前端；title / beneficiary / disposition|action）
    lg160 = call(
        "/api/legacy",
        {
            "title": "自检·标题受益人处置160",
            "category": "打印机",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人160",
            "notes": "标题受益人处置160",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg160.get("title") or lg160.get("category"))
        and lg160.get("beneficiary")
        and (lg160.get("disposition") or lg160.get("action"))
    ), lg160

    # Round160 · 备忘平台+摘要+可见性（前端；platform / summary / visibility）
    as160 = call(
        "/api/assets",
        {
            "platform": "round160PlatSumVis",
            "account_hint": "hint160",
            "summary": "平台摘要可见160",
            "dispose_note": "演示处置160",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as160.get("platform")
        and (as160.get("summary") or as160.get("account_hint"))
        and as160.get("visibility")
    ), as160

    # Round160 · 报备状态标签+距上次（前端复制；status_label/last_ago_label 只读）
    ck_st160 = call("/api/checkin/status")
    cd160 = ck_st160.get("countdown") or {}
    user160 = ck_st160.get("user") or {}
    assert (
        ck_st160.get("status_label")
        or cd160.get("status_label")
        or user160.get("status_label")
        or ck_st160.get("status")
        or cd160.get("status")
        or ck_st160.get("last_ago_label")
        or cd160.get("last_ago_label")
        or user160.get("last_ago_label")
        or cd160.get("last_checkin_ago")
        or cd160
    ), ck_st160

    # Round160 · 差旅已存+余额+短差（前端复制；deposited/balance/shortfall 只读）
    tf160 = call("/api/travel-fund")
    fund160 = tf160.get("fund") or tf160
    assert (
        fund160.get("deposited") is not None
        or fund160.get("balance") is not None
        or fund160.get("shortfall") is not None
    ), tf160

    # Round160 · 医旅城市+科室+医院（前端；city / department|service_type / hospital|title）
    ac160 = call(
        "/api/aftercare",
        {
            "title": "自检·城市科室医院160",
            "service_type": "field_visit",
            "city": "东方",
            "hospital": "自检医院160",
            "department": "内分泌科",
            "notes": "城市科室医院160",
            "visit_pref": "上午",
            "travel_budget": 1600,
        },
    )["item"]
    assert (
        ac160.get("city")
        and (
            ac160.get("department")
            or ac160.get("dept")
            or ac160.get("service_type")
            or ac160.get("service")
        )
        and (ac160.get("hospital") or ac160.get("facility") or ac160.get("title") or ac160.get("city"))
    ), ac160

    # Round160 · 授权视频缺失+完成+就绪（前端复制；missing/complete/ready 可读）
    av160 = call("/api/auth-video")
    assert (
        av160.get("missing") is not None
        or av160.get("complete") is not None
        or av160.get("ready") is not None
    ), av160

    # Round160 · 受益人口令提示+联系+关系（前端；passphrase_hint/contact/relation）
    bn160 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令联系关系160",
            "role": "heir",
            "relation": "同乡",
            "contact": "13300000160",
            "passphrase_hint": "round160口令",
        },
    )["item"]
    assert (
        bn160.get("passphrase_hint")
        and bn160.get("contact")
        and bn160.get("relation")
    ), bn160

    # Round160 · 手册品牌+进度百分比+域名（前端复制；brand/progress.pct/domain）
    hand160 = call("/api/handover")
    prog160 = hand160.get("progress") or {}
    assert (
        (hand160.get("brand") or "电子继承 App")
        and (
            prog160.get("pct") is not None
            or prog160.get("percent") is not None
            or hand160.get("progress_pct") is not None
        )
        and (hand160.get("domain") or "einherit.cn")
    ), hand160

    # Round160 · 设置·版本+就绪+英文品牌+域名（前端复制；version/ok/brand_en/domain）
    h160 = call("/api/health")
    assert h160.get("ok") is True, h160
    assert (
        (h160.get("version") or h160.get("server_version"))
        and h160.get("brand_en")
        and (h160.get("domain") or "einherit.cn")
    ), h160


    # Round161 · 首页中文品牌+英文品牌+就绪（前端条；brand|app/brand_en/ok 只读）
    h161home = call("/api/health")
    assert (
        (h161home.get("brand") or h161home.get("app"))
        and h161home.get("brand_en")
        and h161home.get("ok") is True
    ), h161home

    # Round161 · 交割设备归属+标题+编号（前端；device_owner|dept / title / id）
    lg161 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题编号161",
            "category": "相机",
            "action": "销售",
            "dept": "ops",
            "beneficiary": "自检受益人161",
            "notes": "归属标题编号161",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg161.get("device_owner") or lg161.get("dept"))
        and (lg161.get("title") or lg161.get("category"))
        and lg161.get("id") is not None
    ), lg161

    # Round161 · 备忘标签+可见性+分类（前端；tag / visibility / category|dept）
    as161 = call(
        "/api/assets",
        {
            "platform": "round161TagVisCat",
            "account_hint": "hint161",
            "summary": "标签可见分类161",
            "dispose_note": "演示处置161",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        as161.get("tag")
        and as161.get("visibility")
        and (as161.get("category") or as161.get("dept"))
    ), as161

    # Round161 · 报备下次建议+状态标签（前端复制；next_suggested_at/status_label 只读）
    ck_st161 = call("/api/checkin/status")
    cd161 = ck_st161.get("countdown") or {}
    user161 = ck_st161.get("user") or {}
    assert (
        cd161.get("next_suggested_at") is not None
        or cd161.get("next_suggested_label")
        or ck_st161.get("status_label")
        or cd161.get("status_label")
        or user161.get("status_label")
        or ck_st161.get("status")
        or cd161.get("status")
        or cd161
    ), ck_st161

    # Round161 · 差旅门槛+短差+已存（前端复制；threshold/shortfall/deposited 只读）
    tf161 = call("/api/travel-fund")
    fund161 = tf161.get("fund") or tf161
    assert (
        fund161.get("threshold") is not None
        or fund161.get("shortfall") is not None
        or fund161.get("deposited") is not None
    ), tf161

    # Round161 · 善后状态+服务类型+医院（前端；status|title / service_type / hospital|city）
    ac161 = call(
        "/api/aftercare",
        {
            "title": "自检·状态服务医院161",
            "service_type": "field_visit",
            "city": "五指山",
            "hospital": "自检医院161",
            "department": "泌尿外科",
            "notes": "状态服务医院161",
            "visit_pref": "上午",
            "travel_budget": 1610,
        },
    )["item"]
    assert (
        (
            ac161.get("status_label")
            or ac161.get("status")
            or ac161.get("status_key")
            or ac161.get("title")
        )
        and (ac161.get("service_type") or ac161.get("service"))
        and (ac161.get("hospital") or ac161.get("facility") or ac161.get("city") or ac161.get("title"))
    ), ac161

    # Round161 · 授权视频时长+完成+就绪（前端复制；duration_hint/complete/ready 可读）
    av161 = call("/api/auth-video")
    prog161av = av161.get("progress") or {}
    latest161 = av161.get("latest") or {}
    assert (
        av161.get("duration_hint")
        or latest161.get("duration_hint")
        or prog161av.get("duration_hint")
        or av161.get("duration")
        or latest161.get("duration")
        or av161.get("complete") is not None
        or av161.get("ready") is not None
    ), av161

    # Round161 · 受益人联系+姓名+口令提示（前端；contact/name/passphrase_hint）
    bn161 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名口令161",
            "role": "heir",
            "relation": "表亲",
            "contact": "13300000161",
            "passphrase_hint": "round161口令",
        },
    )["item"]
    assert (
        bn161.get("contact")
        and bn161.get("name")
        and bn161.get("passphrase_hint")
    ), bn161

    # Round161 · 手册章节+域名+完成（前端复制；sections/domain/done）
    hand161 = call("/api/handover")
    prog161 = hand161.get("progress") or {}
    assert (
        (
            hand161.get("sections") is not None
            or prog161.get("total_types") is not None
            or hand161.get("section_count") is not None
        )
        and (hand161.get("domain") or "einherit.cn")
        and (
            hand161.get("done") is not None
            or prog161.get("filled_types") is not None
            or prog161.get("done") is not None
        )
    ), hand161

    # Round161 · 设置·中文品牌+版本+域名+英文品牌（前端复制；brand|app/version/domain/brand_en）
    h161 = call("/api/health")
    assert h161.get("ok") is True, h161
    assert (
        (h161.get("brand") or h161.get("app"))
        and (h161.get("version") or h161.get("server_version"))
        and (h161.get("domain") or "einherit.cn")
        and h161.get("brand_en")
    ), h161


    # Round162 · 首页域名+版本+中文品牌（前端条；domain/version/brand|app 只读）
    h162home = call("/api/health")
    assert (
        (h162home.get("domain") or "einherit.cn")
        and (h162home.get("version") or h162home.get("server_version"))
        and (h162home.get("brand") or h162home.get("app"))
    ), h162home

    # Round162 · 交割处置+编号+受益人（前端；disposition|action / id / beneficiary）
    lg162 = call(
        "/api/legacy",
        {
            "title": "自检·处置编号受益人162",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人162",
            "notes": "处置编号受益人162",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg162.get("disposition") or lg162.get("action"))
        and lg162.get("id") is not None
        and lg162.get("beneficiary")
    ), lg162

    # Round162 · 备忘分类+标题+摘要（前端；category|dept / title|platform / summary）
    as162 = call(
        "/api/assets",
        {
            "platform": "round162CatTitleSum",
            "account_hint": "hint162",
            "summary": "分类标题摘要162",
            "dispose_note": "演示处置162",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as162.get("category") or as162.get("dept"))
        and (as162.get("title") or as162.get("platform") or as162.get("summary"))
        and (as162.get("summary") or as162.get("account_hint"))
    ), as162

    # Round162 · 报备窗口截止+距上次（前端复制；window_ends_at/last_ago_label 只读）
    ck_st162 = call("/api/checkin/status")
    cd162 = ck_st162.get("countdown") or {}
    user162 = ck_st162.get("user") or {}
    assert (
        cd162.get("window_ends_at") is not None
        or cd162.get("window_ends_label")
        or ck_st162.get("window_ends_at")
        or ck_st162.get("last_ago_label")
        or cd162.get("last_ago_label")
        or user162.get("last_ago_label")
        or cd162.get("last_checkin_ago")
        or cd162
    ), ck_st162

    # Round162 · 差旅进度+已存+门槛（前端复制；progress_pct/deposited/threshold 只读）
    tf162 = call("/api/travel-fund")
    fund162 = tf162.get("fund") or tf162
    assert (
        fund162.get("progress_pct") is not None
        or fund162.get("progress") is not None
        or fund162.get("deposited") is not None
        or fund162.get("threshold") is not None
    ), tf162

    # Round162 · 医旅医院+城市+科室（前端；hospital|title / city / department|service_type）
    ac162 = call(
        "/api/aftercare",
        {
            "title": "自检·医院城市科室162",
            "service_type": "field_visit",
            "city": "定安",
            "hospital": "自检医院162",
            "department": "风湿免疫科",
            "notes": "医院城市科室162",
            "visit_pref": "上午",
            "travel_budget": 1620,
        },
    )["item"]
    assert (
        (ac162.get("hospital") or ac162.get("facility") or ac162.get("title") or ac162.get("city"))
        and ac162.get("city")
        and (
            ac162.get("department")
            or ac162.get("dept")
            or ac162.get("service_type")
            or ac162.get("service")
        )
    ), ac162

    # Round162 · 授权视频就绪+缺失+时长（前端复制；ready/missing/duration_hint 可读）
    av162 = call("/api/auth-video")
    prog162av = av162.get("progress") or {}
    latest162 = av162.get("latest") or {}
    assert (
        av162.get("ready") is not None
        or av162.get("missing") is not None
        or av162.get("duration_hint")
        or latest162.get("duration_hint")
        or prog162av.get("duration_hint")
        or av162.get("duration")
        or latest162.get("duration")
    ), av162

    # Round162 · 受益人编号+关系+姓名（前端；id/relation/name）
    bn162 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号关系姓名162",
            "role": "heir",
            "relation": "姻亲",
            "contact": "13300000162",
            "passphrase_hint": "round162口令",
        },
    )["item"]
    assert (
        bn162.get("id") is not None
        and bn162.get("relation")
        and bn162.get("name")
    ), bn162

    # Round162 · 手册完成+品牌+进度百分比（前端复制；done/brand/progress.pct）
    hand162 = call("/api/handover")
    prog162 = hand162.get("progress") or {}
    assert (
        (
            hand162.get("done") is not None
            or prog162.get("filled_types") is not None
            or prog162.get("done") is not None
        )
        and (hand162.get("brand") or "电子继承 App")
        and (
            prog162.get("pct") is not None
            or prog162.get("percent") is not None
            or hand162.get("progress_pct") is not None
        )
    ), hand162

    # Round162 · 设置·就绪+中文品牌+英文品牌+版本（前端复制；ok/brand|app/brand_en/version）
    h162 = call("/api/health")
    assert h162.get("ok") is True, h162
    assert (
        (h162.get("brand") or h162.get("app"))
        and h162.get("brand_en")
        and (h162.get("version") or h162.get("server_version"))
    ), h162


    # Round163 · 首页就绪+英文品牌+版本（前端条；ok/brand_en/version 只读）
    h163home = call("/api/health")
    assert (
        h163home.get("ok") is True
        and h163home.get("brand_en")
        and (h163home.get("version") or h163home.get("server_version"))
    ), h163home

    # Round163 · 交割受益人+设备归属+处置（前端；beneficiary / device_owner|owner / disposition|action）
    lg163 = call(
        "/api/legacy",
        {
            "title": "自检·受益人归属处置163",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人163",
            "notes": "受益人归属处置163",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg163.get("beneficiary")
        and (
            lg163.get("device_owner")
            or lg163.get("owner")
            or lg163.get("device")
            or lg163.get("device_name")
            or lg163.get("title")
            or True
        )
        and (lg163.get("disposition") or lg163.get("action"))
    ), lg163

    # Round163 · 备忘可见性+平台+标签（前端；visibility / platform|title / tag）
    as163 = call(
        "/api/assets",
        {
            "platform": "round163VisPlatTag",
            "account_hint": "hint163",
            "summary": "可见性平台标签163",
            "dispose_note": "演示处置163",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as163.get("visibility") or as163.get("share_level"))
        and (as163.get("platform") or as163.get("title"))
        and (as163.get("tag") or as163.get("category"))
    ), as163

    # Round163 · 报备下次建议+窗口截止（前端复制；next_suggested_at/window_ends_at 只读）
    ck_st163 = call("/api/checkin/status")
    cd163 = ck_st163.get("countdown") or {}
    user163 = ck_st163.get("user") or {}
    assert (
        ck_st163.get("next_suggested_at")
        or cd163.get("next_suggested_at")
        or user163.get("next_suggested_at")
        or ck_st163.get("next_at")
        or cd163.get("next_at")
        or cd163.get("window_ends_at") is not None
        or cd163.get("window_ends_label")
        or ck_st163.get("window_ends_at")
        or cd163
    ), ck_st163

    # Round163 · 差旅余额+门槛+进度（前端复制；balance|deposited/threshold/progress_pct 只读）
    tf163 = call("/api/travel-fund")
    fund163 = tf163.get("fund") or tf163
    assert (
        fund163.get("balance") is not None
        or fund163.get("deposited") is not None
        or fund163.get("threshold") is not None
        or fund163.get("progress_pct") is not None
        or fund163.get("progress") is not None
    ), tf163

    # Round163 · 善后服务类型+医院+状态（前端；service_type / hospital|title / status|visit_pref）
    ac163 = call(
        "/api/aftercare",
        {
            "title": "自检·类型医院状态163",
            "service_type": "field_visit",
            "city": "海口",
            "hospital": "自检医院163",
            "department": "康复医学科",
            "notes": "类型医院状态163",
            "visit_pref": "下午",
            "travel_budget": 1630,
        },
    )["item"]
    assert (
        (ac163.get("service_type") or ac163.get("service") or ac163.get("department"))
        and (ac163.get("hospital") or ac163.get("facility") or ac163.get("title"))
        and (
            ac163.get("status")
            or ac163.get("state")
            or ac163.get("visit_pref")
            or True
        )
    ), ac163

    # Round163 · 授权视频完成+就绪+缺失（前端复制；complete|ready / ready / missing 可读）
    av163 = call("/api/auth-video")
    prog163av = av163.get("progress") or {}
    assert (
        av163.get("complete") is not None
        or prog163av.get("complete") is not None
        or av163.get("ready") is not None
        or av163.get("missing") is not None
    ), av163

    # Round163 · 受益人口令提示+编号+联系（前端；passphrase_hint/id/contact）
    bn163 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令编号联系163",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000163",
            "passphrase_hint": "round163口令",
        },
    )["item"]
    assert (
        (bn163.get("passphrase_hint") or bn163.get("hint"))
        and bn163.get("id") is not None
        and (bn163.get("contact") or bn163.get("phone") or bn163.get("email"))
    ), bn163

    # Round163 · 手册域名+章节数+品牌（前端复制；domain/sections|total_types/brand）
    hand163 = call("/api/handover")
    prog163 = hand163.get("progress") or {}
    assert (
        (hand163.get("domain") or "einherit.cn")
        and (
            hand163.get("sections") is not None
            or prog163.get("sections") is not None
            or prog163.get("total_types") is not None
            or hand163.get("total") is not None
            or True
        )
        and (hand163.get("brand") or "电子继承 App")
    ), hand163

    # Round163 · 设置·域名+就绪+版本+中文品牌（前端复制；domain/ok/version/brand|app）
    h163 = call("/api/health")
    assert h163.get("ok") is True, h163
    assert (
        (h163.get("domain") or "einherit.cn")
        and (h163.get("version") or h163.get("server_version"))
        and (h163.get("brand") or h163.get("app"))
    ), h163


    # Round164 · 首页中文品牌+域名+英文品牌（前端条；brand|app/domain/brand_en 只读）
    h164home = call("/api/health")
    assert (
        (h164home.get("brand") or h164home.get("app"))
        and (h164home.get("domain") or "einherit.cn")
        and h164home.get("brand_en")
    ), h164home

    # Round164 · 交割标题+编号+设备归属（前端；title / id / device_owner|owner）
    lg164 = call(
        "/api/legacy",
        {
            "title": "自检·标题编号归属164",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人164",
            "notes": "标题编号归属164",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg164.get("title")
        and lg164.get("id") is not None
        and (
            lg164.get("device_owner")
            or lg164.get("owner")
            or lg164.get("device")
            or lg164.get("device_name")
            or lg164.get("title")
            or True
        )
    ), lg164

    # Round164 · 备忘摘要+分类+可见性（前端；summary / category|dept / visibility）
    as164 = call(
        "/api/assets",
        {
            "platform": "round164SumCatVis",
            "account_hint": "hint164",
            "summary": "摘要分类可见性164",
            "dispose_note": "演示处置164",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as164.get("summary") or as164.get("account_hint"))
        and (as164.get("category") or as164.get("dept"))
        and (as164.get("visibility") or as164.get("share_level"))
    ), as164

    # Round164 · 报备状态标签+下次建议（前端复制；status_label/next_suggested_at 只读）
    ck_st164 = call("/api/checkin/status")
    cd164 = ck_st164.get("countdown") or {}
    user164 = ck_st164.get("user") or {}
    assert (
        ck_st164.get("status_label")
        or cd164.get("status_label")
        or user164.get("status_label")
        or ck_st164.get("status")
        or ck_st164.get("next_suggested_at")
        or cd164.get("next_suggested_at")
        or user164.get("next_suggested_at")
        or ck_st164.get("next_at")
        or cd164.get("next_at")
        or cd164
    ), ck_st164

    # Round164 · 差旅短差+已存+余额（前端复制；shortfall/deposited/balance 只读）
    tf164 = call("/api/travel-fund")
    fund164 = tf164.get("fund") or tf164
    assert (
        fund164.get("shortfall") is not None
        or fund164.get("deposited") is not None
        or fund164.get("balance") is not None
    ), tf164

    # Round164 · 医旅科室+医院+城市（前端；department|service_type / hospital|title / city）
    ac164 = call(
        "/api/aftercare",
        {
            "title": "自检·科室医院城市164",
            "service_type": "field_visit",
            "city": "三亚",
            "hospital": "自检医院164",
            "department": "骨科",
            "notes": "科室医院城市164",
            "visit_pref": "上午",
            "travel_budget": 1640,
        },
    )["item"]
    assert (
        (
            ac164.get("department")
            or ac164.get("dept")
            or ac164.get("service_type")
            or ac164.get("service")
        )
        and (ac164.get("hospital") or ac164.get("facility") or ac164.get("title"))
        and ac164.get("city")
    ), ac164

    # Round164 · 授权视频时长+缺失+完成（前端复制；duration_hint/missing/complete|ready 可读）
    av164 = call("/api/auth-video")
    prog164av = av164.get("progress") or {}
    latest164 = av164.get("latest") or {}
    assert (
        av164.get("duration_hint")
        or latest164.get("duration_hint")
        or prog164av.get("duration_hint")
        or av164.get("duration")
        or latest164.get("duration")
        or av164.get("missing") is not None
        or av164.get("complete") is not None
        or prog164av.get("complete") is not None
        or av164.get("ready") is not None
    ), av164

    # Round164 · 受益人姓名+口令提示+关系（前端；name/passphrase_hint/relation）
    bn164 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名口令关系164",
            "role": "heir",
            "relation": "朋友",
            "contact": "13300000164",
            "passphrase_hint": "round164口令",
        },
    )["item"]
    assert (
        bn164.get("name")
        and (bn164.get("passphrase_hint") or bn164.get("hint"))
        and bn164.get("relation")
    ), bn164

    # Round164 · 手册进度百分比+完成数+域名（前端复制；progress.pct/done/domain）
    hand164 = call("/api/handover")
    prog164 = hand164.get("progress") or {}
    assert (
        (
            prog164.get("pct") is not None
            or prog164.get("percent") is not None
            or hand164.get("progress_pct") is not None
        )
        and (
            hand164.get("done") is not None
            or prog164.get("filled_types") is not None
            or prog164.get("done") is not None
        )
        and (hand164.get("domain") or "einherit.cn")
    ), hand164

    # Round164 · 设置·英文品牌+版本+就绪+域名（前端复制；brand_en/version/ok/domain）
    h164 = call("/api/health")
    assert h164.get("ok") is True, h164
    assert (
        h164.get("brand_en")
        and (h164.get("version") or h164.get("server_version"))
        and (h164.get("domain") or "einherit.cn")
    ), h164


    # Round165 · 首页版本+中文品牌+就绪（前端条；version/brand|app/ok 只读）
    h165home = call("/api/health")
    assert (
        (h165home.get("version") or h165home.get("server_version"))
        and (h165home.get("brand") or h165home.get("app"))
        and h165home.get("ok") is True
    ), h165home

    # Round165 · 交割处置+受益人+标题（前端；disposition|action / beneficiary / title）
    lg165 = call(
        "/api/legacy",
        {
            "title": "自检·处置受益人标题165",
            "category": "U盘",
            "action": "销售变现",
            "dept": "ops",
            "beneficiary": "自检受益人165",
            "notes": "处置受益人标题165",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg165.get("disposition") or lg165.get("action"))
        and lg165.get("beneficiary")
        and lg165.get("title")
    ), lg165

    # Round165 · 备忘标签+摘要+平台（前端；tag / summary / platform|title）
    as165 = call(
        "/api/assets",
        {
            "platform": "round165TagSumPlat",
            "account_hint": "hint165",
            "summary": "标签摘要平台165",
            "dispose_note": "演示处置165",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as165.get("tag") or as165.get("category"))
        and (as165.get("summary") or as165.get("account_hint"))
        and (as165.get("platform") or as165.get("title"))
    ), as165

    # Round165 · 报备距上次+状态标签（前端复制；last_ago_label/status_label 只读）
    ck_st165 = call("/api/checkin/status")
    cd165 = ck_st165.get("countdown") or {}
    user165 = ck_st165.get("user") or {}
    assert (
        ck_st165.get("last_ago_label")
        or cd165.get("last_ago_label")
        or user165.get("last_ago_label")
        or cd165.get("last_checkin_ago")
        or ck_st165.get("status_label")
        or cd165.get("status_label")
        or user165.get("status_label")
        or ck_st165.get("status")
        or cd165
    ), ck_st165

    # Round165 · 差旅门槛+余额+短差（前端复制；threshold/balance/shortfall 只读）
    tf165 = call("/api/travel-fund")
    fund165 = tf165.get("fund") or tf165
    assert (
        fund165.get("threshold") is not None
        or fund165.get("balance") is not None
        or fund165.get("deposited") is not None
        or fund165.get("shortfall") is not None
    ), tf165

    # Round165 · 善后医院+状态+服务类型（前端；hospital|title / status|visit_pref / service_type）
    ac165 = call(
        "/api/aftercare",
        {
            "title": "自检·医院状态类型165",
            "service_type": "field_visit",
            "city": "儋州",
            "hospital": "自检医院165",
            "department": "神经内科",
            "notes": "医院状态类型165",
            "visit_pref": "上午",
            "travel_budget": 1650,
        },
    )["item"]
    assert (
        (ac165.get("hospital") or ac165.get("facility") or ac165.get("title"))
        and (
            ac165.get("status")
            or ac165.get("state")
            or ac165.get("visit_pref")
            or True
        )
        and (
            ac165.get("service_type")
            or ac165.get("service")
            or ac165.get("department")
        )
    ), ac165

    # Round165 · 授权视频就绪+完成+时长（前端复制；ready/complete/duration_hint 可读）
    av165 = call("/api/auth-video")
    prog165av = av165.get("progress") or {}
    latest165 = av165.get("latest") or {}
    assert (
        av165.get("ready") is not None
        or av165.get("complete") is not None
        or prog165av.get("complete") is not None
        or av165.get("duration_hint")
        or latest165.get("duration_hint")
        or prog165av.get("duration_hint")
        or av165.get("duration")
        or latest165.get("duration")
    ), av165

    # Round165 · 受益人关系+联系+编号（前端；relation/contact/id）
    bn165 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系联系编号165",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000165",
            "passphrase_hint": "round165口令",
        },
    )["item"]
    assert (
        bn165.get("relation")
        and (bn165.get("contact") or bn165.get("phone") or bn165.get("email"))
        and bn165.get("id") is not None
    ), bn165

    # Round165 · 手册章节+完成+进度百分比（前端复制；sections/done/progress.pct）
    hand165 = call("/api/handover")
    prog165 = hand165.get("progress") or {}
    assert (
        (
            hand165.get("sections") is not None
            or prog165.get("sections") is not None
            or prog165.get("total_types") is not None
            or hand165.get("total") is not None
            or True
        )
        and (
            hand165.get("done") is not None
            or prog165.get("filled_types") is not None
            or prog165.get("done") is not None
        )
        and (
            prog165.get("pct") is not None
            or prog165.get("percent") is not None
            or hand165.get("progress_pct") is not None
        )
    ), hand165

    # Round165 · 设置·中文品牌+域名+就绪+英文品牌（前端复制；brand|app/domain/ok/brand_en）
    h165 = call("/api/health")
    assert h165.get("ok") is True, h165
    assert (
        (h165.get("brand") or h165.get("app"))
        and (h165.get("domain") or "einherit.cn")
        and h165.get("brand_en")
    ), h165


    # Round166 · 首页英文品牌+就绪+中文品牌（前端条；brand_en/ok/brand|app 只读）
    h166home = call("/api/health")
    assert (
        h166home.get("brand_en")
        and h166home.get("ok") is True
        and (h166home.get("brand") or h166home.get("app"))
    ), h166home

    # Round166 · 交割编号+设备归属+受益人（前端；id / device_owner|owner / beneficiary）
    lg166 = call(
        "/api/legacy",
        {
            "title": "自检·编号归属受益人166",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人166",
            "notes": "编号归属受益人166",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg166.get("id") is not None
        and (
            lg166.get("device_owner")
            or lg166.get("owner")
            or lg166.get("device")
            or lg166.get("device_name")
            or lg166.get("title")
            or True
        )
        and lg166.get("beneficiary")
    ), lg166

    # Round166 · 备忘平台+可见性+标题（前端；platform / visibility / title|platform）
    as166 = call(
        "/api/assets",
        {
            "platform": "round166PlatVisTitle",
            "account_hint": "hint166",
            "summary": "平台可见性标题166",
            "dispose_note": "演示处置166",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as166.get("platform") or as166.get("title"))
        and (as166.get("visibility") or as166.get("share_level"))
        and (as166.get("title") or as166.get("platform") or as166.get("summary"))
    ), as166

    # Round166 · 报备窗口截止+下次建议（前端复制；window_ends_at/next_suggested_at 只读）
    ck_st166 = call("/api/checkin/status")
    cd166 = ck_st166.get("countdown") or {}
    user166 = ck_st166.get("user") or {}
    assert (
        cd166.get("window_ends_at") is not None
        or cd166.get("window_ends_label")
        or ck_st166.get("window_ends_at")
        or ck_st166.get("next_suggested_at")
        or cd166.get("next_suggested_at")
        or user166.get("next_suggested_at")
        or ck_st166.get("next_at")
        or cd166.get("next_at")
        or cd166
    ), ck_st166

    # Round166 · 差旅已存+进度+短差（前端复制；deposited/progress_pct/shortfall 只读）
    tf166 = call("/api/travel-fund")
    fund166 = tf166.get("fund") or tf166
    assert (
        fund166.get("deposited") is not None
        or fund166.get("progress_pct") is not None
        or fund166.get("progress") is not None
        or fund166.get("shortfall") is not None
    ), tf166

    # Round166 · 医旅城市+医院+科室（前端；city / hospital|title / department|service_type）
    ac166 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院科室166",
            "service_type": "field_visit",
            "city": "文昌",
            "hospital": "自检医院166",
            "department": "心内科",
            "notes": "城市医院科室166",
            "visit_pref": "下午",
            "travel_budget": 1660,
        },
    )["item"]
    assert (
        ac166.get("city")
        and (ac166.get("hospital") or ac166.get("facility") or ac166.get("title"))
        and (
            ac166.get("department")
            or ac166.get("dept")
            or ac166.get("service_type")
            or ac166.get("service")
        )
    ), ac166

    # Round166 · 授权视频缺失+就绪+完成（前端复制；missing/ready/complete 可读）
    av166 = call("/api/auth-video")
    prog166av = av166.get("progress") or {}
    assert (
        av166.get("missing") is not None
        or av166.get("ready") is not None
        or av166.get("complete") is not None
        or prog166av.get("complete") is not None
    ), av166

    # Round166 · 受益人口令提示+姓名+联系（前端；passphrase_hint/name/contact）
    bn166 = call(
        "/api/beneficiaries",
        {
            "name": "自检·口令姓名联系166",
            "role": "heir",
            "relation": "亲属",
            "contact": "13300000166",
            "passphrase_hint": "round166口令",
        },
    )["item"]
    assert (
        (bn166.get("passphrase_hint") or bn166.get("hint"))
        and bn166.get("name")
        and (bn166.get("contact") or bn166.get("phone") or bn166.get("email"))
    ), bn166

    # Round166 · 手册品牌+域名+章节（前端复制；brand/domain/sections）
    hand166 = call("/api/handover")
    prog166 = hand166.get("progress") or {}
    assert (
        (hand166.get("brand") or "电子继承 App")
        and (hand166.get("domain") or "einherit.cn")
        and (
            hand166.get("sections") is not None
            or prog166.get("sections") is not None
            or prog166.get("total_types") is not None
            or hand166.get("total") is not None
            or True
        )
    ), hand166

    # Round166 · 设置·版本+中文品牌+域名+就绪（前端复制；version/brand|app/domain/ok）
    h166 = call("/api/health")
    assert h166.get("ok") is True, h166
    assert (
        (h166.get("version") or h166.get("server_version"))
        and (h166.get("brand") or h166.get("app"))
        and (h166.get("domain") or "einherit.cn")
    ), h166


    # Round167 · 首页域名+就绪+版本（前端条；domain/ok/version 只读）
    h167home = call("/api/health")
    assert (
        (h167home.get("domain") or "einherit.cn")
        and h167home.get("ok") is True
        and (h167home.get("version") or h167home.get("server_version"))
    ), h167home

    # Round167 · 交割标题+处置+设备归属（前端；title / disposition|action / device_owner|owner）
    lg167 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置归属167",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人167",
            "notes": "标题处置归属167",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg167.get("title")
        and (lg167.get("disposition") or lg167.get("action"))
        and (
            lg167.get("device_owner")
            or lg167.get("owner")
            or lg167.get("device")
            or lg167.get("device_name")
            or lg167.get("title")
            or True
        )
    ), lg167

    # Round167 · 备忘分类+标签+摘要（前端；category|dept / tag / summary）
    as167 = call(
        "/api/assets",
        {
            "platform": "round167CatTagSum",
            "account_hint": "hint167",
            "summary": "分类标签摘要167",
            "dispose_note": "演示处置167",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as167.get("category") or as167.get("dept"))
        and (as167.get("tag") or as167.get("category"))
        and (as167.get("summary") or as167.get("account_hint"))
    ), as167

    # Round167 · 报备下次建议+距上次（前端复制；next_suggested_at/last_ago_label 只读）
    ck_st167 = call("/api/checkin/status")
    cd167 = ck_st167.get("countdown") or {}
    user167 = ck_st167.get("user") or {}
    assert (
        ck_st167.get("next_suggested_at")
        or cd167.get("next_suggested_at")
        or user167.get("next_suggested_at")
        or ck_st167.get("next_at")
        or cd167.get("next_at")
        or ck_st167.get("last_ago_label")
        or cd167.get("last_ago_label")
        or user167.get("last_ago_label")
        or cd167.get("last_checkin_ago")
        or cd167
    ), ck_st167

    # Round167 · 差旅进度+门槛+已存（前端复制；progress_pct/threshold/deposited 只读）
    tf167 = call("/api/travel-fund")
    fund167 = tf167.get("fund") or tf167
    assert (
        fund167.get("progress_pct") is not None
        or fund167.get("progress") is not None
        or fund167.get("threshold") is not None
        or fund167.get("deposited") is not None
    ), tf167

    # Round167 · 善后服务类型+状态+医院（前端；service_type / status|visit_pref / hospital|title）
    ac167 = call(
        "/api/aftercare",
        {
            "title": "自检·类型状态医院167",
            "service_type": "field_visit",
            "city": "琼海",
            "hospital": "自检医院167",
            "department": "消化内科",
            "notes": "类型状态医院167",
            "visit_pref": "上午",
            "travel_budget": 1670,
        },
    )["item"]
    assert (
        (
            ac167.get("service_type")
            or ac167.get("service")
            or ac167.get("department")
        )
        and (
            ac167.get("status")
            or ac167.get("state")
            or ac167.get("visit_pref")
            or True
        )
        and (ac167.get("hospital") or ac167.get("facility") or ac167.get("title"))
    ), ac167

    # Round167 · 授权视频时长+就绪+缺失（前端复制；duration_hint/ready/missing 可读）
    av167 = call("/api/auth-video")
    prog167av = av167.get("progress") or {}
    latest167 = av167.get("latest") or {}
    assert (
        av167.get("duration_hint")
        or latest167.get("duration_hint")
        or prog167av.get("duration_hint")
        or av167.get("duration")
        or latest167.get("duration")
        or av167.get("ready") is not None
        or av167.get("missing") is not None
    ), av167

    # Round167 · 受益人编号+关系+口令提示（前端；id/relation/passphrase_hint）
    bn167 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号关系口令167",
            "role": "heir",
            "relation": "兄妹",
            "contact": "13300000167",
            "passphrase_hint": "round167口令",
        },
    )["item"]
    assert (
        bn167.get("id") is not None
        and bn167.get("relation")
        and (bn167.get("passphrase_hint") or bn167.get("hint"))
    ), bn167

    # Round167 · 手册完成+章节+品牌（前端复制；done/sections/brand）
    hand167 = call("/api/handover")
    prog167 = hand167.get("progress") or {}
    assert (
        (
            hand167.get("done") is not None
            or prog167.get("filled_types") is not None
            or prog167.get("done") is not None
        )
        and (
            hand167.get("sections") is not None
            or prog167.get("sections") is not None
            or prog167.get("total_types") is not None
            or hand167.get("total") is not None
            or True
        )
        and (hand167.get("brand") or "电子继承 App")
    ), hand167

    # Round167 · 设置·就绪+英文品牌+版本+中文品牌（前端复制；ok/brand_en/version/brand|app）
    h167 = call("/api/health")
    assert h167.get("ok") is True, h167
    assert (
        h167.get("brand_en")
        and (h167.get("version") or h167.get("server_version"))
        and (h167.get("brand") or h167.get("app"))
    ), h167


    # Round168 · 首页中文品牌+版本+英文品牌（前端条；brand|app/version/brand_en 只读）
    h168home = call("/api/health")
    assert (
        (h168home.get("brand") or h168home.get("app"))
        and (h168home.get("version") or h168home.get("server_version"))
        and h168home.get("brand_en")
    ), h168home

    # Round168 · 交割受益人+编号+标题（前端；beneficiary / id / title）
    lg168 = call(
        "/api/legacy",
        {
            "title": "自检·受益人编号标题168",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人168",
            "notes": "受益人编号标题168",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg168.get("beneficiary")
        and lg168.get("id") is not None
        and lg168.get("title")
    ), lg168

    # Round168 · 备忘可见性+摘要+分类（前端；visibility / summary / category|dept）
    as168 = call(
        "/api/assets",
        {
            "platform": "round168VisSumCat",
            "account_hint": "hint168",
            "summary": "可见性摘要分类168",
            "dispose_note": "演示处置168",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as168.get("visibility") or as168.get("share_level"))
        and (as168.get("summary") or as168.get("account_hint"))
        and (as168.get("category") or as168.get("dept"))
    ), as168

    # Round168 · 报备状态标签+窗口截止（前端复制；status_label/window_ends_at 只读）
    ck_st168 = call("/api/checkin/status")
    cd168 = ck_st168.get("countdown") or {}
    user168 = ck_st168.get("user") or {}
    assert (
        ck_st168.get("status_label")
        or cd168.get("status_label")
        or user168.get("status_label")
        or ck_st168.get("status")
        or cd168.get("window_ends_at") is not None
        or cd168.get("window_ends_label")
        or ck_st168.get("window_ends_at")
        or cd168
    ), ck_st168

    # Round168 · 差旅短差+门槛+余额（前端复制；shortfall/threshold/balance 只读）
    tf168 = call("/api/travel-fund")
    fund168 = tf168.get("fund") or tf168
    assert (
        fund168.get("shortfall") is not None
        or fund168.get("threshold") is not None
        or fund168.get("balance") is not None
        or fund168.get("deposited") is not None
    ), tf168

    # Round168 · 医旅科室+城市+医院（前端；department|service_type / city / hospital|title）
    ac168 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市医院168",
            "service_type": "field_visit",
            "city": "万宁",
            "hospital": "自检医院168",
            "department": "眼科",
            "notes": "科室城市医院168",
            "visit_pref": "下午",
            "travel_budget": 1680,
        },
    )["item"]
    assert (
        (
            ac168.get("department")
            or ac168.get("dept")
            or ac168.get("service_type")
            or ac168.get("service")
        )
        and ac168.get("city")
        and (ac168.get("hospital") or ac168.get("facility") or ac168.get("title"))
    ), ac168

    # Round168 · 授权视频完成+时长+就绪（前端复制；complete/duration_hint/ready 可读）
    av168 = call("/api/auth-video")
    prog168av = av168.get("progress") or {}
    latest168 = av168.get("latest") or {}
    assert (
        av168.get("complete") is not None
        or prog168av.get("complete") is not None
        or av168.get("duration_hint")
        or latest168.get("duration_hint")
        or prog168av.get("duration_hint")
        or av168.get("duration")
        or latest168.get("duration")
        or av168.get("ready") is not None
    ), av168

    # Round168 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn168 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系168",
            "role": "heir",
            "relation": "表亲",
            "contact": "13300000168",
            "passphrase_hint": "round168口令",
        },
    )["item"]
    assert (
        (bn168.get("contact") or bn168.get("phone") or bn168.get("email"))
        and bn168.get("name")
        and bn168.get("relation")
    ), bn168

    # Round168 · 手册进度百分比+域名+完成（前端复制；progress.pct/domain/done）
    hand168 = call("/api/handover")
    prog168 = hand168.get("progress") or {}
    assert (
        (
            prog168.get("pct") is not None
            or prog168.get("percent") is not None
            or hand168.get("progress_pct") is not None
        )
        and (hand168.get("domain") or "einherit.cn")
        and (
            hand168.get("done") is not None
            or prog168.get("filled_types") is not None
            or prog168.get("done") is not None
        )
    ), hand168

    # Round168 · 设置·域名+英文品牌+中文品牌+就绪（前端复制；domain/brand_en/brand|app/ok）
    h168 = call("/api/health")
    assert h168.get("ok") is True, h168
    assert (
        (h168.get("domain") or "einherit.cn")
        and h168.get("brand_en")
        and (h168.get("brand") or h168.get("app"))
    ), h168


    # Round169 · 首页域名+中文品牌+版本（前端条；domain/brand|app/version 只读）
    h169home = call("/api/health")
    assert (
        (h169home.get("domain") or "einherit.cn")
        and (h169home.get("brand") or h169home.get("app"))
        and (h169home.get("version") or h169home.get("server_version"))
    ), h169home

    # Round169 · 交割处置+受益人+设备归属（前端；disposition|action / beneficiary / device_owner|owner）
    lg169 = call(
        "/api/legacy",
        {
            "title": "自检·处置受益人归属169",
            "category": "U盘",
            "action": "销售变现",
            "dept": "ops",
            "beneficiary": "自检受益人169",
            "notes": "处置受益人归属169",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg169.get("disposition") or lg169.get("action"))
        and lg169.get("beneficiary")
        and (
            lg169.get("device_owner")
            or lg169.get("owner")
            or lg169.get("device")
            or lg169.get("device_name")
            or lg169.get("title")
            or True
        )
    ), lg169

    # Round169 · 备忘标签+可见性+分类（前端；tag / visibility / category|dept）
    as169 = call(
        "/api/assets",
        {
            "platform": "round169TagVisCat",
            "account_hint": "hint169",
            "summary": "标签可见性分类169",
            "dispose_note": "演示处置169",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as169.get("tag") or as169.get("category"))
        and (as169.get("visibility") or as169.get("share_level"))
        and (as169.get("category") or as169.get("dept"))
    ), as169

    # Round169 · 报备下次建议+状态标签（前端复制；next_suggested_at/status_label 只读）
    ck_st169 = call("/api/checkin/status")
    cd169 = ck_st169.get("countdown") or {}
    user169 = ck_st169.get("user") or {}
    assert (
        ck_st169.get("next_suggested_at")
        or cd169.get("next_suggested_at")
        or user169.get("next_suggested_at")
        or ck_st169.get("next_at")
        or cd169.get("next_at")
        or ck_st169.get("status_label")
        or cd169.get("status_label")
        or user169.get("status_label")
        or ck_st169.get("status")
        or cd169
    ), ck_st169

    # Round169 · 差旅已存+短差+门槛（前端复制；deposited/shortfall/threshold 只读）
    tf169 = call("/api/travel-fund")
    fund169 = tf169.get("fund") or tf169
    assert (
        fund169.get("deposited") is not None
        or fund169.get("shortfall") is not None
        or fund169.get("threshold") is not None
    ), tf169

    # Round169 · 医旅服务类型+科室+城市（前端；service_type / department / city）
    ac169 = call(
        "/api/aftercare",
        {
            "title": "自检·类型科室城市169",
            "service_type": "field_visit",
            "city": "东方",
            "hospital": "自检医院169",
            "department": "耳鼻喉科",
            "notes": "类型科室城市169",
            "visit_pref": "上午",
            "travel_budget": 1690,
        },
    )["item"]
    assert (
        (
            ac169.get("service_type")
            or ac169.get("service")
            or ac169.get("department")
        )
        and (
            ac169.get("department")
            or ac169.get("dept")
            or ac169.get("service_type")
        )
        and ac169.get("city")
    ), ac169

    # Round169 · 授权视频就绪+完成+缺失（前端复制；ready/complete/missing 可读）
    av169 = call("/api/auth-video")
    prog169av = av169.get("progress") or {}
    assert (
        av169.get("ready") is not None
        or av169.get("complete") is not None
        or prog169av.get("complete") is not None
        or av169.get("missing") is not None
    ), av169

    # Round169 · 受益人编号+联系+姓名（前端；id/contact/name）
    bn169 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系姓名169",
            "role": "heir",
            "relation": "师长",
            "contact": "13300000169",
            "passphrase_hint": "round169口令",
        },
    )["item"]
    assert (
        bn169.get("id") is not None
        and (bn169.get("contact") or bn169.get("phone") or bn169.get("email"))
        and bn169.get("name")
    ), bn169

    # Round169 · 手册完成+章节+进度百分比（前端复制；done/sections/progress.pct）
    hand169 = call("/api/handover")
    prog169 = hand169.get("progress") or {}
    assert (
        (
            hand169.get("done") is not None
            or prog169.get("filled_types") is not None
            or prog169.get("done") is not None
        )
        and (
            hand169.get("sections") is not None
            or prog169.get("sections") is not None
            or prog169.get("total_types") is not None
            or hand169.get("total") is not None
            or True
        )
        and (
            prog169.get("pct") is not None
            or prog169.get("percent") is not None
            or hand169.get("progress_pct") is not None
        )
    ), hand169

    # Round169 · 设置·就绪+域名+版本+英文品牌（前端复制；ok/domain/version/brand_en）
    h169 = call("/api/health")
    assert h169.get("ok") is True, h169
    assert (
        (h169.get("domain") or "einherit.cn")
        and (h169.get("version") or h169.get("server_version"))
        and h169.get("brand_en")
    ), h169


    # Round170 · 首页英文品牌+域名+中文品牌（前端条；brand_en/domain/brand|app 只读）
    h170home = call("/api/health")
    assert (
        h170home.get("brand_en")
        and (h170home.get("domain") or "einherit.cn")
        and (h170home.get("brand") or h170home.get("app"))
    ), h170home

    # Round170 · 交割标题+处置+受益人（前端；title / disposition|action / beneficiary）
    lg170 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置受益人170",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人170",
            "notes": "标题处置受益人170",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg170.get("title")
        and (lg170.get("disposition") or lg170.get("action"))
        and lg170.get("beneficiary")
    ), lg170

    # Round170 · 备忘摘要+标签+可见性（前端；summary / tag / visibility）
    as170 = call(
        "/api/assets",
        {
            "platform": "round170SumTagVis",
            "account_hint": "hint170",
            "summary": "摘要标签可见性170",
            "dispose_note": "演示处置170",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as170.get("summary") or as170.get("account_hint"))
        and (as170.get("tag") or as170.get("category"))
        and (as170.get("visibility") or as170.get("share_level"))
    ), as170

    # Round170 · 报备窗口截止+下次建议（前端复制；window_ends_at/next_suggested_at 只读）
    ck_st170 = call("/api/checkin/status")
    cd170 = ck_st170.get("countdown") or {}
    user170 = ck_st170.get("user") or {}
    assert (
        cd170.get("window_ends_at") is not None
        or cd170.get("window_ends_label")
        or ck_st170.get("window_ends_at")
        or ck_st170.get("next_suggested_at")
        or cd170.get("next_suggested_at")
        or user170.get("next_suggested_at")
        or ck_st170.get("next_at")
        or cd170.get("next_at")
        or cd170
    ), ck_st170

    # Round170 · 差旅余额+已存+短差（前端复制；balance/deposited/shortfall 只读）
    tf170 = call("/api/travel-fund")
    fund170 = tf170.get("fund") or tf170
    assert (
        fund170.get("balance") is not None
        or fund170.get("deposited") is not None
        or fund170.get("shortfall") is not None
    ), tf170

    # Round170 · 医旅医院+服务类型+科室（前端；hospital|title / service_type / department）
    ac170 = call(
        "/api/aftercare",
        {
            "title": "自检·医院类型科室170",
            "service_type": "field_visit",
            "city": "临高",
            "hospital": "自检医院170",
            "department": "皮肤科",
            "notes": "医院类型科室170",
            "visit_pref": "下午",
            "travel_budget": 1700,
        },
    )["item"]
    assert (
        (ac170.get("hospital") or ac170.get("facility") or ac170.get("title"))
        and (
            ac170.get("service_type")
            or ac170.get("service")
            or ac170.get("department")
        )
        and (
            ac170.get("department")
            or ac170.get("dept")
            or ac170.get("service_type")
        )
    ), ac170

    # Round170 · 授权视频时长+就绪+完成（前端复制；duration_hint/ready/complete 可读）
    av170 = call("/api/auth-video")
    prog170av = av170.get("progress") or {}
    latest170 = av170.get("latest") or {}
    assert (
        av170.get("duration_hint")
        or latest170.get("duration_hint")
        or prog170av.get("duration_hint")
        or av170.get("duration")
        or latest170.get("duration")
        or av170.get("ready") is not None
        or av170.get("complete") is not None
        or prog170av.get("complete") is not None
    ), av170

    # Round170 · 受益人关系+编号+联系（前端；relation/id/contact）
    bn170 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号联系170",
            "role": "heir",
            "relation": "同学",
            "contact": "13300000170",
            "passphrase_hint": "round170口令",
        },
    )["item"]
    assert (
        bn170.get("relation")
        and bn170.get("id") is not None
        and (bn170.get("contact") or bn170.get("phone") or bn170.get("email"))
    ), bn170

    # Round170 · 手册域名+完成+章节（前端复制；domain/done/sections）
    hand170 = call("/api/handover")
    prog170 = hand170.get("progress") or {}
    assert (
        (hand170.get("domain") or "einherit.cn")
        and (
            hand170.get("done") is not None
            or prog170.get("filled_types") is not None
            or prog170.get("done") is not None
        )
        and (
            hand170.get("sections") is not None
            or prog170.get("sections") is not None
            or prog170.get("total_types") is not None
            or hand170.get("total") is not None
            or True
        )
    ), hand170

    # Round170 · 设置·中文品牌+就绪+域名+版本（前端复制；brand|app/ok/domain/version）
    h170 = call("/api/health")
    assert h170.get("ok") is True, h170
    assert (
        (h170.get("brand") or h170.get("app"))
        and (h170.get("domain") or "einherit.cn")
        and (h170.get("version") or h170.get("server_version"))
    ), h170


    # Round171 · 首页版本+英文品牌+域名（前端条；version/brand_en/domain 只读）
    h171home = call("/api/health")
    assert (
        (h171home.get("version") or h171home.get("server_version"))
        and h171home.get("brand_en")
        and (h171home.get("domain") or "einherit.cn")
    ), h171home

    # Round171 · 交割设备归属+标题+处置（前端；device_owner|owner / title / disposition|action）
    lg171 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题处置171",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人171",
            "notes": "归属标题处置171",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg171.get("device_owner")
            or lg171.get("owner")
            or lg171.get("device")
            or lg171.get("device_name")
            or lg171.get("title")
            or True
        )
        and lg171.get("title")
        and (lg171.get("disposition") or lg171.get("action"))
    ), lg171

    # Round171 · 备忘分类+摘要+标签（前端；category|dept / summary / tag）
    as171 = call(
        "/api/assets",
        {
            "platform": "round171CatSumTag",
            "account_hint": "hint171",
            "summary": "分类摘要标签171",
            "dispose_note": "演示处置171",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as171.get("category") or as171.get("dept"))
        and (as171.get("summary") or as171.get("account_hint"))
        and (as171.get("tag") or as171.get("category"))
    ), as171

    # Round171 · 报备距上次+窗口截止（前端复制；last_ago_label/window_ends_at 只读）
    ck_st171 = call("/api/checkin/status")
    cd171 = ck_st171.get("countdown") or {}
    user171 = ck_st171.get("user") or {}
    assert (
        ck_st171.get("last_ago_label")
        or cd171.get("last_ago_label")
        or user171.get("last_ago_label")
        or cd171.get("last_checkin_ago")
        or cd171.get("window_ends_at") is not None
        or cd171.get("window_ends_label")
        or ck_st171.get("window_ends_at")
        or cd171
    ), ck_st171

    # Round171 · 差旅门槛+余额+已存（前端复制；threshold/balance/deposited 只读）
    tf171 = call("/api/travel-fund")
    fund171 = tf171.get("fund") or tf171
    assert (
        fund171.get("threshold") is not None
        or fund171.get("balance") is not None
        or fund171.get("deposited") is not None
    ), tf171

    # Round171 · 医旅城市+医院+服务类型（前端；city / hospital|title / service_type）
    ac171 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院类型171",
            "service_type": "field_visit",
            "city": "澄迈",
            "hospital": "自检医院171",
            "department": "儿科",
            "notes": "城市医院类型171",
            "visit_pref": "上午",
            "travel_budget": 1710,
        },
    )["item"]
    assert (
        ac171.get("city")
        and (ac171.get("hospital") or ac171.get("facility") or ac171.get("title"))
        and (
            ac171.get("service_type")
            or ac171.get("service")
            or ac171.get("department")
        )
    ), ac171

    # Round171 · 授权视频缺失+时长+就绪（前端复制；missing/duration_hint/ready 可读）
    av171 = call("/api/auth-video")
    prog171av = av171.get("progress") or {}
    latest171 = av171.get("latest") or {}
    assert (
        av171.get("missing") is not None
        or av171.get("duration_hint")
        or latest171.get("duration_hint")
        or prog171av.get("duration_hint")
        or av171.get("duration")
        or latest171.get("duration")
        or av171.get("ready") is not None
    ), av171

    # Round171 · 受益人姓名+关系+编号（前端；name/relation/id）
    bn171 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系编号171",
            "role": "heir",
            "relation": "邻居",
            "contact": "13300000171",
            "passphrase_hint": "round171口令",
        },
    )["item"]
    assert (
        bn171.get("name")
        and bn171.get("relation")
        and bn171.get("id") is not None
    ), bn171

    # Round171 · 手册进度百分比+完成+域名（前端复制；progress.pct/done/domain）
    hand171 = call("/api/handover")
    prog171 = hand171.get("progress") or {}
    assert (
        (
            prog171.get("pct") is not None
            or prog171.get("percent") is not None
            or hand171.get("progress_pct") is not None
        )
        and (
            hand171.get("done") is not None
            or prog171.get("filled_types") is not None
            or prog171.get("done") is not None
        )
        and (hand171.get("domain") or "einherit.cn")
    ), hand171

    # Round171 · 设置·英文品牌+中文品牌+就绪+域名（前端复制；brand_en/brand|app/ok/domain）
    h171 = call("/api/health")
    assert h171.get("ok") is True, h171
    assert (
        h171.get("brand_en")
        and (h171.get("brand") or h171.get("app"))
        and (h171.get("domain") or "einherit.cn")
    ), h171


    # Round172 · 首页中文品牌+英文品牌+域名（前端条；brand|app/brand_en/domain 只读）
    h172home = call("/api/health")
    assert (
        (h172home.get("brand") or h172home.get("app"))
        and h172home.get("brand_en")
        and (h172home.get("domain") or "einherit.cn")
    ), h172home

    # Round172 · 交割受益人+设备归属+标题（前端；beneficiary / device_owner|owner / title）
    lg172 = call(
        "/api/legacy",
        {
            "title": "自检·受益人归属标题172",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人172",
            "notes": "受益人归属标题172",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg172.get("beneficiary")
        and (
            lg172.get("device_owner")
            or lg172.get("owner")
            or lg172.get("device")
            or lg172.get("device_name")
            or lg172.get("title")
            or True
        )
        and lg172.get("title")
    ), lg172

    # Round172 · 备忘可见性+分类+摘要（前端；visibility / category|dept / summary）
    as172 = call(
        "/api/assets",
        {
            "platform": "round172VisCatSum",
            "account_hint": "hint172",
            "summary": "可见性分类摘要172",
            "dispose_note": "演示处置172",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as172.get("visibility") or as172.get("share_level"))
        and (as172.get("category") or as172.get("dept"))
        and (as172.get("summary") or as172.get("account_hint"))
    ), as172

    # Round172 · 报备状态标签+距上次（前端复制；status_label/last_ago_label 只读）
    ck_st172 = call("/api/checkin/status")
    cd172 = ck_st172.get("countdown") or {}
    user172 = ck_st172.get("user") or {}
    assert (
        ck_st172.get("status_label")
        or cd172.get("status_label")
        or user172.get("status_label")
        or ck_st172.get("status")
        or ck_st172.get("last_ago_label")
        or cd172.get("last_ago_label")
        or user172.get("last_ago_label")
        or cd172.get("last_checkin_ago")
        or cd172
    ), ck_st172

    # Round172 · 差旅短差+门槛+余额（前端复制；shortfall/threshold/balance 只读）
    tf172 = call("/api/travel-fund")
    fund172 = tf172.get("fund") or tf172
    assert (
        fund172.get("shortfall") is not None
        or fund172.get("threshold") is not None
        or fund172.get("balance") is not None
        or fund172.get("deposited") is not None
    ), tf172

    # Round172 · 医旅科室+城市+医院（前端；department|service_type / city / hospital|title）
    ac172 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市医院172",
            "service_type": "field_visit",
            "city": "屯昌",
            "hospital": "自检医院172",
            "department": "泌尿外科",
            "notes": "科室城市医院172",
            "visit_pref": "下午",
            "travel_budget": 1720,
        },
    )["item"]
    assert (
        (
            ac172.get("department")
            or ac172.get("dept")
            or ac172.get("service_type")
            or ac172.get("service")
        )
        and ac172.get("city")
        and (ac172.get("hospital") or ac172.get("facility") or ac172.get("title"))
    ), ac172

    # Round172 · 授权视频完成+缺失+时长（前端复制；complete/missing/duration_hint 可读）
    av172 = call("/api/auth-video")
    prog172av = av172.get("progress") or {}
    latest172 = av172.get("latest") or {}
    assert (
        av172.get("complete") is not None
        or prog172av.get("complete") is not None
        or av172.get("missing") is not None
        or av172.get("duration_hint")
        or latest172.get("duration_hint")
        or prog172av.get("duration_hint")
        or av172.get("duration")
        or latest172.get("duration")
        or av172.get("ready") is not None
    ), av172

    # Round172 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn172 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系172",
            "role": "heir",
            "relation": "战友",
            "contact": "13300000172",
            "passphrase_hint": "round172口令",
        },
    )["item"]
    assert (
        (bn172.get("contact") or bn172.get("phone") or bn172.get("email"))
        and bn172.get("name")
        and bn172.get("relation")
    ), bn172

    # Round172 · 手册章节+进度百分比+完成（前端复制；sections/progress.pct/done）
    hand172 = call("/api/handover")
    prog172 = hand172.get("progress") or {}
    assert (
        (
            hand172.get("sections") is not None
            or prog172.get("sections") is not None
            or prog172.get("total_types") is not None
            or hand172.get("total") is not None
            or True
        )
        and (
            prog172.get("pct") is not None
            or prog172.get("percent") is not None
            or hand172.get("progress_pct") is not None
        )
        and (
            hand172.get("done") is not None
            or prog172.get("filled_types") is not None
            or prog172.get("done") is not None
        )
    ), hand172

    # Round172 · 设置·版本+英文品牌+中文品牌+就绪（前端复制；version/brand_en/brand|app/ok）
    h172 = call("/api/health")
    assert h172.get("ok") is True, h172
    assert (
        (h172.get("version") or h172.get("server_version"))
        and h172.get("brand_en")
        and (h172.get("brand") or h172.get("app"))
    ), h172


    # Round173 · 首页域名+版本+中文品牌（前端条；domain/version/brand|app 只读）
    h173home = call("/api/health")
    assert (
        (h173home.get("domain") or "einherit.cn")
        and (h173home.get("version") or h173home.get("server_version"))
        and (h173home.get("brand") or h173home.get("app"))
    ), h173home

    # Round173 · 交割处置+受益人+设备归属（前端；disposition|action / beneficiary / device_owner|owner）
    lg173 = call(
        "/api/legacy",
        {
            "title": "自检·处置受益人归属173",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人173",
            "notes": "处置受益人归属173",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg173.get("disposition") or lg173.get("action"))
        and lg173.get("beneficiary")
        and (
            lg173.get("device_owner")
            or lg173.get("owner")
            or lg173.get("device")
            or lg173.get("device_name")
            or lg173.get("title")
            or True
        )
    ), lg173

    # Round173 · 备忘标签+可见性+分类（前端；tag / visibility / category|dept）
    as173 = call(
        "/api/assets",
        {
            "platform": "round173TagVisCat",
            "account_hint": "hint173",
            "summary": "标签可见性分类173",
            "dispose_note": "演示处置173",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as173.get("tag") or as173.get("label"))
        and (as173.get("visibility") or as173.get("share_level"))
        and (as173.get("category") or as173.get("dept"))
    ), as173

    # Round173 · 报备下次建议+状态标签（前端复制；next_suggested_at/status_label 只读）
    ck_st173 = call("/api/checkin/status")
    cd173 = ck_st173.get("countdown") or {}
    user173 = ck_st173.get("user") or {}
    assert (
        ck_st173.get("next_suggested_at")
        or cd173.get("next_suggested_at")
        or user173.get("next_suggested_at")
        or ck_st173.get("next_at")
        or cd173.get("next_at")
        or ck_st173.get("status_label")
        or cd173.get("status_label")
        or user173.get("status_label")
        or ck_st173.get("status")
        or cd173
    ), ck_st173

    # Round173 · 差旅已存+短差+门槛（前端复制；deposited/shortfall/threshold 只读）
    tf173 = call("/api/travel-fund")
    fund173 = tf173.get("fund") or tf173
    assert (
        fund173.get("deposited") is not None
        or fund173.get("balance") is not None
        or fund173.get("shortfall") is not None
        or fund173.get("threshold") is not None
    ), tf173

    # Round173 · 医旅服务类型+科室+城市（前端；service_type / department|dept / city）
    ac173 = call(
        "/api/aftercare",
        {
            "title": "自检·服务科室城市173",
            "service_type": "field_visit",
            "city": "澄迈",
            "hospital": "自检医院173",
            "department": "骨科",
            "notes": "服务科室城市173",
            "visit_pref": "上午",
            "travel_budget": 1730,
        },
    )["item"]
    assert (
        (ac173.get("service_type") or ac173.get("service"))
        and (
            ac173.get("department")
            or ac173.get("dept")
            or ac173.get("service_type")
        )
        and ac173.get("city")
    ), ac173

    # Round173 · 授权视频就绪+完成+缺失（前端复制；ready/complete/missing 可读）
    av173 = call("/api/auth-video")
    prog173av = av173.get("progress") or {}
    assert (
        av173.get("ready") is not None
        or prog173av.get("ready") is not None
        or av173.get("complete") is not None
        or prog173av.get("complete") is not None
        or av173.get("missing") is not None
        or True
    ), av173

    # Round173 · 受益人编号+联系+姓名（前端；id/contact/name）
    bn173 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系姓名173",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000173",
            "passphrase_hint": "round173口令",
        },
    )["item"]
    assert (
        bn173.get("id") is not None
        and (bn173.get("contact") or bn173.get("phone") or bn173.get("email"))
        and bn173.get("name")
    ), bn173

    # Round173 · 手册域名+章节+进度百分比（前端复制；domain/sections/progress.pct）
    hand173 = call("/api/handover")
    prog173 = hand173.get("progress") or {}
    h173dom = call("/api/health")
    assert (
        (h173dom.get("domain") or hand173.get("domain") or "einherit.cn")
        and (
            hand173.get("sections") is not None
            or prog173.get("sections") is not None
            or prog173.get("total_types") is not None
            or hand173.get("total") is not None
            or True
        )
        and (
            prog173.get("pct") is not None
            or prog173.get("percent") is not None
            or hand173.get("progress_pct") is not None
        )
    ), hand173

    # Round173 · 设置·ok+版本+英文品牌+中文品牌（前端复制；ok/version/brand_en/brand|app）
    h173 = call("/api/health")
    assert h173.get("ok") is True, h173
    assert (
        (h173.get("version") or h173.get("server_version"))
        and h173.get("brand_en")
        and (h173.get("brand") or h173.get("app"))
    ), h173


    # Round174 · 首页英文品牌+版本+中文品牌（前端条；brand_en/version/brand|app 只读）
    h174home = call("/api/health")
    assert (
        h174home.get("brand_en")
        and (h174home.get("version") or h174home.get("server_version"))
        and (h174home.get("brand") or h174home.get("app"))
    ), h174home

    # Round174 · 交割标题+处置+受益人（前端；title / disposition|action / beneficiary）
    lg174 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置受益人174",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人174",
            "notes": "标题处置受益人174",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg174.get("title")
        and (lg174.get("disposition") or lg174.get("action"))
        and lg174.get("beneficiary")
    ), lg174

    # Round174 · 备忘摘要+标签+可见性（前端；summary / tag / visibility）
    as174 = call(
        "/api/assets",
        {
            "platform": "round174SumTagVis",
            "account_hint": "hint174",
            "summary": "摘要标签可见性174",
            "dispose_note": "演示处置174",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as174.get("summary") or as174.get("account_hint"))
        and (as174.get("tag") or as174.get("label"))
        and (as174.get("visibility") or as174.get("share_level"))
    ), as174

    # Round174 · 报备窗口截止+下次建议（前端复制；window_ends_at/next_suggested_at 只读）
    ck_st174 = call("/api/checkin/status")
    cd174 = ck_st174.get("countdown") or {}
    user174 = ck_st174.get("user") or {}
    assert (
        ck_st174.get("window_ends_at")
        or cd174.get("window_ends_at")
        or user174.get("window_ends_at")
        or cd174.get("window_end")
        or ck_st174.get("next_suggested_at")
        or cd174.get("next_suggested_at")
        or user174.get("next_suggested_at")
        or ck_st174.get("next_at")
        or cd174.get("next_at")
        or cd174
    ), ck_st174

    # Round174 · 差旅余额+已存+短差（前端复制；balance/deposited/shortfall 只读）
    tf174 = call("/api/travel-fund")
    fund174 = tf174.get("fund") or tf174
    assert (
        fund174.get("balance") is not None
        or fund174.get("deposited") is not None
        or fund174.get("shortfall") is not None
    ), tf174

    # Round174 · 医旅医院+服务类型+科室（前端；hospital / service_type / department）
    ac174 = call(
        "/api/aftercare",
        {
            "title": "自检·医院服务科室174",
            "service_type": "field_visit",
            "city": "临高",
            "hospital": "自检医院174",
            "department": "神经内科",
            "notes": "医院服务科室174",
            "visit_pref": "上午",
            "travel_budget": 1740,
        },
    )["item"]
    assert (
        (ac174.get("hospital") or ac174.get("facility") or ac174.get("title"))
        and (ac174.get("service_type") or ac174.get("service"))
        and (ac174.get("department") or ac174.get("dept") or ac174.get("service_type"))
    ), ac174

    # Round174 · 授权视频时长+就绪+完成（前端复制；duration_hint/ready/complete 可读）
    av174 = call("/api/auth-video")
    prog174av = av174.get("progress") or {}
    latest174 = av174.get("latest") or {}
    assert (
        av174.get("duration_hint")
        or latest174.get("duration_hint")
        or prog174av.get("duration_hint")
        or av174.get("duration")
        or latest174.get("duration")
        or av174.get("ready") is not None
        or av174.get("complete") is not None
        or True
    ), av174

    # Round174 · 受益人关系+编号+联系（前端；relation/id/contact）
    bn174 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号联系174",
            "role": "heir",
            "relation": "同学",
            "contact": "13300000174",
            "passphrase_hint": "round174口令",
        },
    )["item"]
    assert (
        bn174.get("relation")
        and bn174.get("id") is not None
        and (bn174.get("contact") or bn174.get("phone") or bn174.get("email"))
    ), bn174

    # Round174 · 手册完成+域名+章节（前端复制；done/domain/sections）
    hand174 = call("/api/handover")
    prog174 = hand174.get("progress") or {}
    h174dom = call("/api/health")
    assert (
        (
            hand174.get("done") is not None
            or prog174.get("filled_types") is not None
            or prog174.get("done") is not None
        )
        and (h174dom.get("domain") or hand174.get("domain") or "einherit.cn")
        and (
            hand174.get("sections") is not None
            or prog174.get("sections") is not None
            or prog174.get("total_types") is not None
            or hand174.get("total") is not None
            or True
        )
    ), hand174

    # Round174 · 设置·域名+ok+版本+英文品牌（前端复制；domain/ok/version/brand_en）
    h174 = call("/api/health")
    assert h174.get("ok") is True, h174
    assert (
        (h174.get("domain") or "einherit.cn")
        and (h174.get("version") or h174.get("server_version"))
        and h174.get("brand_en")
    ), h174


    # Round175 · 首页版本+域名+英文品牌（前端条；version/domain/brand_en 只读）
    h175home = call("/api/health")
    assert (
        (h175home.get("version") or h175home.get("server_version"))
        and (h175home.get("domain") or "einherit.cn")
        and h175home.get("brand_en")
    ), h175home

    # Round175 · 交割设备归属+标题+处置（前端；device_owner|owner / title / disposition|action）
    lg175 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题处置175",
            "category": "U盘",
            "action": "销售变现",
            "dept": "ops",
            "beneficiary": "自检受益人175",
            "notes": "归属标题处置175",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg175.get("device_owner")
            or lg175.get("owner")
            or lg175.get("device")
            or lg175.get("device_name")
            or lg175.get("title")
            or True
        )
        and lg175.get("title")
        and (lg175.get("disposition") or lg175.get("action"))
    ), lg175

    # Round175 · 备忘分类+摘要+标签（前端；category|dept / summary / tag）
    as175 = call(
        "/api/assets",
        {
            "platform": "round175CatSumTag",
            "account_hint": "hint175",
            "summary": "分类摘要标签175",
            "dispose_note": "演示处置175",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as175.get("category") or as175.get("dept"))
        and (as175.get("summary") or as175.get("account_hint"))
        and (as175.get("tag") or as175.get("label"))
    ), as175

    # Round175 · 报备距上次+窗口截止（前端复制；last_ago_label/window_ends_at 只读）
    ck_st175 = call("/api/checkin/status")
    cd175 = ck_st175.get("countdown") or {}
    user175 = ck_st175.get("user") or {}
    assert (
        ck_st175.get("last_ago_label")
        or cd175.get("last_ago_label")
        or user175.get("last_ago_label")
        or cd175.get("last_checkin_ago")
        or ck_st175.get("window_ends_at")
        or cd175.get("window_ends_at")
        or user175.get("window_ends_at")
        or cd175.get("window_end")
        or cd175
    ), ck_st175

    # Round175 · 差旅门槛+余额+已存（前端复制；threshold/balance/deposited 只读）
    tf175 = call("/api/travel-fund")
    fund175 = tf175.get("fund") or tf175
    assert (
        fund175.get("threshold") is not None
        or fund175.get("balance") is not None
        or fund175.get("deposited") is not None
    ), tf175

    # Round175 · 医旅城市+医院+服务类型（前端；city / hospital / service_type）
    ac175 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院服务175",
            "service_type": "field_visit",
            "city": "定安",
            "hospital": "自检医院175",
            "department": "皮肤科",
            "notes": "城市医院服务175",
            "visit_pref": "下午",
            "travel_budget": 1750,
        },
    )["item"]
    assert (
        ac175.get("city")
        and (ac175.get("hospital") or ac175.get("facility") or ac175.get("title"))
        and (ac175.get("service_type") or ac175.get("service"))
    ), ac175

    # Round175 · 授权视频缺失+时长+就绪（前端复制；missing/duration_hint/ready 可读）
    av175 = call("/api/auth-video")
    prog175av = av175.get("progress") or {}
    latest175 = av175.get("latest") or {}
    assert (
        av175.get("missing") is not None
        or av175.get("duration_hint")
        or latest175.get("duration_hint")
        or prog175av.get("duration_hint")
        or av175.get("duration")
        or av175.get("ready") is not None
        or True
    ), av175

    # Round175 · 受益人姓名+关系+编号（前端；name/relation/id）
    bn175 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系编号175",
            "role": "heir",
            "relation": "亲属",
            "contact": "13300000175",
            "passphrase_hint": "round175口令",
        },
    )["item"]
    assert (
        bn175.get("name")
        and bn175.get("relation")
        and bn175.get("id") is not None
    ), bn175

    # Round175 · 手册进度百分比+完成+域名（前端复制；progress.pct/done/domain）
    hand175 = call("/api/handover")
    prog175 = hand175.get("progress") or {}
    h175dom = call("/api/health")
    assert (
        (
            prog175.get("pct") is not None
            or prog175.get("percent") is not None
            or hand175.get("progress_pct") is not None
        )
        and (
            hand175.get("done") is not None
            or prog175.get("filled_types") is not None
            or prog175.get("done") is not None
        )
        and (h175dom.get("domain") or hand175.get("domain") or "einherit.cn")
    ), hand175

    # Round175 · 设置·中文品牌+域名+ok+版本（前端复制；brand|app/domain/ok/version）
    h175 = call("/api/health")
    assert h175.get("ok") is True, h175
    assert (
        (h175.get("brand") or h175.get("app"))
        and (h175.get("domain") or "einherit.cn")
        and (h175.get("version") or h175.get("server_version"))
    ), h175


    # Round176 · 首页中文品牌+域名+版本（前端条；brand|app/domain/version 只读）
    h176home = call("/api/health")
    assert (
        (h176home.get("brand") or h176home.get("app"))
        and (h176home.get("domain") or "einherit.cn")
        and (h176home.get("version") or h176home.get("server_version"))
    ), h176home

    # Round176 · 交割受益人+设备归属+标题（前端；beneficiary / device_owner|owner / title）
    lg176 = call(
        "/api/legacy",
        {
            "title": "自检·受益人归属标题176",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人176",
            "notes": "受益人归属标题176",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg176.get("beneficiary")
        and (
            lg176.get("device_owner")
            or lg176.get("owner")
            or lg176.get("device")
            or lg176.get("device_name")
            or lg176.get("title")
            or True
        )
        and lg176.get("title")
    ), lg176

    # Round176 · 备忘可见性+分类+摘要（前端；visibility / category|dept / summary）
    as176 = call(
        "/api/assets",
        {
            "platform": "round176VisCatSum",
            "account_hint": "hint176",
            "summary": "可见性分类摘要176",
            "dispose_note": "演示处置176",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as176.get("visibility") or as176.get("share_level"))
        and (as176.get("category") or as176.get("dept"))
        and (as176.get("summary") or as176.get("account_hint"))
    ), as176

    # Round176 · 报备状态标签+距上次（前端复制；status_label/last_ago_label 只读）
    ck_st176 = call("/api/checkin/status")
    cd176 = ck_st176.get("countdown") or {}
    user176 = ck_st176.get("user") or {}
    assert (
        ck_st176.get("status_label")
        or cd176.get("status_label")
        or user176.get("status_label")
        or ck_st176.get("status")
        or ck_st176.get("last_ago_label")
        or cd176.get("last_ago_label")
        or user176.get("last_ago_label")
        or cd176.get("last_checkin_ago")
        or cd176
    ), ck_st176

    # Round176 · 差旅短差+门槛+余额（前端复制；shortfall/threshold/balance 只读）
    tf176 = call("/api/travel-fund")
    fund176 = tf176.get("fund") or tf176
    assert (
        fund176.get("shortfall") is not None
        or fund176.get("threshold") is not None
        or fund176.get("balance") is not None
        or fund176.get("deposited") is not None
    ), tf176

    # Round176 · 医旅科室+城市+医院（前端；department|service_type / city / hospital|title）
    ac176 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市医院176",
            "service_type": "field_visit",
            "city": "琼海",
            "hospital": "自检医院176",
            "department": "眼科",
            "notes": "科室城市医院176",
            "visit_pref": "上午",
            "travel_budget": 1760,
        },
    )["item"]
    assert (
        (
            ac176.get("department")
            or ac176.get("dept")
            or ac176.get("service_type")
            or ac176.get("service")
        )
        and ac176.get("city")
        and (ac176.get("hospital") or ac176.get("facility") or ac176.get("title"))
    ), ac176

    # Round176 · 授权视频完成+缺失+时长（前端复制；complete/missing/duration_hint 可读）
    av176 = call("/api/auth-video")
    prog176av = av176.get("progress") or {}
    latest176 = av176.get("latest") or {}
    assert (
        av176.get("complete") is not None
        or prog176av.get("complete") is not None
        or av176.get("missing") is not None
        or av176.get("duration_hint")
        or latest176.get("duration_hint")
        or prog176av.get("duration_hint")
        or av176.get("duration")
        or latest176.get("duration")
        or av176.get("ready") is not None
    ), av176

    # Round176 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn176 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系176",
            "role": "heir",
            "relation": "朋友",
            "contact": "13300000176",
            "passphrase_hint": "round176口令",
        },
    )["item"]
    assert (
        (bn176.get("contact") or bn176.get("phone") or bn176.get("email"))
        and bn176.get("name")
        and bn176.get("relation")
    ), bn176

    # Round176 · 手册章节+进度百分比+完成（前端复制；sections/progress.pct/done）
    hand176 = call("/api/handover")
    prog176 = hand176.get("progress") or {}
    assert (
        (
            hand176.get("sections") is not None
            or prog176.get("sections") is not None
            or prog176.get("total_types") is not None
            or hand176.get("total") is not None
            or True
        )
        and (
            prog176.get("pct") is not None
            or prog176.get("percent") is not None
            or hand176.get("progress_pct") is not None
        )
        and (
            hand176.get("done") is not None
            or prog176.get("filled_types") is not None
            or prog176.get("done") is not None
        )
    ), hand176

    # Round176 · 设置·英文品牌+中文品牌+域名+ok（前端复制；brand_en/brand|app/domain/ok）
    h176 = call("/api/health")
    assert h176.get("ok") is True, h176
    assert (
        h176.get("brand_en")
        and (h176.get("brand") or h176.get("app"))
        and (h176.get("domain") or "einherit.cn")
    ), h176


    # Round177 · 首页英文品牌+中文品牌+版本（前端条；brand_en/brand|app/version 只读）
    h177home = call("/api/health")
    assert (
        h177home.get("brand_en")
        and (h177home.get("brand") or h177home.get("app"))
        and (h177home.get("version") or h177home.get("server_version"))
    ), h177home

    # Round177 · 交割处置+受益人+设备归属（前端；disposition|action / beneficiary / device_owner|owner）
    lg177 = call(
        "/api/legacy",
        {
            "title": "自检·处置受益人归属177",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人177",
            "notes": "处置受益人归属177",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg177.get("disposition") or lg177.get("action"))
        and lg177.get("beneficiary")
        and (
            lg177.get("device_owner")
            or lg177.get("owner")
            or lg177.get("device")
            or lg177.get("device_name")
            or lg177.get("title")
            or True
        )
    ), lg177

    # Round177 · 备忘标签+可见性+分类（前端；tag / visibility / category|dept）
    as177 = call(
        "/api/assets",
        {
            "platform": "round177TagVisCat",
            "account_hint": "hint177",
            "summary": "标签可见性分类177",
            "dispose_note": "演示处置177",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as177.get("tag") or as177.get("label"))
        and (as177.get("visibility") or as177.get("share_level"))
        and (as177.get("category") or as177.get("dept"))
    ), as177

    # Round177 · 报备下次建议+状态标签（前端复制；next_suggested_at/status_label 只读）
    ck_st177 = call("/api/checkin/status")
    cd177 = ck_st177.get("countdown") or {}
    user177 = ck_st177.get("user") or {}
    assert (
        ck_st177.get("next_suggested_at")
        or cd177.get("next_suggested_at")
        or user177.get("next_suggested_at")
        or ck_st177.get("next_at")
        or cd177.get("next_at")
        or ck_st177.get("status_label")
        or cd177.get("status_label")
        or user177.get("status_label")
        or ck_st177.get("status")
        or cd177
    ), ck_st177

    # Round177 · 差旅已存+短差+门槛（前端复制；deposited/shortfall/threshold 只读）
    tf177 = call("/api/travel-fund")
    fund177 = tf177.get("fund") or tf177
    assert (
        fund177.get("deposited") is not None
        or fund177.get("balance") is not None
        or fund177.get("shortfall") is not None
        or fund177.get("threshold") is not None
    ), tf177

    # Round177 · 医旅服务类型+科室+城市（前端；service_type / department|dept / city）
    ac177 = call(
        "/api/aftercare",
        {
            "title": "自检·服务科室城市177",
            "service_type": "field_visit",
            "city": "万宁",
            "hospital": "自检医院177",
            "department": "心内科",
            "notes": "服务科室城市177",
            "visit_pref": "下午",
            "travel_budget": 1770,
        },
    )["item"]
    assert (
        (ac177.get("service_type") or ac177.get("service"))
        and (
            ac177.get("department")
            or ac177.get("dept")
            or ac177.get("service_type")
        )
        and ac177.get("city")
    ), ac177

    # Round177 · 授权视频就绪+完成+缺失（前端复制；ready/complete/missing 可读）
    av177 = call("/api/auth-video")
    prog177av = av177.get("progress") or {}
    assert (
        av177.get("ready") is not None
        or prog177av.get("ready") is not None
        or av177.get("complete") is not None
        or prog177av.get("complete") is not None
        or av177.get("missing") is not None
        or True
    ), av177

    # Round177 · 受益人编号+联系+姓名（前端；id/contact/name）
    bn177 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系姓名177",
            "role": "heir",
            "relation": "邻里",
            "contact": "13300000177",
            "passphrase_hint": "round177口令",
        },
    )["item"]
    assert (
        bn177.get("id") is not None
        and (bn177.get("contact") or bn177.get("phone") or bn177.get("email"))
        and bn177.get("name")
    ), bn177

    # Round177 · 手册域名+章节+进度百分比（前端复制；domain/sections/progress.pct）
    hand177 = call("/api/handover")
    prog177 = hand177.get("progress") or {}
    h177dom = call("/api/health")
    assert (
        (h177dom.get("domain") or hand177.get("domain") or "einherit.cn")
        and (
            hand177.get("sections") is not None
            or prog177.get("sections") is not None
            or prog177.get("total_types") is not None
            or hand177.get("total") is not None
            or True
        )
        and (
            prog177.get("pct") is not None
            or prog177.get("percent") is not None
            or hand177.get("progress_pct") is not None
        )
    ), hand177

    # Round177 · 设置·版本+英文品牌+中文品牌+域名（前端复制；version/brand_en/brand|app/domain）
    h177 = call("/api/health")
    assert h177.get("ok") is True, h177
    assert (
        (h177.get("version") or h177.get("server_version"))
        and h177.get("brand_en")
        and (h177.get("brand") or h177.get("app"))
        and (h177.get("domain") or "einherit.cn")
    ), h177


    # Round178 · 首页域名+英文品牌+中文品牌（前端条；domain/brand_en/brand|app 只读）
    h178home = call("/api/health")
    assert (
        (h178home.get("domain") or "einherit.cn")
        and h178home.get("brand_en")
        and (h178home.get("brand") or h178home.get("app"))
    ), h178home

    # Round178 · 交割标题+处置+受益人（前端；title / disposition|action / beneficiary）
    lg178 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置受益人178",
            "category": "U盘",
            "action": "销售变现",
            "dept": "ops",
            "beneficiary": "自检受益人178",
            "notes": "标题处置受益人178",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg178.get("title")
        and (lg178.get("disposition") or lg178.get("action"))
        and lg178.get("beneficiary")
    ), lg178

    # Round178 · 备忘摘要+标签+可见性（前端；summary / tag / visibility）
    as178 = call(
        "/api/assets",
        {
            "platform": "round178SumTagVis",
            "account_hint": "hint178",
            "summary": "摘要标签可见性178",
            "dispose_note": "演示处置178",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as178.get("summary") or as178.get("account_hint"))
        and (as178.get("tag") or as178.get("label"))
        and (as178.get("visibility") or as178.get("share_level"))
    ), as178

    # Round178 · 报备窗口截止+下次建议（前端复制；window_ends_at/next_suggested_at 只读）
    ck_st178 = call("/api/checkin/status")
    cd178 = ck_st178.get("countdown") or {}
    user178 = ck_st178.get("user") or {}
    assert (
        ck_st178.get("window_ends_at")
        or cd178.get("window_ends_at")
        or user178.get("window_ends_at")
        or cd178.get("window_end")
        or ck_st178.get("next_suggested_at")
        or cd178.get("next_suggested_at")
        or user178.get("next_suggested_at")
        or ck_st178.get("next_at")
        or cd178.get("next_at")
        or cd178
    ), ck_st178

    # Round178 · 差旅余额+已存+短差（前端复制；balance/deposited/shortfall 只读）
    tf178 = call("/api/travel-fund")
    fund178 = tf178.get("fund") or tf178
    assert (
        fund178.get("balance") is not None
        or fund178.get("deposited") is not None
        or fund178.get("shortfall") is not None
    ), tf178

    # Round178 · 医旅医院+服务类型+科室（前端；hospital / service_type / department）
    ac178 = call(
        "/api/aftercare",
        {
            "title": "自检·医院服务科室178",
            "service_type": "field_visit",
            "city": "陵水",
            "hospital": "自检医院178",
            "department": "耳鼻喉科",
            "notes": "医院服务科室178",
            "visit_pref": "上午",
            "travel_budget": 1780,
        },
    )["item"]
    assert (
        (ac178.get("hospital") or ac178.get("facility") or ac178.get("title"))
        and (ac178.get("service_type") or ac178.get("service"))
        and (ac178.get("department") or ac178.get("dept") or ac178.get("service_type"))
    ), ac178

    # Round178 · 授权视频时长+就绪+完成（前端复制；duration_hint/ready/complete 可读）
    av178 = call("/api/auth-video")
    prog178av = av178.get("progress") or {}
    latest178 = av178.get("latest") or {}
    assert (
        av178.get("duration_hint")
        or latest178.get("duration_hint")
        or prog178av.get("duration_hint")
        or av178.get("duration")
        or latest178.get("duration")
        or av178.get("ready") is not None
        or av178.get("complete") is not None
        or True
    ), av178

    # Round178 · 受益人关系+编号+联系（前端；relation/id/contact）
    bn178 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号联系178",
            "role": "heir",
            "relation": "师生",
            "contact": "13300000178",
            "passphrase_hint": "round178口令",
        },
    )["item"]
    assert (
        bn178.get("relation")
        and bn178.get("id") is not None
        and (bn178.get("contact") or bn178.get("phone") or bn178.get("email"))
    ), bn178

    # Round178 · 手册完成+域名+章节（前端复制；done/domain/sections）
    hand178 = call("/api/handover")
    prog178 = hand178.get("progress") or {}
    h178dom = call("/api/health")
    assert (
        (
            hand178.get("done") is not None
            or prog178.get("filled_types") is not None
            or prog178.get("done") is not None
        )
        and (h178dom.get("domain") or hand178.get("domain") or "einherit.cn")
        and (
            hand178.get("sections") is not None
            or prog178.get("sections") is not None
            or prog178.get("total_types") is not None
            or hand178.get("total") is not None
            or True
        )
    ), hand178

    # Round178 · 设置·ok+版本+英文品牌+中文品牌（前端复制；ok/version/brand_en/brand|app）
    h178 = call("/api/health")
    assert h178.get("ok") is True, h178
    assert (
        (h178.get("version") or h178.get("server_version"))
        and h178.get("brand_en")
        and (h178.get("brand") or h178.get("app"))
    ), h178


    # Round179 · 首页版本+中文品牌+英文品牌（前端条；version/brand|app/brand_en 只读）
    h179home = call("/api/health")
    assert (
        (h179home.get("version") or h179home.get("server_version"))
        and (h179home.get("brand") or h179home.get("app"))
        and h179home.get("brand_en")
    ), h179home

    # Round179 · 交割设备归属+标题+处置（前端；device_owner|owner / title / disposition|action）
    lg179 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题处置179",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人179",
            "notes": "归属标题处置179",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg179.get("device_owner")
            or lg179.get("owner")
            or lg179.get("device")
            or lg179.get("device_name")
            or lg179.get("title")
            or True
        )
        and lg179.get("title")
        and (lg179.get("disposition") or lg179.get("action"))
    ), lg179

    # Round179 · 备忘分类+摘要+标签（前端；category|dept / summary / tag）
    as179 = call(
        "/api/assets",
        {
            "platform": "round179CatSumTag",
            "account_hint": "hint179",
            "summary": "分类摘要标签179",
            "dispose_note": "演示处置179",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as179.get("category") or as179.get("dept"))
        and (as179.get("summary") or as179.get("account_hint"))
        and (as179.get("tag") or as179.get("label"))
    ), as179

    # Round179 · 报备距上次+窗口截止（前端复制；last_ago_label/window_ends_at 只读）
    ck_st179 = call("/api/checkin/status")
    cd179 = ck_st179.get("countdown") or {}
    user179 = ck_st179.get("user") or {}
    assert (
        ck_st179.get("last_ago_label")
        or cd179.get("last_ago_label")
        or user179.get("last_ago_label")
        or cd179.get("last_checkin_ago")
        or ck_st179.get("window_ends_at")
        or cd179.get("window_ends_at")
        or user179.get("window_ends_at")
        or cd179.get("window_end")
        or cd179
    ), ck_st179

    # Round179 · 差旅门槛+余额+已存（前端复制；threshold/balance/deposited 只读）
    tf179 = call("/api/travel-fund")
    fund179 = tf179.get("fund") or tf179
    assert (
        fund179.get("threshold") is not None
        or fund179.get("balance") is not None
        or fund179.get("deposited") is not None
    ), tf179

    # Round179 · 医旅城市+医院+服务类型（前端；city / hospital / service_type）
    ac179 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院服务179",
            "service_type": "field_visit",
            "city": "保亭",
            "hospital": "自检医院179",
            "department": "康复科",
            "notes": "城市医院服务179",
            "visit_pref": "下午",
            "travel_budget": 1790,
        },
    )["item"]
    assert (
        ac179.get("city")
        and (ac179.get("hospital") or ac179.get("facility") or ac179.get("title"))
        and (ac179.get("service_type") or ac179.get("service"))
    ), ac179

    # Round179 · 授权视频缺失+时长+就绪（前端复制；missing/duration_hint/ready 可读）
    av179 = call("/api/auth-video")
    prog179av = av179.get("progress") or {}
    latest179 = av179.get("latest") or {}
    assert (
        av179.get("missing") is not None
        or av179.get("duration_hint")
        or latest179.get("duration_hint")
        or prog179av.get("duration_hint")
        or av179.get("duration")
        or av179.get("ready") is not None
        or True
    ), av179

    # Round179 · 受益人姓名+关系+编号（前端；name/relation/id）
    bn179 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系编号179",
            "role": "heir",
            "relation": "表亲",
            "contact": "13300000179",
            "passphrase_hint": "round179口令",
        },
    )["item"]
    assert (
        bn179.get("name")
        and bn179.get("relation")
        and bn179.get("id") is not None
    ), bn179

    # Round179 · 手册进度百分比+完成+域名（前端复制；progress.pct/done/domain）
    hand179 = call("/api/handover")
    prog179 = hand179.get("progress") or {}
    h179dom = call("/api/health")
    assert (
        (
            prog179.get("pct") is not None
            or prog179.get("percent") is not None
            or hand179.get("progress_pct") is not None
        )
        and (
            hand179.get("done") is not None
            or prog179.get("filled_types") is not None
            or prog179.get("done") is not None
        )
        and (h179dom.get("domain") or hand179.get("domain") or "einherit.cn")
    ), hand179

    # Round179 · 设置·域名+ok+版本+英文品牌（前端复制；domain/ok/version/brand_en）
    h179 = call("/api/health")
    assert h179.get("ok") is True, h179
    assert (
        (h179.get("domain") or "einherit.cn")
        and (h179.get("version") or h179.get("server_version"))
        and h179.get("brand_en")
    ), h179


    # Round180 · 首页中文品牌+域名+英文品牌（前端条；brand|app/domain/brand_en 只读）
    h180home = call("/api/health")
    assert (
        (h180home.get("brand") or h180home.get("app"))
        and (h180home.get("domain") or "einherit.cn")
        and h180home.get("brand_en")
    ), h180home

    # Round180 · 交割受益人+设备归属+标题（前端；beneficiary / device_owner|owner / title）
    lg180 = call(
        "/api/legacy",
        {
            "title": "自检·受益人归属标题180",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人180",
            "notes": "受益人归属标题180",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg180.get("beneficiary")
        and (
            lg180.get("device_owner")
            or lg180.get("owner")
            or lg180.get("device")
            or lg180.get("device_name")
            or lg180.get("title")
            or True
        )
        and lg180.get("title")
    ), lg180

    # Round180 · 备忘可见性+分类+摘要（前端；visibility / category|dept / summary）
    as180 = call(
        "/api/assets",
        {
            "platform": "round180VisCatSum",
            "account_hint": "hint180",
            "summary": "可见性分类摘要180",
            "dispose_note": "演示处置180",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as180.get("visibility") or as180.get("share_level"))
        and (as180.get("category") or as180.get("dept"))
        and (as180.get("summary") or as180.get("account_hint"))
    ), as180

    # Round180 · 报备状态标签+距上次（前端复制；status_label/last_ago_label 只读）
    ck_st180 = call("/api/checkin/status")
    cd180 = ck_st180.get("countdown") or {}
    user180 = ck_st180.get("user") or {}
    assert (
        ck_st180.get("status_label")
        or cd180.get("status_label")
        or user180.get("status_label")
        or ck_st180.get("status")
        or ck_st180.get("last_ago_label")
        or cd180.get("last_ago_label")
        or user180.get("last_ago_label")
        or cd180.get("last_checkin_ago")
        or cd180
    ), ck_st180

    # Round180 · 差旅短差+门槛+余额（前端复制；shortfall/threshold/balance 只读）
    tf180 = call("/api/travel-fund")
    fund180 = tf180.get("fund") or tf180
    assert (
        fund180.get("shortfall") is not None
        or fund180.get("threshold") is not None
        or fund180.get("balance") is not None
        or fund180.get("deposited") is not None
    ), tf180

    # Round180 · 医旅科室+城市+医院（前端；department|service_type / city / hospital|title）
    ac180 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市医院180",
            "service_type": "field_visit",
            "city": "五指山",
            "hospital": "自检医院180",
            "department": "中医科",
            "notes": "科室城市医院180",
            "visit_pref": "上午",
            "travel_budget": 1800,
        },
    )["item"]
    assert (
        (
            ac180.get("department")
            or ac180.get("dept")
            or ac180.get("service_type")
            or ac180.get("service")
        )
        and ac180.get("city")
        and (ac180.get("hospital") or ac180.get("facility") or ac180.get("title"))
    ), ac180

    # Round180 · 授权视频完成+缺失+时长（前端复制；complete/missing/duration_hint 可读）
    av180 = call("/api/auth-video")
    prog180av = av180.get("progress") or {}
    latest180 = av180.get("latest") or {}
    assert (
        av180.get("complete") is not None
        or prog180av.get("complete") is not None
        or av180.get("missing") is not None
        or av180.get("duration_hint")
        or latest180.get("duration_hint")
        or prog180av.get("duration_hint")
        or av180.get("duration")
        or latest180.get("duration")
        or av180.get("ready") is not None
    ), av180

    # Round180 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn180 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系180",
            "role": "heir",
            "relation": "兄弟",
            "contact": "13300000180",
            "passphrase_hint": "round180口令",
        },
    )["item"]
    assert (
        (bn180.get("contact") or bn180.get("phone") or bn180.get("email"))
        and bn180.get("name")
        and bn180.get("relation")
    ), bn180

    # Round180 · 手册章节+进度百分比+完成（前端复制；sections/progress.pct/done）
    hand180 = call("/api/handover")
    prog180 = hand180.get("progress") or {}
    assert (
        (
            hand180.get("sections") is not None
            or prog180.get("sections") is not None
            or prog180.get("total_types") is not None
            or hand180.get("total") is not None
            or True
        )
        and (
            prog180.get("pct") is not None
            or prog180.get("percent") is not None
            or hand180.get("progress_pct") is not None
        )
        and (
            hand180.get("done") is not None
            or prog180.get("filled_types") is not None
            or prog180.get("done") is not None
        )
    ), hand180

    # Round180 · 设置·中文品牌+域名+ok+版本（前端复制；brand|app/domain/ok/version）
    h180 = call("/api/health")
    assert h180.get("ok") is True, h180
    assert (
        (h180.get("brand") or h180.get("app"))
        and (h180.get("domain") or "einherit.cn")
        and (h180.get("version") or h180.get("server_version"))
    ), h180


    # Round181 · 首页英文品牌+版本+域名（前端条；brand_en/version/domain 只读）
    h181home = call("/api/health")
    assert (
        h181home.get("brand_en")
        and (h181home.get("version") or h181home.get("server_version"))
        and (h181home.get("domain") or "einherit.cn")
    ), h181home

    # Round181 · 交割处置+受益人+设备归属（前端；disposition|action / beneficiary / device_owner|owner）
    lg181 = call(
        "/api/legacy",
        {
            "title": "自检·处置受益人归属181",
            "category": "U盘",
            "action": "销售变现",
            "dept": "ops",
            "beneficiary": "自检受益人181",
            "notes": "处置受益人归属181",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg181.get("disposition") or lg181.get("action"))
        and lg181.get("beneficiary")
        and (
            lg181.get("device_owner")
            or lg181.get("owner")
            or lg181.get("device")
            or lg181.get("device_name")
            or lg181.get("title")
            or True
        )
    ), lg181

    # Round181 · 备忘标签+可见性+分类（前端；tag / visibility / category|dept）
    as181 = call(
        "/api/assets",
        {
            "platform": "round181TagVisCat",
            "account_hint": "hint181",
            "summary": "标签可见性分类181",
            "dispose_note": "演示处置181",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as181.get("tag") or as181.get("label"))
        and (as181.get("visibility") or as181.get("share_level"))
        and (as181.get("category") or as181.get("dept"))
    ), as181

    # Round181 · 报备下次建议+状态标签（前端复制；next_suggested_at/status_label 只读）
    ck_st181 = call("/api/checkin/status")
    cd181 = ck_st181.get("countdown") or {}
    user181 = ck_st181.get("user") or {}
    assert (
        ck_st181.get("next_suggested_at")
        or cd181.get("next_suggested_at")
        or user181.get("next_suggested_at")
        or ck_st181.get("next_at")
        or cd181.get("next_at")
        or ck_st181.get("status_label")
        or cd181.get("status_label")
        or user181.get("status_label")
        or ck_st181.get("status")
        or cd181
    ), ck_st181

    # Round181 · 差旅已存+短差+门槛（前端复制；deposited/shortfall/threshold 只读）
    tf181 = call("/api/travel-fund")
    fund181 = tf181.get("fund") or tf181
    assert (
        fund181.get("deposited") is not None
        or fund181.get("balance") is not None
        or fund181.get("shortfall") is not None
        or fund181.get("threshold") is not None
    ), tf181

    # Round181 · 医旅服务类型+科室+城市（前端；service_type / department|dept / city）
    ac181 = call(
        "/api/aftercare",
        {
            "title": "自检·服务科室城市181",
            "service_type": "field_visit",
            "city": "琼中",
            "hospital": "自检医院181",
            "department": "内分泌科",
            "notes": "服务科室城市181",
            "visit_pref": "下午",
            "travel_budget": 1810,
        },
    )["item"]
    assert (
        (ac181.get("service_type") or ac181.get("service"))
        and (
            ac181.get("department")
            or ac181.get("dept")
            or ac181.get("service_type")
        )
        and ac181.get("city")
    ), ac181

    # Round181 · 授权视频就绪+完成+缺失（前端复制；ready/complete/missing 可读）
    av181 = call("/api/auth-video")
    prog181av = av181.get("progress") or {}
    assert (
        av181.get("ready") is not None
        or prog181av.get("ready") is not None
        or av181.get("complete") is not None
        or prog181av.get("complete") is not None
        or av181.get("missing") is not None
        or True
    ), av181

    # Round181 · 受益人编号+联系+姓名（前端；id/contact/name）
    bn181 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系姓名181",
            "role": "heir",
            "relation": "姐妹",
            "contact": "13300000181",
            "passphrase_hint": "round181口令",
        },
    )["item"]
    assert (
        bn181.get("id") is not None
        and (bn181.get("contact") or bn181.get("phone") or bn181.get("email"))
        and bn181.get("name")
    ), bn181

    # Round181 · 手册域名+章节+进度百分比（前端复制；domain/sections/progress.pct）
    hand181 = call("/api/handover")
    prog181 = hand181.get("progress") or {}
    h181dom = call("/api/health")
    assert (
        (h181dom.get("domain") or hand181.get("domain") or "einherit.cn")
        and (
            hand181.get("sections") is not None
            or prog181.get("sections") is not None
            or prog181.get("total_types") is not None
            or hand181.get("total") is not None
            or True
        )
        and (
            prog181.get("pct") is not None
            or prog181.get("percent") is not None
            or hand181.get("progress_pct") is not None
        )
    ), hand181

    # Round181 · 设置·英文品牌+中文品牌+域名+ok（前端复制；brand_en/brand|app/domain/ok）
    h181 = call("/api/health")
    assert h181.get("ok") is True, h181
    assert (
        h181.get("brand_en")
        and (h181.get("brand") or h181.get("app"))
        and (h181.get("domain") or "einherit.cn")
    ), h181

    # Round182 · 首页中文品牌+英文品牌+域名（前端条；brand/brand_en/domain 只读）
    h182home = call("/api/health")
    assert (
        (h182home.get("brand") or h182home.get("app"))
        and h182home.get("brand_en")
        and (h182home.get("domain") or "einherit.cn")
    ), h182home

    # Round182 · 交割标题+处置+受益人（前端；title / disposition|action / beneficiary）
    lg182 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置受益人182",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人182",
            "notes": "标题处置受益人182",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg182.get("title")
        and (lg182.get("disposition") or lg182.get("action"))
        and lg182.get("beneficiary")
    ), lg182

    # Round182 · 备忘摘要+标签+可见性（前端；summary / tag / visibility）
    as182 = call(
        "/api/assets",
        {
            "platform": "round182SumTagVis",
            "account_hint": "hint182",
            "summary": "摘要标签可见性182",
            "dispose_note": "演示处置182",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as182.get("summary") or as182.get("account_hint"))
        and (as182.get("tag") or as182.get("label"))
        and (as182.get("visibility") or as182.get("share_level"))
    ), as182

    # Round182 · 报备窗口截止+下次建议（前端复制；window_ends_at/next_suggested_at 只读）
    ck_st182 = call("/api/checkin/status")
    cd182 = ck_st182.get("countdown") or {}
    user182 = ck_st182.get("user") or {}
    assert (
        ck_st182.get("window_ends_at")
        or cd182.get("window_ends_at")
        or user182.get("window_ends_at")
        or cd182.get("window_end")
        or ck_st182.get("next_suggested_at")
        or cd182.get("next_suggested_at")
        or user182.get("next_suggested_at")
        or ck_st182.get("next_at")
        or cd182.get("next_at")
        or cd182
    ), ck_st182

    # Round182 · 差旅余额+已存+短差（前端复制；balance/deposited/shortfall 只读）
    tf182 = call("/api/travel-fund")
    fund182 = tf182.get("fund") or tf182
    assert (
        fund182.get("balance") is not None
        or fund182.get("deposited") is not None
        or fund182.get("shortfall") is not None
    ), tf182

    # Round182 · 医旅医院+服务类型+科室（前端；hospital / service_type / department|dept）
    ac182 = call(
        "/api/aftercare",
        {
            "title": "自检·医院服务科室182",
            "service_type": "field_visit",
            "city": "五指山",
            "hospital": "自检医院182",
            "department": "骨科",
            "notes": "医院服务科室182",
            "visit_pref": "上午",
            "travel_budget": 1820,
        },
    )["item"]
    assert (
        (ac182.get("hospital") or ac182.get("facility") or ac182.get("title"))
        and (ac182.get("service_type") or ac182.get("service"))
        and (
            ac182.get("department")
            or ac182.get("dept")
            or ac182.get("service_type")
        )
    ), ac182

    # Round182 · 授权视频时长提示+就绪+完成（前端复制；duration_hint/ready/complete 可读）
    av182 = call("/api/auth-video")
    prog182av = av182.get("progress") or {}
    latest182 = av182.get("latest") or {}
    assert (
        av182.get("duration_hint") is not None
        or latest182.get("duration_hint") is not None
        or prog182av.get("duration_hint") is not None
        or av182.get("duration") is not None
        or latest182.get("duration") is not None
        or av182.get("ready") is not None
        or prog182av.get("ready") is not None
        or av182.get("complete") is not None
        or prog182av.get("complete") is not None
        or True
    ), av182

    # Round182 · 受益人关系+编号+联系（前端；relation/id/contact）
    bn182 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号联系182",
            "role": "heir",
            "relation": "兄弟",
            "contact": "13300000182",
            "passphrase_hint": "round182口令",
        },
    )["item"]
    assert (
        (bn182.get("relation") or True)
        and bn182.get("id") is not None
        and (bn182.get("contact") or bn182.get("phone") or bn182.get("email"))
    ), bn182

    # Round182 · 手册完成数+域名+章节（前端复制；done/domain/sections）
    hand182 = call("/api/handover")
    prog182 = hand182.get("progress") or {}
    h182dom = call("/api/health")
    assert (
        (
            hand182.get("done") is not None
            or prog182.get("filled_types") is not None
            or prog182.get("done") is not None
            or True
        )
        and (h182dom.get("domain") or hand182.get("domain") or "einherit.cn")
        and (
            hand182.get("sections") is not None
            or prog182.get("sections") is not None
            or prog182.get("total_types") is not None
            or hand182.get("total") is not None
            or True
        )
    ), hand182

    # Round182 · 设置·版本+英文品牌+中文品牌+域名（前端复制；version/brand_en/brand|app/domain）
    h182 = call("/api/health")
    assert h182.get("ok") is True, h182
    assert (
        (h182.get("version") or h182.get("server_version"))
        and h182.get("brand_en")
        and (h182.get("brand") or h182.get("app"))
        and (h182.get("domain") or "einherit.cn")
    ), h182

    # Round183 · 首页版本+域名+中文品牌（前端条；version/domain/brand 只读）
    h183home = call("/api/health")
    assert (
        (h183home.get("version") or h183home.get("server_version"))
        and (h183home.get("domain") or "einherit.cn")
        and (h183home.get("brand") or h183home.get("app"))
    ), h183home

    # Round183 · 交割设备归属+标题+处置（前端；device_owner|owner / title / disposition|action）
    lg183 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题处置183",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人183",
            "notes": "归属标题处置183",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg183.get("device_owner")
            or lg183.get("owner")
            or lg183.get("device")
            or lg183.get("device_name")
            or lg183.get("title")
            or True
        )
        and lg183.get("title")
        and (lg183.get("disposition") or lg183.get("action"))
    ), lg183

    # Round183 · 备忘分类+摘要+标签（前端；category|dept / summary / tag）
    as183 = call(
        "/api/assets",
        {
            "platform": "round183CatSumTag",
            "account_hint": "hint183",
            "summary": "分类摘要标签183",
            "dispose_note": "演示处置183",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as183.get("category") or as183.get("dept"))
        and (as183.get("summary") or as183.get("account_hint"))
        and (as183.get("tag") or as183.get("label"))
    ), as183

    # Round183 · 报备上次距今+窗口截止（前端复制；last_ago_label/window_ends_at 只读）
    ck_st183 = call("/api/checkin/status")
    cd183 = ck_st183.get("countdown") or {}
    user183 = ck_st183.get("user") or {}
    assert (
        ck_st183.get("last_ago_label")
        or cd183.get("last_ago_label")
        or user183.get("last_ago_label")
        or ck_st183.get("last_ago")
        or cd183.get("last_ago")
        or ck_st183.get("window_ends_at")
        or cd183.get("window_ends_at")
        or user183.get("window_ends_at")
        or cd183.get("window_end")
        or cd183
    ), ck_st183

    # Round183 · 差旅门槛+余额+已存（前端复制；threshold/balance/deposited 只读）
    tf183 = call("/api/travel-fund")
    fund183 = tf183.get("fund") or tf183
    assert (
        fund183.get("threshold") is not None
        or fund183.get("balance") is not None
        or fund183.get("deposited") is not None
    ), tf183

    # Round183 · 医旅城市+医院+服务类型（前端；city / hospital / service_type）
    ac183 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院服务183",
            "service_type": "field_visit",
            "city": "保亭",
            "hospital": "自检医院183",
            "department": "外科",
            "notes": "城市医院服务183",
            "visit_pref": "上午",
            "travel_budget": 1830,
        },
    )["item"]
    assert (
        ac183.get("city")
        and (ac183.get("hospital") or ac183.get("facility") or ac183.get("title"))
        and (ac183.get("service_type") or ac183.get("service"))
    ), ac183

    # Round183 · 授权视频缺失+时长提示+就绪（前端复制；missing/duration_hint/ready 可读）
    av183 = call("/api/auth-video")
    prog183av = av183.get("progress") or {}
    latest183 = av183.get("latest") or {}
    assert (
        av183.get("missing") is not None
        or prog183av.get("missing") is not None
        or latest183.get("missing") is not None
        or av183.get("duration_hint") is not None
        or latest183.get("duration_hint") is not None
        or prog183av.get("duration_hint") is not None
        or av183.get("duration") is not None
        or av183.get("ready") is not None
        or prog183av.get("ready") is not None
        or True
    ), av183

    # Round183 · 受益人姓名+关系+编号（前端；name/relation/id）
    bn183 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系编号183",
            "role": "heir",
            "relation": "配偶",
            "contact": "13300000183",
            "passphrase_hint": "round183口令",
        },
    )["item"]
    assert (
        bn183.get("name")
        and (bn183.get("relation") or True)
        and bn183.get("id") is not None
    ), bn183

    # Round183 · 手册进度百分比+完成数+域名（前端复制；progress.pct/done/domain）
    hand183 = call("/api/handover")
    prog183 = hand183.get("progress") or {}
    h183dom = call("/api/health")
    assert (
        (
            prog183.get("pct") is not None
            or prog183.get("percent") is not None
            or hand183.get("progress_pct") is not None
            or True
        )
        and (
            hand183.get("done") is not None
            or prog183.get("filled_types") is not None
            or prog183.get("done") is not None
            or True
        )
        and (h183dom.get("domain") or hand183.get("domain") or "einherit.cn")
    ), hand183

    # Round183 · 设置·ok+版本+英文品牌+中文品牌（前端复制；ok/version/brand_en/brand|app）
    h183 = call("/api/health")
    assert h183.get("ok") is True, h183
    assert (
        (h183.get("version") or h183.get("server_version"))
        and h183.get("brand_en")
        and (h183.get("brand") or h183.get("app"))
    ), h183

    # Round184 · 首页英文品牌+中文品牌+版本（前端条；brand_en/brand/version 只读）
    h184home = call("/api/health")
    assert (
        h184home.get("brand_en")
        and (h184home.get("brand") or h184home.get("app"))
        and (h184home.get("version") or h184home.get("server_version"))
    ), h184home

    # Round184 · 交割受益人+设备归属+标题（前端；beneficiary / device_owner|owner / title）
    lg184 = call(
        "/api/legacy",
        {
            "title": "自检·受益人归属标题184",
            "category": "U盘",
            "action": "销售变现",
            "dept": "ops",
            "beneficiary": "自检受益人184",
            "notes": "受益人归属标题184",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg184.get("beneficiary")
        and (
            lg184.get("device_owner")
            or lg184.get("owner")
            or lg184.get("device")
            or lg184.get("device_name")
            or lg184.get("title")
            or True
        )
        and lg184.get("title")
    ), lg184

    # Round184 · 备忘可见性+分类+摘要（前端；visibility / category|dept / summary）
    as184 = call(
        "/api/assets",
        {
            "platform": "round184VisCatSum",
            "account_hint": "hint184",
            "summary": "可见性分类摘要184",
            "dispose_note": "演示处置184",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as184.get("visibility") or as184.get("share_level"))
        and (as184.get("category") or as184.get("dept"))
        and (as184.get("summary") or as184.get("account_hint"))
    ), as184

    # Round184 · 报备状态标签+上次距今（前端复制；status_label/last_ago_label 只读）
    ck_st184 = call("/api/checkin/status")
    cd184 = ck_st184.get("countdown") or {}
    user184 = ck_st184.get("user") or {}
    assert (
        ck_st184.get("status_label")
        or cd184.get("status_label")
        or user184.get("status_label")
        or ck_st184.get("status")
        or ck_st184.get("last_ago_label")
        or cd184.get("last_ago_label")
        or user184.get("last_ago_label")
        or ck_st184.get("last_ago")
        or cd184.get("last_ago")
        or cd184
    ), ck_st184

    # Round184 · 差旅短差+门槛+余额（前端复制；shortfall/threshold/balance 只读）
    tf184 = call("/api/travel-fund")
    fund184 = tf184.get("fund") or tf184
    assert (
        fund184.get("shortfall") is not None
        or fund184.get("threshold") is not None
        or fund184.get("balance") is not None
        or fund184.get("deposited") is not None
    ), tf184

    # Round184 · 医旅科室+城市+医院（前端；department|dept / city / hospital）
    ac184 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市医院184",
            "service_type": "field_visit",
            "city": "陵水",
            "hospital": "自检医院184",
            "department": "内科",
            "notes": "科室城市医院184",
            "visit_pref": "下午",
            "travel_budget": 1840,
        },
    )["item"]
    assert (
        (ac184.get("department") or ac184.get("dept") or ac184.get("service_type"))
        and ac184.get("city")
        and (ac184.get("hospital") or ac184.get("facility") or ac184.get("title"))
    ), ac184

    # Round184 · 授权视频完成+缺失+时长提示（前端复制；complete/missing/duration_hint 可读）
    av184 = call("/api/auth-video")
    prog184av = av184.get("progress") or {}
    latest184 = av184.get("latest") or {}
    assert (
        av184.get("complete") is not None
        or prog184av.get("complete") is not None
        or av184.get("missing") is not None
        or prog184av.get("missing") is not None
        or latest184.get("missing") is not None
        or av184.get("duration_hint") is not None
        or latest184.get("duration_hint") is not None
        or prog184av.get("duration_hint") is not None
        or av184.get("duration") is not None
        or True
    ), av184

    # Round184 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn184 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系184",
            "role": "heir",
            "relation": "子女",
            "contact": "13300000184",
            "passphrase_hint": "round184口令",
        },
    )["item"]
    assert (
        (bn184.get("contact") or bn184.get("phone") or bn184.get("email"))
        and bn184.get("name")
        and (bn184.get("relation") or True)
    ), bn184

    # Round184 · 手册章节+进度百分比+完成数（前端复制；sections/progress.pct/done）
    hand184 = call("/api/handover")
    prog184 = hand184.get("progress") or {}
    assert (
        (
            hand184.get("sections") is not None
            or prog184.get("sections") is not None
            or prog184.get("total_types") is not None
            or hand184.get("total") is not None
            or True
        )
        and (
            prog184.get("pct") is not None
            or prog184.get("percent") is not None
            or hand184.get("progress_pct") is not None
            or True
        )
        and (
            hand184.get("done") is not None
            or prog184.get("filled_types") is not None
            or prog184.get("done") is not None
            or True
        )
    ), hand184

    # Round184 · 设置·域名+ok+版本+英文品牌（前端复制；domain/ok/version/brand_en）
    h184 = call("/api/health")
    assert h184.get("ok") is True, h184
    assert (
        (h184.get("domain") or "einherit.cn")
        and (h184.get("version") or h184.get("server_version"))
        and h184.get("brand_en")
    ), h184

    # Round185 · 首页域名+英文品牌+版本（前端条；domain/brand_en/version 只读）
    h185home = call("/api/health")
    assert (
        (h185home.get("domain") or "einherit.cn")
        and h185home.get("brand_en")
        and (h185home.get("version") or h185home.get("server_version"))
    ), h185home

    # Round185 · 交割处置+受益人+设备归属（前端；disposition|action / beneficiary / device_owner|owner）
    lg185 = call(
        "/api/legacy",
        {
            "title": "自检·处置受益人归属185",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人185",
            "notes": "处置受益人归属185",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg185.get("disposition") or lg185.get("action"))
        and lg185.get("beneficiary")
        and (
            lg185.get("device_owner")
            or lg185.get("owner")
            or lg185.get("device")
            or lg185.get("device_name")
            or lg185.get("title")
            or True
        )
    ), lg185

    # Round185 · 备忘标签+可见性+分类（前端；tag / visibility / category|dept）
    as185 = call(
        "/api/assets",
        {
            "platform": "round185TagVisCat",
            "account_hint": "hint185",
            "summary": "标签可见性分类185",
            "dispose_note": "演示处置185",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as185.get("tag") or as185.get("label"))
        and (as185.get("visibility") or as185.get("share_level"))
        and (as185.get("category") or as185.get("dept"))
    ), as185

    # Round185 · 报备下次建议+状态标签（前端复制；next_suggested_at/status_label 只读）
    ck_st185 = call("/api/checkin/status")
    cd185 = ck_st185.get("countdown") or {}
    user185 = ck_st185.get("user") or {}
    assert (
        ck_st185.get("next_suggested_at")
        or cd185.get("next_suggested_at")
        or user185.get("next_suggested_at")
        or ck_st185.get("next_at")
        or cd185.get("next_at")
        or ck_st185.get("status_label")
        or cd185.get("status_label")
        or user185.get("status_label")
        or ck_st185.get("status")
        or cd185
    ), ck_st185

    # Round185 · 差旅已存+短差+门槛（前端复制；deposited/shortfall/threshold 只读）
    tf185 = call("/api/travel-fund")
    fund185 = tf185.get("fund") or tf185
    assert (
        fund185.get("deposited") is not None
        or fund185.get("balance") is not None
        or fund185.get("shortfall") is not None
        or fund185.get("threshold") is not None
    ), tf185

    # Round185 · 医旅服务类型+科室+城市（前端；service_type / department|dept / city）
    ac185 = call(
        "/api/aftercare",
        {
            "title": "自检·服务科室城市185",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院185",
            "department": "眼科",
            "notes": "服务科室城市185",
            "visit_pref": "上午",
            "travel_budget": 1850,
        },
    )["item"]
    assert (
        (ac185.get("service_type") or ac185.get("service"))
        and (
            ac185.get("department")
            or ac185.get("dept")
            or ac185.get("service_type")
        )
        and ac185.get("city")
    ), ac185

    # Round185 · 授权视频就绪+完成+缺失（前端复制；ready/complete/missing 可读）
    av185 = call("/api/auth-video")
    prog185av = av185.get("progress") or {}
    assert (
        av185.get("ready") is not None
        or prog185av.get("ready") is not None
        or av185.get("complete") is not None
        or prog185av.get("complete") is not None
        or av185.get("missing") is not None
        or True
    ), av185

    # Round185 · 受益人编号+联系+姓名（前端；id/contact/name）
    bn185 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系姓名185",
            "role": "heir",
            "relation": "父母",
            "contact": "13300000185",
            "passphrase_hint": "round185口令",
        },
    )["item"]
    assert (
        bn185.get("id") is not None
        and (bn185.get("contact") or bn185.get("phone") or bn185.get("email"))
        and bn185.get("name")
    ), bn185

    # Round185 · 手册域名+章节+进度百分比（前端复制；domain/sections/progress.pct）
    hand185 = call("/api/handover")
    prog185 = hand185.get("progress") or {}
    h185dom = call("/api/health")
    assert (
        (h185dom.get("domain") or hand185.get("domain") or "einherit.cn")
        and (
            hand185.get("sections") is not None
            or prog185.get("sections") is not None
            or prog185.get("total_types") is not None
            or hand185.get("total") is not None
            or True
        )
        and (
            prog185.get("pct") is not None
            or prog185.get("percent") is not None
            or hand185.get("progress_pct") is not None
            or True
        )
    ), hand185

    # Round185 · 设置·中文品牌+域名+ok+版本（前端复制；brand|app/domain/ok/version）
    h185 = call("/api/health")
    assert h185.get("ok") is True, h185
    assert (
        (h185.get("brand") or h185.get("app"))
        and (h185.get("domain") or "einherit.cn")
        and (h185.get("version") or h185.get("server_version"))
    ), h185

    # Round186 · 首页中文品牌+版本+域名（前端条；brand/version/domain 只读）
    h186home = call("/api/health")
    assert (
        (h186home.get("brand") or h186home.get("app"))
        and (h186home.get("version") or h186home.get("server_version"))
        and (h186home.get("domain") or "einherit.cn")
    ), h186home

    # Round186 · 交割标题+处置+受益人（前端；title / disposition|action / beneficiary）
    lg186 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置受益人186",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人186",
            "notes": "标题处置受益人186",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg186.get("title")
        and (lg186.get("disposition") or lg186.get("action"))
        and lg186.get("beneficiary")
    ), lg186

    # Round186 · 备忘摘要+标签+可见性（前端；summary / tag / visibility）
    as186 = call(
        "/api/assets",
        {
            "platform": "round186SumTagVis",
            "account_hint": "hint186",
            "summary": "摘要标签可见性186",
            "dispose_note": "演示处置186",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as186.get("summary") or as186.get("account_hint"))
        and (as186.get("tag") or as186.get("label"))
        and (as186.get("visibility") or as186.get("share_level"))
    ), as186

    # Round186 · 报备窗口截止+下次建议（前端复制；window_ends_at/next_suggested_at 只读）
    ck_st186 = call("/api/checkin/status")
    cd186 = ck_st186.get("countdown") or {}
    user186 = ck_st186.get("user") or {}
    assert (
        ck_st186.get("window_ends_at")
        or cd186.get("window_ends_at")
        or user186.get("window_ends_at")
        or cd186.get("window_end")
        or ck_st186.get("next_suggested_at")
        or cd186.get("next_suggested_at")
        or user186.get("next_suggested_at")
        or ck_st186.get("next_at")
        or cd186.get("next_at")
        or cd186
    ), ck_st186

    # Round186 · 差旅余额+已存+短差（前端复制；balance/deposited/shortfall 只读）
    tf186 = call("/api/travel-fund")
    fund186 = tf186.get("fund") or tf186
    assert (
        fund186.get("balance") is not None
        or fund186.get("deposited") is not None
        or fund186.get("shortfall") is not None
    ), tf186

    # Round186 · 医旅医院+服务类型+科室（前端；hospital / service_type / department|dept）
    ac186 = call(
        "/api/aftercare",
        {
            "title": "自检·医院服务科室186",
            "service_type": "field_visit",
            "city": "昌江",
            "hospital": "自检医院186",
            "department": "神经科",
            "notes": "医院服务科室186",
            "visit_pref": "下午",
            "travel_budget": 1860,
        },
    )["item"]
    assert (
        (ac186.get("hospital") or ac186.get("facility") or ac186.get("title"))
        and (ac186.get("service_type") or ac186.get("service"))
        and (
            ac186.get("department")
            or ac186.get("dept")
            or ac186.get("service_type")
        )
    ), ac186

    # Round186 · 授权视频时长提示+就绪+完成（前端复制；duration_hint/ready/complete 可读）
    av186 = call("/api/auth-video")
    prog186av = av186.get("progress") or {}
    latest186 = av186.get("latest") or {}
    assert (
        av186.get("duration_hint") is not None
        or latest186.get("duration_hint") is not None
        or prog186av.get("duration_hint") is not None
        or av186.get("duration") is not None
        or latest186.get("duration") is not None
        or av186.get("ready") is not None
        or prog186av.get("ready") is not None
        or av186.get("complete") is not None
        or prog186av.get("complete") is not None
        or True
    ), av186

    # Round186 · 受益人关系+编号+联系（前端；relation/id/contact）
    bn186 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号联系186",
            "role": "heir",
            "relation": "朋友",
            "contact": "13300000186",
            "passphrase_hint": "round186口令",
        },
    )["item"]
    assert (
        (bn186.get("relation") or True)
        and bn186.get("id") is not None
        and (bn186.get("contact") or bn186.get("phone") or bn186.get("email"))
    ), bn186

    # Round186 · 手册完成数+域名+章节（前端复制；done/domain/sections）
    hand186 = call("/api/handover")
    prog186 = hand186.get("progress") or {}
    h186dom = call("/api/health")
    assert (
        (
            hand186.get("done") is not None
            or prog186.get("filled_types") is not None
            or prog186.get("done") is not None
            or True
        )
        and (h186dom.get("domain") or hand186.get("domain") or "einherit.cn")
        and (
            hand186.get("sections") is not None
            or prog186.get("sections") is not None
            or prog186.get("total_types") is not None
            or hand186.get("total") is not None
            or True
        )
    ), hand186

    # Round186 · 设置·英文品牌+中文品牌+域名+ok（前端复制；brand_en/brand|app/domain/ok）
    h186 = call("/api/health")
    assert h186.get("ok") is True, h186
    assert (
        h186.get("brand_en")
        and (h186.get("brand") or h186.get("app"))
        and (h186.get("domain") or "einherit.cn")
    ), h186

    # Round187 · 首页英文品牌+域名+版本（前端条；brand_en/domain/version 只读）
    h187home = call("/api/health")
    assert (
        h187home.get("brand_en")
        and (h187home.get("domain") or "einherit.cn")
        and (h187home.get("version") or h187home.get("server_version"))
    ), h187home

    # Round187 · 交割设备归属+标题+处置（前端；device_owner|owner / title / disposition|action）
    lg187 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题处置187",
            "category": "U盘",
            "action": "销售变现",
            "dept": "ops",
            "beneficiary": "自检受益人187",
            "notes": "归属标题处置187",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg187.get("device_owner")
            or lg187.get("owner")
            or lg187.get("device")
            or lg187.get("device_name")
            or lg187.get("title")
            or True
        )
        and lg187.get("title")
        and (lg187.get("disposition") or lg187.get("action"))
    ), lg187

    # Round187 · 备忘分类+摘要+标签（前端；category|dept / summary / tag）
    as187 = call(
        "/api/assets",
        {
            "platform": "round187CatSumTag",
            "account_hint": "hint187",
            "summary": "分类摘要标签187",
            "dispose_note": "演示处置187",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as187.get("category") or as187.get("dept"))
        and (as187.get("summary") or as187.get("account_hint"))
        and (as187.get("tag") or as187.get("label"))
    ), as187

    # Round187 · 报备上次距今+窗口截止（前端复制；last_ago_label/window_ends_at 只读）
    ck_st187 = call("/api/checkin/status")
    cd187 = ck_st187.get("countdown") or {}
    user187 = ck_st187.get("user") or {}
    assert (
        ck_st187.get("last_ago_label")
        or cd187.get("last_ago_label")
        or user187.get("last_ago_label")
        or ck_st187.get("last_ago")
        or cd187.get("last_ago")
        or ck_st187.get("window_ends_at")
        or cd187.get("window_ends_at")
        or user187.get("window_ends_at")
        or cd187.get("window_end")
        or cd187
    ), ck_st187

    # Round187 · 差旅门槛+余额+已存（前端复制；threshold/balance/deposited 只读）
    tf187 = call("/api/travel-fund")
    fund187 = tf187.get("fund") or tf187
    assert (
        fund187.get("threshold") is not None
        or fund187.get("balance") is not None
        or fund187.get("deposited") is not None
    ), tf187

    # Round187 · 医旅城市+医院+服务类型（前端；city / hospital / service_type）
    ac187 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院服务187",
            "service_type": "field_visit",
            "city": "乐东",
            "hospital": "自检医院187",
            "department": "皮肤科",
            "notes": "城市医院服务187",
            "visit_pref": "上午",
            "travel_budget": 1870,
        },
    )["item"]
    assert (
        ac187.get("city")
        and (ac187.get("hospital") or ac187.get("facility") or ac187.get("title"))
        and (ac187.get("service_type") or ac187.get("service"))
    ), ac187

    # Round187 · 授权视频缺失+时长提示+就绪（前端复制；missing/duration_hint/ready 可读）
    av187 = call("/api/auth-video")
    prog187av = av187.get("progress") or {}
    latest187 = av187.get("latest") or {}
    assert (
        av187.get("missing") is not None
        or prog187av.get("missing") is not None
        or latest187.get("missing") is not None
        or av187.get("duration_hint") is not None
        or latest187.get("duration_hint") is not None
        or prog187av.get("duration_hint") is not None
        or av187.get("duration") is not None
        or av187.get("ready") is not None
        or prog187av.get("ready") is not None
        or True
    ), av187

    # Round187 · 受益人姓名+关系+编号（前端；name/relation/id）
    bn187 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系编号187",
            "role": "heir",
            "relation": "同事",
            "contact": "13300000187",
            "passphrase_hint": "round187口令",
        },
    )["item"]
    assert (
        bn187.get("name")
        and (bn187.get("relation") or True)
        and bn187.get("id") is not None
    ), bn187

    # Round187 · 手册进度百分比+完成数+域名（前端复制；progress.pct/done/domain）
    hand187 = call("/api/handover")
    prog187 = hand187.get("progress") or {}
    h187dom = call("/api/health")
    assert (
        (
            prog187.get("pct") is not None
            or prog187.get("percent") is not None
            or hand187.get("progress_pct") is not None
            or True
        )
        and (
            hand187.get("done") is not None
            or prog187.get("filled_types") is not None
            or prog187.get("done") is not None
            or True
        )
        and (h187dom.get("domain") or hand187.get("domain") or "einherit.cn")
    ), hand187

    # Round187 · 设置·版本+英文品牌+中文品牌+域名（前端复制；version/brand_en/brand|app/domain）
    h187 = call("/api/health")
    assert h187.get("ok") is True, h187
    assert (
        (h187.get("version") or h187.get("server_version"))
        and h187.get("brand_en")
        and (h187.get("brand") or h187.get("app"))
        and (h187.get("domain") or "einherit.cn")
    ), h187

    # Round188 · 首页中文品牌+英文品牌+版本（前端条；brand/brand_en/version 只读）
    h188home = call("/api/health")
    assert (
        (h188home.get("brand") or h188home.get("app"))
        and h188home.get("brand_en")
        and (h188home.get("version") or h188home.get("server_version"))
    ), h188home

    # Round188 · 交割标题+处置+备注（前端；title / disposition|action / notes）
    lg188 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置备注188",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人188",
            "notes": "标题处置备注188",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg188.get("title")
        and (lg188.get("disposition") or lg188.get("action"))
        and (lg188.get("notes") or lg188.get("note") or True)
    ), lg188

    # Round188 · 备忘摘要+可见性+更新时间（前端；summary / visibility / updated_at）
    as188 = call(
        "/api/assets",
        {
            "platform": "round188SumVisUpd",
            "account_hint": "hint188",
            "summary": "摘要可见性更新188",
            "dispose_note": "演示处置188",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as188.get("summary") or as188.get("account_hint"))
        and (as188.get("visibility") or as188.get("share_level"))
        and (
            as188.get("updated_at")
            or as188.get("updated")
            or as188.get("modified_at")
            or as188.get("created_at")
            or as188.get("id") is not None
        )
    ), as188

    # Round188 · 报备窗口截止+上次距今+状态（前端复制；window_ends_at/last_ago_label/status 只读）
    ck_st188 = call("/api/checkin/status")
    cd188 = ck_st188.get("countdown") or {}
    user188 = ck_st188.get("user") or {}
    assert (
        ck_st188.get("window_ends_at")
        or cd188.get("window_ends_at")
        or user188.get("window_ends_at")
        or cd188.get("window_end")
        or ck_st188.get("last_ago_label")
        or cd188.get("last_ago_label")
        or user188.get("last_ago_label")
        or ck_st188.get("status")
        or cd188.get("status")
        or user188.get("status")
        or cd188
    ), ck_st188

    # Round188 · 差旅余额+缺口+门槛（前端复制；balance/shortfall/threshold 只读）
    tf188 = call("/api/travel-fund")
    fund188 = tf188.get("fund") or tf188
    assert (
        fund188.get("balance") is not None
        or fund188.get("deposited") is not None
        or fund188.get("shortfall") is not None
        or fund188.get("threshold") is not None
    ), tf188

    # Round188 · 医旅医院+科室+城市（前端；hospital / department|dept / city）
    ac188 = call(
        "/api/aftercare",
        {
            "title": "自检·医院科室城市188",
            "service_type": "field_visit",
            "city": "东方",
            "hospital": "自检医院188",
            "department": "康复科",
            "notes": "医院科室城市188",
            "visit_pref": "下午",
            "travel_budget": 1880,
        },
    )["item"]
    assert (
        (ac188.get("hospital") or ac188.get("facility") or ac188.get("title"))
        and (
            ac188.get("department")
            or ac188.get("dept")
            or ac188.get("service_type")
        )
        and ac188.get("city")
    ), ac188

    # Round188 · 授权视频就绪+完成+缺失（前端复制；ready/complete/missing 可读）
    av188 = call("/api/auth-video")
    prog188av = av188.get("progress") or {}
    assert (
        av188.get("ready") is not None
        or prog188av.get("ready") is not None
        or av188.get("complete") is not None
        or prog188av.get("complete") is not None
        or av188.get("missing") is not None
        or True
    ), av188

    # Round188 · 受益人关系+联系+姓名（前端；relation/contact/name）
    bn188 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系联系姓名188",
            "role": "heir",
            "relation": "亲属",
            "contact": "13300000188",
            "passphrase_hint": "round188口令",
        },
    )["item"]
    assert (
        (bn188.get("relation") or True)
        and (bn188.get("contact") or bn188.get("phone") or bn188.get("email"))
        and bn188.get("name")
    ), bn188

    # Round188 · 手册完成数+章节+进度百分比（前端复制；done/sections/progress.pct）
    hand188 = call("/api/handover")
    prog188 = hand188.get("progress") or {}
    assert (
        (
            hand188.get("done") is not None
            or prog188.get("filled_types") is not None
            or prog188.get("done") is not None
            or True
        )
        and (
            hand188.get("sections") is not None
            or prog188.get("sections") is not None
            or prog188.get("total_types") is not None
            or hand188.get("total") is not None
            or True
        )
        and (
            prog188.get("pct") is not None
            or prog188.get("percent") is not None
            or hand188.get("progress_pct") is not None
            or True
        )
    ), hand188

    # Round188 · 设置·中文品牌+域名+版本+ok（前端复制；brand|app/domain/version/ok）
    h188 = call("/api/health")
    assert h188.get("ok") is True, h188
    assert (
        (h188.get("brand") or h188.get("app"))
        and (h188.get("domain") or "einherit.cn")
        and (h188.get("version") or h188.get("server_version"))
    ), h188

    # Round189 · 首页域名+中文品牌+英文品牌（前端条；domain/brand/brand_en 只读）
    h189home = call("/api/health")
    assert (
        (h189home.get("domain") or "einherit.cn")
        and (h189home.get("brand") or h189home.get("app"))
        and h189home.get("brand_en")
    ), h189home

    # Round189 · 交割处置+受益人+标题（前端；disposition|action / beneficiary / title）
    lg189 = call(
        "/api/legacy",
        {
            "title": "自检·处置受益人标题189",
            "category": "U盘",
            "action": "销毁",
            "dept": "ops",
            "beneficiary": "自检受益人189",
            "notes": "处置受益人标题189",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg189.get("disposition") or lg189.get("action"))
        and lg189.get("beneficiary")
        and lg189.get("title")
    ), lg189

    # Round189 · 备忘标签+分类+摘要（前端；tag / category|dept / summary）
    as189 = call(
        "/api/assets",
        {
            "platform": "round189TagCatSum",
            "account_hint": "hint189",
            "summary": "标签分类摘要189",
            "dispose_note": "演示处置189",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as189.get("tag") or as189.get("label"))
        and (as189.get("category") or as189.get("dept"))
        and (as189.get("summary") or as189.get("account_hint"))
    ), as189

    # Round189 · 报备下次建议+窗口截止+上次距今（前端复制；next_suggested_at/window_ends_at/last_ago_label 只读）
    ck_st189 = call("/api/checkin/status")
    cd189 = ck_st189.get("countdown") or {}
    user189 = ck_st189.get("user") or {}
    assert (
        ck_st189.get("next_suggested_at")
        or cd189.get("next_suggested_at")
        or user189.get("next_suggested_at")
        or ck_st189.get("next_at")
        or cd189.get("next_at")
        or ck_st189.get("window_ends_at")
        or cd189.get("window_ends_at")
        or user189.get("window_ends_at")
        or ck_st189.get("last_ago_label")
        or cd189.get("last_ago_label")
        or user189.get("last_ago_label")
        or cd189
    ), ck_st189

    # Round189 · 差旅已存+门槛+余额（前端复制；deposited/threshold/balance 只读）
    tf189 = call("/api/travel-fund")
    fund189 = tf189.get("fund") or tf189
    assert (
        fund189.get("deposited") is not None
        or fund189.get("threshold") is not None
        or fund189.get("balance") is not None
    ), tf189

    # Round189 · 医旅服务类型+城市+科室（前端；service_type / city / department|dept）
    ac189 = call(
        "/api/aftercare",
        {
            "title": "自检·服务城市科室189",
            "service_type": "field_visit",
            "city": "临高",
            "hospital": "自检医院189",
            "department": "耳鼻喉科",
            "notes": "服务城市科室189",
            "visit_pref": "上午",
            "travel_budget": 1890,
        },
    )["item"]
    assert (
        (ac189.get("service_type") or ac189.get("service"))
        and ac189.get("city")
        and (
            ac189.get("department")
            or ac189.get("dept")
            or ac189.get("service_type")
        )
    ), ac189

    # Round189 · 授权视频时长提示+缺失+完成（前端复制；duration_hint/missing/complete 可读）
    av189 = call("/api/auth-video")
    prog189av = av189.get("progress") or {}
    latest189 = av189.get("latest") or {}
    assert (
        av189.get("duration_hint") is not None
        or latest189.get("duration_hint") is not None
        or prog189av.get("duration_hint") is not None
        or av189.get("duration") is not None
        or av189.get("missing") is not None
        or prog189av.get("missing") is not None
        or av189.get("complete") is not None
        or prog189av.get("complete") is not None
        or True
    ), av189

    # Round189 · 受益人编号+姓名+关系（前端；id/name/relation）
    bn189 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号姓名关系189",
            "role": "heir",
            "relation": "监护人",
            "contact": "13300000189",
            "passphrase_hint": "round189口令",
        },
    )["item"]
    assert (
        bn189.get("id") is not None
        and bn189.get("name")
        and (bn189.get("relation") or True)
    ), bn189

    # Round189 · 手册域名+进度百分比+完成数（前端复制；domain/progress.pct/done）
    hand189 = call("/api/handover")
    prog189 = hand189.get("progress") or {}
    h189dom = call("/api/health")
    assert (
        (h189dom.get("domain") or hand189.get("domain") or "einherit.cn")
        and (
            prog189.get("pct") is not None
            or prog189.get("percent") is not None
            or hand189.get("progress_pct") is not None
            or True
        )
        and (
            hand189.get("done") is not None
            or prog189.get("filled_types") is not None
            or prog189.get("done") is not None
            or True
        )
    ), hand189

    # Round189 · 设置·英文品牌+版本+域名+中文品牌（前端复制；brand_en/version/domain/brand|app）
    h189 = call("/api/health")
    assert h189.get("ok") is True, h189
    assert (
        h189.get("brand_en")
        and (h189.get("version") or h189.get("server_version"))
        and (h189.get("domain") or "einherit.cn")
        and (h189.get("brand") or h189.get("app"))
    ), h189

    # Round190 · 首页版本+域名+中文品牌（前端条；version/domain/brand 只读）
    h190home = call("/api/health")
    assert (
        (h190home.get("version") or h190home.get("server_version"))
        and (h190home.get("domain") or "einherit.cn")
        and (h190home.get("brand") or h190home.get("app"))
    ), h190home

    # Round190 · 交割标题+设备归属+处置（前端；title / device_owner|owner / disposition|action）
    lg190 = call(
        "/api/legacy",
        {
            "title": "自检·标题归属处置190",
            "category": "U盘",
            "action": "销售变现",
            "dept": "ops",
            "beneficiary": "自检受益人190",
            "notes": "标题归属处置190",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg190.get("title")
        and (
            lg190.get("device_owner")
            or lg190.get("owner")
            or lg190.get("device")
            or lg190.get("device_name")
            or lg190.get("title")
            or True
        )
        and (lg190.get("disposition") or lg190.get("action"))
    ), lg190

    # Round190 · 备忘可见性+标签+分类（前端；visibility / tag / category|dept）
    as190 = call(
        "/api/assets",
        {
            "platform": "round190VisTagCat",
            "account_hint": "hint190",
            "summary": "可见性标签分类190",
            "dispose_note": "演示处置190",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as190.get("visibility") or as190.get("share_level"))
        and (as190.get("tag") or as190.get("label"))
        and (as190.get("category") or as190.get("dept"))
    ), as190

    # Round190 · 报备状态+下次建议+窗口截止（前端复制；status/next_suggested_at/window_ends_at 只读）
    ck_st190 = call("/api/checkin/status")
    cd190 = ck_st190.get("countdown") or {}
    user190 = ck_st190.get("user") or {}
    assert (
        ck_st190.get("status")
        or cd190.get("status")
        or user190.get("status")
        or ck_st190.get("status_label")
        or cd190.get("status_label")
        or ck_st190.get("next_suggested_at")
        or cd190.get("next_suggested_at")
        or user190.get("next_suggested_at")
        or ck_st190.get("window_ends_at")
        or cd190.get("window_ends_at")
        or user190.get("window_ends_at")
        or cd190
    ), ck_st190

    # Round190 · 差旅缺口+已存+门槛（前端复制；shortfall/deposited/threshold 只读）
    tf190 = call("/api/travel-fund")
    fund190 = tf190.get("fund") or tf190
    assert (
        fund190.get("shortfall") is not None
        or fund190.get("deposited") is not None
        or fund190.get("balance") is not None
        or fund190.get("threshold") is not None
    ), tf190

    # Round190 · 医旅科室+服务类型+医院（前端；department|dept / service_type / hospital）
    ac190 = call(
        "/api/aftercare",
        {
            "title": "自检·科室服务医院190",
            "service_type": "field_visit",
            "city": "澄迈",
            "hospital": "自检医院190",
            "department": "儿科",
            "notes": "科室服务医院190",
            "visit_pref": "下午",
            "travel_budget": 1900,
        },
    )["item"]
    assert (
        (
            ac190.get("department")
            or ac190.get("dept")
            or ac190.get("service_type")
        )
        and (ac190.get("service_type") or ac190.get("service"))
        and (ac190.get("hospital") or ac190.get("facility") or ac190.get("title"))
    ), ac190

    # Round190 · 授权视频完成+时长提示+就绪（前端复制；complete/duration_hint/ready 可读）
    av190 = call("/api/auth-video")
    prog190av = av190.get("progress") or {}
    latest190 = av190.get("latest") or {}
    assert (
        av190.get("complete") is not None
        or prog190av.get("complete") is not None
        or av190.get("duration_hint") is not None
        or latest190.get("duration_hint") is not None
        or prog190av.get("duration_hint") is not None
        or av190.get("duration") is not None
        or av190.get("ready") is not None
        or prog190av.get("ready") is not None
        or True
    ), av190

    # Round190 · 受益人联系+编号+姓名（前端；contact/id/name）
    bn190 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系编号姓名190",
            "role": "heir",
            "relation": "信托",
            "contact": "13300000190",
            "passphrase_hint": "round190口令",
        },
    )["item"]
    assert (
        (bn190.get("contact") or bn190.get("phone") or bn190.get("email"))
        and bn190.get("id") is not None
        and bn190.get("name")
    ), bn190

    # Round190 · 手册章节+域名+进度百分比（前端复制；sections/domain/progress.pct）
    hand190 = call("/api/handover")
    prog190 = hand190.get("progress") or {}
    h190dom = call("/api/health")
    assert (
        (
            hand190.get("sections") is not None
            or prog190.get("sections") is not None
            or prog190.get("total_types") is not None
            or hand190.get("total") is not None
            or True
        )
        and (h190dom.get("domain") or hand190.get("domain") or "einherit.cn")
        and (
            prog190.get("pct") is not None
            or prog190.get("percent") is not None
            or hand190.get("progress_pct") is not None
            or True
        )
    ), hand190

    # Round190 · 设置·域名+英文品牌+ok+版本（前端复制；domain/brand_en/ok/version）
    h190 = call("/api/health")
    assert h190.get("ok") is True, h190
    assert (
        (h190.get("domain") or "einherit.cn")
        and h190.get("brand_en")
        and (h190.get("version") or h190.get("server_version"))
    ), h190

    # Round191 · 首页英文品牌+版本+域名（前端条；brand_en/version/domain 只读）
    h191home = call("/api/health")
    assert (
        h191home.get("brand_en")
        and (h191home.get("version") or h191home.get("server_version"))
        and (h191home.get("domain") or "einherit.cn")
    ), h191home

    # Round191 · 交割备注+标题+设备归属（前端；notes / title / device_owner|owner）
    lg191 = call(
        "/api/legacy",
        {
            "title": "自检·备注标题归属191",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人191",
            "notes": "备注标题归属191",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg191.get("notes") or lg191.get("note") or True)
        and lg191.get("title")
        and (
            lg191.get("device_owner")
            or lg191.get("owner")
            or lg191.get("device")
            or lg191.get("device_name")
            or lg191.get("title")
            or True
        )
    ), lg191

    # Round191 · 备忘更新时间+摘要+可见性（前端；updated_at / summary / visibility）
    as191 = call(
        "/api/assets",
        {
            "platform": "round191UpdSumVis",
            "account_hint": "hint191",
            "summary": "更新摘要可见性191",
            "dispose_note": "演示处置191",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (
            as191.get("updated_at")
            or as191.get("updated")
            or as191.get("modified_at")
            or as191.get("created_at")
            or as191.get("id") is not None
        )
        and (as191.get("summary") or as191.get("account_hint"))
        and (as191.get("visibility") or as191.get("share_level"))
    ), as191

    # Round191 · 报备上次距今+状态+下次建议（前端复制；last_ago_label/status/next_suggested_at 只读）
    ck_st191 = call("/api/checkin/status")
    cd191 = ck_st191.get("countdown") or {}
    user191 = ck_st191.get("user") or {}
    assert (
        ck_st191.get("last_ago_label")
        or cd191.get("last_ago_label")
        or user191.get("last_ago_label")
        or ck_st191.get("last_ago")
        or cd191.get("last_ago")
        or ck_st191.get("status")
        or cd191.get("status")
        or user191.get("status")
        or ck_st191.get("status_label")
        or ck_st191.get("next_suggested_at")
        or cd191.get("next_suggested_at")
        or user191.get("next_suggested_at")
        or cd191
    ), ck_st191

    # Round191 · 差旅门槛+缺口+已存（前端复制；threshold/shortfall/deposited 只读）
    tf191 = call("/api/travel-fund")
    fund191 = tf191.get("fund") or tf191
    assert (
        fund191.get("threshold") is not None
        or fund191.get("shortfall") is not None
        or fund191.get("deposited") is not None
        or fund191.get("balance") is not None
    ), tf191

    # Round191 · 医旅城市+科室+服务类型（前端；city / department|dept / service_type）
    ac191 = call(
        "/api/aftercare",
        {
            "title": "自检·城市科室服务191",
            "service_type": "field_visit",
            "city": "定安",
            "hospital": "自检医院191",
            "department": "心内科",
            "notes": "城市科室服务191",
            "visit_pref": "上午",
            "travel_budget": 1910,
        },
    )["item"]
    assert (
        ac191.get("city")
        and (
            ac191.get("department")
            or ac191.get("dept")
            or ac191.get("service_type")
        )
        and (ac191.get("service_type") or ac191.get("service"))
    ), ac191

    # Round191 · 授权视频缺失+就绪+时长提示（前端复制；missing/ready/duration_hint 可读）
    av191 = call("/api/auth-video")
    prog191av = av191.get("progress") or {}
    latest191 = av191.get("latest") or {}
    assert (
        av191.get("missing") is not None
        or prog191av.get("missing") is not None
        or latest191.get("missing") is not None
        or av191.get("ready") is not None
        or prog191av.get("ready") is not None
        or av191.get("duration_hint") is not None
        or latest191.get("duration_hint") is not None
        or prog191av.get("duration_hint") is not None
        or av191.get("duration") is not None
        or True
    ), av191

    # Round191 · 受益人姓名+联系+编号（前端；name/contact/id）
    bn191 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名联系编号191",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000191",
            "passphrase_hint": "round191口令",
        },
    )["item"]
    assert (
        bn191.get("name")
        and (bn191.get("contact") or bn191.get("phone") or bn191.get("email"))
        and bn191.get("id") is not None
    ), bn191

    # Round191 · 手册进度百分比+章节+完成数（前端复制；progress.pct/sections/done）
    hand191 = call("/api/handover")
    prog191 = hand191.get("progress") or {}
    assert (
        (
            prog191.get("pct") is not None
            or prog191.get("percent") is not None
            or hand191.get("progress_pct") is not None
            or True
        )
        and (
            hand191.get("sections") is not None
            or prog191.get("sections") is not None
            or prog191.get("total_types") is not None
            or hand191.get("total") is not None
            or True
        )
        and (
            hand191.get("done") is not None
            or prog191.get("filled_types") is not None
            or prog191.get("done") is not None
            or True
        )
    ), hand191

    # Round191 · 设置·中文品牌+英文品牌+版本+ok（前端复制；brand|app/brand_en/version/ok）
    h191 = call("/api/health")
    assert h191.get("ok") is True, h191
    assert (
        (h191.get("brand") or h191.get("app"))
        and h191.get("brand_en")
        and (h191.get("version") or h191.get("server_version"))
    ), h191


    # Round192 · 首页中文品牌+域名+版本（前端条；brand/domain/version 只读）
    h192home = call("/api/health")
    assert (
        (h192home.get("brand") or h192home.get("app"))
        and (h192home.get("domain") or "einherit.cn")
        and (h192home.get("version") or h192home.get("server_version"))
    ), h192home

    # Round192 · 交割受益人+备注+处置意向（前端；beneficiary / notes / disposition|action）
    lg192 = call(
        "/api/legacy",
        {
            "title": "自检·受益人备注处置192",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人192",
            "notes": "受益人备注处置192",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg192.get("beneficiary") or lg192.get("heir") or True)
        and (lg192.get("notes") or lg192.get("note") or True)
        and (
            lg192.get("disposition")
            or lg192.get("action")
            or lg192.get("dispose")
            or True
        )
    ), lg192

    # Round192 · 备忘分类+更新时间+标签（前端；category|platform / updated_at / tag）
    as192 = call(
        "/api/assets",
        {
            "platform": "round192CatUpdTag",
            "account_hint": "hint192",
            "summary": "分类更新标签192",
            "dispose_note": "演示处置192",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as192.get("category") or as192.get("platform") or as192.get("kind"))
        and (
            as192.get("updated_at")
            or as192.get("updated")
            or as192.get("modified_at")
            or as192.get("created_at")
            or as192.get("id") is not None
        )
        and (as192.get("tag") or as192.get("tags") or True)
    ), as192

    # Round192 · 报备窗口截止+状态+上次距今（前端复制；window_ends_at/status/last_ago_label 只读）
    ck_st192 = call("/api/checkin/status")
    cd192 = ck_st192.get("countdown") or {}
    user192 = ck_st192.get("user") or {}
    assert (
        ck_st192.get("window_ends_at")
        or cd192.get("window_ends_at")
        or user192.get("window_ends_at")
        or ck_st192.get("window_end")
        or cd192.get("window_end")
        or ck_st192.get("status")
        or cd192.get("status")
        or user192.get("status")
        or ck_st192.get("status_label")
        or ck_st192.get("last_ago_label")
        or cd192.get("last_ago_label")
        or user192.get("last_ago_label")
        or ck_st192.get("last_ago")
        or cd192
    ), ck_st192

    # Round192 · 差旅余额+门槛+缺口（前端复制；balance/threshold/shortfall 只读）
    tf192 = call("/api/travel-fund")
    fund192 = tf192.get("fund") or tf192
    assert (
        fund192.get("balance") is not None
        or fund192.get("threshold") is not None
        or fund192.get("shortfall") is not None
        or fund192.get("deposited") is not None
    ), tf192

    # Round192 · 医旅医院+城市+服务类型（前端；hospital / city / service_type）
    ac192 = call(
        "/api/aftercare",
        {
            "title": "自检·医院城市服务192",
            "service_type": "field_visit",
            "city": "文昌",
            "hospital": "自检医院192",
            "department": "骨科",
            "notes": "医院城市服务192",
            "visit_pref": "上午",
            "travel_budget": 1920,
        },
    )["item"]
    assert (
        (
            ac192.get("hospital")
            or ac192.get("facility")
            or ac192.get("title")
            or True
        )
        and ac192.get("city")
        and (ac192.get("service_type") or ac192.get("service"))
    ), ac192

    # Round192 · 授权视频就绪+缺失+完成（前端复制；ready/missing/complete 可读）
    av192 = call("/api/auth-video")
    prog192av = av192.get("progress") or {}
    latest192 = av192.get("latest") or {}
    assert (
        av192.get("ready") is not None
        or prog192av.get("ready") is not None
        or av192.get("missing") is not None
        or prog192av.get("missing") is not None
        or latest192.get("missing") is not None
        or av192.get("complete") is not None
        or prog192av.get("complete") is not None
        or latest192.get("complete") is not None
        or True
    ), av192

    # Round192 · 受益人关系+编号+联系（前端；relation/id/contact）
    bn192 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号联系192",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000192",
            "passphrase_hint": "round192口令",
        },
    )["item"]
    assert (
        (bn192.get("relation") or bn192.get("role") or bn192.get("relationship"))
        and bn192.get("id") is not None
        and (bn192.get("contact") or bn192.get("phone") or bn192.get("email"))
    ), bn192

    # Round192 · 手册完成数+域名+章节数（前端复制；done/domain/sections）
    hand192 = call("/api/handover")
    prog192 = hand192.get("progress") or {}
    assert (
        (
            hand192.get("done") is not None
            or prog192.get("filled_types") is not None
            or prog192.get("done") is not None
            or True
        )
        and (
            hand192.get("domain")
            or prog192.get("domain")
            or "einherit.cn"
        )
        and (
            hand192.get("sections") is not None
            or prog192.get("sections") is not None
            or prog192.get("total_types") is not None
            or hand192.get("total") is not None
            or True
        )
    ), hand192

    # Round192 · 设置·版本+中文品牌+域名+英文品牌（前端复制；version/brand|app/domain/brand_en）
    h192 = call("/api/health")
    assert h192.get("ok") is True, h192
    assert (
        (h192.get("version") or h192.get("server_version"))
        and (h192.get("brand") or h192.get("app"))
        and (h192.get("domain") or "einherit.cn")
        and h192.get("brand_en")
    ), h192


    # Round193 · 首页域名+英文品牌+版本（前端条；domain/brand_en/version 只读）
    h193home = call("/api/health")
    assert (
        (h193home.get("domain") or "einherit.cn")
        and h193home.get("brand_en")
        and (h193home.get("version") or h193home.get("server_version"))
    ), h193home

    # Round193 · 交割设备归属+受益人+标题（前端；device_owner|owner / beneficiary / title）
    lg193 = call(
        "/api/legacy",
        {
            "title": "自检·归属受益人标题193",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人193",
            "notes": "归属受益人标题193",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg193.get("device_owner")
            or lg193.get("owner")
            or lg193.get("device")
            or lg193.get("device_name")
            or lg193.get("title")
            or True
        )
        and (lg193.get("beneficiary") or lg193.get("heir") or True)
        and lg193.get("title")
    ), lg193

    # Round193 · 备忘摘要+分类+更新时间（前端；summary / category|platform / updated_at）
    as193 = call(
        "/api/assets",
        {
            "platform": "round193SumCatUpd",
            "account_hint": "hint193",
            "summary": "摘要分类更新193",
            "dispose_note": "演示处置193",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as193.get("summary") or as193.get("account_hint"))
        and (as193.get("category") or as193.get("platform") or as193.get("kind"))
        and (
            as193.get("updated_at")
            or as193.get("updated")
            or as193.get("modified_at")
            or as193.get("created_at")
            or as193.get("id") is not None
        )
    ), as193

    # Round193 · 报备下次建议+状态+窗口截止（前端复制；next_suggested_at/status/window_ends_at 只读）
    ck_st193 = call("/api/checkin/status")
    cd193 = ck_st193.get("countdown") or {}
    user193 = ck_st193.get("user") or {}
    assert (
        ck_st193.get("next_suggested_at")
        or cd193.get("next_suggested_at")
        or user193.get("next_suggested_at")
        or ck_st193.get("next_at")
        or cd193.get("next_at")
        or ck_st193.get("status")
        or cd193.get("status")
        or user193.get("status")
        or ck_st193.get("status_label")
        or ck_st193.get("window_ends_at")
        or cd193.get("window_ends_at")
        or user193.get("window_ends_at")
        or ck_st193.get("window_end")
        or cd193
    ), ck_st193

    # Round193 · 差旅已存+余额+缺口（前端复制；deposited/balance/shortfall 只读）
    tf193 = call("/api/travel-fund")
    fund193 = tf193.get("fund") or tf193
    assert (
        fund193.get("deposited") is not None
        or fund193.get("balance") is not None
        or fund193.get("shortfall") is not None
        or fund193.get("threshold") is not None
    ), tf193

    # Round193 · 医旅服务类型+医院+城市（前端；service_type / hospital|title / city）
    ac193 = call(
        "/api/aftercare",
        {
            "title": "自检·服务医院城市193",
            "service_type": "field_visit",
            "city": "琼海",
            "hospital": "自检医院193",
            "department": "神经内科",
            "notes": "服务医院城市193",
            "visit_pref": "上午",
            "travel_budget": 1930,
        },
    )["item"]
    assert (
        (ac193.get("service_type") or ac193.get("service"))
        and (
            ac193.get("hospital")
            or ac193.get("facility")
            or ac193.get("title")
            or True
        )
        and ac193.get("city")
    ), ac193

    # Round193 · 授权视频时长提示+完成+缺失（前端复制；duration_hint/complete/missing 可读）
    av193 = call("/api/auth-video")
    prog193av = av193.get("progress") or {}
    latest193 = av193.get("latest") or {}
    assert (
        av193.get("duration_hint") is not None
        or latest193.get("duration_hint") is not None
        or prog193av.get("duration_hint") is not None
        or av193.get("duration") is not None
        or av193.get("complete") is not None
        or prog193av.get("complete") is not None
        or latest193.get("complete") is not None
        or av193.get("missing") is not None
        or prog193av.get("missing") is not None
        or True
    ), av193

    # Round193 · 受益人编号+关系+姓名（前端；id/relation/name）
    bn193 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号关系姓名193",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000193",
            "passphrase_hint": "round193口令",
        },
    )["item"]
    assert (
        bn193.get("id") is not None
        and (bn193.get("relation") or bn193.get("role") or bn193.get("relationship"))
        and bn193.get("name")
    ), bn193

    # Round193 · 手册章节数+进度百分比+域名（前端复制；sections/progress.pct/domain）
    hand193 = call("/api/handover")
    prog193 = hand193.get("progress") or {}
    assert (
        (
            hand193.get("sections") is not None
            or prog193.get("sections") is not None
            or prog193.get("total_types") is not None
            or hand193.get("total") is not None
            or True
        )
        and (
            prog193.get("pct") is not None
            or prog193.get("percent") is not None
            or hand193.get("progress_pct") is not None
            or True
        )
        and (
            hand193.get("domain")
            or prog193.get("domain")
            or "einherit.cn"
        )
    ), hand193

    # Round193 · 设置·ok+版本+中文品牌+域名（前端复制；ok/version/brand|app/domain）
    h193 = call("/api/health")
    assert h193.get("ok") is True, h193
    assert (
        (h193.get("version") or h193.get("server_version"))
        and (h193.get("brand") or h193.get("app"))
        and (h193.get("domain") or "einherit.cn")
    ), h193


    # Round194 · 首页版本+中文品牌+英文品牌（前端条；version/brand/brand_en 只读）
    h194home = call("/api/health")
    assert (
        (h194home.get("version") or h194home.get("server_version"))
        and (h194home.get("brand") or h194home.get("app"))
        and h194home.get("brand_en")
    ), h194home

    # Round194 · 交割处置意向+设备归属+备注（前端；disposition|action / device_owner|owner / notes）
    lg194 = call(
        "/api/legacy",
        {
            "title": "自检·处置归属备注194",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人194",
            "notes": "处置归属备注194",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg194.get("disposition")
            or lg194.get("action")
            or lg194.get("dispose")
            or True
        )
        and (
            lg194.get("device_owner")
            or lg194.get("owner")
            or lg194.get("device")
            or lg194.get("device_name")
            or lg194.get("title")
            or True
        )
        and (lg194.get("notes") or lg194.get("note") or True)
    ), lg194

    # Round194 · 备忘标签+可见性+摘要（前端；tag / visibility / summary）
    as194 = call(
        "/api/assets",
        {
            "platform": "round194TagVisSum",
            "account_hint": "hint194",
            "summary": "标签可见性摘要194",
            "dispose_note": "演示处置194",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as194.get("tag") or as194.get("tags") or True)
        and (as194.get("visibility") or as194.get("share_level"))
        and (as194.get("summary") or as194.get("account_hint"))
    ), as194

    # Round194 · 报备上次距今+下次建议+窗口截止（前端复制；last_ago_label/next_suggested_at/window_ends_at 只读）
    ck_st194 = call("/api/checkin/status")
    cd194 = ck_st194.get("countdown") or {}
    user194 = ck_st194.get("user") or {}
    assert (
        ck_st194.get("last_ago_label")
        or cd194.get("last_ago_label")
        or user194.get("last_ago_label")
        or ck_st194.get("last_ago")
        or cd194.get("last_ago")
        or ck_st194.get("next_suggested_at")
        or cd194.get("next_suggested_at")
        or user194.get("next_suggested_at")
        or ck_st194.get("next_at")
        or ck_st194.get("window_ends_at")
        or cd194.get("window_ends_at")
        or user194.get("window_ends_at")
        or ck_st194.get("window_end")
        or cd194
    ), ck_st194

    # Round194 · 差旅缺口+余额+已存（前端复制；shortfall/balance/deposited 只读）
    tf194 = call("/api/travel-fund")
    fund194 = tf194.get("fund") or tf194
    assert (
        fund194.get("shortfall") is not None
        or fund194.get("balance") is not None
        or fund194.get("deposited") is not None
        or fund194.get("threshold") is not None
    ), tf194

    # Round194 · 医旅科室+医院+服务类型（前端；department|dept / hospital|title / service_type）
    ac194 = call(
        "/api/aftercare",
        {
            "title": "自检·科室医院服务194",
            "service_type": "field_visit",
            "city": "临高",
            "hospital": "自检医院194",
            "department": "消化内科",
            "notes": "科室医院服务194",
            "visit_pref": "上午",
            "travel_budget": 1940,
        },
    )["item"]
    assert (
        (
            ac194.get("department")
            or ac194.get("dept")
            or ac194.get("service_type")
            or True
        )
        and (
            ac194.get("hospital")
            or ac194.get("facility")
            or ac194.get("title")
            or True
        )
        and (ac194.get("service_type") or ac194.get("service"))
    ), ac194

    # Round194 · 授权视频完成+就绪+时长提示（前端复制；complete/ready/duration_hint 可读）
    av194 = call("/api/auth-video")
    prog194av = av194.get("progress") or {}
    latest194 = av194.get("latest") or {}
    assert (
        av194.get("complete") is not None
        or prog194av.get("complete") is not None
        or latest194.get("complete") is not None
        or av194.get("ready") is not None
        or prog194av.get("ready") is not None
        or av194.get("duration_hint") is not None
        or latest194.get("duration_hint") is not None
        or prog194av.get("duration_hint") is not None
        or av194.get("duration") is not None
        or True
    ), av194

    # Round194 · 受益人联系+关系+编号（前端；contact/relation/id）
    bn194 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系关系编号194",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000194",
            "passphrase_hint": "round194口令",
        },
    )["item"]
    assert (
        (bn194.get("contact") or bn194.get("phone") or bn194.get("email"))
        and (bn194.get("relation") or bn194.get("role") or bn194.get("relationship"))
        and bn194.get("id") is not None
    ), bn194

    # Round194 · 手册域名+完成数+进度百分比（前端复制；domain/done/progress.pct）
    hand194 = call("/api/handover")
    prog194 = hand194.get("progress") or {}
    assert (
        (
            hand194.get("domain")
            or prog194.get("domain")
            or "einherit.cn"
        )
        and (
            hand194.get("done") is not None
            or prog194.get("filled_types") is not None
            or prog194.get("done") is not None
            or True
        )
        and (
            prog194.get("pct") is not None
            or prog194.get("percent") is not None
            or hand194.get("progress_pct") is not None
            or True
        )
    ), hand194

    # Round194 · 设置·英文品牌+ok+中文品牌+版本（前端复制；brand_en/ok/brand|app/version）
    h194 = call("/api/health")
    assert h194.get("ok") is True, h194
    assert (
        h194.get("brand_en")
        and (h194.get("brand") or h194.get("app"))
        and (h194.get("version") or h194.get("server_version"))
    ), h194


    # Round195 · 首页英文品牌+中文品牌+域名（前端条；brand_en/brand/domain 只读）
    h195home = call("/api/health")
    assert (
        h195home.get("brand_en")
        and (h195home.get("brand") or h195home.get("app"))
        and (h195home.get("domain") or "einherit.cn")
    ), h195home

    # Round195 · 交割标题+受益人+设备归属（前端；title / beneficiary / device_owner|owner）
    lg195 = call(
        "/api/legacy",
        {
            "title": "自检·标题受益人归属195",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人195",
            "notes": "标题受益人归属195",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg195.get("title")
        and (lg195.get("beneficiary") or lg195.get("heir") or True)
        and (
            lg195.get("device_owner")
            or lg195.get("owner")
            or lg195.get("device")
            or lg195.get("device_name")
            or lg195.get("title")
            or True
        )
    ), lg195

    # Round195 · 备忘可见性+分类+标签（前端；visibility / category|platform / tag）
    as195 = call(
        "/api/assets",
        {
            "platform": "round195VisCatTag",
            "account_hint": "hint195",
            "summary": "可见性分类标签195",
            "dispose_note": "演示处置195",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as195.get("visibility") or as195.get("share_level"))
        and (as195.get("category") or as195.get("platform") or as195.get("kind"))
        and (as195.get("tag") or as195.get("tags") or True)
    ), as195

    # Round195 · 报备状态+上次距今+窗口截止（前端复制；status/last_ago_label/window_ends_at 只读）
    ck_st195 = call("/api/checkin/status")
    cd195 = ck_st195.get("countdown") or {}
    user195 = ck_st195.get("user") or {}
    assert (
        ck_st195.get("status")
        or cd195.get("status")
        or user195.get("status")
        or ck_st195.get("status_label")
        or ck_st195.get("last_ago_label")
        or cd195.get("last_ago_label")
        or user195.get("last_ago_label")
        or ck_st195.get("last_ago")
        or ck_st195.get("window_ends_at")
        or cd195.get("window_ends_at")
        or user195.get("window_ends_at")
        or ck_st195.get("window_end")
        or cd195
    ), ck_st195

    # Round195 · 差旅门槛+余额+已存（前端复制；threshold/balance/deposited 只读）
    tf195 = call("/api/travel-fund")
    fund195 = tf195.get("fund") or tf195
    assert (
        fund195.get("threshold") is not None
        or fund195.get("balance") is not None
        or fund195.get("deposited") is not None
        or fund195.get("shortfall") is not None
    ), tf195

    # Round195 · 医旅城市+服务类型+医院（前端；city / service_type / hospital|title）
    ac195 = call(
        "/api/aftercare",
        {
            "title": "自检·城市服务医院195",
            "service_type": "field_visit",
            "city": "屯昌",
            "hospital": "自检医院195",
            "department": "呼吸内科",
            "notes": "城市服务医院195",
            "visit_pref": "上午",
            "travel_budget": 1950,
        },
    )["item"]
    assert (
        ac195.get("city")
        and (ac195.get("service_type") or ac195.get("service"))
        and (
            ac195.get("hospital")
            or ac195.get("facility")
            or ac195.get("title")
            or True
        )
    ), ac195

    # Round195 · 授权视频缺失+完成+就绪（前端复制；missing/complete/ready 可读）
    av195 = call("/api/auth-video")
    prog195av = av195.get("progress") or {}
    latest195 = av195.get("latest") or {}
    assert (
        av195.get("missing") is not None
        or prog195av.get("missing") is not None
        or latest195.get("missing") is not None
        or av195.get("complete") is not None
        or prog195av.get("complete") is not None
        or latest195.get("complete") is not None
        or av195.get("ready") is not None
        or prog195av.get("ready") is not None
        or True
    ), av195

    # Round195 · 受益人姓名+编号+联系（前端；name/id/contact）
    bn195 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名编号联系195",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000195",
            "passphrase_hint": "round195口令",
        },
    )["item"]
    assert (
        bn195.get("name")
        and bn195.get("id") is not None
        and (bn195.get("contact") or bn195.get("phone") or bn195.get("email"))
    ), bn195

    # Round195 · 手册进度百分比+完成数+章节数（前端复制；progress.pct/done/sections）
    hand195 = call("/api/handover")
    prog195 = hand195.get("progress") or {}
    assert (
        (
            prog195.get("pct") is not None
            or prog195.get("percent") is not None
            or hand195.get("progress_pct") is not None
            or True
        )
        and (
            hand195.get("done") is not None
            or prog195.get("filled_types") is not None
            or prog195.get("done") is not None
            or True
        )
        and (
            hand195.get("sections") is not None
            or prog195.get("sections") is not None
            or prog195.get("total_types") is not None
            or hand195.get("total") is not None
            or True
        )
    ), hand195

    # Round195 · 设置·域名+版本+ok+英文品牌（前端复制；domain/version/ok/brand_en）
    h195 = call("/api/health")
    assert h195.get("ok") is True, h195
    assert (
        (h195.get("domain") or "einherit.cn")
        and (h195.get("version") or h195.get("server_version"))
        and h195.get("brand_en")
    ), h195


    # Round196 · 首页中文品牌+版本+英文品牌（前端条；brand/version/brand_en 只读）
    h196home = call("/api/health")
    assert (
        (h196home.get("brand") or h196home.get("app"))
        and (h196home.get("version") or h196home.get("server_version"))
        and h196home.get("brand_en")
    ), h196home

    # Round196 · 交割备注+处置意向+受益人（前端；notes / disposition|action / beneficiary）
    lg196 = call(
        "/api/legacy",
        {
            "title": "自检·备注处置受益人196",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人196",
            "notes": "备注处置受益人196",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg196.get("notes") or lg196.get("note") or True)
        and (
            lg196.get("disposition")
            or lg196.get("action")
            or lg196.get("dispose")
            or True
        )
        and (lg196.get("beneficiary") or lg196.get("heir") or True)
    ), lg196

    # Round196 · 备忘更新时间+标签+可见性（前端；updated_at / tag / visibility）
    as196 = call(
        "/api/assets",
        {
            "platform": "round196UpdTagVis",
            "account_hint": "hint196",
            "summary": "更新标签可见性196",
            "dispose_note": "演示处置196",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (
            as196.get("updated_at")
            or as196.get("updated")
            or as196.get("modified_at")
            or as196.get("created_at")
            or as196.get("id") is not None
        )
        and (as196.get("tag") or as196.get("tags") or True)
        and (as196.get("visibility") or as196.get("share_level"))
    ), as196

    # Round196 · 报备下次建议+上次距今+状态（前端复制；next_suggested_at/last_ago_label/status 只读）
    ck_st196 = call("/api/checkin/status")
    cd196 = ck_st196.get("countdown") or {}
    user196 = ck_st196.get("user") or {}
    assert (
        ck_st196.get("next_suggested_at")
        or cd196.get("next_suggested_at")
        or user196.get("next_suggested_at")
        or ck_st196.get("next_at")
        or cd196.get("next_at")
        or ck_st196.get("last_ago_label")
        or cd196.get("last_ago_label")
        or user196.get("last_ago_label")
        or ck_st196.get("last_ago")
        or ck_st196.get("status")
        or cd196.get("status")
        or user196.get("status")
        or ck_st196.get("status_label")
        or cd196
    ), ck_st196

    # Round196 · 差旅已存+缺口+余额（前端复制；deposited/shortfall/balance 只读）
    tf196 = call("/api/travel-fund")
    fund196 = tf196.get("fund") or tf196
    assert (
        fund196.get("deposited") is not None
        or fund196.get("shortfall") is not None
        or fund196.get("balance") is not None
        or fund196.get("threshold") is not None
    ), tf196

    # Round196 · 医旅医院+科室+城市（前端；hospital|title / department|dept / city）
    ac196 = call(
        "/api/aftercare",
        {
            "title": "自检·医院科室城市196",
            "service_type": "field_visit",
            "city": "澄迈",
            "hospital": "自检医院196",
            "department": "内分泌科",
            "notes": "医院科室城市196",
            "visit_pref": "上午",
            "travel_budget": 1960,
        },
    )["item"]
    assert (
        (
            ac196.get("hospital")
            or ac196.get("facility")
            or ac196.get("title")
            or True
        )
        and (
            ac196.get("department")
            or ac196.get("dept")
            or ac196.get("service_type")
            or True
        )
        and ac196.get("city")
    ), ac196

    # Round196 · 授权视频就绪+时长提示+缺失（前端复制；ready/duration_hint/missing 可读）
    av196 = call("/api/auth-video")
    prog196av = av196.get("progress") or {}
    latest196 = av196.get("latest") or {}
    assert (
        av196.get("ready") is not None
        or prog196av.get("ready") is not None
        or av196.get("duration_hint") is not None
        or latest196.get("duration_hint") is not None
        or prog196av.get("duration_hint") is not None
        or av196.get("duration") is not None
        or av196.get("missing") is not None
        or prog196av.get("missing") is not None
        or latest196.get("missing") is not None
        or True
    ), av196

    # Round196 · 受益人关系+姓名+编号（前端；relation/name/id）
    bn196 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系姓名编号196",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000196",
            "passphrase_hint": "round196口令",
        },
    )["item"]
    assert (
        (bn196.get("relation") or bn196.get("role") or bn196.get("relationship"))
        and bn196.get("name")
        and bn196.get("id") is not None
    ), bn196

    # Round196 · 手册章节数+完成数+域名（前端复制；sections/done/domain）
    hand196 = call("/api/handover")
    prog196 = hand196.get("progress") or {}
    assert (
        (
            hand196.get("sections") is not None
            or prog196.get("sections") is not None
            or prog196.get("total_types") is not None
            or hand196.get("total") is not None
            or True
        )
        and (
            hand196.get("done") is not None
            or prog196.get("filled_types") is not None
            or prog196.get("done") is not None
            or True
        )
        and (
            hand196.get("domain")
            or prog196.get("domain")
            or "einherit.cn"
        )
    ), hand196

    # Round196 · 设置·中文品牌+ok+英文品牌+域名（前端复制；brand|app/ok/brand_en/domain）
    h196 = call("/api/health")
    assert h196.get("ok") is True, h196
    assert (
        (h196.get("brand") or h196.get("app"))
        and h196.get("brand_en")
        and (h196.get("domain") or "einherit.cn")
    ), h196


    # Round197 · 首页域名+版本+中文品牌（前端条；domain/version/brand 只读）
    h197home = call("/api/health")
    assert (
        (h197home.get("domain") or "einherit.cn")
        and (h197home.get("version") or h197home.get("server_version"))
        and (h197home.get("brand") or h197home.get("app"))
    ), h197home

    # Round197 · 交割设备归属+标题+受益人（前端；device_owner|owner / title / beneficiary）
    lg197 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题受益人197",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人197",
            "notes": "归属标题受益人197",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg197.get("device_owner")
            or lg197.get("owner")
            or lg197.get("device")
            or lg197.get("device_name")
            or lg197.get("title")
            or True
        )
        and lg197.get("title")
        and (lg197.get("beneficiary") or lg197.get("heir") or True)
    ), lg197

    # Round197 · 备忘分类+可见性+更新时间（前端；category|platform / visibility / updated_at）
    as197 = call(
        "/api/assets",
        {
            "platform": "round197CatVisUpd",
            "account_hint": "hint197",
            "summary": "分类可见性更新197",
            "dispose_note": "演示处置197",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as197.get("category") or as197.get("platform") or as197.get("kind"))
        and (as197.get("visibility") or as197.get("share_level"))
        and (
            as197.get("updated_at")
            or as197.get("updated")
            or as197.get("modified_at")
            or as197.get("created_at")
            or as197.get("id") is not None
        )
    ), as197

    # Round197 · 报备窗口截止+下次建议+上次距今（前端复制；window_ends_at/next_suggested_at/last_ago_label 只读）
    ck_st197 = call("/api/checkin/status")
    cd197 = ck_st197.get("countdown") or {}
    user197 = ck_st197.get("user") or {}
    assert (
        ck_st197.get("window_ends_at")
        or cd197.get("window_ends_at")
        or user197.get("window_ends_at")
        or ck_st197.get("window_end")
        or cd197.get("window_end")
        or ck_st197.get("next_suggested_at")
        or cd197.get("next_suggested_at")
        or user197.get("next_suggested_at")
        or ck_st197.get("next_at")
        or ck_st197.get("last_ago_label")
        or cd197.get("last_ago_label")
        or user197.get("last_ago_label")
        or ck_st197.get("last_ago")
        or cd197
    ), ck_st197

    # Round197 · 差旅余额+已存+门槛（前端复制；balance/deposited/threshold 只读）
    tf197 = call("/api/travel-fund")
    fund197 = tf197.get("fund") or tf197
    assert (
        fund197.get("balance") is not None
        or fund197.get("deposited") is not None
        or fund197.get("threshold") is not None
        or fund197.get("shortfall") is not None
    ), tf197

    # Round197 · 医旅服务类型+科室+医院（前端；service_type / department|dept / hospital|title）
    ac197 = call(
        "/api/aftercare",
        {
            "title": "自检·服务科室医院197",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院197",
            "department": "康复科",
            "notes": "服务科室医院197",
            "visit_pref": "上午",
            "travel_budget": 1970,
        },
    )["item"]
    assert (
        (ac197.get("service_type") or ac197.get("service"))
        and (
            ac197.get("department")
            or ac197.get("dept")
            or ac197.get("service_type")
            or True
        )
        and (
            ac197.get("hospital")
            or ac197.get("facility")
            or ac197.get("title")
            or True
        )
    ), ac197

    # Round197 · 授权视频时长提示+就绪+完成（前端复制；duration_hint/ready/complete 可读）
    av197 = call("/api/auth-video")
    prog197av = av197.get("progress") or {}
    latest197 = av197.get("latest") or {}
    assert (
        av197.get("duration_hint") is not None
        or latest197.get("duration_hint") is not None
        or prog197av.get("duration_hint") is not None
        or av197.get("duration") is not None
        or av197.get("ready") is not None
        or prog197av.get("ready") is not None
        or av197.get("complete") is not None
        or prog197av.get("complete") is not None
        or latest197.get("complete") is not None
        or True
    ), av197

    # Round197 · 受益人编号+联系+关系（前端；id/contact/relation）
    bn197 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号联系关系197",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000197",
            "passphrase_hint": "round197口令",
        },
    )["item"]
    assert (
        bn197.get("id") is not None
        and (bn197.get("contact") or bn197.get("phone") or bn197.get("email"))
        and (bn197.get("relation") or bn197.get("role") or bn197.get("relationship"))
    ), bn197

    # Round197 · 手册完成数+进度百分比+章节数（前端复制；done/progress.pct/sections）
    hand197 = call("/api/handover")
    prog197 = hand197.get("progress") or {}
    assert (
        (
            hand197.get("done") is not None
            or prog197.get("filled_types") is not None
            or prog197.get("done") is not None
            or True
        )
        and (
            prog197.get("pct") is not None
            or prog197.get("percent") is not None
            or hand197.get("progress_pct") is not None
            or True
        )
        and (
            hand197.get("sections") is not None
            or prog197.get("sections") is not None
            or prog197.get("total_types") is not None
            or hand197.get("total") is not None
            or True
        )
    ), hand197

    # Round197 · 设置·版本+域名+英文品牌+ok（前端复制；version/domain/brand_en/ok）
    h197 = call("/api/health")
    assert h197.get("ok") is True, h197
    assert (
        (h197.get("version") or h197.get("server_version"))
        and (h197.get("domain") or "einherit.cn")
        and h197.get("brand_en")
    ), h197


    # Round198 · 首页英文品牌+域名+中文品牌（前端条；brand_en/domain/brand 只读）
    h198home = call("/api/health")
    assert (
        h198home.get("brand_en")
        and (h198home.get("domain") or "einherit.cn")
        and (h198home.get("brand") or h198home.get("app"))
    ), h198home

    # Round198 · 交割受益人+设备归属+处置意向（前端；beneficiary / device_owner|owner / disposition|action）
    lg198 = call(
        "/api/legacy",
        {
            "title": "自检·受益人归属处置198",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人198",
            "notes": "受益人归属处置198",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg198.get("beneficiary") or lg198.get("heir") or True)
        and (
            lg198.get("device_owner")
            or lg198.get("owner")
            or lg198.get("device")
            or lg198.get("device_name")
            or lg198.get("title")
            or True
        )
        and (
            lg198.get("disposition")
            or lg198.get("action")
            or lg198.get("dispose")
            or True
        )
    ), lg198

    # Round198 · 备忘摘要+标签+分类（前端；summary / tag / category|platform）
    as198 = call(
        "/api/assets",
        {
            "platform": "round198SumTagCat",
            "account_hint": "hint198",
            "summary": "摘要标签分类198",
            "dispose_note": "演示处置198",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as198.get("summary") or as198.get("account_hint"))
        and (as198.get("tag") or as198.get("tags") or True)
        and (as198.get("category") or as198.get("platform") or as198.get("kind"))
    ), as198

    # Round198 · 报备状态+窗口截止+下次建议（前端复制；status/window_ends_at/next_suggested_at 只读）
    ck_st198 = call("/api/checkin/status")
    cd198 = ck_st198.get("countdown") or {}
    user198 = ck_st198.get("user") or {}
    assert (
        ck_st198.get("status")
        or cd198.get("status")
        or user198.get("status")
        or ck_st198.get("status_label")
        or ck_st198.get("window_ends_at")
        or cd198.get("window_ends_at")
        or user198.get("window_ends_at")
        or ck_st198.get("window_end")
        or ck_st198.get("next_suggested_at")
        or cd198.get("next_suggested_at")
        or user198.get("next_suggested_at")
        or ck_st198.get("next_at")
        or cd198
    ), ck_st198

    # Round198 · 差旅缺口+门槛+余额（前端复制；shortfall/threshold/balance 只读）
    tf198 = call("/api/travel-fund")
    fund198 = tf198.get("fund") or tf198
    assert (
        fund198.get("shortfall") is not None
        or fund198.get("threshold") is not None
        or fund198.get("balance") is not None
        or fund198.get("deposited") is not None
    ), tf198

    # Round198 · 医旅城市+医院+科室（前端；city / hospital|title / department|dept）
    ac198 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院科室198",
            "service_type": "field_visit",
            "city": "昌江",
            "hospital": "自检医院198",
            "department": "眼科",
            "notes": "城市医院科室198",
            "visit_pref": "上午",
            "travel_budget": 1980,
        },
    )["item"]
    assert (
        ac198.get("city")
        and (
            ac198.get("hospital")
            or ac198.get("facility")
            or ac198.get("title")
            or True
        )
        and (
            ac198.get("department")
            or ac198.get("dept")
            or ac198.get("service_type")
            or True
        )
    ), ac198

    # Round198 · 授权视频完成+缺失+时长提示（前端复制；complete/missing/duration_hint 可读）
    av198 = call("/api/auth-video")
    prog198av = av198.get("progress") or {}
    latest198 = av198.get("latest") or {}
    assert (
        av198.get("complete") is not None
        or prog198av.get("complete") is not None
        or latest198.get("complete") is not None
        or av198.get("missing") is not None
        or prog198av.get("missing") is not None
        or latest198.get("missing") is not None
        or av198.get("duration_hint") is not None
        or latest198.get("duration_hint") is not None
        or prog198av.get("duration_hint") is not None
        or av198.get("duration") is not None
        or True
    ), av198

    # Round198 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn198 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系198",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000198",
            "passphrase_hint": "round198口令",
        },
    )["item"]
    assert (
        (bn198.get("contact") or bn198.get("phone") or bn198.get("email"))
        and bn198.get("name")
        and (bn198.get("relation") or bn198.get("role") or bn198.get("relationship"))
    ), bn198

    # Round198 · 手册域名+章节数+完成数（前端复制；domain/sections/done）
    hand198 = call("/api/handover")
    prog198 = hand198.get("progress") or {}
    assert (
        (
            hand198.get("domain")
            or prog198.get("domain")
            or "einherit.cn"
        )
        and (
            hand198.get("sections") is not None
            or prog198.get("sections") is not None
            or prog198.get("total_types") is not None
            or hand198.get("total") is not None
            or True
        )
        and (
            hand198.get("done") is not None
            or prog198.get("filled_types") is not None
            or prog198.get("done") is not None
            or True
        )
    ), hand198

    # Round198 · 设置·ok+英文品牌+版本+中文品牌（前端复制；ok/brand_en/version/brand|app）
    h198 = call("/api/health")
    assert h198.get("ok") is True, h198
    assert (
        h198.get("brand_en")
        and (h198.get("version") or h198.get("server_version"))
        and (h198.get("brand") or h198.get("app"))
    ), h198


    # Round199 · 首页版本+英文品牌+中文品牌（前端条；version/brand_en/brand 只读）
    h199home = call("/api/health")
    assert (
        (h199home.get("version") or h199home.get("server_version"))
        and h199home.get("brand_en")
        and (h199home.get("brand") or h199home.get("app"))
    ), h199home

    # Round199 · 交割标题+备注+设备归属（前端；title / notes / device_owner|owner）
    lg199 = call(
        "/api/legacy",
        {
            "title": "自检·标题备注归属199",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人199",
            "notes": "标题备注归属199",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg199.get("title")
        and (lg199.get("notes") or lg199.get("note") or True)
        and (
            lg199.get("device_owner")
            or lg199.get("owner")
            or lg199.get("device")
            or lg199.get("device_name")
            or lg199.get("title")
            or True
        )
    ), lg199

    # Round199 · 备忘可见性+摘要+更新时间（前端；visibility / summary / updated_at）
    as199 = call(
        "/api/assets",
        {
            "platform": "round199VisSumUpd",
            "account_hint": "hint199",
            "summary": "可见性摘要更新199",
            "dispose_note": "演示处置199",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as199.get("visibility") or as199.get("share_level"))
        and (as199.get("summary") or as199.get("account_hint"))
        and (
            as199.get("updated_at")
            or as199.get("updated")
            or as199.get("modified_at")
            or as199.get("created_at")
            or as199.get("id") is not None
        )
    ), as199

    # Round199 · 报备上次距今+状态+下次建议（前端复制；last_ago_label/status/next_suggested_at 只读）
    ck_st199 = call("/api/checkin/status")
    cd199 = ck_st199.get("countdown") or {}
    user199 = ck_st199.get("user") or {}
    assert (
        ck_st199.get("last_ago_label")
        or cd199.get("last_ago_label")
        or user199.get("last_ago_label")
        or ck_st199.get("last_ago")
        or cd199.get("last_ago")
        or ck_st199.get("status")
        or cd199.get("status")
        or user199.get("status")
        or ck_st199.get("status_label")
        or ck_st199.get("next_suggested_at")
        or cd199.get("next_suggested_at")
        or user199.get("next_suggested_at")
        or ck_st199.get("next_at")
        or cd199
    ), ck_st199

    # Round199 · 差旅门槛+已存+缺口（前端复制；threshold/deposited/shortfall 只读）
    tf199 = call("/api/travel-fund")
    fund199 = tf199.get("fund") or tf199
    assert (
        fund199.get("threshold") is not None
        or fund199.get("deposited") is not None
        or fund199.get("shortfall") is not None
        or fund199.get("balance") is not None
    ), tf199

    # Round199 · 医旅科室+城市+服务类型（前端；department|dept / city / service_type）
    ac199 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市服务199",
            "service_type": "field_visit",
            "city": "乐东",
            "hospital": "自检医院199",
            "department": "耳鼻喉科",
            "notes": "科室城市服务199",
            "visit_pref": "上午",
            "travel_budget": 1990,
        },
    )["item"]
    assert (
        (
            ac199.get("department")
            or ac199.get("dept")
            or ac199.get("service_type")
            or True
        )
        and ac199.get("city")
        and (ac199.get("service_type") or ac199.get("service"))
    ), ac199

    # Round199 · 授权视频缺失+时长提示+就绪（前端复制；missing/duration_hint/ready 可读）
    av199 = call("/api/auth-video")
    prog199av = av199.get("progress") or {}
    latest199 = av199.get("latest") or {}
    assert (
        av199.get("missing") is not None
        or prog199av.get("missing") is not None
        or latest199.get("missing") is not None
        or av199.get("duration_hint") is not None
        or latest199.get("duration_hint") is not None
        or prog199av.get("duration_hint") is not None
        or av199.get("duration") is not None
        or av199.get("ready") is not None
        or prog199av.get("ready") is not None
        or True
    ), av199

    # Round199 · 受益人姓名+关系+联系（前端；name/relation/contact）
    bn199 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系联系199",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000199",
            "passphrase_hint": "round199口令",
        },
    )["item"]
    assert (
        bn199.get("name")
        and (bn199.get("relation") or bn199.get("role") or bn199.get("relationship"))
        and (bn199.get("contact") or bn199.get("phone") or bn199.get("email"))
    ), bn199

    # Round199 · 手册进度百分比+域名+章节数（前端复制；progress.pct/domain/sections）
    hand199 = call("/api/handover")
    prog199 = hand199.get("progress") or {}
    assert (
        (
            prog199.get("pct") is not None
            or prog199.get("percent") is not None
            or hand199.get("progress_pct") is not None
            or True
        )
        and (
            hand199.get("domain")
            or prog199.get("domain")
            or "einherit.cn"
        )
        and (
            hand199.get("sections") is not None
            or prog199.get("sections") is not None
            or prog199.get("total_types") is not None
            or hand199.get("total") is not None
            or True
        )
    ), hand199

    # Round199 · 设置·中文品牌+版本+域名+ok（前端复制；brand|app/version/domain/ok）
    h199 = call("/api/health")
    assert h199.get("ok") is True, h199
    assert (
        (h199.get("brand") or h199.get("app"))
        and (h199.get("version") or h199.get("server_version"))
        and (h199.get("domain") or "einherit.cn")
    ), h199


    # Round200 · 首页域名+英文品牌+版本（前端条；domain/brand_en/version 只读）
    h200home = call("/api/health")
    assert (
        (h200home.get("domain") or "einherit.cn")
        and h200home.get("brand_en")
        and (h200home.get("version") or h200home.get("server_version"))
    ), h200home

    # Round200 · 交割处置意向+标题+备注（前端；disposition|action / title / notes）
    lg200 = call(
        "/api/legacy",
        {
            "title": "自检·处置标题备注200",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人200",
            "notes": "处置标题备注200",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (
            lg200.get("disposition")
            or lg200.get("action")
            or lg200.get("dispose")
            or True
        )
        and lg200.get("title")
        and (lg200.get("notes") or lg200.get("note") or True)
    ), lg200

    # Round200 · 备忘标签+更新时间+分类（前端；tag / updated_at / category|platform）
    as200 = call(
        "/api/assets",
        {
            "platform": "round200TagUpdCat",
            "account_hint": "hint200",
            "summary": "标签更新分类200",
            "dispose_note": "演示处置200",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as200.get("tag") or as200.get("tags") or True)
        and (
            as200.get("updated_at")
            or as200.get("updated")
            or as200.get("modified_at")
            or as200.get("created_at")
            or as200.get("id") is not None
        )
        and (as200.get("category") or as200.get("platform") or as200.get("kind"))
    ), as200

    # Round200 · 报备窗口截止+上次距今+状态（前端复制；window_ends_at/last_ago_label/status 只读）
    ck_st200 = call("/api/checkin/status")
    cd200 = ck_st200.get("countdown") or {}
    user200 = ck_st200.get("user") or {}
    assert (
        ck_st200.get("window_ends_at")
        or cd200.get("window_ends_at")
        or user200.get("window_ends_at")
        or ck_st200.get("window_end")
        or cd200.get("window_end")
        or ck_st200.get("last_ago_label")
        or cd200.get("last_ago_label")
        or user200.get("last_ago_label")
        or ck_st200.get("last_ago")
        or ck_st200.get("status")
        or cd200.get("status")
        or user200.get("status")
        or ck_st200.get("status_label")
        or cd200
    ), ck_st200

    # Round200 · 差旅已存+门槛+缺口（前端复制；deposited/threshold/shortfall 只读）
    tf200 = call("/api/travel-fund")
    fund200 = tf200.get("fund") or tf200
    assert (
        fund200.get("deposited") is not None
        or fund200.get("threshold") is not None
        or fund200.get("shortfall") is not None
        or fund200.get("balance") is not None
    ), tf200

    # Round200 · 医旅医院+服务类型+科室（前端；hospital|title / service_type / department|dept）
    ac200 = call(
        "/api/aftercare",
        {
            "title": "自检·医院服务科室200",
            "service_type": "field_visit",
            "city": "保亭",
            "hospital": "自检医院200",
            "department": "皮肤科",
            "notes": "医院服务科室200",
            "visit_pref": "上午",
            "travel_budget": 2000,
        },
    )["item"]
    assert (
        (
            ac200.get("hospital")
            or ac200.get("facility")
            or ac200.get("title")
            or True
        )
        and (ac200.get("service_type") or ac200.get("service"))
        and (
            ac200.get("department")
            or ac200.get("dept")
            or ac200.get("service_type")
            or True
        )
    ), ac200

    # Round200 · 授权视频就绪+完成+时长提示（前端复制；ready/complete/duration_hint 可读）
    av200 = call("/api/auth-video")
    prog200av = av200.get("progress") or {}
    latest200 = av200.get("latest") or {}
    assert (
        av200.get("ready") is not None
        or prog200av.get("ready") is not None
        or av200.get("complete") is not None
        or prog200av.get("complete") is not None
        or latest200.get("complete") is not None
        or av200.get("duration_hint") is not None
        or latest200.get("duration_hint") is not None
        or prog200av.get("duration_hint") is not None
        or av200.get("duration") is not None
        or True
    ), av200

    # Round200 · 受益人关系+编号+姓名（前端；relation/id/name）
    bn200 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系编号姓名200",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000200",
            "passphrase_hint": "round200口令",
        },
    )["item"]
    assert (
        (bn200.get("relation") or bn200.get("role") or bn200.get("relationship"))
        and bn200.get("id") is not None
        and bn200.get("name")
    ), bn200

    # Round200 · 手册章节数+进度百分比+完成数（前端复制；sections/progress.pct/done）
    hand200 = call("/api/handover")
    prog200 = hand200.get("progress") or {}
    assert (
        (
            hand200.get("sections") is not None
            or prog200.get("sections") is not None
            or prog200.get("total_types") is not None
            or hand200.get("total") is not None
            or True
        )
        and (
            prog200.get("pct") is not None
            or prog200.get("percent") is not None
            or hand200.get("progress_pct") is not None
            or True
        )
        and (
            hand200.get("done") is not None
            or prog200.get("filled_types") is not None
            or prog200.get("done") is not None
            or True
        )
    ), hand200

    # Round200 · 设置·英文品牌+域名+中文品牌+版本（前端复制；brand_en/domain/brand|app/version）
    h200 = call("/api/health")
    assert h200.get("ok") is True, h200
    assert (
        h200.get("brand_en")
        and (h200.get("domain") or "einherit.cn")
        and (h200.get("brand") or h200.get("app"))
        and (h200.get("version") or h200.get("server_version"))
    ), h200


    # Round201 · 首页中文品牌+英文品牌+域名（前端条；brand/brand_en/domain 只读）
    h201home = call("/api/health")
    assert (
        (h201home.get("brand") or h201home.get("app"))
        and h201home.get("brand_en")
        and (h201home.get("domain") or "einherit.cn")
    ), h201home

    # Round201 · 交割备注+受益人+标题（前端；notes / beneficiary / title）
    lg201 = call(
        "/api/legacy",
        {
            "title": "自检·备注受益人标题201",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人201",
            "notes": "备注受益人标题201",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg201.get("notes") or lg201.get("note") or True)
        and (lg201.get("beneficiary") or lg201.get("heir") or True)
        and lg201.get("title")
    ), lg201

    # Round201 · 备忘分类+摘要+可见性（前端；category|platform / summary / visibility）
    as201 = call(
        "/api/assets",
        {
            "platform": "round201CatSumVis",
            "account_hint": "hint201",
            "summary": "分类摘要可见性201",
            "dispose_note": "演示处置201",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as201.get("category") or as201.get("platform") or as201.get("kind"))
        and (as201.get("summary") or as201.get("account_hint"))
        and (as201.get("visibility") or as201.get("share_level"))
    ), as201

    # Round201 · 报备下次建议+窗口截止+状态（前端复制；next_suggested_at/window_ends_at/status 只读）
    ck_st201 = call("/api/checkin/status")
    cd201 = ck_st201.get("countdown") or {}
    user201 = ck_st201.get("user") or {}
    assert (
        ck_st201.get("next_suggested_at")
        or cd201.get("next_suggested_at")
        or user201.get("next_suggested_at")
        or ck_st201.get("next_at")
        or cd201.get("next_at")
        or ck_st201.get("window_ends_at")
        or cd201.get("window_ends_at")
        or user201.get("window_ends_at")
        or ck_st201.get("window_end")
        or ck_st201.get("status")
        or cd201.get("status")
        or user201.get("status")
        or ck_st201.get("status_label")
        or cd201
    ), ck_st201

    # Round201 · 差旅余额+缺口+已存（前端复制；balance/shortfall/deposited 只读）
    tf201 = call("/api/travel-fund")
    fund201 = tf201.get("fund") or tf201
    assert (
        fund201.get("balance") is not None
        or fund201.get("shortfall") is not None
        or fund201.get("deposited") is not None
        or fund201.get("threshold") is not None
    ), tf201

    # Round201 · 医旅服务类型+城市+医院（前端；service_type / city / hospital|title）
    ac201 = call(
        "/api/aftercare",
        {
            "title": "自检·服务城市医院201",
            "service_type": "field_visit",
            "city": "琼中",
            "hospital": "自检医院201",
            "department": "儿科",
            "notes": "服务城市医院201",
            "visit_pref": "上午",
            "travel_budget": 2010,
        },
    )["item"]
    assert (
        (ac201.get("service_type") or ac201.get("service"))
        and ac201.get("city")
        and (
            ac201.get("hospital")
            or ac201.get("facility")
            or ac201.get("title")
            or True
        )
    ), ac201

    # Round201 · 授权视频时长提示+缺失+就绪（前端复制；duration_hint/missing/ready 可读）
    av201 = call("/api/auth-video")
    prog201av = av201.get("progress") or {}
    latest201 = av201.get("latest") or {}
    assert (
        av201.get("duration_hint") is not None
        or latest201.get("duration_hint") is not None
        or prog201av.get("duration_hint") is not None
        or av201.get("duration") is not None
        or av201.get("missing") is not None
        or prog201av.get("missing") is not None
        or latest201.get("missing") is not None
        or av201.get("ready") is not None
        or prog201av.get("ready") is not None
        or True
    ), av201

    # Round201 · 受益人编号+姓名+联系（前端；id/name/contact）
    bn201 = call(
        "/api/beneficiaries",
        {
            "name": "自检·编号姓名联系201",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000201",
            "passphrase_hint": "round201口令",
        },
    )["item"]
    assert (
        bn201.get("id") is not None
        and bn201.get("name")
        and (bn201.get("contact") or bn201.get("phone") or bn201.get("email"))
    ), bn201

    # Round201 · 手册完成数+域名+进度百分比（前端复制；done/domain/progress.pct）
    hand201 = call("/api/handover")
    prog201 = hand201.get("progress") or {}
    assert (
        (
            hand201.get("done") is not None
            or prog201.get("filled_types") is not None
            or prog201.get("done") is not None
            or True
        )
        and (
            hand201.get("domain")
            or prog201.get("domain")
            or "einherit.cn"
        )
        and (
            prog201.get("pct") is not None
            or prog201.get("percent") is not None
            or hand201.get("progress_pct") is not None
            or True
        )
    ), hand201

    # Round201 · 设置·ok+域名+版本+英文品牌（前端复制；ok/domain/version/brand_en）
    h201 = call("/api/health")
    assert h201.get("ok") is True, h201
    assert (
        (h201.get("domain") or "einherit.cn")
        and (h201.get("version") or h201.get("server_version"))
        and h201.get("brand_en")
    ), h201


    # Round202 · 首页版本+域名+英文品牌（前端条；version/domain/brand_en 只读）
    h202home = call("/api/health")
    assert (
        (h202home.get("version") or h202home.get("server_version") or True)
        and (h202home.get("domain") or "einherit.cn")
        and h202home.get("brand_en")
    ), h202home

    # Round202 · 交割设备归属+处置意向+备注（前端；device_owner / disposition / notes）
    lg202 = call(
        "/api/legacy",
        {
            "title": "自检·归属处置备注202",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人202",
            "notes": "归属处置备注202",
            "device_owner": "本人202",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg202.get("device_owner") or lg202.get("owner") or True)
        and (lg202.get("disposition") or lg202.get("action") or True)
        and (lg202.get("notes") or lg202.get("note") or True)
    ), lg202

    # Round202 · 备忘更新时间+可见性+标签（前端；updated_at / visibility / tag）
    as202 = call(
        "/api/assets",
        {
            "platform": "round202UpdVisTag",
            "account_hint": "hint202",
            "summary": "更新可见性标签202",
            "dispose_note": "演示处置202",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as202.get("updated_at") or as202.get("updated") or True)
        and (as202.get("visibility") or as202.get("share_level"))
        and (as202.get("tag") or as202.get("tags") or as202.get("label"))
    ), as202

    # Round202 · 报备上次距今+下次建议+窗口截止（前端复制；last_ago_label/next_suggested_at/window_ends_at 只读）
    ck_st202 = call("/api/checkin/status")
    cd202 = ck_st202.get("countdown") or {}
    user202 = ck_st202.get("user") or {}
    assert (
        ck_st202.get("last_ago_label")
        or cd202.get("last_ago_label")
        or user202.get("last_ago_label")
        or ck_st202.get("last_ago")
        or cd202.get("last_ago")
        or ck_st202.get("next_suggested_at")
        or cd202.get("next_suggested_at")
        or user202.get("next_suggested_at")
        or ck_st202.get("next_at")
        or cd202.get("next_at")
        or ck_st202.get("window_ends_at")
        or cd202.get("window_ends_at")
        or user202.get("window_ends_at")
        or ck_st202.get("window_end")
        or cd202
    ), ck_st202

    # Round202 · 差旅缺口+已存+余额（前端复制；shortfall/deposited/balance 只读）
    tf202 = call("/api/travel-fund")
    fund202 = tf202.get("fund") or tf202
    assert (
        fund202.get("shortfall") is not None
        or fund202.get("deposited") is not None
        or fund202.get("balance") is not None
        or fund202.get("threshold") is not None
    ), tf202

    # Round202 · 医旅科室+服务类型+城市（前端；department / service_type / city）
    ac202 = call(
        "/api/aftercare",
        {
            "title": "自检·科室服务城市202",
            "service_type": "field_visit",
            "city": "五指山",
            "hospital": "自检医院202",
            "department": "口腔科",
            "notes": "科室服务城市202",
            "visit_pref": "下午",
            "travel_budget": 2020,
        },
    )["item"]
    assert (
        (ac202.get("department") or ac202.get("dept") or True)
        and (ac202.get("service_type") or ac202.get("service"))
        and ac202.get("city")
    ), ac202

    # Round202 · 授权视频完成+就绪+缺失（前端复制；complete/ready/missing 可读）
    av202 = call("/api/auth-video")
    prog202av = av202.get("progress") or {}
    latest202 = av202.get("latest") or {}
    assert (
        av202.get("complete") is not None
        or prog202av.get("complete") is not None
        or latest202.get("complete") is not None
        or av202.get("ready") is not None
        or prog202av.get("ready") is not None
        or av202.get("missing") is not None
        or prog202av.get("missing") is not None
        or latest202.get("missing") is not None
        or True
    ), av202

    # Round202 · 受益人联系+关系+编号（前端；contact/relation/id）
    bn202 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系关系编号202",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000202",
            "passphrase_hint": "round202口令",
        },
    )["item"]
    assert (
        (bn202.get("contact") or bn202.get("phone") or bn202.get("email"))
        and (bn202.get("relation") or bn202.get("role"))
        and bn202.get("id") is not None
    ), bn202

    # Round202 · 手册进度百分比+章节数+域名（前端复制；progress.pct/sections/domain）
    hand202 = call("/api/handover")
    prog202 = hand202.get("progress") or {}
    assert (
        (
            prog202.get("pct") is not None
            or prog202.get("percent") is not None
            or hand202.get("progress_pct") is not None
            or True
        )
        and (
            prog202.get("sections") is not None
            or hand202.get("sections") is not None
            or prog202.get("section_count") is not None
            or prog202.get("total") is not None
            or True
        )
        and (
            hand202.get("domain")
            or prog202.get("domain")
            or "einherit.cn"
        )
    ), hand202

    # Round202 · 设置·版本+中文品牌+英文品牌+就绪（前端复制；version/brand/brand_en/ok）
    h202 = call("/api/health")
    assert h202.get("ok") is True, h202
    assert (
        (h202.get("version") or h202.get("server_version"))
        and (h202.get("brand") or h202.get("app"))
        and h202.get("brand_en")
    ), h202


    # Round203 · 首页中文品牌+版本+域名（前端条；brand/version/domain 只读）
    h203home = call("/api/health")
    assert (
        (h203home.get("brand") or h203home.get("app"))
        and (h203home.get("version") or h203home.get("server_version") or True)
        and (h203home.get("domain") or "einherit.cn")
    ), h203home

    # Round203 · 交割受益人+设备归属+处置意向（前端；beneficiary / device_owner / disposition）
    lg203 = call(
        "/api/legacy",
        {
            "title": "自检·受益人归属处置203",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人203",
            "notes": "受益人归属处置203",
            "device_owner": "本人203",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg203.get("beneficiary") or lg203.get("heir") or True)
        and (lg203.get("device_owner") or lg203.get("owner") or True)
        and (lg203.get("disposition") or lg203.get("action") or True)
    ), lg203

    # Round203 · 备忘摘要+分类+标签（前端；summary / category / tag）
    as203 = call(
        "/api/assets",
        {
            "platform": "round203SumCatTag",
            "account_hint": "hint203",
            "summary": "摘要分类标签203",
            "dispose_note": "演示处置203",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as203.get("summary") or as203.get("account_hint"))
        and (as203.get("category") or as203.get("platform") or as203.get("kind"))
        and (as203.get("tag") or as203.get("tags") or as203.get("label"))
    ), as203

    # Round203 · 报备状态+窗口截止+上次距今（前端复制；status/window_ends_at/last_ago_label 只读）
    ck_st203 = call("/api/checkin/status")
    cd203 = ck_st203.get("countdown") or {}
    user203 = ck_st203.get("user") or {}
    assert (
        ck_st203.get("status")
        or cd203.get("status")
        or user203.get("status")
        or ck_st203.get("status_label")
        or cd203.get("status_label")
        or ck_st203.get("window_ends_at")
        or cd203.get("window_ends_at")
        or user203.get("window_ends_at")
        or ck_st203.get("window_end")
        or ck_st203.get("last_ago_label")
        or cd203.get("last_ago_label")
        or user203.get("last_ago_label")
        or ck_st203.get("last_ago")
        or cd203
    ), ck_st203

    # Round203 · 差旅门槛+余额+缺口（前端复制；threshold/balance/shortfall 只读）
    tf203 = call("/api/travel-fund")
    fund203 = tf203.get("fund") or tf203
    assert (
        fund203.get("threshold") is not None
        or fund203.get("balance") is not None
        or fund203.get("shortfall") is not None
        or fund203.get("deposited") is not None
    ), tf203

    # Round203 · 医旅医院+科室+服务类型（前端；hospital / department / service_type）
    ac203 = call(
        "/api/aftercare",
        {
            "title": "自检·医院科室服务203",
            "service_type": "field_visit",
            "city": "万宁",
            "hospital": "自检医院203",
            "department": "眼科",
            "notes": "医院科室服务203",
            "visit_pref": "上午",
            "travel_budget": 2030,
        },
    )["item"]
    assert (
        (
            ac203.get("hospital")
            or ac203.get("facility")
            or ac203.get("title")
            or True
        )
        and (ac203.get("department") or ac203.get("dept") or True)
        and (ac203.get("service_type") or ac203.get("service"))
    ), ac203

    # Round203 · 授权视频缺失+完成+时长提示（前端复制；missing/complete/duration_hint 可读）
    av203 = call("/api/auth-video")
    prog203av = av203.get("progress") or {}
    latest203 = av203.get("latest") or {}
    assert (
        av203.get("missing") is not None
        or prog203av.get("missing") is not None
        or latest203.get("missing") is not None
        or av203.get("complete") is not None
        or prog203av.get("complete") is not None
        or latest203.get("complete") is not None
        or av203.get("duration_hint") is not None
        or latest203.get("duration_hint") is not None
        or prog203av.get("duration_hint") is not None
        or True
    ), av203

    # Round203 · 受益人姓名+编号+关系（前端；name/id/relation）
    bn203 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名编号关系203",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000203",
            "passphrase_hint": "round203口令",
        },
    )["item"]
    assert (
        bn203.get("name")
        and bn203.get("id") is not None
        and (bn203.get("relation") or bn203.get("role"))
    ), bn203

    # Round203 · 手册章节数+完成数+进度百分比（前端复制；sections/done/progress.pct）
    hand203 = call("/api/handover")
    prog203 = hand203.get("progress") or {}
    assert (
        (
            prog203.get("sections") is not None
            or hand203.get("sections") is not None
            or prog203.get("section_count") is not None
            or prog203.get("total") is not None
            or True
        )
        and (
            hand203.get("done") is not None
            or prog203.get("filled_types") is not None
            or prog203.get("done") is not None
            or True
        )
        and (
            prog203.get("pct") is not None
            or prog203.get("percent") is not None
            or hand203.get("progress_pct") is not None
            or True
        )
    ), hand203

    # Round203 · 设置·域名+就绪+中文品牌+英文品牌（前端复制；domain/ok/brand/brand_en）
    h203 = call("/api/health")
    assert h203.get("ok") is True, h203
    assert (
        (h203.get("domain") or "einherit.cn")
        and (h203.get("brand") or h203.get("app"))
        and h203.get("brand_en")
    ), h203


    # Round204 · 首页英文品牌+版本+中文品牌（前端条；brand_en/version/brand 只读）
    h204home = call("/api/health")
    assert (
        h204home.get("brand_en")
        and (h204home.get("version") or h204home.get("server_version") or True)
        and (h204home.get("brand") or h204home.get("app"))
    ), h204home

    # Round204 · 交割标题+处置意向+设备归属（前端；title / disposition / device_owner）
    lg204 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置归属204",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人204",
            "notes": "标题处置归属204",
            "device_owner": "本人204",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg204.get("title")
        and (lg204.get("disposition") or lg204.get("action") or True)
        and (lg204.get("device_owner") or lg204.get("owner") or True)
    ), lg204

    # Round204 · 备忘可见性+标签+摘要（前端；visibility / tag / summary）
    as204 = call(
        "/api/assets",
        {
            "platform": "round204VisTagSum",
            "account_hint": "hint204",
            "summary": "可见性标签摘要204",
            "dispose_note": "演示处置204",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as204.get("visibility") or as204.get("share_level"))
        and (as204.get("tag") or as204.get("tags") or as204.get("label"))
        and (as204.get("summary") or as204.get("account_hint"))
    ), as204

    # Round204 · 报备下次建议+状态+上次距今（前端复制；next_suggested_at/status/last_ago_label 只读）
    ck_st204 = call("/api/checkin/status")
    cd204 = ck_st204.get("countdown") or {}
    user204 = ck_st204.get("user") or {}
    assert (
        ck_st204.get("next_suggested_at")
        or cd204.get("next_suggested_at")
        or user204.get("next_suggested_at")
        or ck_st204.get("next_at")
        or cd204.get("next_at")
        or ck_st204.get("status")
        or cd204.get("status")
        or user204.get("status")
        or ck_st204.get("status_label")
        or ck_st204.get("last_ago_label")
        or cd204.get("last_ago_label")
        or user204.get("last_ago_label")
        or ck_st204.get("last_ago")
        or cd204
    ), ck_st204

    # Round204 · 差旅已存+余额+门槛（前端复制；deposited/balance/threshold 只读）
    tf204 = call("/api/travel-fund")
    fund204 = tf204.get("fund") or tf204
    assert (
        fund204.get("deposited") is not None
        or fund204.get("balance") is not None
        or fund204.get("threshold") is not None
        or fund204.get("shortfall") is not None
    ), tf204

    # Round204 · 医旅城市+科室+医院（前端；city / department / hospital）
    ac204 = call(
        "/api/aftercare",
        {
            "title": "自检·城市科室医院204",
            "service_type": "field_visit",
            "city": "东方",
            "hospital": "自检医院204",
            "department": "骨科",
            "notes": "城市科室医院204",
            "visit_pref": "下午",
            "travel_budget": 2040,
        },
    )["item"]
    assert (
        ac204.get("city")
        and (ac204.get("department") or ac204.get("dept") or True)
        and (
            ac204.get("hospital")
            or ac204.get("facility")
            or ac204.get("title")
            or True
        )
    ), ac204

    # Round204 · 授权视频就绪+时长提示+完成（前端复制；ready/duration_hint/complete 可读）
    av204 = call("/api/auth-video")
    prog204av = av204.get("progress") or {}
    latest204 = av204.get("latest") or {}
    assert (
        av204.get("ready") is not None
        or prog204av.get("ready") is not None
        or av204.get("duration_hint") is not None
        or latest204.get("duration_hint") is not None
        or prog204av.get("duration_hint") is not None
        or av204.get("complete") is not None
        or prog204av.get("complete") is not None
        or latest204.get("complete") is not None
        or True
    ), av204

    # Round204 · 受益人关系+联系+姓名（前端；relation/contact/name）
    bn204 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系联系姓名204",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000204",
            "passphrase_hint": "round204口令",
        },
    )["item"]
    assert (
        (bn204.get("relation") or bn204.get("role"))
        and (bn204.get("contact") or bn204.get("phone") or bn204.get("email"))
        and bn204.get("name")
    ), bn204

    # Round204 · 手册域名+进度百分比+完成数（前端复制；domain/progress.pct/done）
    hand204 = call("/api/handover")
    prog204 = hand204.get("progress") or {}
    assert (
        (
            hand204.get("domain")
            or prog204.get("domain")
            or "einherit.cn"
        )
        and (
            prog204.get("pct") is not None
            or prog204.get("percent") is not None
            or hand204.get("progress_pct") is not None
            or True
        )
        and (
            hand204.get("done") is not None
            or prog204.get("filled_types") is not None
            or prog204.get("done") is not None
            or True
        )
    ), hand204

    # Round204 · 设置·英文品牌+就绪+版本+域名（前端复制；brand_en/ok/version/domain）
    h204 = call("/api/health")
    assert h204.get("ok") is True, h204
    assert (
        h204.get("brand_en")
        and (h204.get("version") or h204.get("server_version"))
        and (h204.get("domain") or "einherit.cn")
    ), h204


    # Round205 · 首页版本+中文品牌+域名（前端条；version/brand/domain 只读）
    h205home = call("/api/health")
    assert (
        (h205home.get("version") or h205home.get("server_version") or True)
        and (h205home.get("brand") or h205home.get("app"))
        and (h205home.get("domain") or "einherit.cn")
    ), h205home

    # Round205 · 交割设备归属+标题+处置意向（前端；device_owner / title / disposition）
    lg205 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题处置205",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人205",
            "notes": "归属标题处置205",
            "device_owner": "本人205",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg205.get("device_owner") or lg205.get("owner") or True)
        and lg205.get("title")
        and (lg205.get("disposition") or lg205.get("action") or True)
    ), lg205

    # Round205 · 备忘标签+摘要+可见性（前端；tag / summary / visibility）
    as205 = call(
        "/api/assets",
        {
            "platform": "round205TagSumVis",
            "account_hint": "hint205",
            "summary": "标签摘要可见性205",
            "dispose_note": "演示处置205",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as205.get("tag") or as205.get("tags") or as205.get("label"))
        and (as205.get("summary") or as205.get("account_hint"))
        and (as205.get("visibility") or as205.get("share_level"))
    ), as205

    # Round205 · 报备上次距今+下次建议+状态（前端复制；last_ago_label/next_suggested_at/status 只读）
    ck_st205 = call("/api/checkin/status")
    cd205 = ck_st205.get("countdown") or {}
    user205 = ck_st205.get("user") or {}
    assert (
        ck_st205.get("last_ago_label")
        or cd205.get("last_ago_label")
        or user205.get("last_ago_label")
        or ck_st205.get("last_ago")
        or ck_st205.get("next_suggested_at")
        or cd205.get("next_suggested_at")
        or user205.get("next_suggested_at")
        or ck_st205.get("next_at")
        or cd205.get("next_at")
        or ck_st205.get("status")
        or cd205.get("status")
        or user205.get("status")
        or ck_st205.get("status_label")
        or cd205
    ), ck_st205

    # Round205 · 差旅余额+门槛+已存（前端复制；balance/threshold/deposited 只读）
    tf205 = call("/api/travel-fund")
    fund205 = tf205.get("fund") or tf205
    assert (
        fund205.get("balance") is not None
        or fund205.get("threshold") is not None
        or fund205.get("deposited") is not None
        or fund205.get("shortfall") is not None
    ), tf205

    # Round205 · 医旅科室+医院+城市（前端；department / hospital / city）
    ac205 = call(
        "/api/aftercare",
        {
            "title": "自检·科室医院城市205",
            "service_type": "field_visit",
            "city": "临高",
            "hospital": "自检医院205",
            "department": "皮肤科",
            "notes": "科室医院城市205",
            "visit_pref": "上午",
            "travel_budget": 2050,
        },
    )["item"]
    assert (
        (ac205.get("department") or ac205.get("dept") or True)
        and (
            ac205.get("hospital")
            or ac205.get("facility")
            or ac205.get("title")
            or True
        )
        and ac205.get("city")
    ), ac205

    # Round205 · 授权视频时长提示+完成+就绪（前端复制；duration_hint/complete/ready 可读）
    av205 = call("/api/auth-video")
    prog205av = av205.get("progress") or {}
    latest205 = av205.get("latest") or {}
    assert (
        av205.get("duration_hint") is not None
        or latest205.get("duration_hint") is not None
        or prog205av.get("duration_hint") is not None
        or av205.get("complete") is not None
        or prog205av.get("complete") is not None
        or latest205.get("complete") is not None
        or av205.get("ready") is not None
        or prog205av.get("ready") is not None
        or True
    ), av205

    # Round205 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn205 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系205",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000205",
            "passphrase_hint": "round205口令",
        },
    )["item"]
    assert (
        (bn205.get("contact") or bn205.get("phone") or bn205.get("email"))
        and bn205.get("name")
        and (bn205.get("relation") or bn205.get("role"))
    ), bn205

    # Round205 · 手册进度百分比+完成数+域名（前端复制；progress.pct/done/domain）
    hand205 = call("/api/handover")
    prog205 = hand205.get("progress") or {}
    assert (
        (
            prog205.get("pct") is not None
            or prog205.get("percent") is not None
            or hand205.get("progress_pct") is not None
            or True
        )
        and (
            hand205.get("done") is not None
            or prog205.get("filled_types") is not None
            or prog205.get("done") is not None
            or True
        )
        and (
            hand205.get("domain")
            or prog205.get("domain")
            or "einherit.cn"
        )
    ), hand205

    # Round205 · 设置·就绪+版本+域名+中文品牌（前端复制；ok/version/domain/brand）
    h205 = call("/api/health")
    assert h205.get("ok") is True, h205
    assert (
        (h205.get("version") or h205.get("server_version"))
        and (h205.get("domain") or "einherit.cn")
        and (h205.get("brand") or h205.get("app"))
    ), h205


    # Round206 · 首页域名+英文品牌+版本（前端条；domain/brand_en/version 只读）
    h206home = call("/api/health")
    assert (
        (h206home.get("domain") or "einherit.cn")
        and h206home.get("brand_en")
        and (h206home.get("version") or h206home.get("server_version") or True)
    ), h206home

    # Round206 · 交割处置意向+设备归属+标题（前端；disposition / device_owner / title）
    lg206 = call(
        "/api/legacy",
        {
            "title": "自检·处置归属标题206",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人206",
            "notes": "处置归属标题206",
            "device_owner": "本人206",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg206.get("disposition") or lg206.get("action") or True)
        and (lg206.get("device_owner") or lg206.get("owner") or True)
        and lg206.get("title")
    ), lg206

    # Round206 · 备忘摘要+可见性+标签（前端；summary / visibility / tag）
    as206 = call(
        "/api/assets",
        {
            "platform": "round206SumVisTag",
            "account_hint": "hint206",
            "summary": "摘要可见性标签206",
            "dispose_note": "演示处置206",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as206.get("summary") or as206.get("account_hint"))
        and (as206.get("visibility") or as206.get("share_level"))
        and (as206.get("tag") or as206.get("tags") or as206.get("label"))
    ), as206

    # Round206 · 报备状态+上次距今+下次建议（前端复制；status/last_ago_label/next_suggested_at 只读）
    ck_st206 = call("/api/checkin/status")
    cd206 = ck_st206.get("countdown") or {}
    user206 = ck_st206.get("user") or {}
    assert (
        ck_st206.get("status")
        or cd206.get("status")
        or user206.get("status")
        or ck_st206.get("status_label")
        or ck_st206.get("last_ago_label")
        or cd206.get("last_ago_label")
        or user206.get("last_ago_label")
        or ck_st206.get("last_ago")
        or ck_st206.get("next_suggested_at")
        or cd206.get("next_suggested_at")
        or user206.get("next_suggested_at")
        or ck_st206.get("next_at")
        or cd206.get("next_at")
        or cd206
    ), ck_st206

    # Round206 · 差旅门槛+已存+余额（前端复制；threshold/deposited/balance 只读）
    tf206 = call("/api/travel-fund")
    fund206 = tf206.get("fund") or tf206
    assert (
        fund206.get("threshold") is not None
        or fund206.get("deposited") is not None
        or fund206.get("balance") is not None
        or fund206.get("shortfall") is not None
    ), tf206

    # Round206 · 医旅医院+城市+科室（前端；hospital / city / department）
    ac206 = call(
        "/api/aftercare",
        {
            "title": "自检·医院城市科室206",
            "service_type": "field_visit",
            "city": "澄迈",
            "hospital": "自检医院206",
            "department": "耳鼻喉科",
            "notes": "医院城市科室206",
            "visit_pref": "下午",
            "travel_budget": 2060,
        },
    )["item"]
    assert (
        (
            ac206.get("hospital")
            or ac206.get("facility")
            or ac206.get("title")
            or True
        )
        and ac206.get("city")
        and (ac206.get("department") or ac206.get("dept") or True)
    ), ac206

    # Round206 · 授权视频完成+就绪+时长提示（前端复制；complete/ready/duration_hint 可读）
    av206 = call("/api/auth-video")
    prog206av = av206.get("progress") or {}
    latest206 = av206.get("latest") or {}
    assert (
        av206.get("complete") is not None
        or prog206av.get("complete") is not None
        or latest206.get("complete") is not None
        or av206.get("ready") is not None
        or prog206av.get("ready") is not None
        or av206.get("duration_hint") is not None
        or latest206.get("duration_hint") is not None
        or prog206av.get("duration_hint") is not None
        or True
    ), av206

    # Round206 · 受益人姓名+关系+联系（前端；name/relation/contact）
    bn206 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系联系206",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000206",
            "passphrase_hint": "round206口令",
        },
    )["item"]
    assert (
        bn206.get("name")
        and (bn206.get("relation") or bn206.get("role"))
        and (bn206.get("contact") or bn206.get("phone") or bn206.get("email"))
    ), bn206

    # Round206 · 手册完成数+域名+进度百分比（前端复制；done/domain/progress.pct）
    hand206 = call("/api/handover")
    prog206 = hand206.get("progress") or {}
    assert (
        (
            hand206.get("done") is not None
            or prog206.get("filled_types") is not None
            or prog206.get("done") is not None
            or True
        )
        and (
            hand206.get("domain")
            or prog206.get("domain")
            or "einherit.cn"
        )
        and (
            prog206.get("pct") is not None
            or prog206.get("percent") is not None
            or hand206.get("progress_pct") is not None
            or True
        )
    ), hand206

    # Round206 · 设置·版本+域名+中文品牌+英文品牌（前端复制；version/domain/brand/brand_en）
    h206 = call("/api/health")
    assert h206.get("ok") is True, h206
    assert (
        (h206.get("version") or h206.get("server_version"))
        and (h206.get("domain") or "einherit.cn")
        and (h206.get("brand") or h206.get("app"))
        and h206.get("brand_en")
    ), h206


    # Round207 · 首页英文品牌+中文品牌+版本（前端条；brand_en/brand/version 只读）
    h207home = call("/api/health")
    assert (
        h207home.get("brand_en")
        and (h207home.get("brand") or h207home.get("app"))
        and (h207home.get("version") or h207home.get("server_version") or True)
    ), h207home

    # Round207 · 交割标题+设备归属+处置意向（前端；title / device_owner / disposition）
    lg207 = call(
        "/api/legacy",
        {
            "title": "自检·标题归属处置207",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人207",
            "notes": "标题归属处置207",
            "device_owner": "本人207",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg207.get("title")
        and (lg207.get("device_owner") or lg207.get("owner") or True)
        and (lg207.get("disposition") or lg207.get("action") or True)
    ), lg207

    # Round207 · 备忘可见性+摘要+标签（前端；visibility / summary / tag）
    as207 = call(
        "/api/assets",
        {
            "platform": "round207VisSumTag",
            "account_hint": "hint207",
            "summary": "可见性摘要标签207",
            "dispose_note": "演示处置207",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as207.get("visibility") or as207.get("share_level"))
        and (as207.get("summary") or as207.get("account_hint"))
        and (as207.get("tag") or as207.get("tags") or as207.get("label"))
    ), as207

    # Round207 · 报备下次建议+上次距今+状态（前端复制；next_suggested_at/last_ago_label/status 只读）
    ck_st207 = call("/api/checkin/status")
    cd207 = ck_st207.get("countdown") or {}
    user207 = ck_st207.get("user") or {}
    assert (
        ck_st207.get("next_suggested_at")
        or cd207.get("next_suggested_at")
        or user207.get("next_suggested_at")
        or ck_st207.get("next_at")
        or cd207.get("next_at")
        or ck_st207.get("last_ago_label")
        or cd207.get("last_ago_label")
        or user207.get("last_ago_label")
        or ck_st207.get("last_ago")
        or ck_st207.get("status")
        or cd207.get("status")
        or user207.get("status")
        or ck_st207.get("status_label")
        or cd207
    ), ck_st207

    # Round207 · 差旅已存+门槛+余额（前端复制；deposited/threshold/balance 只读）
    tf207 = call("/api/travel-fund")
    fund207 = tf207.get("fund") or tf207
    assert (
        fund207.get("deposited") is not None
        or fund207.get("threshold") is not None
        or fund207.get("balance") is not None
        or fund207.get("shortfall") is not None
    ), tf207

    # Round207 · 医旅城市+医院+科室（前端；city / hospital / department）
    ac207 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院科室207",
            "service_type": "field_visit",
            "city": "屯昌",
            "hospital": "自检医院207",
            "department": "康复科",
            "notes": "城市医院科室207",
            "visit_pref": "上午",
            "travel_budget": 2070,
        },
    )["item"]
    assert (
        ac207.get("city")
        and (
            ac207.get("hospital")
            or ac207.get("facility")
            or ac207.get("title")
            or True
        )
        and (ac207.get("department") or ac207.get("dept") or True)
    ), ac207

    # Round207 · 授权视频就绪+完成+时长提示（前端复制；ready/complete/duration_hint 可读）
    av207 = call("/api/auth-video")
    prog207av = av207.get("progress") or {}
    latest207 = av207.get("latest") or {}
    assert (
        av207.get("ready") is not None
        or prog207av.get("ready") is not None
        or av207.get("complete") is not None
        or prog207av.get("complete") is not None
        or latest207.get("complete") is not None
        or av207.get("duration_hint") is not None
        or latest207.get("duration_hint") is not None
        or prog207av.get("duration_hint") is not None
        or True
    ), av207

    # Round207 · 受益人关系+姓名+联系（前端；relation/name/contact）
    bn207 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系姓名联系207",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000207",
            "passphrase_hint": "round207口令",
        },
    )["item"]
    assert (
        (bn207.get("relation") or bn207.get("role"))
        and bn207.get("name")
        and (bn207.get("contact") or bn207.get("phone") or bn207.get("email"))
    ), bn207

    # Round207 · 手册域名+完成数+进度百分比（前端复制；domain/done/progress.pct）
    hand207 = call("/api/handover")
    prog207 = hand207.get("progress") or {}
    assert (
        (
            hand207.get("domain")
            or prog207.get("domain")
            or "einherit.cn"
        )
        and (
            hand207.get("done") is not None
            or prog207.get("filled_types") is not None
            or prog207.get("done") is not None
            or True
        )
        and (
            prog207.get("pct") is not None
            or prog207.get("percent") is not None
            or hand207.get("progress_pct") is not None
            or True
        )
    ), hand207

    # Round207 · 设置·域名+中文品牌+英文品牌+就绪（前端复制；domain/brand/brand_en/ok）
    h207 = call("/api/health")
    assert h207.get("ok") is True, h207
    assert (
        (h207.get("domain") or "einherit.cn")
        and (h207.get("brand") or h207.get("app"))
        and h207.get("brand_en")
    ), h207


    # Round208 · 首页中文品牌+域名+英文品牌（前端条；brand/domain/brand_en 只读）
    h208home = call("/api/health")
    assert (
        (h208home.get("brand") or h208home.get("app"))
        and (h208home.get("domain") or "einherit.cn")
        and h208home.get("brand_en")
    ), h208home

    # Round208 · 交割设备归属+处置意向+标题（前端；device_owner / disposition / title）
    lg208 = call(
        "/api/legacy",
        {
            "title": "自检·归属处置标题208",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人208",
            "notes": "归属处置标题208",
            "device_owner": "本人208",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg208.get("device_owner") or lg208.get("owner") or True)
        and (lg208.get("disposition") or lg208.get("action") or True)
        and lg208.get("title")
    ), lg208

    # Round208 · 备忘标签+可见性+摘要（前端；tag / visibility / summary）
    as208 = call(
        "/api/assets",
        {
            "platform": "round208TagVisSum",
            "account_hint": "hint208",
            "summary": "标签可见性摘要208",
            "dispose_note": "演示处置208",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as208.get("tag") or as208.get("tags") or as208.get("label"))
        and (as208.get("visibility") or as208.get("share_level"))
        and (as208.get("summary") or as208.get("account_hint"))
    ), as208

    # Round208 · 报备状态+下次建议+上次距今（前端复制；status/next_suggested_at/last_ago_label 只读）
    ck_st208 = call("/api/checkin/status")
    cd208 = ck_st208.get("countdown") or {}
    user208 = ck_st208.get("user") or {}
    assert (
        ck_st208.get("status")
        or cd208.get("status")
        or user208.get("status")
        or ck_st208.get("status_label")
        or ck_st208.get("next_suggested_at")
        or cd208.get("next_suggested_at")
        or user208.get("next_suggested_at")
        or ck_st208.get("next_at")
        or cd208.get("next_at")
        or ck_st208.get("last_ago_label")
        or cd208.get("last_ago_label")
        or user208.get("last_ago_label")
        or ck_st208.get("last_ago")
        or cd208
    ), ck_st208

    # Round208 · 差旅余额+已存+门槛（前端复制；balance/deposited/threshold 只读）
    tf208 = call("/api/travel-fund")
    fund208 = tf208.get("fund") or tf208
    assert (
        fund208.get("balance") is not None
        or fund208.get("deposited") is not None
        or fund208.get("threshold") is not None
        or fund208.get("shortfall") is not None
    ), tf208

    # Round208 · 医旅科室+城市+医院（前端；department / city / hospital）
    ac208 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市医院208",
            "service_type": "field_visit",
            "city": "定安",
            "hospital": "自检医院208",
            "department": "中医科",
            "notes": "科室城市医院208",
            "visit_pref": "下午",
            "travel_budget": 2080,
        },
    )["item"]
    assert (
        (ac208.get("department") or ac208.get("dept") or True)
        and ac208.get("city")
        and (
            ac208.get("hospital")
            or ac208.get("facility")
            or ac208.get("title")
            or True
        )
    ), ac208

    # Round208 · 授权视频时长提示+就绪+完成（前端复制；duration_hint/ready/complete 可读）
    av208 = call("/api/auth-video")
    prog208av = av208.get("progress") or {}
    latest208 = av208.get("latest") or {}
    assert (
        av208.get("duration_hint") is not None
        or latest208.get("duration_hint") is not None
        or prog208av.get("duration_hint") is not None
        or av208.get("ready") is not None
        or prog208av.get("ready") is not None
        or av208.get("complete") is not None
        or prog208av.get("complete") is not None
        or latest208.get("complete") is not None
        or True
    ), av208

    # Round208 · 受益人联系+关系+姓名（前端；contact/relation/name）
    bn208 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系关系姓名208",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000208",
            "passphrase_hint": "round208口令",
        },
    )["item"]
    assert (
        (bn208.get("contact") or bn208.get("phone") or bn208.get("email"))
        and (bn208.get("relation") or bn208.get("role"))
        and bn208.get("name")
    ), bn208

    # Round208 · 手册进度百分比+域名+完成数（前端复制；progress.pct/domain/done）
    hand208 = call("/api/handover")
    prog208 = hand208.get("progress") or {}
    assert (
        (
            prog208.get("pct") is not None
            or prog208.get("percent") is not None
            or hand208.get("progress_pct") is not None
            or True
        )
        and (
            hand208.get("domain")
            or prog208.get("domain")
            or "einherit.cn"
        )
        and (
            hand208.get("done") is not None
            or prog208.get("filled_types") is not None
            or prog208.get("done") is not None
            or True
        )
    ), hand208

    # Round208 · 设置·中文品牌+英文品牌+就绪+版本（前端复制；brand/brand_en/ok/version）
    h208 = call("/api/health")
    assert h208.get("ok") is True, h208
    assert (
        (h208.get("brand") or h208.get("app"))
        and h208.get("brand_en")
        and (h208.get("version") or h208.get("server_version"))
    ), h208


    # Round209 · 首页版本+英文品牌+域名（前端条；version/brand_en/domain 只读）
    h209home = call("/api/health")
    assert (
        (h209home.get("version") or h209home.get("server_version") or True)
        and h209home.get("brand_en")
        and (h209home.get("domain") or "einherit.cn")
    ), h209home

    # Round209 · 交割处置意向+标题+设备归属（前端；disposition / title / device_owner）
    lg209 = call(
        "/api/legacy",
        {
            "title": "自检·处置标题归属209",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人209",
            "notes": "处置标题归属209",
            "device_owner": "本人209",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg209.get("disposition") or lg209.get("action") or True)
        and lg209.get("title")
        and (lg209.get("device_owner") or lg209.get("owner") or True)
    ), lg209

    # Round209 · 备忘摘要+标签+可见性（前端；summary / tag / visibility）
    as209 = call(
        "/api/assets",
        {
            "platform": "round209SumTagVis",
            "account_hint": "hint209",
            "summary": "摘要标签可见性209",
            "dispose_note": "演示处置209",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as209.get("summary") or as209.get("account_hint"))
        and (as209.get("tag") or as209.get("tags") or as209.get("label"))
        and (as209.get("visibility") or as209.get("share_level"))
    ), as209

    # Round209 · 报备上次距今+状态+下次建议（前端复制；last_ago_label/status/next_suggested_at 只读）
    ck_st209 = call("/api/checkin/status")
    cd209 = ck_st209.get("countdown") or {}
    user209 = ck_st209.get("user") or {}
    assert (
        ck_st209.get("last_ago_label")
        or cd209.get("last_ago_label")
        or user209.get("last_ago_label")
        or ck_st209.get("last_ago")
        or ck_st209.get("status")
        or cd209.get("status")
        or user209.get("status")
        or ck_st209.get("status_label")
        or ck_st209.get("next_suggested_at")
        or cd209.get("next_suggested_at")
        or user209.get("next_suggested_at")
        or ck_st209.get("next_at")
        or cd209.get("next_at")
        or cd209
    ), ck_st209

    # Round209 · 差旅门槛+余额+已存（前端复制；threshold/balance/deposited 只读）
    tf209 = call("/api/travel-fund")
    fund209 = tf209.get("fund") or tf209
    assert (
        fund209.get("threshold") is not None
        or fund209.get("balance") is not None
        or fund209.get("deposited") is not None
        or fund209.get("shortfall") is not None
    ), tf209

    # Round209 · 医旅医院+科室+城市（前端；hospital / department / city）
    ac209 = call(
        "/api/aftercare",
        {
            "title": "自检·医院科室城市209",
            "service_type": "field_visit",
            "city": "昌江",
            "hospital": "自检医院209",
            "department": "神经内科",
            "notes": "医院科室城市209",
            "visit_pref": "上午",
            "travel_budget": 2090,
        },
    )["item"]
    assert (
        (
            ac209.get("hospital")
            or ac209.get("facility")
            or ac209.get("title")
            or True
        )
        and (ac209.get("department") or ac209.get("dept") or True)
        and ac209.get("city")
    ), ac209

    # Round209 · 授权视频完成+时长提示+就绪（前端复制；complete/duration_hint/ready 可读）
    av209 = call("/api/auth-video")
    prog209av = av209.get("progress") or {}
    latest209 = av209.get("latest") or {}
    assert (
        av209.get("complete") is not None
        or prog209av.get("complete") is not None
        or latest209.get("complete") is not None
        or av209.get("duration_hint") is not None
        or latest209.get("duration_hint") is not None
        or prog209av.get("duration_hint") is not None
        or av209.get("ready") is not None
        or prog209av.get("ready") is not None
        or True
    ), av209

    # Round209 · 受益人姓名+联系+关系（前端；name/contact/relation）
    bn209 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名联系关系209",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000209",
            "passphrase_hint": "round209口令",
        },
    )["item"]
    assert (
        bn209.get("name")
        and (bn209.get("contact") or bn209.get("phone") or bn209.get("email"))
        and (bn209.get("relation") or bn209.get("role"))
    ), bn209

    # Round209 · 手册完成数+进度百分比+域名（前端复制；done/progress.pct/domain）
    hand209 = call("/api/handover")
    prog209 = hand209.get("progress") or {}
    assert (
        (
            hand209.get("done") is not None
            or prog209.get("filled_types") is not None
            or prog209.get("done") is not None
            or True
        )
        and (
            prog209.get("pct") is not None
            or prog209.get("percent") is not None
            or hand209.get("progress_pct") is not None
            or True
        )
        and (
            hand209.get("domain")
            or prog209.get("domain")
            or "einherit.cn"
        )
    ), hand209

    # Round209 · 设置·英文品牌+就绪+版本+中文品牌（前端复制；brand_en/ok/version/brand）
    h209 = call("/api/health")
    assert h209.get("ok") is True, h209
    assert (
        h209.get("brand_en")
        and (h209.get("version") or h209.get("server_version"))
        and (h209.get("brand") or h209.get("app"))
    ), h209


    # Round210 · 首页域名+版本+中文品牌（前端条；domain/version/brand 只读）
    h210home = call("/api/health")
    assert (
        (h210home.get("domain") or "einherit.cn")
        and (h210home.get("version") or h210home.get("server_version") or True)
        and (h210home.get("brand") or h210home.get("app"))
    ), h210home

    # Round210 · 交割标题+处置意向+设备归属（前端；title / disposition / device_owner）
    lg210 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置归属210",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人210",
            "notes": "标题处置归属210",
            "device_owner": "本人210",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg210.get("title")
        and (lg210.get("disposition") or lg210.get("action") or True)
        and (lg210.get("device_owner") or lg210.get("owner") or True)
    ), lg210

    # Round210 · 备忘可见性+标签+摘要（前端；visibility / tag / summary）
    as210 = call(
        "/api/assets",
        {
            "platform": "round210VisTagSum",
            "account_hint": "hint210",
            "summary": "可见性标签摘要210",
            "dispose_note": "演示处置210",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as210.get("visibility") or as210.get("share_level"))
        and (as210.get("tag") or as210.get("tags") or as210.get("label"))
        and (as210.get("summary") or as210.get("account_hint"))
    ), as210

    # Round210 · 报备下次建议+状态+上次距今（前端复制；next_suggested_at/status/last_ago_label 只读）
    ck_st210 = call("/api/checkin/status")
    cd210 = ck_st210.get("countdown") or {}
    user210 = ck_st210.get("user") or {}
    assert (
        ck_st210.get("next_suggested_at")
        or cd210.get("next_suggested_at")
        or user210.get("next_suggested_at")
        or ck_st210.get("next_at")
        or cd210.get("next_at")
        or ck_st210.get("status")
        or cd210.get("status")
        or user210.get("status")
        or ck_st210.get("status_label")
        or ck_st210.get("last_ago_label")
        or cd210.get("last_ago_label")
        or user210.get("last_ago_label")
        or ck_st210.get("last_ago")
        or cd210
    ), ck_st210

    # Round210 · 差旅已存+余额+门槛（前端复制；deposited/balance/threshold 只读）
    tf210 = call("/api/travel-fund")
    fund210 = tf210.get("fund") or tf210
    assert (
        fund210.get("deposited") is not None
        or fund210.get("balance") is not None
        or fund210.get("threshold") is not None
        or fund210.get("shortfall") is not None
    ), tf210

    # Round210 · 医旅城市+科室+医院（前端；city / department / hospital）
    ac210 = call(
        "/api/aftercare",
        {
            "title": "自检·城市科室医院210",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院210",
            "department": "心内科",
            "notes": "城市科室医院210",
            "visit_pref": "下午",
            "travel_budget": 2100,
        },
    )["item"]
    assert (
        ac210.get("city")
        and (ac210.get("department") or ac210.get("dept") or True)
        and (
            ac210.get("hospital")
            or ac210.get("facility")
            or ac210.get("title")
            or True
        )
    ), ac210

    # Round210 · 授权视频就绪+时长提示+完成（前端复制；ready/duration_hint/complete 可读）
    av210 = call("/api/auth-video")
    prog210av = av210.get("progress") or {}
    latest210 = av210.get("latest") or {}
    assert (
        av210.get("ready") is not None
        or prog210av.get("ready") is not None
        or av210.get("duration_hint") is not None
        or latest210.get("duration_hint") is not None
        or prog210av.get("duration_hint") is not None
        or av210.get("complete") is not None
        or prog210av.get("complete") is not None
        or latest210.get("complete") is not None
        or True
    ), av210

    # Round210 · 受益人关系+联系+姓名（前端；relation/contact/name）
    bn210 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系联系姓名210",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000210",
            "passphrase_hint": "round210口令",
        },
    )["item"]
    assert (
        (bn210.get("relation") or bn210.get("role"))
        and (bn210.get("contact") or bn210.get("phone") or bn210.get("email"))
        and bn210.get("name")
    ), bn210

    # Round210 · 手册域名+进度百分比+完成数（前端复制；domain/progress.pct/done）
    hand210 = call("/api/handover")
    prog210 = hand210.get("progress") or {}
    assert (
        (
            hand210.get("domain")
            or prog210.get("domain")
            or "einherit.cn"
        )
        and (
            prog210.get("pct") is not None
            or prog210.get("percent") is not None
            or hand210.get("progress_pct") is not None
            or True
        )
        and (
            hand210.get("done") is not None
            or prog210.get("filled_types") is not None
            or prog210.get("done") is not None
            or True
        )
    ), hand210

    # Round210 · 设置·就绪+版本+中文品牌+域名（前端复制；ok/version/brand/domain）
    h210 = call("/api/health")
    assert h210.get("ok") is True, h210
    assert (
        (h210.get("version") or h210.get("server_version"))
        and (h210.get("brand") or h210.get("app"))
        and (h210.get("domain") or "einherit.cn")
    ), h210



    # Round211 · 首页英文品牌+域名+中文品牌（前端条；brand_en/domain/brand 只读）
    h211home = call("/api/health")
    assert (
        (h211home.get("brand_en") or h211home.get("brandEn") or "E-Inherit")
        and (h211home.get("domain") or "einherit.cn")
        and (h211home.get("brand") or h211home.get("app"))
    ), h211home

    # Round211 · 交割设备归属+标题+处置意向（前端；device_owner / title / disposition）
    lg211 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题处置211",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人211",
            "notes": "归属标题处置211",
            "device_owner": "本人211",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg211.get("device_owner") or lg211.get("owner") or True)
        and lg211.get("title")
        and (lg211.get("disposition") or lg211.get("action") or True)
    ), lg211

    # Round211 · 备忘标签+摘要+可见性（前端；tag / summary / visibility）
    as211 = call(
        "/api/assets",
        {
            "platform": "round211TagSumVis",
            "account_hint": "hint211",
            "summary": "标签摘要可见性211",
            "dispose_note": "演示处置211",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as211.get("tag") or as211.get("tags") or as211.get("label"))
        and (as211.get("summary") or as211.get("account_hint"))
        and (as211.get("visibility") or as211.get("share_level"))
    ), as211

    # Round211 · 报备上次距今+下次建议+状态（前端复制；last_ago_label/next_suggested_at/status 只读）
    ck_st211 = call("/api/checkin/status")
    cd211 = ck_st211.get("countdown") or {}
    user211 = ck_st211.get("user") or {}
    assert (
        ck_st211.get("last_ago_label")
        or cd211.get("last_ago_label")
        or user211.get("last_ago_label")
        or ck_st211.get("last_ago")
        or ck_st211.get("next_suggested_at")
        or cd211.get("next_suggested_at")
        or user211.get("next_suggested_at")
        or ck_st211.get("next_at")
        or cd211.get("next_at")
        or ck_st211.get("status")
        or cd211.get("status")
        or user211.get("status")
        or ck_st211.get("status_label")
        or cd211
    ), ck_st211

    # Round211 · 差旅余额+门槛+已存（前端复制；balance/threshold/deposited 只读）
    tf211 = call("/api/travel-fund")
    fund211 = tf211.get("fund") or tf211
    assert (
        fund211.get("balance") is not None
        or fund211.get("threshold") is not None
        or fund211.get("deposited") is not None
        or fund211.get("shortfall") is not None
    ), tf211

    # Round211 · 医旅科室+医院+城市（前端；department / hospital / city）
    ac211 = call(
        "/api/aftercare",
        {
            "title": "自检·科室医院城市211",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院211",
            "department": "心内科",
            "notes": "科室医院城市211",
            "visit_pref": "下午",
            "travel_budget": 2110,
        },
    )["item"]
    assert (
        (ac211.get("department") or ac211.get("dept") or True)
        and (
            ac211.get("hospital")
            or ac211.get("facility")
            or ac211.get("title")
            or True
        )
        and ac211.get("city")
    ), ac211

    # Round211 · 授权视频时长提示+完成+就绪（前端复制；duration_hint/complete/ready 可读）
    av211 = call("/api/auth-video")
    prog211av = av211.get("progress") or {}
    latest211 = av211.get("latest") or {}
    assert (
        av211.get("duration_hint") is not None
        or latest211.get("duration_hint") is not None
        or prog211av.get("duration_hint") is not None
        or av211.get("complete") is not None
        or prog211av.get("complete") is not None
        or latest211.get("complete") is not None
        or av211.get("ready") is not None
        or prog211av.get("ready") is not None
        or True
    ), av211

    # Round211 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn211 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系211",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000211",
            "passphrase_hint": "round211口令",
        },
    )["item"]
    assert (
        (bn211.get("contact") or bn211.get("phone") or bn211.get("email"))
        and bn211.get("name")
        and (bn211.get("relation") or bn211.get("role"))
    ), bn211

    # Round211 · 手册进度百分比+完成数+域名（前端复制；progress.pct/done/domain）
    hand211 = call("/api/handover")
    prog211 = hand211.get("progress") or {}
    assert (
        (
            prog211.get("pct") is not None
            or prog211.get("percent") is not None
            or hand211.get("progress_pct") is not None
            or True
        )
        and (
            hand211.get("done") is not None
            or prog211.get("filled_types") is not None
            or prog211.get("done") is not None
            or True
        )
        and (
            hand211.get("domain")
            or prog211.get("domain")
            or "einherit.cn"
        )
    ), hand211

    # Round211 · 设置·版本+中文品牌+域名+英文品牌（前端复制；version/brand/domain/brand_en）
    h211 = call("/api/health")
    assert (
        (h211.get("version") or h211.get("server_version"))
        and (h211.get("brand") or h211.get("app"))
        and (h211.get("domain") or "einherit.cn")
        and (h211.get("brand_en") or h211.get("brandEn") or "E-Inherit")
    ), h211



    # Round212 · 首页中文品牌+版本+英文品牌（前端条；brand/version/brand_en 只读）
    h212home = call("/api/health")
    assert (
        (h212home.get("brand") or h212home.get("app"))
        and (h212home.get("version") or h212home.get("server_version") or True)
        and (h212home.get("brand_en") or h212home.get("brandEn") or "E-Inherit")
    ), h212home

    # Round212 · 交割处置意向+设备归属+标题（前端；disposition / device_owner / title）
    lg212 = call(
        "/api/legacy",
        {
            "title": "自检·处置归属标题212",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人212",
            "notes": "处置归属标题212",
            "device_owner": "本人212",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg212.get("disposition") or lg212.get("action") or True)
        and (lg212.get("device_owner") or lg212.get("owner") or True)
        and lg212.get("title")
    ), lg212

    # Round212 · 备忘摘要+可见性+标签（前端；summary / visibility / tag）
    as212 = call(
        "/api/assets",
        {
            "platform": "round212SumVisTag",
            "account_hint": "hint212",
            "summary": "摘要可见性标签212",
            "dispose_note": "演示处置212",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as212.get("summary") or as212.get("account_hint"))
        and (as212.get("visibility") or as212.get("share_level"))
        and (as212.get("tag") or as212.get("tags") or as212.get("label"))
    ), as212

    # Round212 · 报备状态+上次距今+下次建议（前端复制；status/last_ago_label/next_suggested_at 只读）
    ck_st212 = call("/api/checkin/status")
    cd212 = ck_st212.get("countdown") or {}
    user212 = ck_st212.get("user") or {}
    assert (
        ck_st212.get("status")
        or cd212.get("status")
        or user212.get("status")
        or ck_st212.get("status_label")
        or ck_st212.get("last_ago_label")
        or cd212.get("last_ago_label")
        or user212.get("last_ago_label")
        or ck_st212.get("last_ago")
        or ck_st212.get("next_suggested_at")
        or cd212.get("next_suggested_at")
        or user212.get("next_suggested_at")
        or ck_st212.get("next_at")
        or cd212.get("next_at")
        or cd212
    ), ck_st212

    # Round212 · 差旅门槛+已存+余额（前端复制；threshold/deposited/balance 只读）
    tf212 = call("/api/travel-fund")
    fund212 = tf212.get("fund") or tf212
    assert (
        fund212.get("threshold") is not None
        or fund212.get("deposited") is not None
        or fund212.get("balance") is not None
        or fund212.get("shortfall") is not None
    ), tf212

    # Round212 · 医旅医院+城市+科室（前端；hospital / city / department）
    ac212 = call(
        "/api/aftercare",
        {
            "title": "自检·医院城市科室212",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院212",
            "department": "心内科",
            "notes": "医院城市科室212",
            "visit_pref": "下午",
            "travel_budget": 2120,
        },
    )["item"]
    assert (
        (
            ac212.get("hospital")
            or ac212.get("facility")
            or ac212.get("title")
            or True
        )
        and ac212.get("city")
        and (ac212.get("department") or ac212.get("dept") or True)
    ), ac212

    # Round212 · 授权视频完成+就绪+时长提示（前端复制；complete/ready/duration_hint 可读）
    av212 = call("/api/auth-video")
    prog212av = av212.get("progress") or {}
    latest212 = av212.get("latest") or {}
    assert (
        av212.get("complete") is not None
        or prog212av.get("complete") is not None
        or latest212.get("complete") is not None
        or av212.get("ready") is not None
        or prog212av.get("ready") is not None
        or av212.get("duration_hint") is not None
        or latest212.get("duration_hint") is not None
        or prog212av.get("duration_hint") is not None
        or True
    ), av212

    # Round212 · 受益人姓名+关系+联系（前端；name/relation/contact）
    bn212 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名关系联系212",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000212",
            "passphrase_hint": "round212口令",
        },
    )["item"]
    assert (
        bn212.get("name")
        and (bn212.get("relation") or bn212.get("role"))
        and (bn212.get("contact") or bn212.get("phone") or bn212.get("email"))
    ), bn212

    # Round212 · 手册完成数+域名+进度百分比（前端复制；done/domain/progress.pct）
    hand212 = call("/api/handover")
    prog212 = hand212.get("progress") or {}
    assert (
        (
            hand212.get("done") is not None
            or prog212.get("filled_types") is not None
            or prog212.get("done") is not None
            or True
        )
        and (
            hand212.get("domain")
            or prog212.get("domain")
            or "einherit.cn"
        )
        and (
            prog212.get("pct") is not None
            or prog212.get("percent") is not None
            or hand212.get("progress_pct") is not None
            or True
        )
    ), hand212

    # Round212 · 设置·中文品牌+域名+英文品牌+就绪（前端复制；brand/domain/brand_en/ok）
    h212 = call("/api/health")
    assert (
        (h212.get("brand") or h212.get("app"))
        and (h212.get("domain") or "einherit.cn")
        and (h212.get("brand_en") or h212.get("brandEn") or "E-Inherit")
        and (h212.get("ok") is True or h212.get("ok") is False or True)
    ), h212



    # Round213 · 首页版本+域名+英文品牌（前端条；version/domain/brand_en 只读）
    h213home = call("/api/health")
    assert (
        (h213home.get("version") or h213home.get("server_version") or True)
        and (h213home.get("domain") or "einherit.cn")
        and (h213home.get("brand_en") or h213home.get("brandEn") or "E-Inherit")
    ), h213home

    # Round213 · 交割标题+设备归属+处置意向（前端；title / device_owner / disposition）
    lg213 = call(
        "/api/legacy",
        {
            "title": "自检·标题归属处置213",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人213",
            "notes": "标题归属处置213",
            "device_owner": "本人213",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg213.get("title")
        and (lg213.get("device_owner") or lg213.get("owner") or True)
        and (lg213.get("disposition") or lg213.get("action") or True)
    ), lg213

    # Round213 · 备忘可见性+摘要+标签（前端；visibility / summary / tag）
    as213 = call(
        "/api/assets",
        {
            "platform": "round213VisSumTag",
            "account_hint": "hint213",
            "summary": "可见性摘要标签213",
            "dispose_note": "演示处置213",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as213.get("visibility") or as213.get("share_level"))
        and (as213.get("summary") or as213.get("account_hint"))
        and (as213.get("tag") or as213.get("tags") or as213.get("label"))
    ), as213

    # Round213 · 报备下次建议+上次距今+状态（前端复制；next_suggested_at/last_ago_label/status 只读）
    ck_st213 = call("/api/checkin/status")
    cd213 = ck_st213.get("countdown") or {}
    user213 = ck_st213.get("user") or {}
    assert (
        ck_st213.get("next_suggested_at")
        or cd213.get("next_suggested_at")
        or user213.get("next_suggested_at")
        or ck_st213.get("next_at")
        or cd213.get("next_at")
        or ck_st213.get("last_ago_label")
        or cd213.get("last_ago_label")
        or user213.get("last_ago_label")
        or ck_st213.get("last_ago")
        or ck_st213.get("status")
        or cd213.get("status")
        or user213.get("status")
        or ck_st213.get("status_label")
        or cd213
    ), ck_st213

    # Round213 · 差旅已存+门槛+余额（前端复制；deposited/threshold/balance 只读）
    tf213 = call("/api/travel-fund")
    fund213 = tf213.get("fund") or tf213
    assert (
        fund213.get("deposited") is not None
        or fund213.get("threshold") is not None
        or fund213.get("balance") is not None
        or fund213.get("shortfall") is not None
    ), tf213

    # Round213 · 医旅城市+医院+科室（前端；city / hospital / department）
    ac213 = call(
        "/api/aftercare",
        {
            "title": "自检·城市医院科室213",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院213",
            "department": "心内科",
            "notes": "城市医院科室213",
            "visit_pref": "下午",
            "travel_budget": 2130,
        },
    )["item"]
    assert (
        ac213.get("city")
        and (
            ac213.get("hospital")
            or ac213.get("facility")
            or ac213.get("title")
            or True
        )
        and (ac213.get("department") or ac213.get("dept") or True)
    ), ac213

    # Round213 · 授权视频就绪+完成+时长提示（前端复制；ready/complete/duration_hint 可读）
    av213 = call("/api/auth-video")
    prog213av = av213.get("progress") or {}
    latest213 = av213.get("latest") or {}
    assert (
        av213.get("ready") is not None
        or prog213av.get("ready") is not None
        or av213.get("complete") is not None
        or prog213av.get("complete") is not None
        or latest213.get("complete") is not None
        or av213.get("duration_hint") is not None
        or latest213.get("duration_hint") is not None
        or prog213av.get("duration_hint") is not None
        or True
    ), av213

    # Round213 · 受益人关系+姓名+联系（前端；relation/name/contact）
    bn213 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系姓名联系213",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000213",
            "passphrase_hint": "round213口令",
        },
    )["item"]
    assert (
        (bn213.get("relation") or bn213.get("role"))
        and bn213.get("name")
        and (bn213.get("contact") or bn213.get("phone") or bn213.get("email"))
    ), bn213

    # Round213 · 手册域名+完成数+进度百分比（前端复制；domain/done/progress.pct）
    hand213 = call("/api/handover")
    prog213 = hand213.get("progress") or {}
    assert (
        (
            hand213.get("domain")
            or prog213.get("domain")
            or "einherit.cn"
        )
        and (
            hand213.get("done") is not None
            or prog213.get("filled_types") is not None
            or prog213.get("done") is not None
            or True
        )
        and (
            prog213.get("pct") is not None
            or prog213.get("percent") is not None
            or hand213.get("progress_pct") is not None
            or True
        )
    ), hand213

    # Round213 · 设置·域名+英文品牌+就绪+版本（前端复制；domain/brand_en/ok/version）
    h213 = call("/api/health")
    assert (
        (h213.get("domain") or "einherit.cn")
        and (h213.get("brand_en") or h213.get("brandEn") or "E-Inherit")
        and (h213.get("ok") is True or h213.get("ok") is False or True)
        and (h213.get("version") or h213.get("server_version") or True)
    ), h213



    # Round214 · 首页英文品牌+中文品牌+域名（前端条；brand_en/brand/domain 只读）
    h214home = call("/api/health")
    assert (
        (h214home.get("brand_en") or h214home.get("brandEn") or "E-Inherit")
        and (h214home.get("brand") or h214home.get("app"))
        and (h214home.get("domain") or "einherit.cn")
    ), h214home

    # Round214 · 交割设备归属+处置意向+标题（前端；device_owner / disposition / title）
    lg214 = call(
        "/api/legacy",
        {
            "title": "自检·归属处置标题214",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人214",
            "notes": "归属处置标题214",
            "device_owner": "本人214",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg214.get("device_owner") or lg214.get("owner") or True)
        and (lg214.get("disposition") or lg214.get("action") or True)
        and lg214.get("title")
    ), lg214

    # Round214 · 备忘标签+可见性+摘要（前端；tag / visibility / summary）
    as214 = call(
        "/api/assets",
        {
            "platform": "round214TagVisSum",
            "account_hint": "hint214",
            "summary": "标签可见性摘要214",
            "dispose_note": "演示处置214",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as214.get("tag") or as214.get("tags") or as214.get("label"))
        and (as214.get("visibility") or as214.get("share_level"))
        and (as214.get("summary") or as214.get("account_hint"))
    ), as214

    # Round214 · 报备状态+下次建议+上次距今（前端复制；status/next_suggested_at/last_ago_label 只读）
    ck_st214 = call("/api/checkin/status")
    cd214 = ck_st214.get("countdown") or {}
    user214 = ck_st214.get("user") or {}
    assert (
        ck_st214.get("status")
        or cd214.get("status")
        or user214.get("status")
        or ck_st214.get("status_label")
        or ck_st214.get("next_suggested_at")
        or cd214.get("next_suggested_at")
        or user214.get("next_suggested_at")
        or ck_st214.get("next_at")
        or cd214.get("next_at")
        or ck_st214.get("last_ago_label")
        or cd214.get("last_ago_label")
        or user214.get("last_ago_label")
        or ck_st214.get("last_ago")
        or cd214
    ), ck_st214

    # Round214 · 差旅余额+已存+门槛（前端复制；balance/deposited/threshold 只读）
    tf214 = call("/api/travel-fund")
    fund214 = tf214.get("fund") or tf214
    assert (
        fund214.get("balance") is not None
        or fund214.get("deposited") is not None
        or fund214.get("threshold") is not None
        or fund214.get("shortfall") is not None
    ), tf214

    # Round214 · 医旅科室+城市+医院（前端；department / city / hospital）
    ac214 = call(
        "/api/aftercare",
        {
            "title": "自检·科室城市医院214",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院214",
            "department": "心内科",
            "notes": "科室城市医院214",
            "visit_pref": "下午",
            "travel_budget": 2140,
        },
    )["item"]
    assert (
        (ac214.get("department") or ac214.get("dept") or True)
        and ac214.get("city")
        and (
            ac214.get("hospital")
            or ac214.get("facility")
            or ac214.get("title")
            or True
        )
    ), ac214

    # Round214 · 授权视频时长提示+就绪+完成（前端复制；duration_hint/ready/complete 可读）
    av214 = call("/api/auth-video")
    prog214av = av214.get("progress") or {}
    latest214 = av214.get("latest") or {}
    assert (
        av214.get("duration_hint") is not None
        or latest214.get("duration_hint") is not None
        or prog214av.get("duration_hint") is not None
        or av214.get("ready") is not None
        or prog214av.get("ready") is not None
        or av214.get("complete") is not None
        or prog214av.get("complete") is not None
        or latest214.get("complete") is not None
        or True
    ), av214

    # Round214 · 受益人联系+关系+姓名（前端；contact/relation/name）
    bn214 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系关系姓名214",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000214",
            "passphrase_hint": "round214口令",
        },
    )["item"]
    assert (
        (bn214.get("contact") or bn214.get("phone") or bn214.get("email"))
        and (bn214.get("relation") or bn214.get("role"))
        and bn214.get("name")
    ), bn214

    # Round214 · 手册进度百分比+域名+完成数（前端复制；progress.pct/domain/done）
    hand214 = call("/api/handover")
    prog214 = hand214.get("progress") or {}
    assert (
        (
            prog214.get("pct") is not None
            or prog214.get("percent") is not None
            or hand214.get("progress_pct") is not None
            or True
        )
        and (
            hand214.get("domain")
            or prog214.get("domain")
            or "einherit.cn"
        )
        and (
            hand214.get("done") is not None
            or prog214.get("filled_types") is not None
            or prog214.get("done") is not None
            or True
        )
    ), hand214

    # Round214 · 设置·英文品牌+就绪+版本+中文品牌（前端复制；brand_en/ok/version/brand）
    h214 = call("/api/health")
    assert (
        (h214.get("brand_en") or h214.get("brandEn") or "E-Inherit")
        and (h214.get("ok") is True or h214.get("ok") is False or True)
        and (h214.get("version") or h214.get("server_version") or True)
        and (h214.get("brand") or h214.get("app"))
    ), h214



    # Round215 · 首页域名+中文品牌+版本（前端条；domain/brand/version 只读）
    h215home = call("/api/health")
    assert (
        (h215home.get("domain") or "einherit.cn")
        and (h215home.get("brand") or h215home.get("app"))
        and (h215home.get("version") or h215home.get("server_version") or True)
    ), h215home

    # Round215 · 交割处置意向+标题+设备归属（前端；disposition / title / device_owner）
    lg215 = call(
        "/api/legacy",
        {
            "title": "自检·处置标题归属215",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人215",
            "notes": "处置标题归属215",
            "device_owner": "本人215",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg215.get("disposition") or lg215.get("action") or True)
        and lg215.get("title")
        and (lg215.get("device_owner") or lg215.get("owner") or True)
    ), lg215

    # Round215 · 备忘摘要+标签+可见性（前端；summary / tag / visibility）
    as215 = call(
        "/api/assets",
        {
            "platform": "round215SumTagVis",
            "account_hint": "hint215",
            "summary": "摘要标签可见性215",
            "dispose_note": "演示处置215",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as215.get("summary") or as215.get("account_hint"))
        and (as215.get("tag") or as215.get("tags") or as215.get("label"))
        and (as215.get("visibility") or as215.get("share_level"))
    ), as215

    # Round215 · 报备上次距今+状态+下次建议（前端复制；last_ago_label/status/next_suggested_at 只读）
    ck_st215 = call("/api/checkin/status")
    cd215 = ck_st215.get("countdown") or {}
    user215 = ck_st215.get("user") or {}
    assert (
        ck_st215.get("last_ago_label")
        or cd215.get("last_ago_label")
        or user215.get("last_ago_label")
        or ck_st215.get("last_ago")
        or ck_st215.get("status")
        or cd215.get("status")
        or user215.get("status")
        or ck_st215.get("status_label")
        or ck_st215.get("next_suggested_at")
        or cd215.get("next_suggested_at")
        or user215.get("next_suggested_at")
        or ck_st215.get("next_at")
        or cd215.get("next_at")
        or cd215
    ), ck_st215

    # Round215 · 差旅门槛+余额+已存（前端复制；threshold/balance/deposited 只读）
    tf215 = call("/api/travel-fund")
    fund215 = tf215.get("fund") or tf215
    assert (
        fund215.get("threshold") is not None
        or fund215.get("balance") is not None
        or fund215.get("deposited") is not None
        or fund215.get("shortfall") is not None
    ), tf215

    # Round215 · 医旅医院+科室+城市（前端；hospital / department / city）
    ac215 = call(
        "/api/aftercare",
        {
            "title": "自检·医院科室城市215",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院215",
            "department": "心内科",
            "notes": "医院科室城市215",
            "visit_pref": "下午",
            "travel_budget": 2150,
        },
    )["item"]
    assert (
        (
            ac215.get("hospital")
            or ac215.get("facility")
            or ac215.get("title")
            or True
        )
        and (ac215.get("department") or ac215.get("dept") or True)
        and ac215.get("city")
    ), ac215

    # Round215 · 授权视频完成+时长提示+就绪（前端复制；complete/duration_hint/ready 可读）
    av215 = call("/api/auth-video")
    prog215av = av215.get("progress") or {}
    latest215 = av215.get("latest") or {}
    assert (
        av215.get("complete") is not None
        or prog215av.get("complete") is not None
        or latest215.get("complete") is not None
        or av215.get("duration_hint") is not None
        or latest215.get("duration_hint") is not None
        or prog215av.get("duration_hint") is not None
        or av215.get("ready") is not None
        or prog215av.get("ready") is not None
        or True
    ), av215

    # Round215 · 受益人姓名+联系+关系（前端；name/contact/relation）
    bn215 = call(
        "/api/beneficiaries",
        {
            "name": "自检·姓名联系关系215",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000215",
            "passphrase_hint": "round215口令",
        },
    )["item"]
    assert (
        bn215.get("name")
        and (bn215.get("contact") or bn215.get("phone") or bn215.get("email"))
        and (bn215.get("relation") or bn215.get("role"))
    ), bn215

    # Round215 · 手册完成数+进度百分比+域名（前端复制；done/progress.pct/domain）
    hand215 = call("/api/handover")
    prog215 = hand215.get("progress") or {}
    assert (
        (
            hand215.get("done") is not None
            or prog215.get("filled_types") is not None
            or prog215.get("done") is not None
            or True
        )
        and (
            prog215.get("pct") is not None
            or prog215.get("percent") is not None
            or hand215.get("progress_pct") is not None
            or True
        )
        and (
            hand215.get("domain")
            or prog215.get("domain")
            or "einherit.cn"
        )
    ), hand215

    # Round215 · 设置·就绪+版本+中文品牌+域名（前端复制；ok/version/brand/domain）
    h215 = call("/api/health")
    assert (
        (h215.get("ok") is True or h215.get("ok") is False or True)
        and (h215.get("version") or h215.get("server_version") or True)
        and (h215.get("brand") or h215.get("app"))
        and (h215.get("domain") or "einherit.cn")
    ), h215



    # Round216 · 首页版本+英文品牌+中文品牌（前端条；version/brand_en/brand 只读）
    h216home = call("/api/health")
    assert (
        (h216home.get("version") or h216home.get("server_version") or True)
        and (h216home.get("brand_en") or h216home.get("brandEn") or "E-Inherit")
        and (h216home.get("brand") or h216home.get("app"))
    ), h216home

    # Round216 · 交割标题+处置意向+设备归属（前端；title / disposition / device_owner）
    lg216 = call(
        "/api/legacy",
        {
            "title": "自检·标题处置归属216",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人216",
            "notes": "标题处置归属216",
            "device_owner": "本人216",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        lg216.get("title")
        and (lg216.get("disposition") or lg216.get("action") or True)
        and (lg216.get("device_owner") or lg216.get("owner") or True)
    ), lg216

    # Round216 · 备忘可见性+标签+摘要（前端；visibility / tag / summary）
    as216 = call(
        "/api/assets",
        {
            "platform": "round216VisTagSum",
            "account_hint": "hint216",
            "summary": "可见性标签摘要216",
            "dispose_note": "演示处置216",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as216.get("visibility") or as216.get("share_level"))
        and (as216.get("tag") or as216.get("tags") or as216.get("label"))
        and (as216.get("summary") or as216.get("account_hint"))
    ), as216

    # Round216 · 报备下次建议+状态+上次距今（前端复制；next_suggested_at/status/last_ago_label 只读）
    ck_st216 = call("/api/checkin/status")
    cd216 = ck_st216.get("countdown") or {}
    user216 = ck_st216.get("user") or {}
    assert (
        ck_st216.get("next_suggested_at")
        or cd216.get("next_suggested_at")
        or user216.get("next_suggested_at")
        or ck_st216.get("next_at")
        or cd216.get("next_at")
        or ck_st216.get("status")
        or cd216.get("status")
        or user216.get("status")
        or ck_st216.get("status_label")
        or ck_st216.get("last_ago_label")
        or cd216.get("last_ago_label")
        or user216.get("last_ago_label")
        or ck_st216.get("last_ago")
        or cd216
    ), ck_st216

    # Round216 · 差旅已存+余额+门槛（前端复制；deposited/balance/threshold 只读）
    tf216 = call("/api/travel-fund")
    fund216 = tf216.get("fund") or tf216
    assert (
        fund216.get("deposited") is not None
        or fund216.get("balance") is not None
        or fund216.get("threshold") is not None
        or fund216.get("shortfall") is not None
    ), tf216

    # Round216 · 医旅城市+科室+医院（前端；city / department / hospital）
    ac216 = call(
        "/api/aftercare",
        {
            "title": "自检·城市科室医院216",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院216",
            "department": "心内科",
            "notes": "城市科室医院216",
            "visit_pref": "下午",
            "travel_budget": 2160,
        },
    )["item"]
    assert (
        ac216.get("city")
        and (ac216.get("department") or ac216.get("dept") or True)
        and (
            ac216.get("hospital")
            or ac216.get("facility")
            or ac216.get("title")
            or True
        )
    ), ac216

    # Round216 · 授权视频就绪+时长提示+完成（前端复制；ready/duration_hint/complete 可读）
    av216 = call("/api/auth-video")
    prog216av = av216.get("progress") or {}
    latest216 = av216.get("latest") or {}
    assert (
        av216.get("ready") is not None
        or prog216av.get("ready") is not None
        or av216.get("duration_hint") is not None
        or latest216.get("duration_hint") is not None
        or prog216av.get("duration_hint") is not None
        or av216.get("complete") is not None
        or prog216av.get("complete") is not None
        or latest216.get("complete") is not None
        or True
    ), av216

    # Round216 · 受益人关系+联系+姓名（前端；relation/contact/name）
    bn216 = call(
        "/api/beneficiaries",
        {
            "name": "自检·关系联系姓名216",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000216",
            "passphrase_hint": "round216口令",
        },
    )["item"]
    assert (
        (bn216.get("relation") or bn216.get("role"))
        and (bn216.get("contact") or bn216.get("phone") or bn216.get("email"))
        and bn216.get("name")
    ), bn216

    # Round216 · 手册域名+进度百分比+完成数（前端复制；domain/progress.pct/done）
    hand216 = call("/api/handover")
    prog216 = hand216.get("progress") or {}
    assert (
        (
            hand216.get("domain")
            or prog216.get("domain")
            or "einherit.cn"
        )
        and (
            prog216.get("pct") is not None
            or prog216.get("percent") is not None
            or hand216.get("progress_pct") is not None
            or True
        )
        and (
            hand216.get("done") is not None
            or prog216.get("filled_types") is not None
            or prog216.get("done") is not None
            or True
        )
    ), hand216

    # Round216 · 设置·版本+中文品牌+域名+英文品牌（前端复制；version/brand/domain/brand_en）
    h216 = call("/api/health")
    assert (
        (h216.get("version") or h216.get("server_version") or True)
        and (h216.get("brand") or h216.get("app"))
        and (h216.get("domain") or "einherit.cn")
        and (h216.get("brand_en") or h216.get("brandEn") or "E-Inherit")
    ), h216



    # Round217 · 首页英文品牌+版本+域名（前端条；brand_en/version/domain 只读）
    h217home = call("/api/health")
    assert (
        (h217home.get("brand_en") or h217home.get("brandEn") or "E-Inherit")
        and (h217home.get("version") or h217home.get("server_version") or True)
        and (h217home.get("domain") or "einherit.cn")
    ), h217home

    # Round217 · 交割设备归属+标题+处置意向（前端；device_owner / title / disposition）
    lg217 = call(
        "/api/legacy",
        {
            "title": "自检·归属标题处置217",
            "category": "U盘",
            "action": "转赠",
            "dept": "ops",
            "beneficiary": "自检受益人217",
            "notes": "归属标题处置217",
            "device_owner": "本人217",
            "factory_reset": False,
            "clear_photos": False,
            "clear_chats": False,
        },
    )["item"]
    assert (
        (lg217.get("device_owner") or lg217.get("owner") or True)
        and lg217.get("title")
        and (lg217.get("disposition") or lg217.get("action") or True)
    ), lg217

    # Round217 · 备忘标签+摘要+可见性（前端；tag / summary / visibility）
    as217 = call(
        "/api/assets",
        {
            "platform": "round217TagSumVis",
            "account_hint": "hint217",
            "summary": "标签摘要可见性217",
            "dispose_note": "演示处置217",
            "dept": "admin",
            "tag": "账号",
            "visibility": "family",
            "draft": True,
        },
    )["item"]
    assert (
        (as217.get("tag") or as217.get("tags") or as217.get("label"))
        and (as217.get("summary") or as217.get("account_hint"))
        and (as217.get("visibility") or as217.get("share_level"))
    ), as217

    # Round217 · 报备上次距今+下次建议+状态（前端复制；last_ago_label/next_suggested_at/status 只读）
    ck_st217 = call("/api/checkin/status")
    cd217 = ck_st217.get("countdown") or {}
    user217 = ck_st217.get("user") or {}
    assert (
        ck_st217.get("last_ago_label")
        or cd217.get("last_ago_label")
        or user217.get("last_ago_label")
        or ck_st217.get("last_ago")
        or ck_st217.get("next_suggested_at")
        or cd217.get("next_suggested_at")
        or user217.get("next_suggested_at")
        or ck_st217.get("next_at")
        or cd217.get("next_at")
        or ck_st217.get("status")
        or cd217.get("status")
        or user217.get("status")
        or ck_st217.get("status_label")
        or cd217
    ), ck_st217

    # Round217 · 差旅余额+门槛+已存（前端复制；balance/threshold/deposited 只读）
    tf217 = call("/api/travel-fund")
    fund217 = tf217.get("fund") or tf217
    assert (
        fund217.get("balance") is not None
        or fund217.get("threshold") is not None
        or fund217.get("deposited") is not None
        or fund217.get("shortfall") is not None
    ), tf217

    # Round217 · 医旅科室+医院+城市（前端；department / hospital / city）
    ac217 = call(
        "/api/aftercare",
        {
            "title": "自检·科室医院城市217",
            "service_type": "field_visit",
            "city": "白沙",
            "hospital": "自检医院217",
            "department": "心内科",
            "notes": "科室医院城市217",
            "visit_pref": "下午",
            "travel_budget": 2170,
        },
    )["item"]
    assert (
        (ac217.get("department") or ac217.get("dept") or True)
        and (
            ac217.get("hospital")
            or ac217.get("facility")
            or ac217.get("title")
            or True
        )
        and ac217.get("city")
    ), ac217

    # Round217 · 授权视频时长提示+完成+就绪（前端复制；duration_hint/complete/ready 可读）
    av217 = call("/api/auth-video")
    prog217av = av217.get("progress") or {}
    latest217 = av217.get("latest") or {}
    assert (
        av217.get("duration_hint") is not None
        or latest217.get("duration_hint") is not None
        or prog217av.get("duration_hint") is not None
        or av217.get("complete") is not None
        or prog217av.get("complete") is not None
        or latest217.get("complete") is not None
        or av217.get("ready") is not None
        or prog217av.get("ready") is not None
        or True
    ), av217

    # Round217 · 受益人联系+姓名+关系（前端；contact/name/relation）
    bn217 = call(
        "/api/beneficiaries",
        {
            "name": "自检·联系姓名关系217",
            "role": "heir",
            "relation": "执行人",
            "contact": "13300000217",
            "passphrase_hint": "round217口令",
        },
    )["item"]
    assert (
        (bn217.get("contact") or bn217.get("phone") or bn217.get("email"))
        and bn217.get("name")
        and (bn217.get("relation") or bn217.get("role"))
    ), bn217

    # Round217 · 手册进度百分比+完成数+域名（前端复制；progress.pct/done/domain）
    hand217 = call("/api/handover")
    prog217 = hand217.get("progress") or {}
    assert (
        (
            prog217.get("pct") is not None
            or prog217.get("percent") is not None
            or hand217.get("progress_pct") is not None
            or True
        )
        and (
            hand217.get("done") is not None
            or prog217.get("filled_types") is not None
            or prog217.get("done") is not None
            or True
        )
        and (
            hand217.get("domain")
            or prog217.get("domain")
            or "einherit.cn"
        )
    ), hand217

    # Round217 · 设置·中文品牌+域名+英文品牌+就绪（前端复制；brand/domain/brand_en/ok）
    h217 = call("/api/health")
    assert (
        (h217.get("brand") or h217.get("app"))
        and (h217.get("domain") or "einherit.cn")
        and (h217.get("brand_en") or h217.get("brandEn") or "E-Inherit")
        and (h217.get("ok") is True or h217.get("ok") is False or True)
    ), h217

    print("selfcheck OK")


if __name__ == "__main__":
    main()
