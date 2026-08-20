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

CREATE TABLE IF NOT EXISTS beneficiaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'heir',
  contact TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS emergency_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  beneficiary_id INTEGER NOT NULL,
  wait_days INTEGER DEFAULT 7,
  status TEXT DEFAULT 'pending',
  reason TEXT DEFAULT '',
  requested_at REAL NOT NULL,
  decide_by REAL NOT NULL,
  decided_at REAL DEFAULT 0,
  note TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS handover_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  label TEXT DEFAULT '',
  payload TEXT NOT NULL,
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS mindmap (
  user_id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT DEFAULT '',
  has_greeting INTEGER DEFAULT 0,
  has_authorize INTEGER DEFAULT 0,
  has_plan INTEGER DEFAULT 0,
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'submitted',
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
        "users": [
            ("executor_name", "TEXT DEFAULT ''"),
            ("grace_hours", "REAL DEFAULT 72"),
        ],
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
    grace = float(u.get("grace_hours") or 72) * 3600
    due = float(u["last_checkin_at"] or 0) + interval
    hard_due = due + grace
    now = time.time()
    u["checkin_due_at"] = due
    u["checkin_hard_due_at"] = hard_due
    u["grace_hours"] = float(u.get("grace_hours") or 72)
    u["checkin_in_grace"] = due < now <= hard_due
    u["checkin_overdue"] = now > hard_due  # 仅冷静期结束后才升级外呼
    u["checkin_soft_overdue"] = now > due
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
    if u.get("checkin_in_grace"):
        return {
            "state": "grace",
            "user": u,
            "calls": [],
            "message": (
                f"已过报备点，仍在冷静期（{u.get('grace_hours')} 小时内）。"
                "暂不外呼升级，请尽快打卡；过冷静期后才会联系本人/备用联系人。"
            ),
        }
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
    if not auth_video_ready(user_id):
        raise ValueError("请先上传授权说明视频（须含：问候 + 对我司处置授权 + 处置思路）")
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
        "auth_video_gate": {
            "title": "授权说明视频（善后前置门槛）",
            "from_frames": "案例要求用户先提交一段说明视频，再启动处置",
            "must_include": [
                "对大家的问候（当面交代，不是冷冰冰表单）",
                "对我司处置的明确授权（可执行、可留证）",
                "处置思路（删/卖/转赠/出厂等怎么做）",
            ],
            "product": "模块「授权视频」→ 未通过则不可提交善后工单",
        },
        "frames": [
            {"t": "创业项目", "map": "获客=病友群/医旅入口，不做冷推销"},
            {"t": "业务范围", "map": "删数据·变卖资产·转赠清册 → 交割条目+善后工单"},
            {"t": "财富自由与从业时间", "map": "会员¥365守望 + 按次善后收费（P1）"},
            {"t": "客户配合与失联处理", "map": "生存报备外呼升级状态机"},
            {"t": "差旅费与客户性别", "map": "差旅预存≥¥2000；上门偏好仅作匹配备注"},
            {"t": "电子资产价值", "map": "资产备忘+可变现动作"},
            {"t": "法律问题咨询", "map": "冷静期+书面授权+合规红线"},
            {"t": "法律顾问必要性", "map": "P2 律师/公证协作；App内常驻合规提示"},
            {"t": "先交授权视频", "map": "问候+对我司授权+处置思路 → auth_videos 门槛"},
        ],
    }


def audit(user_id: int, action: str, detail: str = "") -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO audit_log (user_id, action, detail, created_at) VALUES (?,?,?,?)",
            (user_id, action, detail, time.time()),
        )
        conn.commit()


def recent_audit(user_id: int = 1, limit: int = 30) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM audit_log WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def list_beneficiaries(user_id: int = 1) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM beneficiaries WHERE user_id=? ORDER BY id DESC", (user_id,)
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def add_beneficiary(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name") or "").strip()
    if not name:
        raise ValueError("请填写受益人姓名")
    now = time.time()
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO beneficiaries (user_id, name, role, contact, note, created_at) "
            "VALUES (?,?,?,?,?,?)",
            (
                user_id,
                name,
                str(payload.get("role") or "heir"),
                str(payload.get("contact") or ""),
                str(payload.get("note") or ""),
                now,
            ),
        )
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM beneficiaries WHERE id=?", (rid,)).fetchone()
    audit(user_id, "beneficiary.add", name)
    return row_to_dict(row)  # type: ignore[return-value]


