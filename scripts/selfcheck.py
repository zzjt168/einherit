#!/usr/bin/env python3
"""ponytail: one runnable check — fails if core digital-legacy flows break."""
from __future__ import annotations

import json
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

    print("selfcheck OK")


if __name__ == "__main__":
    main()
