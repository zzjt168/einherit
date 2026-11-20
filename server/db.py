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
    {
        "id": "production",
        "name": "生产部/个人产出类(工资 兼职 股票)",
        "short": "生产部",
        "category": "个人产出类",
        "blurb": "你靠什么产出与赚钱",
        "examples": "工资、兼职、股票、自媒体、订阅分成",
    },
    {
        "id": "finance",
        "name": "财务部/资金与负债类(银行卡 保险 贷款)",
        "short": "财务部",
        "category": "资金与负债类",
        "blurb": "钱放哪、欠多少、保什么",
        "examples": "银行卡、支付宝、保险、贷款、公积金",
    },
    {
        "id": "ip",
        "name": "知识产权部/精神文化类(云盘 日记 游戏号)",
        "short": "知识产权部",
        "category": "精神文化类",
        "blurb": "记忆、创作与情感载体",
        "examples": "云盘、日记、游戏号、人脉、遗言视频",
    },
    {
        "id": "admin",
        "name": "行政部/实体钥匙类(手机平板 证件 恢复码)",
        "short": "行政部",
        "category": "实体钥匙类",
        "blurb": "看得见的东西和数字钥匙",
        "examples": "手机平板、证件、保险箱、2FA恢复码",
    },
    {
        "id": "board",
        "name": "董事会/决策触发类(执行人 分配 报备)",
        "short": "董事会",
        "category": "决策触发类",
        "blurb": "谁来接盘、怎么分、何时启动",
        "examples": "执行人、分配决议、生存报备、医疗意愿",
    },
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
  tag TEXT DEFAULT '其他',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS company_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  dept TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
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
  intl INTEGER DEFAULT 0,
  address TEXT DEFAULT '',
  remark TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS med_intents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  hospital_id INTEGER,
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
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
  province TEXT DEFAULT '',
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'heir',
  relation TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  note TEXT DEFAULT '',
  passphrase_hint TEXT DEFAULT '',
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

# 医旅详情补全（地址 / 冷静备注；信息中介，不做疗效承诺）
HOSPITAL_DETAILS = [
    ("北京协和医院", "北京市东城区帅府园1号", "可先了解国际医疗部预约流程；不做疗效承诺。"),
    ("上海交通大学医学院附属瑞金医院", "上海市黄浦区瑞金二路197号", "内分泌/血液方向常见问询；建议顾问协助路径评估。"),
    ("武汉同济医院", "武汉市硚口区解放大道1095号", "肿瘤/移植相关转诊信息仅供筛选。"),
    ("广州中山大学附属第一医院", "广州市越秀区中山二路58号", "器官移植相关咨询请以医院官方为准。"),
    ("梅奥诊所 Mayo Clinic", "200 First St. SW, Rochester, MN", "国际患者通道信息；出行与签证请自行核实。"),
    ("MD 安德森癌症中心", "1515 Holcombe Blvd, Houston, TX", "癌症专科信息中介；治疗方案需面诊确认。"),
    ("东京大学医学部附属病院", "東京都文京区本郷7-3-1", "国际患者窗口信息仅供参考。"),
    ("新加坡国立大学医院", "5 Lower Kent Ridge Rd, Singapore", "英语友好；费用与预约以院方为准。"),
]


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


ASSET_TAGS = ("账号", "设备", "虚拟资产", "其他")

ESCALATION_LABELS = {
    "ok": "正常",
    "grace": "冷静期内",
    "calling_self": "联系本人中",
    "calling_backup": "联系备用联系人中",
    "manual_review": "人工复核中",
}