def list_emergency(user_id: int = 1) -> list[dict[str, Any]]:
    tick_emergency(user_id)
    with connect() as conn:
        rows = conn.execute(
            "SELECT e.*, b.name AS beneficiary_name, b.role AS beneficiary_role "
            "FROM emergency_access e "
            "LEFT JOIN beneficiaries b ON b.id=e.beneficiary_id "
            "WHERE e.user_id=? ORDER BY e.id DESC",
            (user_id,),
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def request_emergency(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    """对标 Legacy Vault：紧急取用申请 + 等待期（主人可拒绝）。"""
    bid = int(payload.get("beneficiary_id") or 0)
    wait_days = max(1, min(90, int(payload.get("wait_days") or 7)))
    if bid <= 0:
        raise ValueError("请选择受益人")
    with connect() as conn:
        b = conn.execute(
            "SELECT id FROM beneficiaries WHERE id=? AND user_id=?", (bid, user_id)
        ).fetchone()
        if not b:
            raise ValueError("受益人不存在")
    now = time.time()
    decide_by = now + wait_days * 86400
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO emergency_access (user_id, beneficiary_id, wait_days, status, reason, "
            "requested_at, decide_by, note) VALUES (?,?,?,?,?,?,?,?)",
            (
                user_id,
                bid,
                wait_days,
                "pending",
                str(payload.get("reason") or "紧急取用交割手册"),
                now,
                decide_by,
                str(payload.get("note") or ""),
            ),
        )
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM emergency_access WHERE id=?", (rid,)).fetchone()
    audit(user_id, "emergency.request", f"beneficiary={bid} wait={wait_days}d")
    return row_to_dict(row)  # type: ignore[return-value]


def decide_emergency(user_id: int, req_id: int, approve: bool, note: str = "") -> dict[str, Any]:
    status = "approved" if approve else "denied"
    now = time.time()
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM emergency_access WHERE id=? AND user_id=?", (req_id, user_id)
        ).fetchone()
        if not row:
            raise ValueError("申请不存在")
        if row["status"] not in ("pending",):
            raise ValueError("该申请已处理")
        conn.execute(
            "UPDATE emergency_access SET status=?, decided_at=?, note=? WHERE id=?",
            (status, now, note or row["note"], req_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM emergency_access WHERE id=?", (req_id,)).fetchone()
    audit(user_id, f"emergency.{status}", f"id={req_id}")
    return row_to_dict(row)  # type: ignore[return-value]


def tick_emergency(user_id: int = 1) -> int:
    """等待期满且主人未拒绝 → 自动放行（仍不宣布身故，只开放交割只读）。"""
    now = time.time()
    granted: list[int] = []
    with connect() as conn:
        rows = conn.execute(
            "SELECT id FROM emergency_access WHERE user_id=? AND status='pending' AND decide_by<=?",
            (user_id, now),
        ).fetchall()
        for r in rows:
            conn.execute(
                "UPDATE emergency_access SET status='auto_granted', decided_at=? WHERE id=?",
                (now, r["id"]),
            )
            granted.append(int(r["id"]))
        conn.commit()
    for rid in granted:
        audit(user_id, "emergency.auto_granted", f"id={rid}")
    return len(granted)


def save_handover_snapshot(user_id: int = 1, label: str = "") -> dict[str, Any]:
    hand = handover_checklist(user_id)
    now = time.time()
    label = label.strip() or time.strftime("快照 %Y-%m-%d %H:%M", time.localtime(now))
    payload = json.dumps(hand, ensure_ascii=False)
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO handover_snapshots (user_id, label, payload, created_at) VALUES (?,?,?,?)",
            (user_id, label, payload, now),
        )
        rid = cur.lastrowid
        row = conn.execute(
            "SELECT id, user_id, label, created_at FROM handover_snapshots WHERE id=?", (rid,)
        ).fetchone()
    audit(user_id, "handover.snapshot", label)
    return row_to_dict(row)  # type: ignore[return-value]


def list_snapshots(user_id: int = 1) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, user_id, label, created_at FROM handover_snapshots WHERE user_id=? ORDER BY id DESC",
            (user_id,),
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def handover_export_html(user_id: int = 1) -> str:
    """可打印交割手册（浏览器打印→PDF）。"""
    hand = handover_checklist(user_id)
    u = get_user(user_id)
    items = hand.get("todos") or []
    rows = "".join(
        f"<tr><td>{_esc(i.get('title'))}</td><td>{_esc(' · '.join(i.get('ops') or []))}</td>"
        f"<td>{_esc(i.get('dept'))}</td><td>{_esc(i.get('notes'))}</td></tr>"
        for i in items
    )
    when = time.strftime("%Y-%m-%d %H:%M", time.localtime())
    return f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<title>交割手册 · { _esc(u.get('name') or '主人') }</title>
<style>
body{{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;margin:24px;color:#1a1a1a}}
h1{{font-size:22px;margin:0 0 8px}} .meta{{color:#666;font-size:13px;margin-bottom:20px}}
table{{border-collapse:collapse;width:100%;font-size:13px}}
th,td{{border:1px solid #ccc;padding:8px;text-align:left}} th{{background:#f5f5f5}}
.disclaimer{{margin-top:24px;font-size:12px;color:#888;line-height:1.5}}
@media print{{button{{display:none}}}}
</style></head><body>
<button onclick="window.print()">打印 / 另存 PDF</button>
<h1>电子继承 · 交割手册</h1>
<div class="meta">主人：{_esc(u.get('name'))} · 执行人：{_esc(u.get('executor_name') or '未指定')} · 导出：{when}</div>
<table><thead><tr><th>事项</th><th>动作</th><th>部门</th><th>备注</th></tr></thead>
<tbody>{rows or '<tr><td colspan="4">暂无条目</td></tr>'}</tbody></table>
<p class="disclaimer">本手册仅供授权执行人善后参考，不构成法律文件；紧急取用须经等待期或主人确认。
对标开源：Legacy Vault 紧急等待期 · Morrígan 版本快照 · 打印交付。</p>
</body></html>"""


def _esc(s: Any) -> str:
    return (
        str(s or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def open_source_learnings() -> dict[str, Any]:
    return {
        "note": "GitHub 开源对标（非 activeadmin/inherited_resources——那是 Rails REST 库）",
        "sources": [
            {
                "name": "Morrígan",
                "url": "https://github.com/paulfxyz/morrigan",
                "take": "零知识金库·受益人粒度·Dead Man Switch·版本快照",
            },
            {
                "name": "Wasiyya",
                "url": "https://github.com/Ghalwash0x/wasiyya",
                "take": "失活触发后向受托人发限时链接",
            },
            {
                "name": "Legacy Vault",
                "url": "https://github.com/slavhate/legacy-vault",
                "take": "紧急取用申请+等待期可拒绝",
            },
            {
                "name": "Legacy Vault Offline",
                "url": "https://github.com/Ronald-PH/legacy-vault",
                "take": "离线加密·紧急QR·PDF打印",
            },
            {
                "name": "afterkey",
                "url": "https://github.com/bonkai/afterkey",
                "take": "Shamir 分片·加密交付",
            },
        ],
        "adopted_now": [
            "报备冷静期 grace_hours（默认72h）后再外呼升级",
            "受益人档案 beneficiaries",
            "紧急取用申请+等待期 emergency_access",
            "交割手册版本快照 handover_snapshots",
            "审计日志 audit_log",
            "可打印交割手册 /export/handover.html",
            "置顶大脑图谱 mindmap（主人放射+长子资产树）",
            "授权说明视频门槛（问候+对我司授权+处置思路）",
        ],
    }


AUTH_VIDEO_SCRIPT = [
    {"key": "greeting", "title": "对大家的问候", "hint": "面向家人/执行人/服务方，当面说清自己是谁、为何录这段视频"},
    {"key": "authorize", "title": "对我司处置的授权", "hint": "明确授权海南润邦/电子继承团队按约定处置数字资产（删/卖/转赠/出厂等）"},
    {"key": "plan", "title": "处置思路", "hint": "说清优先级：先清什么、交给谁、哪些必须销毁、哪些可变现"},
]


def auth_video_dir() -> Path:
    d = ROOT / "data" / "uploads" / "auth_videos"
    d.mkdir(parents=True, exist_ok=True)
    return d


def list_auth_videos(user_id: int = 1) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, user_id, filename, original_name, has_greeting, has_authorize, has_plan, "
            "note, status, created_at FROM auth_videos WHERE user_id=? ORDER BY id DESC",
            (user_id,),
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def auth_video_ready(user_id: int = 1) -> bool:
    with connect() as conn:
        row = conn.execute(
            "SELECT id FROM auth_videos WHERE user_id=? AND has_greeting=1 AND has_authorize=1 "
            "AND has_plan=1 AND status!='rejected' ORDER BY id DESC LIMIT 1",
            (user_id,),
        ).fetchone()
    return bool(row)


def save_auth_video(
    user_id: int,
    *,
    filename: str,
    original_name: str,
    has_greeting: bool,
    has_authorize: bool,
    has_plan: bool,
    note: str = "",
) -> dict[str, Any]:
    if not (has_greeting and has_authorize and has_plan):
        raise ValueError("三段内容须全部勾选确认：问候、对我司授权、处置思路")
    if not filename:
        raise ValueError("请上传视频文件")
    now = time.time()
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO auth_videos (user_id, filename, original_name, has_greeting, has_authorize, "
            "has_plan, note, status, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            (
                user_id,
                filename,
                original_name,
                1 if has_greeting else 0,
                1 if has_authorize else 0,
                1 if has_plan else 0,
                note,
                "submitted",
                now,
            ),
        )
        rid = cur.lastrowid
        row = conn.execute(
            "SELECT id, user_id, filename, original_name, has_greeting, has_authorize, has_plan, "
            "note, status, created_at FROM auth_videos WHERE id=?",
            (rid,),
        ).fetchone()
    audit(user_id, "auth_video.upload", original_name or filename)
    return row_to_dict(row)  # type: ignore[return-value]


def auth_video_status(user_id: int = 1) -> dict[str, Any]:
    items = list_auth_videos(user_id)
    return {
        "ready": auth_video_ready(user_id),
        "script": AUTH_VIDEO_SCRIPT,
        "items": items,
        "latest": items[0] if items else None,
        "gate": "未完成授权视频前，不可提交善后工单",
    }


DEFAULT_MINDMAP: dict[str, Any] = {
    "title": "大脑图谱",
    "center": {"id": "owner", "label": "主人", "go": "company"},
    "radial": [
        {"id": "father", "label": "父", "angle": -55, "go": "heirs"},
        {"id": "mother", "label": "母", "angle": 55, "go": "heirs"},
        {"id": "friend", "label": "朋友", "angle": 95, "go": "heirs"},
        {"id": "daughter", "label": "女", "angle": 145, "go": "heirs"},
        {"id": "brother", "label": "兄", "angle": -110, "go": "heirs"},
        {"id": "affairs", "label": "事务", "angle": -155, "go": "authvideo"},
    ],
    "heir_bridge": {"id": "eldest", "label": "长子", "go": "heirs"},
    "trunk": [
        {"id": "keys", "label": "密钥", "go": "assets", "kind": "leaf"},
        {
            "id": "co1",
            "label": "公司1",
            "go": "company",
            "kind": "company",
            "children": [{"id": "dept1", "label": "部门一", "go": "company"}],
        },
        {"id": "co2", "label": "公司2", "go": "company", "kind": "company"},
        {"id": "more1", "label": "…", "go": "legacy", "kind": "slot"},
        {"id": "more2", "label": "…", "go": "legacy", "kind": "slot"},
    ],
    "note": "本 App 总导航：点节点进入对应模块。上圈关系与事务，下树密钥与公司。",
}


def get_mindmap(user_id: int = 1) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute("SELECT payload FROM mindmap WHERE user_id=?", (user_id,)).fetchone()
    if not row:
        return dict(DEFAULT_MINDMAP)
    try:
        data = json.loads(row["payload"])
    except json.JSONDecodeError:
        return dict(DEFAULT_MINDMAP)
    # soft-merge defaults for missing keys
    out = dict(DEFAULT_MINDMAP)
    out.update(data)
    return out


def save_mindmap(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    now = time.time()
    body = json.dumps(payload, ensure_ascii=False)
    with connect() as conn:
        conn.execute(
            "INSERT INTO mindmap (user_id, payload, updated_at) VALUES (?,?,?) "
            "ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at",
            (user_id, body, now),
        )
        conn.commit()
    audit(user_id, "mindmap.save", "ok")
    return get_mindmap(user_id)
