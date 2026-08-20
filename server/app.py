#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""电子继承 App E-Inherit · HTTP 服务（P0）"""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))

import db  # noqa: E402

STATIC = ROOT / "static"
HOST = "0.0.0.0"
PORT = 8877


def json_bytes(obj: object, code: int = 200) -> tuple[int, bytes, str]:
    body = json.dumps(obj, ensure_ascii=False, default=str).encode("utf-8")
    return code, body, "application/json; charset=utf-8"


class Handler(BaseHTTPRequestHandler):
    server_version = "EInherit/0.4"

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return {}

    def _send(self, code: int, body: bytes, content_type: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path.startswith("/api/"):
            return self._api_get(path, qs)

        if path in ("/export/handover.html", "/export/handover"):
            html = db.handover_export_html(1).encode("utf-8")
            self._send(200, html, "text/html; charset=utf-8")
            return

        # static
        rel = "index.html" if path in ("/", "") else path.lstrip("/")
        file_path = (STATIC / rel).resolve()
        if not str(file_path).startswith(str(STATIC.resolve())) or not file_path.is_file():
            self._send(404, b"Not Found", "text/plain; charset=utf-8")
            return
        data = file_path.read_bytes()
        ctype = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".webmanifest": "application/manifest+json; charset=utf-8",
            ".png": "image/png",
            ".svg": "image/svg+xml",
        }.get(file_path.suffix, "application/octet-stream")
        self._send(200, data, ctype)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        if not path.startswith("/api/"):
            self._send(404, b"Not Found", "text/plain")
            return
        payload = self._read_json()
        try:
            result = self._api_post(path, payload)
            code, body, ctype = json_bytes(result)
            self._send(code, body, ctype)
        except ValueError as e:
            code, body, ctype = json_bytes({"error": str(e)}, 400)
            self._send(code, body, ctype)
        except Exception as e:  # noqa: BLE001
            code, body, ctype = json_bytes({"error": str(e)}, 500)
            self._send(code, body, ctype)

    def _api_get(self, path: str, qs: dict) -> None:
        try:
            if path == "/api/health":
                out = {
                    "ok": True,
                    "app": "电子继承 App",
                    "brand_en": "E-Inherit",
                    "domain": "einherit.cn",
                    "version": "0.4.0",
                }
            elif path == "/api/me":
                out = {"user": db.get_user(1), "ledger": db.recent_ledger(1, 8)}
            elif path == "/api/legacy":
                out = {"items": db.list_legacy(1)}
            elif path == "/api/assets":
                out = {"items": db.list_assets(1)}
            elif path == "/api/hospitals":
                q = (qs.get("q") or [""])[0]
                country = (qs.get("country") or [""])[0]
                out = {"items": db.list_hospitals(q=q, country=country)}
            elif path == "/api/checkin/status":
                out = {
                    "user": db.get_user(1),
                    "calls": db.recent_calls(1, 10),
                }
            elif path == "/api/travel-fund":
                out = {"fund": db.get_travel(1), "ledger": db.recent_ledger(1, 12)}
            elif path == "/api/company":
                out = db.company_overview(1)
            elif path == "/api/self-guard":
                out = db.self_guard_state(1)
            elif path == "/api/handover":
                out = db.handover_checklist(1)
            elif path == "/api/aftercare":
                out = {
                    "items": db.list_aftercare(1),
                    "playbook": db.aftercare_playbook(),
                }
            elif path == "/api/icu-pack":
                out = {"pack": db.ICU_PACK, "count": len(db.ICU_PACK)}
            elif path == "/api/beneficiaries":
                out = {"items": db.list_beneficiaries(1)}
            elif path == "/api/emergency":
                out = {"items": db.list_emergency(1)}
            elif path == "/api/audit":
                out = {"items": db.recent_audit(1, 40)}
            elif path == "/api/snapshots":
                out = {"items": db.list_snapshots(1)}
            elif path == "/api/learnings":
                out = db.open_source_learnings()
            else:
                code, body, ctype = json_bytes({"error": "not found"}, 404)
                self._send(code, body, ctype)
                return
            code, body, ctype = json_bytes(out)
            self._send(code, body, ctype)
        except Exception as e:  # noqa: BLE001
            code, body, ctype = json_bytes({"error": str(e)}, 500)
            self._send(code, body, ctype)

    def _api_post(self, path: str, payload: dict) -> dict:
        if path == "/api/me":
            fields = {}
            if "checkin_interval_hours" in payload:
                fields["checkin_interval_hours"] = float(payload["checkin_interval_hours"])
            if "grace_hours" in payload:
                fields["grace_hours"] = float(payload["grace_hours"])
            if "backup_contacts" in payload:
                fields["backup_contacts"] = payload["backup_contacts"]
            if "name" in payload:
                fields["name"] = str(payload["name"])
            if "executor_name" in payload:
                fields["executor_name"] = str(payload["executor_name"])
            if fields:
                return {"user": db.update_user(1, **fields)}
            return {"user": db.get_user(1)}

        if path == "/api/legacy":
            return {"item": db.add_legacy(1, payload)}

        if path == "/api/assets":
            return {"item": db.add_asset(1, payload)}

        if path == "/api/company/note":
            return {
                "note": db.add_company_note(
                    1,
                    str(payload.get("dept") or "board"),
                    str(payload.get("title") or ""),
                    str(payload.get("body") or ""),
                )
            }

        if path == "/api/self-guard":
            return db.set_self_guard(
                1,
                int(payload.get("sin_rank") or 0),
                bool(payload.get("checked")),
                str(payload.get("note") or ""),
            )

        if path == "/api/hospitals/intent":
            hid = payload.get("hospital_id")
            return {
                "intent": db.add_med_intent(
                    1,
                    int(hid) if hid is not None else None,
                    str(payload.get("note") or ""),
                )
            }

        if path == "/api/membership/pay":
            return {"user": db.activate_membership(1), "paid": 365}

        if path == "/api/checkin":
            u = db.do_checkin(1)
            db.audit(1, "checkin", "ok")
            return {"user": u, "message": "今日报备已完成，谢谢您的安心确认"}

        if path == "/api/checkin/escalate":
            return db.evaluate_escalation(
                1, simulate_unreachable=bool(payload.get("simulate_unreachable"))
            )

        if path == "/api/travel-fund":
            amount = float(payload.get("amount") or 0)
            if amount < 2000 and not payload.get("force"):
                raise ValueError("建议最低预存 ¥2000（演示可传 force:true）")
            return {"fund": db.travel_deposit(1, amount)}

        if path == "/api/membership/lapse":
            return db.lapse_membership(1)

        if path == "/api/icu-pack":
            items = db.apply_icu_pack(1, str(payload.get("beneficiary") or ""))
            return {"items": items, "message": f"已写入急症前清册 {len(items)} 条"}

        if path == "/api/aftercare":
            return {"item": db.add_aftercare(1, payload)}

        if path == "/api/executor-lead":
            return {"item": db.add_executor_lead(payload)}

        if path == "/api/beneficiaries":
            return {"item": db.add_beneficiary(1, payload)}

        if path == "/api/emergency/request":
            return {"item": db.request_emergency(1, payload)}

        if path == "/api/emergency/decide":
            return {
                "item": db.decide_emergency(
                    1,
                    int(payload.get("id") or 0),
                    bool(payload.get("approve")),
                    str(payload.get("note") or ""),
                )
            }

        if path == "/api/handover/snapshot":
            return {"item": db.save_handover_snapshot(1, str(payload.get("label") or ""))}

        # 演示：把上次报备拨回到过去，制造逾期
        if path == "/api/checkin/force-overdue":
            import time

            hours = float(payload.get("hours_ago") or 48)
            past = time.time() - hours * 3600
            return {"user": db.update_user(1, last_checkin_at=past, escalation_state="calling_self")}

        raise ValueError(f"unknown api {path}")


def main() -> None:
    db.init_db()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"电子继承 App · E-Inherit 已启动 → http://127.0.0.1:{PORT}")
    print(f"正式网页入口：https://einherit.cn")
    print(f"手册：{ROOT / 'docs' / '电子继承-开发技术手册.md'}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")


if __name__ == "__main__":
    main()