def _ensure_columns(conn: sqlite3.Connection) -> None:
    """轻量迁移：老库补列。"""
    specs = {
        "legacy_items": [
            ("dept", "TEXT DEFAULT 'admin'"),
            ("factory_reset", "INTEGER DEFAULT 0"),
            ("clear_photos", "INTEGER DEFAULT 0"),
            ("clear_chats", "INTEGER DEFAULT 0"),
            ("beneficiary_id", "INTEGER DEFAULT 0"),
        ],
        "assets": [
            ("dept", "TEXT DEFAULT 'finance'"),
            ("tag", "TEXT DEFAULT '其他'"),
            ("review_at", "TEXT DEFAULT ''"),
        ],
        "users": [
            ("executor_name", "TEXT DEFAULT ''"),
            ("grace_hours", "REAL DEFAULT 72"),
        ],
        "beneficiaries": [
            ("relation", "TEXT DEFAULT ''"),
            ("passphrase_hint", "TEXT DEFAULT ''"),
        ],
        "med_intents": [
            ("status", "TEXT DEFAULT 'open'"),
        ],
        "executor_leads": [
            ("province", "TEXT DEFAULT ''"),
            ("region", "TEXT DEFAULT ''"),
        ],
        "company_notes": [("sort_order", "INTEGER DEFAULT 0")],
        "hospitals": [
            ("address", "TEXT DEFAULT ''"),
            ("remark", "TEXT DEFAULT ''"),
        ],
        "aftercare_jobs": [
            ("contact_window", "TEXT DEFAULT ''"),
        ],
    }
    for table, cols in specs.items():
        existing = {r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}
        for name, decl in cols:
            if name not in existing:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {decl}")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS icu_checklist (
          user_id INTEGER NOT NULL,
          pack_key TEXT NOT NULL,
          checked INTEGER DEFAULT 0,
          updated_at REAL NOT NULL,
          PRIMARY KEY (user_id, pack_key)
        )
        """
    )
    # 部门内条目：仅把仍为默认 0 的行回填为 id，便于上下移（不覆盖已排序）
    for r in conn.execute("SELECT id FROM company_notes WHERE sort_order = 0").fetchall():
        conn.execute("UPDATE company_notes SET sort_order = ? WHERE id = ?", (r["id"], r["id"]))


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
        # 医院详情缺省地址/备注（演示信息，非疗效承诺；在种子之后回填）
        for name, address, remark in HOSPITAL_DETAILS:
            conn.execute(
                "UPDATE hospitals SET address=?, remark=? WHERE name=? AND (address IS NULL OR address='')",
                (address, remark, name),
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
    now = time.time()
    u["is_member"] = bool(u["member_until"] and u["member_until"] > now)
    u["member_until_iso"] = (
        time.strftime("%Y-%m-%d", time.localtime(u["member_until"])) if u["member_until"] else None
    )
    # 会员剩余天数温和提示（禁恐吓断缴文案）
    if u["is_member"] and u.get("member_until"):
        days_left = max(0, int((float(u["member_until"]) - now) // 86400))
        u["member_days_left"] = days_left
        u["member_gentle_hint"] = (
            f"演示有效期还剩约 {days_left} 天，按自己节奏续费即可。"
            if days_left > 0
            else "演示有效期将满，想续的话随时开通下一年。"
        )
    else:
        u["member_days_left"] = None
        u["member_gentle_hint"] = "尚未开通会员。一天一块钱，托管交割与报备守望，不着急。"
    interval = float(u["checkin_interval_hours"] or 24) * 3600
    grace = float(u.get("grace_hours") or 72) * 3600
    due = float(u["last_checkin_at"] or 0) + interval
    hard_due = due + grace
    u["checkin_due_at"] = due
    u["checkin_hard_due_at"] = hard_due
    u["grace_hours"] = float(u.get("grace_hours") or 72)
    u["checkin_in_grace"] = due < now <= hard_due
    u["checkin_overdue"] = now > hard_due  # 仅冷静期结束后才升级外呼
    u["checkin_soft_overdue"] = now > due
    u["grace_remaining_seconds"] = max(0, int(hard_due - now)) if now > due else int(grace)
    u["domain"] = "einherit.cn"
    u["brand"] = "电子继承 App"
    u["brand_en"] = "E-Inherit"
    return u


def normalize_backup_contacts(raw: Any) -> list[dict[str, str]]:
    """温和校验备用联系人：姓名+电话；缺省返回空列表并可由调用方提示。"""
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw or "[]")
        except json.JSONDecodeError as e:
            raise ValueError("备用联系人格式不正确") from e
    if not isinstance(raw, list):
        raise ValueError("备用联系人须为列表")
    out: list[dict[str, str]] = []
    for c in raw:
        if not isinstance(c, dict):
            continue
        name = str(c.get("name") or "").strip()
        phone = str(c.get("phone") or "").strip()
        relation = str(c.get("relation") or "备用").strip() or "备用"
        if not name and not phone:
            continue
        if not name or not phone:
            raise ValueError("备用联系人请同时填写姓名与电话（先本人报备，再通知备用）")
        digits = "".join(ch for ch in phone if ch.isdigit())
        if len(digits) < 6:
            raise ValueError("备用联系人电话看起来不完整，请再核对一下")
        out.append({"name": name, "relation": relation, "phone": phone})
    return out


def update_user(user_id: int, **fields: Any) -> dict[str, Any]:
    if "backup_contacts" in fields and not isinstance(fields["backup_contacts"], str):
        fields["backup_contacts"] = json.dumps(
            normalize_backup_contacts(fields["backup_contacts"]), ensure_ascii=False
        )
    keys = ", ".join(f"{k}=?" for k in fields)
    vals = list(fields.values()) + [user_id]
    with connect() as conn:
        conn.execute(f"UPDATE users SET {keys} WHERE id=?", vals)
        conn.commit()
    return get_user(user_id)


def list_legacy(
    user_id: int = 1, dept: str = "", q: str = ""
) -> list[dict[str, Any]]:
    dept = str(dept or "").strip()
    q = str(q or "").strip().lower()
    with connect() as conn:
        if dept:
            rows = conn.execute(
                "SELECT * FROM legacy_items WHERE user_id=? AND dept=? ORDER BY id DESC",
                (user_id, dept),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM legacy_items WHERE user_id=? ORDER BY id DESC", (user_id,)
            ).fetchall()
    items = [row_to_dict(r) for r in rows]  # type: ignore[misc]
    if not q:
        return items
    out: list[dict[str, Any]] = []
    for it in items:
        hay = " ".join(
            [
                str(it.get("title") or ""),
                str(it.get("beneficiary") or ""),
                str(it.get("notes") or ""),
            ]
        ).lower()
        if q in hay:
            out.append(it)
    return out


def _resolve_legacy_beneficiary(
    user_id: int, payload: dict[str, Any]
) -> tuple[int, str]:
    bid = int(payload.get("beneficiary_id") or 0)
    name = str(payload.get("beneficiary") or "").strip()
    if bid > 0:
        with connect() as conn:
            row = conn.execute(
                "SELECT id, name FROM beneficiaries WHERE id=? AND user_id=?",
                (bid, user_id),
            ).fetchone()
        if not row:
            raise ValueError("所选受益人不存在")
        return int(row["id"]), str(row["name"])
    return 0, name


def add_legacy(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    now = time.time()
    bid, bene_name = _resolve_legacy_beneficiary(user_id, payload)
    with connect() as conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(legacy_items)").fetchall()}
        if "beneficiary_id" not in cols:
            conn.execute(
                "ALTER TABLE legacy_items ADD COLUMN beneficiary_id INTEGER DEFAULT 0"
            )
        cur = conn.execute(
            "INSERT INTO legacy_items (user_id, title, category, action, beneficiary, notes, "
            "dept, factory_reset, clear_photos, clear_chats, beneficiary_id, created_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                user_id,
                payload.get("title", "").strip() or "未命名条目",
                payload.get("category", "其他"),
                payload.get("action", "销毁"),
                bene_name,
                payload.get("notes", ""),
                payload.get("dept", "admin"),
                1 if payload.get("factory_reset") else 0,
                1 if payload.get("clear_photos") else 0,
                1 if payload.get("clear_chats") else 0,
                bid,
                now,
            ),
        )
        conn.commit()
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM legacy_items WHERE id=?", (rid,)).fetchone()
    title = (row_to_dict(row) or {}).get("title") or ""
    audit(user_id, "legacy.change", str(title))
    return row_to_dict(row)  # type: ignore[return-value]


def delete_legacy(user_id: int, item_id: int) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM legacy_items WHERE id=? AND user_id=?", (item_id, user_id)
        ).fetchone()
        if not row:
            raise ValueError("交割条目不存在")
        title = row["title"]
        conn.execute("DELETE FROM legacy_items WHERE id=?", (item_id,))
        conn.commit()
    audit(user_id, "legacy.delete", str(title))
    return {"ok": True, "id": item_id, "title": title}


def delete_asset(user_id: int, item_id: int) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM assets WHERE id=? AND user_id=?", (item_id, user_id)
        ).fetchone()
        if not row:
            raise ValueError("备忘不存在")
        platform = row["platform"]
        conn.execute("DELETE FROM assets WHERE id=?", (item_id,))
        conn.commit()
    audit(user_id, "asset.delete", str(platform))
    return {"ok": True, "id": item_id, "platform": platform}


def list_assets(
    user_id: int = 1,
    visibility: str = "",
    sort: str = "",
    dept: str = "",
) -> list[dict[str, Any]]:
    vis = str(visibility or "").strip().lower()
    dept = str(dept or "").strip()
    sort_key = str(sort or "").strip().lower()
    order = "id DESC"
    if sort_key in ("due", "review_at", "review"):
        # 有 review_at 的置顶，再按检视日升序（将到期靠前）
        order = (
            "CASE WHEN review_at IS NULL OR trim(review_at)='' THEN 1 ELSE 0 END ASC, "
            "review_at ASC, id DESC"
        )
    with connect() as conn:
        clauses = ["user_id=?"]
        args: list[Any] = [user_id]
        if vis in ("private", "family"):
            clauses.append("lower(visibility)=?")
            args.append(vis)
        if dept:
            clauses.append("dept=?")
            args.append(dept)
        sql = f"SELECT * FROM assets WHERE {' AND '.join(clauses)} ORDER BY {order}"
        rows = conn.execute(sql, args).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def assets_due_partition(
    user_id: int = 1, visibility: str = "", dept: str = ""
) -> dict[str, Any]:
    """备忘：有 review_at 的「将到期」区 + 其余（冷静分区，不恐吓）。"""
    items = list_assets(user_id, visibility=visibility, sort="due", dept=dept)
    due: list[dict[str, Any]] = []
    rest: list[dict[str, Any]] = []
    for it in items:
        if str(it.get("review_at") or "").strip():
            due.append(it)
        else:
            rest.append(it)
    return {
        "items": items,
        "due_soon": due,
        "rest": rest,
        "due_count": len(due),
        "sort": "due",
        "note": "有检视日的备忘已置顶；按自己节奏看看即可。",
    }


DISPOSE_GUIDES = ("销毁", "转赠", "变现")


def _normalize_dispose_note(raw: str) -> str:
    """引导三类处置：销毁 / 转赠 / 变现；允许「类型 · 补充」。"""
    text = str(raw or "").strip()
    if not text:
        raise ValueError("请选择处置指引：销毁、转赠或变现（可再写一句补充）")
    head = text.split("·", 1)[0].strip()
    if head not in DISPOSE_GUIDES and text not in DISPOSE_GUIDES:
        # 兼容旧自由文本：若含关键词则保留，否则要求重选
        if any(k in text for k in DISPOSE_GUIDES):
            return text
        raise ValueError("处置指引请选：销毁、转赠或变现")
    return text
def normalize_asset_tag(raw: Any) -> str:
    tag = str(raw or "").strip()
    return tag if tag in ASSET_TAGS else "其他"


def add_asset(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    now = time.time()
    # draft=True 允许暂不填处置，供「未填角标 · 一键补填」
    if payload.get("draft"):
        dispose = str(payload.get("dispose_note") or "").strip()
    else:
        dispose = _normalize_dispose_note(str(payload.get("dispose_note") or ""))
    tag = normalize_asset_tag(payload.get("tag"))
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO assets (user_id, platform, account_hint, summary, dispose_note, visibility, dept, tag, created_at) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            (
                user_id,
                payload.get("platform", "").strip() or "未命名平台",
                payload.get("account_hint", ""),
                payload.get("summary", ""),
                dispose,
                payload.get("visibility", "private"),
                payload.get("dept", "finance"),
                tag,
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
                "SELECT * FROM company_notes WHERE user_id=? ORDER BY sort_order ASC, id ASC",
                (user_id,),
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
    gaps = []
    for d in DEPTS:
        dept = {
            **d,
            "legacy_count": by_legacy.get(d["id"], 0),
            "asset_count": by_assets.get(d["id"], 0),
            "notes": [n for n in notes if n and n.get("dept") == d["id"]],
        }
        depts.append(dept)
        if dept["legacy_count"] + dept["asset_count"] + len(dept["notes"]) == 0:
            gaps.append(
                {
                    "id": d["id"],
                    "name": d["name"],
                    "short": d.get("short") or d["name"],
                    "go": "company",
                    "anchor": f"dept-{d['id']}",
                }
            )
    filled = sum(1 for d in depts if d["legacy_count"] + d["asset_count"] + len(d["notes"]) > 0)
    return {
        "depts": depts,
        "gaps": gaps,
        "progress": {"filled": filled, "total": 5, "pct": int(filled / 5 * 100)},
        "slogan": "生成我的个人公司年度报告 · 个人生命资产盘点",
    }


def add_company_note(user_id: int, dept: str, title: str, body: str) -> dict[str, Any]:
    now = time.time()
    with connect() as conn:
        mx = conn.execute(
            "SELECT COALESCE(MAX(sort_order), 0) AS m FROM company_notes WHERE user_id=? AND dept=?",
            (user_id, dept),
        ).fetchone()["m"]
        cur = conn.execute(
            "INSERT INTO company_notes (user_id, dept, title, body, sort_order, created_at) "
            "VALUES (?,?,?,?,?,?)",
            (user_id, dept, title or "盘点条目", body or "", int(mx) + 1, now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM company_notes WHERE id=?", (cur.lastrowid,)).fetchone()
    return row_to_dict(row)  # type: ignore[return-value]


def reorder_company_note(user_id: int, note_id: int, direction: str) -> dict[str, Any]:
    """部门内上下移：direction 为 up|down。"""
    direction = (direction or "").lower().strip()
    if direction not in ("up", "down"):
        raise ValueError("direction 须为 up 或 down")
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM company_notes WHERE id=? AND user_id=?", (note_id, user_id)
        ).fetchone()
        if not row:
            raise ValueError("找不到该盘点条目")
        dept = row["dept"]
        siblings = conn.execute(
            "SELECT id, sort_order FROM company_notes WHERE user_id=? AND dept=? "
            "ORDER BY sort_order ASC, id ASC",
            (user_id, dept),
        ).fetchall()
        ids = [r["id"] for r in siblings]
        try:
            idx = ids.index(note_id)
        except ValueError as e:
            raise ValueError("找不到该盘点条目") from e
        swap_with = idx - 1 if direction == "up" else idx + 1
        if swap_with < 0 or swap_with >= len(siblings):
            return company_overview(user_id)
        a, b = siblings[idx], siblings[swap_with]
        conn.execute("UPDATE company_notes SET sort_order=? WHERE id=?", (b["sort_order"], a["id"]))
        conn.execute("UPDATE company_notes SET sort_order=? WHERE id=?", (a["sort_order"], b["id"]))
        # 若 sort_order 相同，交换后仍冲突时用位置重排
        if a["sort_order"] == b["sort_order"]:
            for i, s in enumerate(
                conn.execute(
                    "SELECT id FROM company_notes WHERE user_id=? AND dept=? ORDER BY sort_order ASC, id ASC",
                    (user_id, dept),
                ).fetchall(),
                start=1,
            ):
                conn.execute("UPDATE company_notes SET sort_order=? WHERE id=?", (i, s["id"]))
        conn.commit()
    return company_overview(user_id)


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
    total = 7
    pct = int(round(100.0 * done / total)) if total else 0
    return {
        "items": items,
        "progress": {
            "done": done,
            "total": total,
            "pct": pct,
            "label": f"已勾选 {done}/{total}",
        },
    }


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


def list_hospitals(
    q: str = "",
    country: str = "",
    region: str = "",
    intl: str | int | bool | None = None,
) -> list[dict[str, Any]]:
    """筛选医院。region=国内|国外；intl=1 仅国际患者友好（不改医院数据）。"""
    sql = "SELECT * FROM hospitals WHERE 1=1"
    args: list[Any] = []
    region = str(region or "").strip()
    if region in ("国内", "domestic", "cn"):
        sql += " AND country=?"
        args.append("中国")
    elif region in ("国外", "international", "intl", "overseas"):
        sql += " AND country<>?"
        args.append("中国")
    if country:
        sql += " AND country=?"
        args.append(country)
    intl_on = False
    if isinstance(intl, bool):
        intl_on = intl
    else:
        raw = str(intl or "").strip().lower()
        intl_on = raw in ("1", "true", "yes", "intl", "on")
    if intl_on:
        sql += " AND intl=1"
    if q:
        sql += " AND (name LIKE ? OR city LIKE ? OR dept LIKE ? OR tags LIKE ?)"
        like = f"%{q}%"
        args.extend([like, like, like, like])
    sql += " ORDER BY country, city, name"
    with connect() as conn:
        rows = conn.execute(sql, args).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def get_hospital(hospital_id: int) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM hospitals WHERE id=?", (hospital_id,)).fetchone()
    return row_to_dict(row)


def add_med_intent(user_id: int, hospital_id: int | None, note: str) -> dict[str, Any]:
    now = time.time()
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO med_intents (user_id, hospital_id, note, status, created_at) "
            "VALUES (?,?,?,?,?)",
            (user_id, hospital_id, note, "open", now),
        )
        conn.commit()
        rid = cur.lastrowid
    audit(user_id, "med.intent", f"hospital={hospital_id or '-'}")
    return get_med_intent(user_id, int(rid or 0))


def list_med_intents(
    user_id: int = 1,
    limit: int = 40,
    include_cancelled: bool = True,
    status: str = "",
) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT m.*, h.name AS hospital_name, h.country AS hospital_country, "
            "h.city AS hospital_city, h.dept AS hospital_dept "
            "FROM med_intents m LEFT JOIN hospitals h ON h.id = m.hospital_id "
            "WHERE m.user_id=? ORDER BY m.id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    items = [row_to_dict(r) for r in rows]  # type: ignore[misc]
    if not include_cancelled:
        items = [i for i in items if (i or {}).get("status") != "cancelled"]
    for it in items:
        if not it:
            continue
        st = it.get("status") or "pending"
        if st == "open":
            st = "pending"
            it["status"] = "pending"
        it["status_label"] = {
            "pending": "待联系",
            "open": "待联系",
            "contacted": "已联系",
            "cancelled": "已取消",
            "done": "已完成",
        }.get(st, st)
    want = str(status or "").strip().lower()
    if want in ("pending", "open", "contacted", "cancelled", "done"):
        if want == "open":
            want = "pending"
        items = [
            i
            for i in items
            if (i.get("status") or "") == want
            or (want == "pending" and (i.get("status") or "") in ("pending", "open"))
        ]
    return items


def get_med_intent(user_id: int, intent_id: int) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute(
            "SELECT m.*, h.name AS hospital_name, h.country AS hospital_country, "
            "h.city AS hospital_city, h.dept AS hospital_dept, h.tags AS hospital_tags "
            "FROM med_intents m LEFT JOIN hospitals h ON h.id = m.hospital_id "
            "WHERE m.user_id=? AND m.id=?",
            (user_id, intent_id),
        ).fetchone()
    if not row:
        raise ValueError("意向单不存在")
    it = row_to_dict(row)
    assert it is not None
    st = it.get("status") or "open"
    it["status_label"] = {"open": "进行中", "cancelled": "已撤回", "done": "已完成"}.get(st, st)
    return it


def cancel_med_intent(user_id: int, intent_id: int) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM med_intents WHERE id=? AND user_id=?", (intent_id, user_id)
        ).fetchone()
        if not row:
            raise ValueError("意向单不存在")
        if (row["status"] or "open") == "cancelled":
            raise ValueError("该意向已撤回")
        conn.execute(
            "UPDATE med_intents SET status='cancelled' WHERE id=?", (intent_id,)
        )
        conn.commit()
    audit(user_id, "med.intent.cancel", f"id={intent_id}")
    return get_med_intent(user_id, intent_id)


def get_travel(user_id: int = 1) -> dict[str, Any]:
    with connect() as conn:
        row = row_to_dict(
            conn.execute("SELECT * FROM travel_fund WHERE user_id=?", (user_id,)).fetchone()
        )
    if not row:
        row = {"user_id": user_id, "balance": 0.0, "updated_at": time.time()}
    balance = float(row.get("balance") or 0)
    threshold = 2000.0
    last_refund = None
    with connect() as conn:
        refund_row = conn.execute(
            "SELECT * FROM ledger WHERE user_id=? AND kind='travel_refund' ORDER BY id DESC LIMIT 1",
            (user_id,),
        ).fetchone()
        if refund_row:
            last_refund = row_to_dict(refund_row)
    row["threshold"] = threshold
    row["met"] = balance >= threshold
    row["meets_threshold"] = balance >= threshold
    row["last_refund"] = last_refund
    shortfall = max(0.0, threshold - balance)
    row["shortfall"] = shortfall
    row["progress_pct"] = (
        100 if threshold <= 0 else min(100, int(round(100.0 * balance / threshold)))
    )
    row["progress_label"] = (
        "已达建议门槛" if balance >= threshold else f"还差 ¥{shortfall:.0f}"
    )
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
    audit(user_id, "checkin", "生存报备打卡")
    return u


def checkin_history(user_id: int = 1, limit: int = 20) -> list[dict[str, Any]]:
    """最近 N 次报备时间（只读；来自 ledger，不改外呼状态机）。"""
    limit = max(1, min(int(limit or 20), 100))
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, note, created_at FROM ledger WHERE user_id=? AND kind='checkin' "
            "ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    items = [
        {
            "id": r["id"],
            "at": r["created_at"],
            "note": r["note"] or "生存报备",
        }
        for r in rows
    ]
    if not items:
        u = get_user(user_id)
        if u.get("last_checkin_at"):
            items = [
                {
                    "id": 0,
                    "at": u["last_checkin_at"],
                    "note": "最近一次报备",
                }
            ]
    return items


def onboarding_status(user_id: int = 1) -> dict[str, Any]:
    """首次引导三步：报备设置 → 备用联系人 → 交割至少一条。"""
    u = get_user(user_id)
    contacts = u.get("backup_contacts") or []
    contacts_ok = any(
        str(c.get("name") or "").strip() and str(c.get("phone") or "").strip() for c in contacts
    )
    legacy_n = len(list_legacy(user_id))
    checkin_ok = bool(u.get("checkin_interval_hours")) and bool(u.get("grace_hours") is not None)
    # 报备设置：间隔 + 冷静期已配置（演示默认即有）；执行人有则更完整
    steps = [
        {
            "id": "checkin",
            "title": "报备设置",
            "hint": "设定报备间隔与冷静期，安心节奏由你掌握。",
            "done": checkin_ok,
            "go": "settings",
        },
        {
            "id": "contacts",
            "title": "备用联系人",
            "hint": "至少一位可联系的家人或朋友。",
            "done": contacts_ok,
            "go": "settings",
        },
        {
            "id": "legacy",
            "title": "交割至少一条",
            "hint": "先写一条设备或账号安排即可。",
            "done": legacy_n >= 1,
            "go": "legacy",
        },
    ]
    done_n = sum(1 for s in steps if s["done"])
    return {
        "steps": steps,
        "done": done_n,
        "total": len(steps),
        "complete": done_n == len(steps),
    }


def export_data_pack(user_id: int = 1) -> dict[str, Any]:
    """一键导出：交割 + 备忘 + 受益人脱敏 JSON（演示包）。"""
    u = get_user(user_id)
    legacy = list_legacy(user_id)
    assets = list_assets(user_id)
    bene = list_beneficiaries(user_id)

    def mask_phone(p: str) -> str:
        s = str(p or "").strip()
        if len(s) < 7:
            return "***" if s else ""
        return s[:3] + "****" + s[-4:]

    def mask_contact(c: str) -> str:
        s = str(c or "").strip()
        if not s:
            return ""
        if s.isdigit() or (s.startswith("+") and s[1:].isdigit()):
            return mask_phone(s)
        if "@" in s:
            name, _, domain = s.partition("@")
            return (name[:1] + "***@" + domain) if domain else "***"
        if len(s) <= 2:
            return "*" * len(s)
        return s[0] + "*" * (len(s) - 2) + s[-1]

    return {
        "brand": "电子继承 App",
        "brand_en": "E-Inherit",
        "domain": "einherit.cn",
        "exported_at": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime()),
        "user": {
            "name": u.get("name"),
            "executor_name": u.get("executor_name") or "",
            "checkin_interval_hours": u.get("checkin_interval_hours"),
            "grace_hours": u.get("grace_hours"),
            "backup_contacts": [
                {
                    "name": c.get("name"),
                    "relation": c.get("relation"),
                    "phone": mask_phone(c.get("phone") or ""),
                }
                for c in (u.get("backup_contacts") or [])
            ],
        },
        "legacy_items": [
            {
                "title": it.get("title"),
                "category": it.get("category"),
                "action": it.get("action"),
                "beneficiary": it.get("beneficiary"),
                "dept": it.get("dept"),
                "factory_reset": bool(it.get("factory_reset")),
                "clear_photos": bool(it.get("clear_photos")),
                "clear_chats": bool(it.get("clear_chats")),
                "notes": it.get("notes") or "",
            }
            for it in legacy
        ],
        "assets": [
            {
                "platform": a.get("platform"),
                "account_hint": a.get("account_hint"),
                "summary": a.get("summary"),
                "dispose_note": a.get("dispose_note"),
                "dept": a.get("dept"),
                "visibility": a.get("visibility"),
            }
            for a in assets
        ],
        "beneficiaries": [
            {
                "name": b.get("name"),
                "role": b.get("role"),
                "contact": mask_contact(b.get("contact") or ""),
                "note": b.get("note") or "",
            }
            for b in bene
        ],
        "notice": "演示导出包：联系方式已脱敏；不含完整密码/私钥。",
        "summary": {
            "legacy_count": len(legacy),
            "assets_count": len(assets),
            "beneficiaries_count": len(bene),
            "backup_contacts_count": len(u.get("backup_contacts") or []),
            "exported_at": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime()),
            "domain": "einherit.cn",
            "text": (
                f"电子继承导出摘要 · 交割 {len(legacy)} · 备忘 {len(assets)} · "
                f"受益人 {len(bene)} · 备用联系人 {len(u.get('backup_contacts') or [])} · "
                f"einherit.cn · {time.strftime('%Y-%m-%d %H:%M', time.localtime())}"
            ),
        },
    }


def export_pack_summary(user_id: int = 1) -> dict[str, Any]:
    """导出包条数摘要（便于一键复制；不改导出本体）。"""
    pack = export_data_pack(user_id)
    return {"summary": pack.get("summary") or {}, "domain": pack.get("domain") or "einherit.cn"}


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


LEDGER_KIND_LABELS = {
    "membership": "会员年费",
    "travel_deposit": "差旅预存",
    "travel_refund": "差旅退回",
    "checkin": "生存报备",
}


def ledger_kind_label(kind: str) -> str:
    k = str(kind or "").strip()
    if k in LEDGER_KIND_LABELS:
        return LEDGER_KIND_LABELS[k]
    if k.startswith("travel"):
        return "差旅相关"
    if not k:
        return "其他流水"
    return k


def recent_ledger(user_id: int = 1, limit: int = 20) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM ledger WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    out: list[dict[str, Any]] = []
    for r in rows:
        item = row_to_dict(r)
        if not item:
            continue
        item["kind_label"] = ledger_kind_label(str(item.get("kind") or ""))
        out.append(item)
    return out


def recent_calls(user_id: int = 1, limit: int = 20) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM call_log WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def _action_bucket(action: str) -> str:
    a = str(action or "")
    if "转赠" in a:
        return "转赠"
    if "销售" in a or "变现" in a:
        return "变现"
    if "销毁" in a:
        return "销毁"
    if "清除" in a:
        return "清除"
    return "其他"


def legacy_action_counts(user_id: int = 1) -> dict[str, Any]:
    """交割列表只读小计：销毁 / 变现 / 转赠（及清除）。"""
    items = list_legacy(user_id)
    buckets = ["销毁", "变现", "转赠", "清除"]
    counts = {b: 0 for b in buckets}
    for it in items:
        b = _action_bucket(it.get("action"))
        if b in counts:
            counts[b] += 1
    return {
        "destroy": counts["销毁"],
        "sale": counts["变现"],
        "gift": counts["转赠"],
        "clear": counts["清除"],
        "total": len(items),
        "by_action": [{"action": b, "count": counts[b]} for b in buckets],
        "label": "当前列表只读小计",
    }


def legacy_progress(user_id: int = 1) -> dict[str, Any]:
    """按处置类型统计交割条目完成度（有条目=已填该桶）。"""
    items = list_legacy(user_id)
    buckets = ["销毁", "变现", "转赠", "清除"]
    counts = {b: 0 for b in buckets}
    for it in items:
        b = _action_bucket(it.get("action"))
        if b in counts:
            counts[b] += 1
        else:
            counts.setdefault("其他", 0)
            counts["其他"] += 1
    filled = sum(1 for b in buckets if counts.get(b, 0) > 0)
    total = len(buckets)
    by_action = [{"action": b, "count": counts[b], "filled": counts[b] > 0} for b in buckets]
    return {
        "total_items": len(items),
        "by_action": by_action,
        "filled_types": filled,
        "total_types": total,
        "pct": int(filled / total * 100) if total else 0,
        "action_counts": {
            "destroy": counts["销毁"],
            "sale": counts["变现"],
            "gift": counts["转赠"],
            "clear": counts["清除"],
        },
    }


def handover_checklist(user_id: int = 1) -> dict[str, Any]:
    """Inherit 交割待办：给执行人的冷手册摘要。"""
    u = get_user(user_id)
    items = list_legacy(user_id)
    heirs = list_beneficiaries(user_id)
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
                "action": it.get("action") or "",
                "beneficiary": it.get("beneficiary") or "",
                "factory_reset": bool(it.get("factory_reset")),
                "clear_photos": bool(it.get("clear_photos")),
                "clear_chats": bool(it.get("clear_chats")),
            }
        )
    progress = legacy_progress(user_id)
    now = time.time()
    return {
        "brand": "E-Inherit 交割手册",
        "domain": "einherit.cn",
        "executor": u.get("executor_name") or "（未指定执行人）",
        "member": u.get("is_member"),
        "todos": todos,
        "progress": progress,
        "item_count": len(todos),
        "beneficiary_count": len(heirs),
        "generated_at": now,
        "generated_at_iso": time.strftime("%Y-%m-%d %H:%M", time.localtime(now)),
        "heirs": [
            {
                "name": h.get("name"),
                "role": h.get("role"),
                "relation": h.get("relation") or "",
            }
            for h in heirs
        ],
        "export_path": "/export/handover.html",
        "note": "本清单为客观资产交割待办，不依赖情感授权。",
        "share_hint": "仅执行人持有，勿转发至群聊或公开渠道。",
        "export_align_note": (
            f"当前手册 {len(todos)} 条，与导出页条目数一致；"
            "打开打印页即可核对。"
        ),
    }


def icu_pack_generated(user_id: int = 1) -> bool:
    """急症前清册是否已写入（按模板标题匹配）。"""
    titles = {tpl["title"] for tpl in ICU_PACK}
    found = {it.get("title") for it in list_legacy(user_id)}
    return titles.issubset(found)


def today_todos(user_id: int = 1) -> dict[str, Any]:
    """首页三件套：今日报备 / 急症清册 / 交割未完成条数。只读聚合，不改状态机。"""
    u = get_user(user_id)
    hand = handover_checklist(user_id)
    open_count = len(hand.get("todos") or [])
    if u.get("checkin_overdue"):
        checkin_label = "报备稍有延迟"
        checkin_done = False
    elif u.get("checkin_in_grace"):
        checkin_label = "报备点已过，仍在冷静期"
        checkin_done = False
    else:
        checkin_label = "今日报备正常"
        checkin_done = True
    icu_done = icu_pack_generated(user_id)
    state = u.get("escalation_state") or "ok"
    if u.get("checkin_in_grace") and state == "ok":
        state = "grace"
    return {
        "items": [
            {
                "key": "checkin",
                "title": "今日报备",
                "done": checkin_done,
                "detail": checkin_label,
                "go": "checkin",
            },
            {
                "key": "icu",
                "title": "急症前清册",
                "done": icu_done,
                "detail": "已生成" if icu_done else "尚未生成",
                "go": "icu",
            },
            {
                "key": "handover",
                "title": "交割未完成",
                "done": open_count == 0,
                "detail": f"{open_count} 条待办" if open_count else "暂无待办条目",
                "go": "handover" if open_count else "legacy",
            },
        ],
        "escalation": {
            "state": state,
            "label": ESCALATION_LABELS.get(state, state),
            "calls": recent_calls(user_id, 3),
        },
        "open_handover_count": open_count,
        "icu_generated": icu_done,
    }


def apply_icu_pack(user_id: int = 1, beneficiary: str = "") -> list[dict[str, Any]]:
    """一键写入急症前清册（相册/聊天/出厂/虚拟资产）。"""
    created: list[dict[str, Any]] = []
    for tpl in ICU_PACK:
        payload = dict(tpl)
        if beneficiary:
            payload["beneficiary"] = beneficiary
        created.append(add_legacy(user_id, payload))
    audit(user_id, "icu.pack", f"count={len(created)}")
    return created


def _icu_pack_key(idx: int, tpl: dict[str, Any]) -> str:
    return f"icu_{idx}_{tpl.get('title') or idx}"


def icu_checklist_state(user_id: int = 1) -> dict[str, Any]:
    with connect() as conn:
        rows = {
            r["pack_key"]: bool(r["checked"])
            for r in conn.execute(
                "SELECT pack_key, checked FROM icu_checklist WHERE user_id=?",
                (user_id,),
            ).fetchall()
        }
    items = []
    for i, tpl in enumerate(ICU_PACK):
        key = _icu_pack_key(i, tpl)
        items.append({**tpl, "pack_key": key, "checked": bool(rows.get(key, False))})
    done = sum(1 for it in items if it["checked"])
    total = len(items) or 1
    pct = int(round(done / total * 100)) if items else 0
    return {
        "items": items,
        "done": done,
        "total": len(items),
        "pct": pct,
        "progress_label": f"急症前清册进度 {done}/{len(items)}",
    }


def set_icu_checklist(user_id: int, pack_key: str, checked: bool) -> dict[str, Any]:
    key = str(pack_key or "").strip()
    if not key:
        raise ValueError("缺少清册项")
    valid = {_icu_pack_key(i, t) for i, t in enumerate(ICU_PACK)}
    if key not in valid:
        raise ValueError("清册项无效")
    now = time.time()
    with connect() as conn:
        conn.execute(
            "INSERT INTO icu_checklist (user_id, pack_key, checked, updated_at) VALUES (?,?,?,?) "
            "ON CONFLICT(user_id, pack_key) DO UPDATE SET checked=excluded.checked, "
            "updated_at=excluded.updated_at",
            (user_id, key, 1 if checked else 0, now),
        )
        conn.commit()
    return icu_checklist_state(user_id)


def icu_pack_items(user_id: int = 1) -> list[dict[str, Any]]:
    """从交割条目中挑出急症清册模板标题（已写入则可导出摘要）。"""
    titles = {t["title"] for t in ICU_PACK}
    return [it for it in list_legacy(user_id) if it.get("title") in titles]


def icu_pack_ready(user_id: int = 1) -> bool:
    found = {it["title"] for it in icu_pack_items(user_id)}
    return all(t["title"] in found for t in ICU_PACK)


def _aftercare_status_meta(row: dict[str, Any], ready: bool) -> dict[str, str]:
    """冷静状态标签：待授权 / 可执行 / 已提交（不恐吓）。"""
    raw = str(row.get("status") or "queued")
    coop = str(row.get("coop_state") or "pending")
    if raw in ("done", "completed", "closed"):
        return {"status_key": "done", "status_label": "已完成", "status_tone": "done"}
    if not ready or raw in ("draft", "pending_auth"):
        return {"status_key": "pending_auth", "status_label": "待授权", "status_tone": "wait"}
    if coop == "cooperative" or raw in ("ready", "executable"):
        return {"status_key": "executable", "status_label": "可执行", "status_tone": "ready"}
    return {"status_key": "submitted", "status_label": "已提交", "status_tone": "queued"}


def list_aftercare(
    user_id: int = 1, service_type: str = ""
) -> list[dict[str, Any]]:
    ready = auth_video_ready(user_id)
    st = str(service_type or "").strip()
    with connect() as conn:
        if st:
            rows = conn.execute(
                "SELECT * FROM aftercare_jobs WHERE user_id=? AND service_type=? "
                "ORDER BY id DESC",
                (user_id, st),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM aftercare_jobs WHERE user_id=? ORDER BY id DESC",
                (user_id,),
            ).fetchall()
    out: list[dict[str, Any]] = []
    for r in rows:
        item = row_to_dict(r)
        if not item:
            continue
        item.update(_aftercare_status_meta(item, ready))
        item["travel_budget_label"] = f"¥{float(item.get('travel_budget') or 0):.0f}"
        out.append(item)
    return out


def add_aftercare(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    if not auth_video_ready(user_id):
        raise ValueError("请先上传授权说明视频（须含：问候 + 对我司处置授权 + 处置思路）")
    now = time.time()
    title = str(payload.get("title") or "").strip() or "电子数据善后"
    service_type = str(payload.get("service_type") or "delete_data")
    contact_window = str(payload.get("contact_window") or "").strip()
    with connect() as conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(aftercare_jobs)").fetchall()}
        if "contact_window" not in cols:
            conn.execute(
                "ALTER TABLE aftercare_jobs ADD COLUMN contact_window TEXT DEFAULT ''"
            )
        cur = conn.execute(
            "INSERT INTO aftercare_jobs (user_id, service_type, title, city, visit_pref, "
            "travel_budget, coop_state, status, notes, contact_window, created_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
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
                contact_window,
                now,
            ),
        )
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM aftercare_jobs WHERE id=?", (rid,)).fetchone()
    audit(user_id, "aftercare.submit", title)
    item = row_to_dict(row)
    assert item is not None
    item.update(_aftercare_status_meta(item, True))
    item["travel_budget_label"] = f"¥{float(item.get('travel_budget') or 0):.0f}"
    return item


def _require_executor_region(payload: dict[str, Any]) -> tuple[str, str, str]:
    province = str(payload.get("province") or "").strip()
    city = str(payload.get("city") or "").strip()
    region = str(payload.get("region") or "").strip()
    if not province:
        raise ValueError("请填写省份/直辖市")
    if not city:
        raise ValueError("请填写城市")
    if not region:
        raise ValueError("请填写区域（区/县）")
    return province, city, region


def list_executor_leads(limit: int = 40) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM executor_leads ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def add_executor_lead(payload: dict[str, Any]) -> dict[str, Any]:
    now = time.time()
    name = str(payload.get("name") or "").strip()
    if not name:
        raise ValueError("请填写姓名")
    province, city, region = _require_executor_region(payload)
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO executor_leads (name, province, city, region, phone, note, created_at) "
            "VALUES (?,?,?,?,?,?,?)",
            (
                name,
                province,
                city,
                region,
                str(payload.get("phone") or ""),
                str(payload.get("note") or ""),
                now,
            ),
        )
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM executor_leads WHERE id=?", (rid,)).fetchone()
    return row_to_dict(row)  # type: ignore[return-value]


def list_executor_leads(limit: int = 30) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM executor_leads ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]
def update_executor_lead(lead_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    if lead_id <= 0:
        raise ValueError("无效的加盟记录")
    with connect() as conn:
        row = conn.execute("SELECT * FROM executor_leads WHERE id=?", (lead_id,)).fetchone()
        if not row:
            raise ValueError("未找到该加盟意向")
    name = str(payload.get("name") or row["name"] or "").strip()
    if not name:
        raise ValueError("请填写姓名")
    merged = {
        "province": payload.get("province", row["province"] if "province" in row.keys() else ""),
        "city": payload.get("city", row["city"]),
        "region": payload.get("region", row["region"] if "region" in row.keys() else ""),
    }
    province, city, region = _require_executor_region(merged)
    phone = str(payload.get("phone") if "phone" in payload else row["phone"] or "")
    note = str(payload.get("note") if "note" in payload else row["note"] or "")
    with connect() as conn:
        conn.execute(
            "UPDATE executor_leads SET name=?, province=?, city=?, region=?, phone=?, note=? WHERE id=?",
            (name, province, city, region, phone, note, lead_id),
        )
        conn.commit()
        out = conn.execute("SELECT * FROM executor_leads WHERE id=?", (lead_id,)).fetchone()
    return row_to_dict(out)  # type: ignore[return-value]


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


_AUDIT_LABELS = {
    "checkin": "生存报备",
    "beneficiary.add": "新增受益人",
    "beneficiary.update": "更新受益人",
    "beneficiary.delete": "移除受益人",
    "emergency.request": "紧急取用申请",
    "emergency.approved": "紧急取用已批准",
    "emergency.denied": "紧急取用已拒绝",
    "emergency.auto_granted": "紧急取用到期放行",
    "handover.snapshot": "交割快照",
    "auth_video.upload": "授权视频",
    "aftercare.submit": "善后工单",
    "med.intent": "医旅意向",
    "med.intent.cancel": "撤回医旅意向",
    "mindmap.save": "保存大脑图谱",
    "legacy.change": "交割变更",
}


AUDIT_TYPE_LABELS = {
    "checkin": "报备",
    "legacy": "交割",
    "aftercare": "工单",
    "auth": "授权",
}


def _audit_type(action: str) -> str:
    a = str(action or "")
    if a.startswith("checkin") or a == "checkin":
        return "checkin"
    if a.startswith("legacy") or a.startswith("handover"):
        return "legacy"
    if a.startswith("aftercare"):
        return "aftercare"
    if (
        a.startswith("auth_video")
        or a.startswith("beneficiary")
        or a.startswith("emergency")
    ):
        return "auth"
    return "other"


def recent_audit(
    user_id: int = 1, limit: int = 30, type_filter: str = ""
) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM audit_log WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, max(limit, 80)),
        ).fetchall()
    items: list[dict[str, Any]] = []
    want = str(type_filter or "").strip()
    for r in rows:
        item = row_to_dict(r)
        if not item:
            continue
        action = str(item.get("action") or "")
        kind = _audit_type(action)
        item["type"] = kind
        item["type_label"] = AUDIT_TYPE_LABELS.get(kind, "其他")
        item["label"] = _AUDIT_LABELS.get(action, action or "记录")
        item["created_at_iso"] = time.strftime(
            "%Y-%m-%d %H:%M", time.localtime(float(item.get("created_at") or 0))
        )
        if want and kind != want:
            continue
        items.append(item)
        if len(items) >= limit:
            break
    return items


def list_beneficiaries(user_id: int = 1, role: str = "") -> list[dict[str, Any]]:
    role = str(role or "").strip().lower()
    with connect() as conn:
        if role:
            rows = conn.execute(
                "SELECT * FROM beneficiaries WHERE user_id=? AND lower(role)=? "
                "ORDER BY id DESC",
                (user_id, role),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM beneficiaries WHERE user_id=? ORDER BY id DESC",
                (user_id,),
            ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def add_beneficiary(user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name") or "").strip()
    if not name:
        raise ValueError("请填写受益人姓名")
    hint = str(payload.get("passphrase_hint") or "").strip()
    if hint and ("密码" in hint or "password" in hint.lower() or len(hint) > 80):
        raise ValueError("请只登记口令提示（如「生日后四位」），不要写入真实密码")
    now = time.time()
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO beneficiaries (user_id, name, role, relation, contact, note, "
            "passphrase_hint, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (
                user_id,
                name,
                str(payload.get("role") or "heir"),
                str(payload.get("relation") or ""),
                str(payload.get("contact") or ""),
                str(payload.get("note") or ""),
                hint,
                now,
            ),
        )
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM beneficiaries WHERE id=?", (rid,)).fetchone()
    audit(user_id, "beneficiary.add", name)
    return row_to_dict(row)  # type: ignore[return-value]


def update_beneficiary(user_id: int, bene_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM beneficiaries WHERE id=? AND user_id=?", (bene_id, user_id)
        ).fetchone()
        if not row:
            raise ValueError("受益人不存在")
        name = str(payload.get("name") if "name" in payload else row["name"]).strip()
        if not name:
            raise ValueError("请填写受益人姓名")
        hint = str(
            payload.get("passphrase_hint")
            if "passphrase_hint" in payload
            else (row["passphrase_hint"] if "passphrase_hint" in row.keys() else "")
        ).strip()
        if hint and ("密码" in hint or "password" in hint.lower() or len(hint) > 80):
            raise ValueError("请只登记口令提示（如「生日后四位」），不要写入真实密码")
        relation = str(
            payload.get("relation")
            if "relation" in payload
            else (row["relation"] if "relation" in row.keys() else "")
        )
        role = str(payload.get("role") if "role" in payload else row["role"] or "heir")
        contact = str(payload.get("contact") if "contact" in payload else row["contact"] or "")
        note = str(payload.get("note") if "note" in payload else row["note"] or "")
        conn.execute(
            "UPDATE beneficiaries SET name=?, role=?, relation=?, contact=?, note=?, "
            "passphrase_hint=? WHERE id=?",
            (name, role, relation, contact, note, hint, bene_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM beneficiaries WHERE id=?", (bene_id,)).fetchone()
    audit(user_id, "beneficiary.update", name)
    return row_to_dict(row)  # type: ignore[return-value]


def delete_beneficiary(user_id: int, bene_id: int) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM beneficiaries WHERE id=? AND user_id=?", (bene_id, user_id)
        ).fetchone()
        if not row:
            raise ValueError("受益人不存在")
        name = row["name"]
        conn.execute("DELETE FROM beneficiaries WHERE id=?", (bene_id,))
        conn.commit()
    audit(user_id, "beneficiary.delete", str(name))
    return {"ok": True, "id": bene_id, "name": name}


def _fmt_wait_remaining(seconds: int) -> str:
    seconds = max(0, int(seconds or 0))
    if seconds <= 0:
        return "等待期已满"
    days, rem = divmod(seconds, 86400)
    hours, rem = divmod(rem, 3600)
    mins = rem // 60
    parts: list[str] = []
    if days:
        parts.append(f"{days} 天")
    if hours:
        parts.append(f"{hours} 小时")
    if mins and not days:
        parts.append(f"{mins} 分")
    if not parts:
        parts.append("不到 1 分钟")
    return "约还剩 " + " ".join(parts)


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
    now = time.time()
    out: list[dict[str, Any]] = []
    for r in rows:
        it = row_to_dict(r)
        if not it:
            continue
        decide_by = float(it.get("decide_by") or 0)
        if str(it.get("status") or "") == "pending" and decide_by:
            rem = max(0, int(decide_by - now))
            it["wait_remaining_seconds"] = rem
            it["wait_remaining_label"] = _fmt_wait_remaining(rem)
        else:
            it["wait_remaining_seconds"] = 0
            it["wait_remaining_label"] = ""
        out.append(it)
    return out


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


def _snapshot_summary(payload_text: str) -> dict[str, Any]:
    try:
        data = json.loads(payload_text or "{}")
    except json.JSONDecodeError:
        data = {}
    todos = data.get("todos") or []
    titles = [str(t.get("title") or "") for t in todos[:5] if isinstance(t, dict)]
    return {
        "item_count": len(todos) if isinstance(todos, list) else 0,
        "executor": data.get("executor") or "",
        "titles": titles,
        "heirs": data.get("heirs") or [],
    }


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
            "SELECT id, user_id, label, created_at, payload FROM handover_snapshots WHERE id=?",
            (rid,),
        ).fetchone()
    audit(user_id, "handover.snapshot", label)
    item = row_to_dict(row)
    assert item is not None
    item["summary"] = _snapshot_summary(str(item.pop("payload", "") or ""))
    return item


def list_snapshots(user_id: int = 1, limit: int = 20) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, user_id, label, created_at, payload FROM handover_snapshots "
            "WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    out: list[dict[str, Any]] = []
    for r in rows:
        item = row_to_dict(r)
        if not item:
            continue
        item["summary"] = _snapshot_summary(str(item.pop("payload", "") or ""))
        out.append(item)
    return out


def get_snapshot(user_id: int, snap_id: int) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute(
            "SELECT id, user_id, label, created_at, payload FROM handover_snapshots "
            "WHERE id=? AND user_id=?",
            (snap_id, user_id),
        ).fetchone()
    if not row:
        raise ValueError("快照不存在")
    item = row_to_dict(row)
    assert item is not None
    payload = str(item.pop("payload", "") or "")
    item["summary"] = _snapshot_summary(payload)
    try:
        item["checklist"] = json.loads(payload)
    except json.JSONDecodeError:
        item["checklist"] = {}
    return item


def latest_snapshot(user_id: int = 1) -> dict[str, Any] | None:
    items = list_snapshots(user_id, limit=1)
    return items[0] if items else None


def handover_export_html(user_id: int = 1) -> str:
    """可打印交割手册（浏览器打印→PDF）。"""
    hand = handover_checklist(user_id)
    u = get_user(user_id)
    items = hand.get("todos") or []
    heirs = hand.get("heirs") or []
    heir_line = "、".join(
        f"{h.get('name')}（{h.get('relation') or h.get('role') or '受益人'}）"
        for h in heirs
        if h.get("name")
    ) or "尚未登记受益人"
    rows = "".join(
        f"<tr><td>{_esc(i.get('title'))}</td><td>{_esc(' · '.join(i.get('ops') or []))}</td>"
        f"<td>{_esc(i.get('beneficiary') or '—')}</td>"
        f"<td>{_esc(i.get('dept'))}</td><td>{_esc(i.get('notes'))}</td></tr>"
        for i in items
    )
    when = hand.get("generated_at_iso") or time.strftime("%Y-%m-%d %H:%M", time.localtime())
    count = int(hand.get("item_count") or len(items))
    return f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<title>交割手册 · { _esc(u.get('name') or '主人') }</title>
<style>
body{{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;margin:24px;color:#1a1a1a}}
h1{{font-size:22px;margin:0 0 8px}} .meta{{color:#666;font-size:13px;margin-bottom:20px}}
table{{border-collapse:collapse;width:100%;font-size:13px}}
th,td{{border:1px solid #ccc;padding:8px;text-align:left}} th{{background:#f5f5f5}}
.disclaimer{{margin-top:24px;font-size:12px;color:#888;line-height:1.5}}
.footer-mark{{margin-top:28px;padding-top:12px;border-top:1px dashed #ccc;font-size:12px;color:#666}}
@media print{{button{{display:none}}}}
</style></head><body>
<button onclick="window.print()">打印 / 另存 PDF</button>
<h1>电子继承 · 交割手册</h1>
<div class="meta">主人：{_esc(u.get('name'))} · 执行人：{_esc(u.get('executor_name') or '未指定')} · 生成：{when} · 条目 {count}</div>
<div class="meta">给谁：{_esc(heir_line)}</div>
<table><thead><tr><th>事项</th><th>动作</th><th>接收人</th><th>部门</th><th>备注</th></tr></thead>
<tbody>{rows or '<tr><td colspan="5">暂无条目</td></tr>'}</tbody></table>
<p class="disclaimer">本手册仅供授权执行人善后参考，不构成法律文件；紧急取用须经等待期或主人确认。
对标开源：Legacy Vault 紧急等待期 · Morrígan 版本快照 · 打印交付。</p>
<p class="footer-mark">电子继承 · 仅执行人持有 · 请勿转发群聊或公开渠道 · einherit.cn</p>
</body></html>"""


