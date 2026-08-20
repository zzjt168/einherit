#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""电子继承 App E-Inherit · SQLite 存储层"""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "legacy.db"

DEPTS = [
    {"id": "production", "name": "生产部", "blurb": "日常运营与现金流", "examples": "工资卡、公积金、欠款、自媒体与订阅"},
    {"id": "finance", "name": "财务部", "blurb": "资金池与负债防火墙", "examples": "银行卡、投资、保险、贷款"},
    {"id": "ip", "name": "知识产权部", "blurb": "精神财富与文化载体", "examples": "云盘、日记、游戏号、人脉、遗言"},
    {"id": "admin", "name": "行政部", "blurb": "实体资产与数字钥匙", "examples": "手机平板、证件、2FA 恢复码"},
    {"id": "board", "name": "董事会", "blurb": "最高决策与继承触发", "examples": "执行人、分配决议、报备、医疗意愿"},
]

# 七宗罪 · 按危害程度排序（产品钉死，勿调换）
SEVEN_SINS = [
    {
        "rank": 1,
        "sin": "色欲",
        "en": "Lust",
        "harm": "冲动最易留下不可逆数字痕迹",
        "advice": "私密相册/小号定期清理；设备转赠前勾选「清除照片」；约会类账号只写处置指引，不存明文密码。",
        "dept": "admin",
    },
    {
        "rank": 2,
        "sin": "暴食",
        "en": "Gluttony",
        "harm": "过量消耗健康与现金流",
        "advice": "生产部记下医疗/保健订阅；医旅预留体检医院；差旅预存专款专用，勿挪作日常挥霍。",
        "dept": "production",
    },
    {
        "rank": 3,
        "sin": "贪婪",
        "en": "Greed",
        "harm": "高风险资产与负债失控",
        "advice": "财务部强制登记杠杆与钱包「存放位置」；完整私钥勿与账号清单一库存放。",
        "dept": "finance",
    },
    {
        "rank": 4,
        "sin": "懒惰",
        "en": "Sloth",
        "harm": "不报备、不更新导致交割失败",
        "advice": "会员期内坚持生存报备；资产备忘每季度复习一次；董事会指定执行人不可空。",
        "dept": "board",
    },
    {
        "rank": 5,
        "sin": "暴怒",
        "en": "Wrath",
        "harm": "冲动删除或公开对骂留证",
        "advice": "社交账号默认「销毁」而非公开告别；聊天记录可选加密封存给律师/执行人。",
        "dept": "ip",
    },
    {
        "rank": 6,
        "sin": "嫉妒",
        "en": "Envy",
        "harm": "人际比较导致错误转赠",
        "advice": "分配决议写清「给谁、不给谁」；大额转赠需执行人二次确认。",
        "dept": "board",
    },
    {
        "rank": 7,
        "sin": "傲慢",
        "en": "Pride",
        "harm": "以为「我没事」拒绝盘点",
        "advice": "把「个人公司化」当成年度经营动作；五部门未完成则交割手册不完整。",
        "dept": "board",
    },
]

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  member_until REAL DEFAULT 0,
  checkin_interval_hours REAL DEFAULT 24,
  last_checkin_at REAL DEFAULT 0,
  backup_contacts TEXT DEFAULT '[]',
  escalation_state TEXT DEFAULT 'ok',
  executor_name TEXT DEFAULT '',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS legacy_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  beneficiary TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  dept TEXT DEFAULT 'admin',
  factory_reset INTEGER DEFAULT 0,
  clear_photos INTEGER DEFAULT 0,
  clear_chats INTEGER DEFAULT 0,
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  account_hint TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  dispose_note TEXT DEFAULT '',
  visibility TEXT DEFAULT 'private',
  dept TEXT DEFAULT 'finance',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS company_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  dept TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS self_guard_checks (
  user_id INTEGER NOT NULL,
  sin_rank INTEGER NOT NULL,
  checked INTEGER DEFAULT 0,
  note TEXT DEFAULT '',
  updated_at REAL NOT NULL,
  PRIMARY KEY (user_id, sin_rank)
);

