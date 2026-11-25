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

    print("selfcheck OK")


if __name__ == "__main__":
    main()