def icu_export_html(user_id: int = 1) -> str:
    """急症前冷静摘要页：入院前可打开/打印带走。"""
    u = get_user(user_id)
    items = icu_pack_items(user_id)
    ready = icu_pack_ready(user_id)
    # 若尚未写入，仍展示模板预览（只读说明）
    source = items if items else [
        {
            "title": t["title"],
            "action": t["action"],
            "notes": t.get("notes") or "",
            "beneficiary": "",
            "dept": t.get("dept") or "",
        }
        for t in ICU_PACK
    ]
    rows = "".join(
        f"<tr><td>{_esc(i.get('title'))}</td><td>{_esc(i.get('action'))}</td>"
        f"<td>{_esc(i.get('beneficiary') or '—')}</td><td>{_esc(i.get('notes'))}</td></tr>"
        for i in source
    )
    when = time.strftime("%Y-%m-%d %H:%M", time.localtime())
    status = "已写入交割手册，可带走打印" if ready else "预览模板（生成清册后将带入您的安排）"
    return f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<title>急症前清册摘要 · {_esc(u.get('name') or '主人')}</title>
<style>
body{{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;margin:24px;color:#1a1a1a;line-height:1.55}}
h1{{font-size:22px;margin:0 0 8px}} .meta{{color:#666;font-size:13px;margin-bottom:16px}}
.calm{{background:#f3f7f4;border:1px solid #d5e4da;border-radius:10px;padding:12px 14px;margin-bottom:18px;font-size:13px;color:#2f4f3e}}
table{{border-collapse:collapse;width:100%;font-size:13px}}
th,td{{border:1px solid #ccc;padding:8px;text-align:left}} th{{background:#f5f5f5}}
.disclaimer{{margin-top:24px;font-size:12px;color:#888}}
@media print{{button{{display:none}}}}
</style></head><body>
<button onclick="window.print()">打印 / 另存 PDF</button>
<h1>急症前清册 · 冷静摘要</h1>
<div class="meta">主人：{_esc(u.get('name'))} · 执行人：{_esc(u.get('executor_name') or '未指定')} · 导出：{when}</div>
<div class="calm">{_esc(status)} · 按自己的节奏安排即可，不必一次做完。</div>
<table><thead><tr><th>事项</th><th>处置</th><th>接收人</th><th>备注</th></tr></thead>
<tbody>{rows}</tbody></table>
<p class="disclaimer">本页为入院前带走的冷静摘要，不构成医疗或法律文书；完整交割见「交割手册」。</p>
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
            "急症前冷静摘要 /export/icu.html",
            "置顶大脑图谱 mindmap（主人放射+长子资产树）",
            "授权说明视频门槛（问候+对我司授权+处置思路）",
            "医旅意向列表 · 执行人加盟已登记回显",
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
    latest = items[0] if items else None
    checklist = [
        {
            "key": "greeting",
            "label": "问候",
            "done": bool(latest and latest.get("has_greeting")),
            "demo_checked": bool(latest and latest.get("has_greeting")),
        },
        {
            "key": "authorize",
            "label": "授权",
            "done": bool(latest and latest.get("has_authorize")),
            "demo_checked": bool(latest and latest.get("has_authorize")),
        },
        {
            "key": "plan",
            "label": "思路",
            "done": bool(latest and latest.get("has_plan")),
            "demo_checked": bool(latest and latest.get("has_plan")),
        },
    ]
    ready = auth_video_ready(user_id)
    if ready:
        for c in checklist:
            c["done"] = True
            c["demo_checked"] = True
    done_n = sum(1 for c in checklist if c.get("done"))
    missing = [
        {"key": c["key"], "label": c["label"]}
        for c in checklist
        if not c.get("done")
    ]
    missing_labels = [m["label"] for m in missing]
    if ready:
        missing_text = "三项已齐备，可按自己的节奏提交善后工单。"
    elif missing_labels:
        missing_text = "还差：" + "、".join(missing_labels) + "。补齐后即可提交。"
    else:
        missing_text = "三项齐备后即可提交善后工单。"
    return {
        "ready": ready,
        "complete": ready,
        "complete_label": "三项齐备，可提交善后工单" if ready else "三项齐备后即可提交善后工单",
        "progress": {"done": done_n, "total": 3},
        "script": AUTH_VIDEO_SCRIPT,
        "items": items,
        "latest": latest,
        "checklist": checklist,
        "missing": missing,
        "missing_labels": missing_labels,
        "missing_text": missing_text,
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


def _mindmap_has_saved(user_id: int = 1) -> bool:
    with connect() as conn:
        row = conn.execute(
            "SELECT 1 AS ok FROM mindmap WHERE user_id=?", (user_id,)
        ).fetchone()
    return bool(row)


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


def mindmap_payload(user_id: int = 1) -> dict[str, Any]:
    """图谱 + 空态元数据（未保存自定义时 empty=true，便于前端引导）。"""
    has_saved = _mindmap_has_saved(user_id)
    return {
        "map": get_mindmap(user_id),
        "has_saved": has_saved,
        "empty": not has_saved,
        "empty_hint": "还没有保存过自己的图谱。可以先从盘点或受益人关系开始，再回来改节点。",
        "cta": {"go": "company", "label": "先去公司盘点"},
    }


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

def execution_queue(user_id: int = 1) -> dict[str, Any]:
    """只读：当前升级状态与待人工复核/待执行摘要（不改状态机）。"""
    u = get_user(user_id)
    state = u.get("escalation_state") or "ok"
    calls = recent_calls(user_id, 5)
    jobs = list_aftercare(user_id)
    pending = [
        j
        for j in jobs
        if str(j.get("status") or "") not in ("done", "completed", "closed")
    ]
    return {
        "escalation_state": state,
        "escalation_label": ESCALATION_LABELS.get(state, state),
        "in_queue": state in ("manual_review", "execution_queued", "calling_self", "calling_backup"),
        "calls": calls,
        "aftercare_open": pending[:10],
        "note": "只读展示，不在此改动外呼或退款流程。",
    }


def batch_legacy_action(user_id: int, ids: list[int], action: str) -> dict[str, Any]:
    action = str(action or "").strip()
    if action not in ("销毁", "变现", "转赠", "清除"):
        raise ValueError("处置类型请选择：销毁 / 变现 / 转赠 / 清除")
    ids = [int(i) for i in (ids or []) if i]
    if not ids:
        raise ValueError("请先勾选要批量标记的交割条目")
    with connect() as conn:
        for i in ids:
            conn.execute(
                "UPDATE legacy_items SET action=? WHERE user_id=? AND id=?",
                (action, user_id, i),
            )
        conn.commit()
    audit(user_id, "legacy.batch_action", f"{action}:{len(ids)}")
    return {"updated": len(ids), "action": action, "items": list_legacy(user_id)}


def set_asset_review_at(user_id: int, asset_id: int, review_at: str) -> dict[str, Any]:
    review_at = str(review_at or "").strip()
    with connect() as conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(assets)").fetchall()}
        if "review_at" not in cols:
            conn.execute("ALTER TABLE assets ADD COLUMN review_at TEXT DEFAULT ''")
        conn.execute(
            "UPDATE assets SET review_at=? WHERE user_id=? AND id=?",
            (review_at, user_id, asset_id),
        )
        conn.commit()
    audit(user_id, "asset.review_at", review_at or "clear")
    items = [a for a in list_assets(user_id) if int(a["id"]) == int(asset_id)]
    return {"item": items[0] if items else None}


def set_med_intent_status(user_id: int, intent_id: int, status: str) -> dict[str, Any]:
    status = str(status or "").strip()
    allowed = {"pending": "待联系", "contacted": "已联系", "cancelled": "已取消", "open": "待联系"}
    if status not in allowed and status not in allowed.values():
        # map labels
        rev = {v: k for k, v in {"pending": "待联系", "contacted": "已联系", "cancelled": "已取消"}.items()}
        status = rev.get(status, status)
    if status not in ("pending", "contacted", "cancelled", "open"):
        raise ValueError("意向状态请选择：待联系 / 已联系 / 已取消")
    with connect() as conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(med_intents)").fetchall()}
        if "status" in cols:
            conn.execute(
                "UPDATE med_intents SET status=? WHERE user_id=? AND id=?",
                (status, user_id, intent_id),
            )
        else:
            conn.execute(
                "UPDATE med_intents SET note=COALESCE(note,'') || ? WHERE user_id=? AND id=?",
                (f" [状态:{allowed.get(status, status)}]", user_id, intent_id),
            )
        conn.commit()
    audit(user_id, "med_intent.status", f"{intent_id}:{status}")
    try:
        item = get_med_intent(user_id, intent_id)
    except Exception:
        items = list_med_intents(user_id)
        item = next((x for x in items if int(x["id"]) == int(intent_id)), None)
    return {"item": item, "status_label": allowed.get(status, status)}


def import_export_pack(user_id: int, pack: dict[str, Any], *, confirm: bool = False) -> dict[str, Any]:
    """演示级导入：先预览，confirm=true 才写入交割/备忘/受益人（不覆盖密钥）。"""
    legacy = pack.get("legacy") or pack.get("legacy_items") or []
    assets = pack.get("assets") or []
    bene = pack.get("beneficiaries") or pack.get("heirs") or []
    preview = {
        "legacy_count": len(legacy),
        "assets_count": len(assets),
        "beneficiaries_count": len(bene),
        "confirm_required": True,
    }
    if not confirm:
        return {"preview": preview, "message": "请确认无误后再导入（演示）。"}
    n_l = n_a = n_b = 0
    for it in legacy:
        add_legacy(
            user_id,
            {
                "title": it.get("title") or "导入条目",
                "action": it.get("action") or "转赠",
                "notes": it.get("notes") or "",
                "dept": it.get("dept") or "admin",
                "category": it.get("category") or "导入",
                "beneficiary": it.get("beneficiary") or "",
            },
        )
        n_l += 1
    for it in assets:
        add_asset(
            user_id,
            {
                "platform": it.get("platform") or it.get("title") or "导入备忘",
                "account_hint": it.get("account_hint") or "",
                "summary": it.get("summary") or "",
                "dispose_note": it.get("dispose_note") or "转赠",
                "tag": it.get("tag") or "其他",
                "dept": it.get("dept") or "finance",
            },
        )
        n_a += 1
    for it in bene:
        try:
            add_beneficiary(
                user_id,
                {
                    "name": it.get("name") or "受益人",
                    "relation": it.get("relation") or "",
                    "role": it.get("role") or "heir",
                },
            )
            n_b += 1
        except Exception:
            pass
    audit(user_id, "export.import", f"l{n_l}/a{n_a}/b{n_b}")
    return {
        "imported": {"legacy": n_l, "assets": n_a, "beneficiaries": n_b},
        "message": "演示导入完成，请在对应列表查看。",
    }


def home_next_step(user_id: int = 1) -> dict[str, Any]:
    """首页一条冷静下一步（只读聚合；不改报备/退款状态机）。"""
    co = company_overview(user_id)
    hand = handover_checklist(user_id)
    heirs = list_beneficiaries(user_id)
    gaps = co.get("gaps") or []
    if gaps:
        g = gaps[0]
        short = g.get("short") or g.get("name") or "某一部门"
        return {
            "text": f"下一步可以补一下「{short}」盘点，写一条就好，不急。",
            "go": "company",
            "cta": "去公司盘点",
            "reason": "company_gap",
            "dept": g.get("id") or "",
            "anchor": g.get("anchor") or (f"dept-{g['id']}" if g.get("id") else ""),
        }
    if not heirs:
        return {
            "text": "盘点有了起点。可以先记下一位受益人，方便交割时对照。",
            "go": "heirs",
            "cta": "去受益人名册",
            "reason": "no_beneficiary",
        }
    prog = hand.get("progress") or {}
    filled = int(prog.get("filled_types") or 0)
    total = int(prog.get("total_types") or 4)
    if filled < total:
        return {
            "text": "受益人已就绪。可按销毁 / 变现 / 转赠补一条交割安排。",
            "go": "legacy",
            "cta": "去交割",
            "reason": "handover_incomplete",
        }
    return {
        "text": "五部门、交割与受益人都有了着落。需要时打开手册预览即可。",
        "go": "handover",
        "cta": "打开交割手册",
        "reason": "steady",
    }


def executor_card(user_id: int = 1) -> dict[str, Any]:
    """首页/手册只读执行人卡片（缺则温和 CTA；不改外呼机）。"""
    u = get_user(user_id)
    name = str(u.get("executor_name") or "").strip()
    contact_hint = ""
    role_executors = [
        b
        for b in list_beneficiaries(user_id)
        if str(b.get("role") or "").lower() == "executor"
    ]
    if role_executors:
        if not name:
            name = str(role_executors[0].get("name") or "").strip()
        contact_hint = str(role_executors[0].get("contact") or "").strip()
    has = bool(name)
    return {
        "has_executor": has,
        "name": name,
        "contact_hint": contact_hint,
        "text": (
            f"当前执行人：{name}"
            if has
            else "尚未指定执行人。可在报备页慢慢填写，不着急。"
        ),
        "contact_text": (
            f"联系提示：{contact_hint}" if contact_hint else "联系提示：可在受益人名册补充"
        ),
        "cta": "查看报备设置" if has else "去设置执行人",
        "go": "checkin",
        "note": "只读展示；修改请到报备页「遗产执行人」。",
    }


def checkin_readable(user_id: int = 1) -> dict[str, Any]:
    """报备频率与下次建议时间（只读说明；不改外呼升级机）。"""
    u = get_user(user_id)
    interval = float(u.get("checkin_interval_hours") or 24)
    next_at = float(u.get("checkin_due_at") or 0)
    last_at = float(u.get("last_checkin_at") or 0)
    next_iso = (
        time.strftime("%Y-%m-%d %H:%M", time.localtime(next_at)) if next_at else "—"
    )
    last_iso = (
        time.strftime("%Y-%m-%d %H:%M", time.localtime(last_at)) if last_at else "尚未报备"
    )
    return {
        "interval_hours": interval,
        "grace_hours": float(u.get("grace_hours") or 72),
        "last_checkin_at": last_at,
        "next_suggested_at": next_at,
        "last_checkin_label": last_iso,
        "next_suggested_label": next_iso,
        "readable": (
            f"当前间隔 {interval:g} 小时；最近一次 {last_iso}；"
            f"下次建议约在 {next_iso}。只读说明，不改外呼流程。"
        ),
    }


def update_legacy_action(user_id: int, item_id: int, action: str) -> dict[str, Any]:
    """单条交割快速改处置（复用批量处置校验）。"""
    item_id = int(item_id or 0)
    if item_id <= 0:
        raise ValueError("请指定交割条目")
    result = batch_legacy_action(user_id, [item_id], action)
    items = [it for it in result.get("items") or [] if int(it.get("id") or 0) == item_id]
    return {"updated": 1, "action": result.get("action"), "item": items[0] if items else None}


# ── Round9 · 交割与日常可用性增量（不改报备外呼 / 断缴退款状态机）──


def assets_dispose_pending(user_id: int = 1) -> dict[str, Any]:
    """无 dispose_note 的备忘（温和角标数据源）。"""
    items = [
        a
        for a in list_assets(user_id)
        if not str(a.get("dispose_note") or "").strip()
    ]
    return {
        "count": len(items),
        "items": items,
        "hint": "有几条备忘还没写处置指引，选销毁 / 转赠 / 变现即可，慢慢来。",
        "cta": "补填处置",
    }


def set_asset_dispose(user_id: int, asset_id: int, dispose_note: str) -> dict[str, Any]:
    """一键补填备忘处置指引。"""
    asset_id = int(asset_id or 0)
    if asset_id <= 0:
        raise ValueError("请指定备忘条目")
    dispose = _normalize_dispose_note(str(dispose_note or ""))
    with connect() as conn:
        row = conn.execute(
            "SELECT id FROM assets WHERE user_id=? AND id=?", (user_id, asset_id)
        ).fetchone()
        if not row:
            raise ValueError("找不到该备忘")
        conn.execute(
            "UPDATE assets SET dispose_note=? WHERE user_id=? AND id=?",
            (dispose, user_id, asset_id),
        )
        conn.commit()
    audit(user_id, "asset.dispose", f"{asset_id}:{dispose}")
    items = [a for a in list_assets(user_id) if int(a["id"]) == asset_id]
    return {"updated": 1, "item": items[0] if items else None}


def backup_contacts_summary(user_id: int = 1) -> dict[str, Any]:
    """报备页只读：已登记备用联系人数量与姓名（不改外呼）。"""
    u = get_user(user_id)
    contacts = u.get("backup_contacts") or []
    names = [str(c.get("name") or "").strip() for c in contacts if str(c.get("name") or "").strip()]
    count = len(contacts)
    if count == 0:
        text = "尚未登记备用联系人。报备升级时会先联系您本人。"
    elif count == 1:
        text = f"已登记 1 位备用联系人：{names[0] if names else '（未留姓名）'}。"
    else:
        shown = "、".join(names[:3]) if names else "（未留姓名）"
        more = f" 等 {count} 位" if len(names) > 3 else f" · 共 {count} 位"
        text = f"已登记备用联系人：{shown}{more}。"
    return {
        "count": count,
        "names": names,
        "text": text,
        "note": "只读摘要，不改外呼升级流程。",
        "go": "checkin",
    }


def membership_gentle(user_id: int = 1) -> dict[str, Any]:
    """会员到期温和提示（剩余天数或演示有效期；禁恐吓断缴文案）。"""
    u = get_user(user_id)
    return {
        "is_member": bool(u.get("is_member")),
        "member_until_iso": u.get("member_until_iso"),
        "days_left": u.get("member_days_left"),
        "hint": u.get("member_gentle_hint") or "",
        "label": (
            f"演示有效期 · 还剩约 {u['member_days_left']} 天"
            if u.get("is_member") and u.get("member_days_left") is not None
            else ("演示有效期" if u.get("is_member") else "未开通")
        ),
    }


def aftercare_cities(user_id: int = 1) -> dict[str, Any]:
    """善后工单已出现过的城市（筛选下拉数据源）。"""
    jobs = list_aftercare(user_id)
    seen: list[str] = []
    for j in jobs:
        city = str(j.get("city") or "").strip()
        if city and city not in seen:
            seen.append(city)
    return {"cities": seen, "count": len(seen)}


def snapshots_compare(user_id: int = 1) -> dict[str, Any]:
    """最近两次 handover snapshot 条数差（只读温和对比）。"""
    items = list_snapshots(user_id, limit=2)
    if len(items) < 2:
        return {
            "ready": False,
            "text": "快照不足两条，暂无可对比。需要时再存一版即可。",
            "delta": 0,
            "newer": items[0] if items else None,
            "older": None,
        }
    newer, older = items[0], items[1]
    cn = int((newer.get("summary") or {}).get("item_count") or 0)
    co = int((older.get("summary") or {}).get("item_count") or 0)
    delta = cn - co
    if delta > 0:
        text = f"较上一版多 {delta} 条交割待办（{co} → {cn}）。"
    elif delta < 0:
        text = f"较上一版少 {abs(delta)} 条交割待办（{co} → {cn}）。"
    else:
        text = f"与上一版条数相同（均为 {cn} 条）。"
    return {
        "ready": True,
        "delta": delta,
        "newer_count": cn,
        "older_count": co,
        "text": text,
        "newer": {"id": newer.get("id"), "label": newer.get("label"), "item_count": cn},
        "older": {"id": older.get("id"), "label": older.get("label"), "item_count": co},
    }


def checkin_calendar(user_id: int = 1, days: int = 14) -> dict[str, Any]:
    """最近 N 天报备日历（只读标记；不改外呼升级）。"""
    days = max(1, min(int(days or 14), 60))
    hist = checkin_history(user_id, limit=100)
    marked: set[str] = set()
    for it in hist:
        at = it.get("at")
        if at is None:
            continue
        try:
            ts = float(at)
        except (TypeError, ValueError):
            continue
        marked.add(time.strftime("%Y-%m-%d", time.localtime(ts)))
    today = time.localtime()
    # build from oldest → newest within window
    day_list: list[dict[str, Any]] = []
    for i in range(days - 1, -1, -1):
        t = time.mktime(
            (
                today.tm_year,
                today.tm_mon,
                today.tm_mday,
                12,
                0,
                0,
                today.tm_wday,
                today.tm_yday,
                today.tm_isdst,
            )
        ) - i * 86400
        local = time.localtime(t)
        iso = time.strftime("%Y-%m-%d", local)
        day_list.append(
            {
                "date": iso,
                "label": time.strftime("%m/%d", local),
                "weekday": "一二三四五六日"[local.tm_wday],
                "checked": iso in marked,
                "is_today": i == 0,
            }
        )
    checked_n = sum(1 for d in day_list if d["checked"])
    return {
        "days": days,
        "items": day_list,
        "checked_count": checked_n,
        "note": "只读日历：点选日期可看是否有报备记录，不改外呼流程。",
        "text": f"近 {days} 天有 {checked_n} 天留下了报备。",
    }


def counts_summary(user_id: int = 1) -> dict[str, Any]:
    """设置页一键自检：关键列表条数摘要（只读）。"""
    legacy_n = len(list_legacy(user_id))
    assets_n = len(list_assets(user_id))
    heirs_n = len(list_beneficiaries(user_id))
    intents_n = len(list_med_intents(user_id, include_cancelled=True))
    leads_n = len(list_executor_leads())
    jobs_n = len(list_aftercare(user_id))
    guard = self_guard_state(user_id)
    hand = handover_checklist(user_id)
    counts = {
        "legacy": legacy_n,
        "assets": assets_n,
        "beneficiaries": heirs_n,
        "med_intents": intents_n,
        "executor_leads": leads_n,
        "aftercare": jobs_n,
        "self_guard_done": int((guard.get("progress") or {}).get("done") or 0),
        "handover_items": int(hand.get("item_count") or 0),
    }
    text = (
        f"交割 {counts['legacy']} · 备忘 {counts['assets']} · 受益人 {counts['beneficiaries']} · "
        f"医旅意向 {counts['med_intents']} · 加盟 {counts['executor_leads']} · "
        f"善后 {counts['aftercare']} · 自保 {counts['self_guard_done']}/7 · "
        f"手册条目 {counts['handover_items']}"
    )
    return {
        "counts": counts,
        "text": text,
        "note": "温和自检摘要，便于确认本机数据是否就绪。",
        "domain": "einherit.cn",
        "cards": [
            {"key": "legacy", "label": "交割", "count": counts["legacy"]},
            {"key": "assets", "label": "备忘", "count": counts["assets"]},
            {"key": "beneficiaries", "label": "受益人", "count": counts["beneficiaries"]},
            {"key": "aftercare", "label": "工单", "count": counts["aftercare"]},
        ],
    }


# ── Round11 · 用得下去与信任闭环（不改报备外呼 / 断缴退款状态机）──


def set_checkin_interval(user_id: int, hours: float) -> dict[str, Any]:
    """只写报备间隔小时数；不触碰外呼升级机。"""
    hours = float(hours or 0)
    if hours < 1:
        raise ValueError("报备间隔至少 1 小时")
    if hours > 24 * 30:
        raise ValueError("报备间隔请控制在 30 天以内")
    user = update_user(user_id, checkin_interval_hours=hours)
    readable = checkin_readable(user_id)
    return {
        "user": user,
        "interval_hours": float(user.get("checkin_interval_hours") or hours),
        "readable": readable.get("readable") or "",
        "note": "已更新报备间隔；外呼升级流程未改动。",
    }


def aftercare_budget_hint(user_id: int, budget: float = 0) -> dict[str, Any]:
    """单笔工单预算相对差旅预存余额的温和对照（不改退款）。"""
    fund = get_travel(user_id)
    balance = float(fund.get("balance") or 0)
    threshold = float(fund.get("threshold") or 2000)
    budget = max(0.0, float(budget or 0))
    within = budget <= balance if budget > 0 else True
    if budget <= 0:
        tone = "soft"
        text = (
            f"当前预存余额 ¥{balance:.0f}（建议门槛 ¥{threshold:.0f}）。"
            "填写单笔差旅预算后，可对照是否在余额内。"
        )
    elif within:
        tone = "ok"
        text = (
            f"本笔预算 ¥{budget:.0f}，相对预存余额 ¥{balance:.0f} 在可对照范围内。"
            "按自己节奏安排即可。"
        )
    else:
        tone = "care"
        text = (
            f"本笔预算 ¥{budget:.0f}，略高于当前预存余额 ¥{balance:.0f}。"
            "可先调低预算，或到差旅页温和补存；退款流程不变。"
        )
    return {
        "balance": balance,
        "threshold": threshold,
        "budget": budget,
        "within_balance": within,
        "meets_threshold": bool(fund.get("meets_threshold") or fund.get("met")),
        "tone": tone,
        "text": text,
        "note": "只读对照提示，不改断缴退款状态机。",
    }


def handover_print_checklist(user_id: int = 1) -> dict[str, Any]:
    """手册打印前只读检查：执行人、条目数、受益人数。"""
    hand = handover_checklist(user_id)
    u = get_user(user_id)
    executor_raw = str(u.get("executor_name") or "").strip()
    executor_filled = bool(executor_raw)
    item_count = int(hand.get("item_count") or 0)
    beneficiary_count = int(hand.get("beneficiary_count") or len(hand.get("heirs") or []))
    items = [
        {
            "key": "executor",
            "label": "执行人",
            "ok": executor_filled,
            "value": executor_raw if executor_filled else "尚未填写",
            "hint": "已填写执行人" if executor_filled else "可到报备页填写遗产执行人",
        },
        {
            "key": "items",
            "label": "交割条目",
            "ok": item_count > 0,
            "value": f"{item_count} 条",
            "hint": "已有交割条目" if item_count > 0 else "可到交割页先写一条安排",
        },
        {
            "key": "beneficiaries",
            "label": "受益人",
            "ok": beneficiary_count > 0,
            "value": f"{beneficiary_count} 人",
            "hint": "名册已有人" if beneficiary_count > 0 else "可到受益人名册添加一位",
        },
    ]
    ready_n = sum(1 for it in items if it["ok"])
    return {
        "items": items,
        "ready_count": ready_n,
        "total": len(items),
        "executor_filled": executor_filled,
        "item_count": item_count,
        "beneficiary_count": beneficiary_count,
        "export_path": hand.get("export_path") or "/export/handover.html",
        "text": (
            f"打印前检查：执行人{'已填' if executor_filled else '未填'} · "
            f"条目 {item_count} · 受益人 {beneficiary_count}"
        ),
        "note": "只读清单，便于导出前温和核对；不改交割内容。",
    }