CREATE TABLE IF NOT EXISTS hospitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  dept TEXT NOT NULL,
  tags TEXT DEFAULT '',
  intl INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS med_intents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  hospital_id INTEGER,
  note TEXT DEFAULT '',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS travel_fund (
  user_id INTEGER PRIMARY KEY,
  balance REAL DEFAULT 0,
  updated_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT DEFAULT '',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS call_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  target TEXT NOT NULL,
  result TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS aftercare_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  service_type TEXT NOT NULL,
  title TEXT NOT NULL,
  city TEXT DEFAULT '',
  visit_pref TEXT DEFAULT '',
  travel_budget REAL DEFAULT 0,
  coop_state TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'draft',
  notes TEXT DEFAULT '',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS executor_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at REAL NOT NULL
);
"""

# 急症前清册（ICU / 入院前）——对标病友真实场景
ICU_PACK = [
    {
        "title": "手机相册隐私清理",
        "category": "云盘相册",
        "action": "清除密码/照片",
        "dept": "admin",
        "factory_reset": 0,
        "clear_photos": 1,
        "clear_chats": 0,
        "notes": "急症前优先清相册；勿留明文约会类痕迹",
    },
    {
        "title": "即时通讯聊天记录",
        "category": "社交账号",
        "action": "清除密码/照片",
        "dept": "ip",
        "factory_reset": 0,
        "clear_photos": 0,
        "clear_chats": 1,
        "notes": "可销毁或加密封存给指定执行人，默认不公开告别",
    },
    {
        "title": "本机出厂重置预案",
        "category": "电子设备",
        "action": "销毁数据后转赠",
        "dept": "admin",
        "factory_reset": 1,
        "clear_photos": 1,
        "clear_chats": 1,
        "notes": "入院/ICU 前写清：交给谁、是否先清再交",
    },
    {
        "title": "虚拟资产处置指引",
        "category": "虚拟资产",
        "action": "销售变现",
        "dept": "finance",
        "factory_reset": 0,
        "clear_photos": 0,
        "clear_chats": 0,
        "notes": "只记位置指引，完整私钥勿明文同库",
    },
]

SEED_HOSPITALS = [
    ("北京协和医院", "中国", "北京", "综合/疑难", "三甲,国际医疗部", 1),
    ("上海交通大学医学院附属瑞金医院", "中国", "上海", "内分泌/血液", "三甲,国际患者", 1),
    ("武汉同济医院", "中国", "武汉", "肿瘤/移植", "三甲", 0),
    ("广州中山大学附属第一医院", "中国", "广州", "器官移植", "三甲", 1),
    ("梅奥诊所 Mayo Clinic", "美国", "罗切斯特", "综合疑难", "国际名院", 1),
    ("MD 安德森癌症中心", "美国", "休斯顿", "肿瘤", "癌症专科", 1),
    ("东京大学医学部附属病院", "日本", "东京", "综合", "国际患者", 1),
    ("新加坡国立大学医院", "新加坡", "新加坡", "综合", "英语友好", 1),
]


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_columns(conn: sqlite3.Connection) -> None:
    """轻量迁移：老库补列。"""
    specs = {
        "legacy_items": [
            ("dept", "TEXT DEFAULT 'admin'"),
            ("factory_reset", "INTEGER DEFAULT 0"),
            ("clear_photos", "INTEGER DEFAULT 0"),
            ("clear_chats", "INTEGER DEFAULT 0"),
        ],
        "assets": [("dept", "TEXT DEFAULT 'finance'")],
        "users": [("executor_name", "TEXT DEFAULT ''")],
    }
    for table, cols in specs.items():
        existing = {r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}
        for name, decl in cols:
            if name not in existing:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {decl}")


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)
        _ensure_columns(conn)
        row = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()
        if row["c"] == 0:
            now = time.time()
            contacts = json.dumps(
                [
                    {"name": "张女士", "relation": "配偶", "phone": "13800001111"},
                    {"name": "李先生", "relation": "子女", "phone": "13800002222"},
                ],
                ensure_ascii=False,
            )
            conn.execute(
                "INSERT INTO users (id, name, phone, member_until, checkin_interval_hours, "
                "last_checkin_at, backup_contacts, escalation_state, executor_name, created_at) "
                "VALUES (1, ?, ?, 0, 24, ?, ?, 'ok', ?, ?)",
                ("演示用户", "13900000000", now, contacts, "李先生", now),
            )
            conn.execute(
                "INSERT INTO travel_fund (user_id, balance, updated_at) VALUES (1, 0, ?)",
                (now,),
            )
            samples = [
                ("微信/朋友圈与聊天记录", "社交账号", "销毁", "", "ip", 0, 0, 1, "去世后申请注销，不转赠"),
                ("iPhone 15 Pro", "电子设备", "销毁数据后转赠", "子女·李先生", "admin", 1, 1, 1, "清相册与聊天后出厂重置再转赠"),
                ("某交易所小额资产", "虚拟资产", "销售变现", "配偶·张女士", "finance", 0, 0, 0, "变现后转入指定卡"),
            ]
            for title, cat, action, bene, dept, fr, cp, cc, notes in samples:
                conn.execute(
                    "INSERT INTO legacy_items (user_id, title, category, action, beneficiary, notes, "
                    "dept, factory_reset, clear_photos, clear_chats, created_at) "
                    "VALUES (1,?,?,?,?,?,?,?,?,?,?)",
                    (title, cat, action, bene, notes, dept, fr, cp, cc, now),
                )
            for platform, hint, summary, note, vis, dept in [
                ("网易云盘", "user***@mail.com", "约 120GB 家庭照片", "可转赠配偶", "family", "ip"),
                ("Steam", "demo_player", "游戏库，无现金", "销毁或闲置", "private", "ip"),
            ]:
                conn.execute(
                    "INSERT INTO assets (user_id, platform, account_hint, summary, dispose_note, visibility, dept, created_at) "
                    "VALUES (1,?,?,?,?,?,?,?)",
                    (platform, hint, summary, note, vis, dept, now),
                )
            for d in DEPTS:
                conn.execute(
                    "INSERT INTO company_notes (user_id, dept, title, body, created_at) VALUES (1,?,?,?,?)",
                    (d["id"], f"{d['name']}盘点草稿", f"示例：{d['examples']}", now),
                )
        h = conn.execute("SELECT COUNT(*) AS c FROM hospitals").fetchone()
        if h["c"] == 0:
            conn.executemany(
                "INSERT INTO hospitals (name, country, city, dept, tags, intl) VALUES (?,?,?,?,?,?)",
                SEED_HOSPITALS,
            )
        conn.commit()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {k: row[k] for k in row.keys()}


def get_user(user_id: int = 1) -> dict[str, Any]:
    with connect() as conn:
        u = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone())
    assert u is not None
    u["backup_contacts"] = json.loads(u["backup_contacts"] or "[]")
    u["is_member"] = bool(u["member_until"] and u["member_until"] > time.time())
    u["member_until_iso"] = (
        time.strftime("%Y-%m-%d", time.localtime(u["member_until"])) if u["member_until"] else None
    )
    interval = float(u["checkin_interval_hours"] or 24) * 3600
    due = float(u["last_checkin_at"] or 0) + interval
    u["checkin_due_at"] = due
    u["checkin_overdue"] = time.time() > due
    u["domain"] = "einherit.cn"
    u["brand"] = "电子继承 App"
    u["brand_en"] = "E-Inherit"
    return u


def update_user(user_id: int, **fields: Any) -> dict[str, Any]:
    if "backup_contacts" in fields and not isinstance(fields["backup_contacts"], str):
        fields["backup_contacts"] = json.dumps(fields["backup_contacts"], ensure_ascii=False)
    keys = ", ".join(f"{k}=?" for k in fields)
    vals = list(fields.values()) + [user_id]
    with connect() as conn:
        conn.execute(f"UPDATE users SET {keys} WHERE id=?", vals)
        conn.commit()
    return get_user(user_id)


def list_legacy(user_id: int = 1) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM legacy_items WHERE user_id=? ORDER BY id DESC", (user_id,)
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def add_legacy(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    now = time.time()
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO legacy_items (user_id, title, category, action, beneficiary, notes, "
            "dept, factory_reset, clear_photos, clear_chats, created_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (
                user_id,
                payload.get("title", "").strip() or "未命名条目",
                payload.get("category", "其他"),
                payload.get("action", "销毁"),
                payload.get("beneficiary", ""),
                payload.get("notes", ""),
                payload.get("dept", "admin"),
                1 if payload.get("factory_reset") else 0,
                1 if payload.get("clear_photos") else 0,
                1 if payload.get("clear_chats") else 0,
                now,
            ),
        )
        conn.commit()
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM legacy_items WHERE id=?", (rid,)).fetchone()
    return row_to_dict(row)  # type: ignore[return-value]


def list_assets(user_id: int = 1) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM assets WHERE user_id=? ORDER BY id DESC", (user_id,)
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def add_asset(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    now = time.time()
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO assets (user_id, platform, account_hint, summary, dispose_note, visibility, dept, created_at) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (
                user_id,
                payload.get("platform", "").strip() or "未命名平台",
                payload.get("account_hint", ""),
                payload.get("summary", ""),
                payload.get("dispose_note", ""),
                payload.get("visibility", "private"),
                payload.get("dept", "finance"),
                now,
            ),
        )
        conn.commit()
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM assets WHERE id=?", (rid,)).fetchone()
    return row_to_dict(row)  # type: ignore[return-value]


def company_overview(user_id: int = 1) -> dict[str, Any]:
    with connect() as conn:
        notes = [
            row_to_dict(r)
            for r in conn.execute(
                "SELECT * FROM company_notes WHERE user_id=? ORDER BY id DESC", (user_id,)
            ).fetchall()
        ]
        legacy = conn.execute(
            "SELECT dept, COUNT(*) AS c FROM legacy_items WHERE user_id=? GROUP BY dept",
            (user_id,),
        ).fetchall()
        assets = conn.execute(
            "SELECT dept, COUNT(*) AS c FROM assets WHERE user_id=? GROUP BY dept",
            (user_id,),
        ).fetchall()
    by_legacy = {r["dept"]: r["c"] for r in legacy}
    by_assets = {r["dept"]: r["c"] for r in assets}
    depts = []
    for d in DEPTS:
        depts.append(
            {
                **d,
                "legacy_count": by_legacy.get(d["id"], 0),
                "asset_count": by_assets.get(d["id"], 0),
                "notes": [n for n in notes if n and n.get("dept") == d["id"]],
            }
        )
    filled = sum(1 for d in depts if d["legacy_count"] + d["asset_count"] + len(d["notes"]) > 0)
    return {
        "depts": depts,
        "progress": {"filled": filled, "total": 5, "pct": int(filled / 5 * 100)},
        "slogan": "生成我的个人公司年度报告 · 个人生命资产盘点",
    }


def add_company_note(user_id: int, dept: str, title: str, body: str) -> dict[str, Any]:
    now = time.time()
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO company_notes (user_id, dept, title, body, created_at) VALUES (?,?,?,?,?)",
            (user_id, dept, title or "盘点条目", body or "", now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM company_notes WHERE id=?", (cur.lastrowid,)).fetchone()
    return row_to_dict(row)  # type: ignore[return-value]


def self_guard_state(user_id: int = 1) -> dict[str, Any]:
    with connect() as conn:
        rows = {
            r["sin_rank"]: row_to_dict(r)
            for r in conn.execute(
                "SELECT * FROM self_guard_checks WHERE user_id=?", (user_id,)
            ).fetchall()
        }
    items = []
    for s in SEVEN_SINS:
        st = rows.get(s["rank"]) or {"checked": 0, "note": ""}
        items.append({**s, "checked": bool(st.get("checked")), "user_note": st.get("note") or ""})
    done = sum(1 for i in items if i["checked"])
    return {"items": items, "progress": {"done": done, "total": 7}}


def set_self_guard(user_id: int, sin_rank: int, checked: bool, note: str = "") -> dict[str, Any]:
    now = time.time()
    with connect() as conn:
        conn.execute(
            "INSERT INTO self_guard_checks (user_id, sin_rank, checked, note, updated_at) VALUES (?,?,?,?,?) "
            "ON CONFLICT(user_id, sin_rank) DO UPDATE SET checked=excluded.checked, note=excluded.note, updated_at=excluded.updated_at",
            (user_id, sin_rank, 1 if checked else 0, note, now),
        )
        conn.commit()
    return self_guard_state(user_id)


def list_hospitals(q: str = "", country: str = "") -> list[dict[str, Any]]:
    sql = "SELECT * FROM hospitals WHERE 1=1"
    args: list[Any] = []
    if country:
        sql += " AND country=?"
        args.append(country)
    if q:
        sql += " AND (name LIKE ? OR city LIKE ? OR dept LIKE ? OR tags LIKE ?)"
        like = f"%{q}%"
        args.extend([like, like, like, like])
    sql += " ORDER BY country, city, name"
    with connect() as conn:
        rows = conn.execute(sql, args).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def add_med_intent(user_id: int, hospital_id: int | None, note: str) -> dict[str, Any]:
    now = time.time()
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO med_intents (user_id, hospital_id, note, created_at) VALUES (?,?,?,?)",
            (user_id, hospital_id, note, now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM med_intents WHERE id=?", (cur.lastrowid,)).fetchone()
    return row_to_dict(row)  # type: ignore[return-value]


def get_travel(user_id: int = 1) -> dict[str, Any]:
    with connect() as conn:
        row = row_to_dict(
            conn.execute("SELECT * FROM travel_fund WHERE user_id=?", (user_id,)).fetchone()
        )
    if not row:
        return {"user_id": user_id, "balance": 0.0, "updated_at": time.time()}
    return row


def add_ledger(user_id: int, kind: str, amount: float, note: str = "") -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO ledger (user_id, kind, amount, note, created_at) VALUES (?,?,?,?,?)",
            (user_id, kind, amount, note, time.time()),
        )
        conn.commit()


def travel_deposit(user_id: int, amount: float) -> dict[str, Any]:
    if amount <= 0:
        raise ValueError("充值金额须大于 0")
    now = time.time()
    with connect() as conn:
        conn.execute(
            "INSERT INTO travel_fund (user_id, balance, updated_at) VALUES (?,?,?) "
            "ON CONFLICT(user_id) DO UPDATE SET balance = balance + excluded.balance, updated_at=excluded.updated_at",
            (user_id, amount, now),
        )
        conn.commit()
    add_ledger(user_id, "travel_deposit", amount, "差旅费预存")
    return get_travel(user_id)


def activate_membership(user_id: int = 1, years: float = 1.0) -> dict[str, Any]:
    now = time.time()
    until = now + years * 365.25 * 24 * 3600
    u = update_user(user_id, member_until=until, escalation_state="ok")
    add_ledger(user_id, "membership", 365.0 * years, "会员年费 ¥365/年")
    return u


def do_checkin(user_id: int = 1) -> dict[str, Any]:
    now = time.time()
    u = update_user(user_id, last_checkin_at=now, escalation_state="ok")
    add_ledger(user_id, "checkin", 0, "生存报备打卡")
    return u


def evaluate_escalation(user_id: int = 1, simulate_unreachable: bool = False) -> dict[str, Any]:
    u = get_user(user_id)
    if not u["checkin_overdue"]:
        return {"state": "ok", "user": u, "calls": [], "message": "报备正常，无需呼叫"}

    calls: list[dict[str, Any]] = []
    now = time.time()

    def log_call(target: str, result: str, note: str) -> None:
        with connect() as conn:
            conn.execute(
                "INSERT INTO call_log (user_id, target, result, note, created_at) VALUES (?,?,?,?,?)",
                (user_id, target, result, note, now),
            )
            conn.commit()
        calls.append({"target": target, "result": result, "note": note})

    if simulate_unreachable:
        log_call(u["phone"], "no_answer", "自动外呼本人：未接通（演示）")
        update_user(user_id, escalation_state="calling_backup")
        for c in u["backup_contacts"]:
            log_call(
                c.get("phone", ""),
                "queued",
                f"联系备用联系人 {c.get('name')}（{c.get('relation')}）：请协助确认是否安全",
            )
        u = update_user(user_id, escalation_state="manual_review")
        return {
            "state": "manual_review",
            "user": u,
            "calls": calls,
            "message": "本人未接通，已通知备用联系人，进入人工复核（不会直接宣布身故）",
        }

    log_call(u["phone"], "answered_confirm", "自动外呼本人：已确认安全（演示）")
    u = do_checkin(user_id)
    return {
        "state": "ok",
        "user": u,
        "calls": calls,
        "message": "本人已确认安全，报备周期已重置",
    }


def lapse_membership(user_id: int = 1) -> dict[str, Any]:
    fund = get_travel(user_id)
    balance = float(fund.get("balance") or 0)
    refund = 0.0
    if balance > 0:
        refund = balance
        with connect() as conn:
            conn.execute(
                "UPDATE travel_fund SET balance=0, updated_at=? WHERE user_id=?",
                (time.time(), user_id),
            )
            conn.commit()
        add_ledger(user_id, "travel_refund", -refund, "会员断缴·差旅预存原路退回")
    u = update_user(user_id, member_until=0)
    return {
        "user": u,
        "refunded": refund,
        "state": "refunded" if refund else "lapsed_no_balance",
        "message": f"会员已断缴；差旅预存已原路退回 ¥{refund:.2f}" if refund else "会员已断缴；无差旅余额可退",
    }


def recent_ledger(user_id: int = 1, limit: int = 20) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM ledger WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def recent_calls(user_id: int = 1, limit: int = 20) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM call_log WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def handover_checklist(user_id: int = 1) -> dict[str, Any]:
    """Inherit 交割待办：给执行人的冷手册摘要。"""
    u = get_user(user_id)
    items = list_legacy(user_id)
    todos = []
    for it in items:
        bits = [it["action"]]
        if it.get("factory_reset"):
            bits.append("出厂重置")
        if it.get("clear_photos"):
            bits.append("清除照片")
        if it.get("clear_chats"):
            bits.append("清除聊天")
        if it.get("beneficiary"):
            bits.append(f"交给 {it['beneficiary']}")
        todos.append(
            {
                "title": it["title"],
                "ops": bits,
                "notes": it.get("notes") or "",
                "dept": it.get("dept") or "",
            }
        )
    return {
        "brand": "E-Inherit 交割手册",
        "domain": "einherit.cn",
        "executor": u.get("executor_name") or "（未指定执行人）",
        "member": u.get("is_member"),
        "todos": todos,
        "note": "本清单为客观资产交割待办，不依赖情感授权。",
    }


def apply_icu_pack(user_id: int = 1, beneficiary: str = "") -> list[dict[str, Any]]:
    """一键写入急症前清册（相册/聊天/出厂/虚拟资产）。"""
    created: list[dict[str, Any]] = []
    for tpl in ICU_PACK:
        payload = dict(tpl)
        if beneficiary:
            payload["beneficiary"] = beneficiary
        created.append(add_legacy(user_id, payload))
    return created


def list_aftercare(user_id: int = 1) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM aftercare_jobs WHERE user_id=? ORDER BY id DESC", (user_id,)
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def add_aftercare(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    now = time.time()
    title = str(payload.get("title") or "").strip() or "电子数据善后"
    service_type = str(payload.get("service_type") or "delete_data")
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO aftercare_jobs (user_id, service_type, title, city, visit_pref, "
            "travel_budget, coop_state, status, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (
                user_id,
                service_type,
                title,
                str(payload.get("city") or ""),
                str(payload.get("visit_pref") or ""),
                float(payload.get("travel_budget") or 0),
                str(payload.get("coop_state") or "pending"),
                str(payload.get("status") or "queued"),
                str(payload.get("notes") or ""),
                now,
            ),
        )
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM aftercare_jobs WHERE id=?", (rid,)).fetchone()
    return row_to_dict(row)  # type: ignore[return-value]


def add_executor_lead(payload: dict[str, Any]) -> dict[str, Any]:
    now = time.time()
    name = str(payload.get("name") or "").strip()
    if not name:
        raise ValueError("请填写姓名")
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO executor_leads (name, city, phone, note, created_at) VALUES (?,?,?,?,?)",
            (
                name,
                str(payload.get("city") or ""),
                str(payload.get("phone") or ""),
                str(payload.get("note") or ""),
                now,
            ),
        )
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM executor_leads WHERE id=?", (rid,)).fetchone()
    return row_to_dict(row)  # type: ignore[return-value]


def aftercare_playbook() -> dict[str, Any]:
    """王洋律师案例商业拆解 → 产品动作映射（只读）。"""
    return {
        "source": "抖音·王洋律师·2026-07-28·电子继承善后创业咨询",
        "aweme_id": "7667449309423724891",
        "story": (
            "28岁病友在病友群发现需求：提供电子数据善后（删数据、变卖电子资产），"
            "上门涉及差旅；客户失联要有流程；撞法律问题后要长期法律顾问。"
        ),
        "frames": [
            {"t": "创业项目", "map": "获客=病友群/医旅入口，不做冷推销"},
            {"t": "业务范围", "map": "删数据·变卖资产·转赠清册 → 交割条目+善后工单"},
            {"t": "财富自由与从业时间", "map": "会员¥365守望 + 按次善后收费（P1）"},
            {"t": "客户配合与失联处理", "map": "生存报备外呼升级状态机"},
            {"t": "差旅费与客户性别", "map": "差旅预存≥¥2000；上门偏好仅作匹配备注"},
            {"t": "电子资产价值", "map": "资产备忘+可变现动作"},
            {"t": "法律问题咨询", "map": "冷静期+书面授权+合规红线"},
            {"t": "法律顾问必要性", "map": "P2 律师/公证协作；App内常驻合规提示"},
        ],
    }
