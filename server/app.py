#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""电子继承 App E-Inherit · HTTP 服务（P0）"""

from __future__ import annotations

import json
import sys
import time
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
    server_version = "EInherit/0.5"

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

        if path in ("/export/icu.html", "/export/icu"):
            html = db.icu_export_html(1).encode("utf-8")
            self._send(200, html, "text/html; charset=utf-8")
        if path == "/export/pack.json":
            pack = db.export_data_pack(1)
            code, body, ctype = json_bytes(pack)
            self._send(code, body, ctype)
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
        try:
            if path == "/api/auth-video":
                result = self._api_auth_video_upload()
            else:
                payload = self._read_json()
                result = self._api_post(path, payload)
            code, body, ctype = json_bytes(result)
            self._send(code, body, ctype)
        except ValueError as e:
            code, body, ctype = json_bytes({"error": str(e)}, 400)
            self._send(code, body, ctype)
        except Exception as e:  # noqa: BLE001
            code, body, ctype = json_bytes({"error": str(e)}, 500)
            self._send(code, body, ctype)

    def _api_auth_video_upload(self) -> dict:
        """multipart: file + has_greeting/has_authorize/has_plan/note；或 JSON 演示占位。"""
        ctype = self.headers.get("Content-Type") or ""
        if "multipart/form-data" in ctype:
            try:
                import cgi  # noqa: PLC0415

                env = {
                    "REQUEST_METHOD": "POST",
                    "CONTENT_TYPE": ctype,
                    "CONTENT_LENGTH": self.headers.get("Content-Length") or "0",
                }
                form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ=env)
            except Exception as e:  # noqa: BLE001
                raise ValueError(f"无法解析上传表单：{e}") from e

            def flag(name: str) -> bool:
                v = form.getvalue(name, "")
                return str(v).lower() in ("1", "true", "on", "yes")

            note = str(form.getvalue("note") or "")
            fileitem = form["file"] if "file" in form else None
            if fileitem is None or not getattr(fileitem, "filename", None):
                raise ValueError("请选择要上传的视频文件")
            raw = fileitem.file.read()
            if not raw:
                raise ValueError("视频文件为空")
            if len(raw) > 120 * 1024 * 1024:
                raise ValueError("视频请控制在 120MB 以内")
            orig = Path(str(fileitem.filename)).name
            ext = Path(orig).suffix.lower() or ".mp4"
            if ext not in (".mp4", ".mov", ".m4v", ".webm", ".avi"):
                raise ValueError("仅支持 mp4 / mov / webm 等常见视频")
            import uuid

            fname = f"u1_{int(time.time())}_{uuid.uuid4().hex[:8]}{ext}"
            dest = db.auth_video_dir() / fname
            dest.write_bytes(raw)
            item = db.save_auth_video(
                1,
                filename=fname,
                original_name=orig,
                has_greeting=flag("has_greeting"),
                has_authorize=flag("has_authorize"),
                has_plan=flag("has_plan"),
                note=note,
            )
            return {"item": item, "status": db.auth_video_status(1), "message": "授权说明视频已提交"}

        # JSON 路径：自检/演示可用 placeholder（不落真实文件）
        payload = self._read_json()
        if not payload.get("demo"):
            raise ValueError("请使用表单上传视频文件（Content-Type: multipart/form-data）")
        import uuid

        fname = f"demo_{uuid.uuid4().hex[:8]}.txt"
        (db.auth_video_dir() / fname).write_text(
            "demo auth video placeholder\n" + json.dumps(payload, ensure_ascii=False),
            encoding="utf-8",
        )
        item = db.save_auth_video(
            1,
            filename=fname,
            original_name="demo-auth-video.txt",
            has_greeting=bool(payload.get("has_greeting", True)),
            has_authorize=bool(payload.get("has_authorize", True)),
            has_plan=bool(payload.get("has_plan", True)),
            note=str(payload.get("note") or "演示占位"),
        )
        return {"item": item, "status": db.auth_video_status(1), "message": "演示授权视频已登记"}

    def _api_get(self, path: str, qs: dict) -> None:
        try:
            if path == "/api/health":
                out = {
                    "ok": True,
                    "app": "电子继承 App",
                    "brand_en": "E-Inherit",
                    "domain": "einherit.cn",
                    "version": "0.5.0",
                    "server_version": self.server_version,
                }
            elif path == "/api/me":
                out = {"user": db.get_user(1), "ledger": db.recent_ledger(1, 8)}
            elif path == "/api/legacy":
                dept = (qs.get("dept") or [""])[0]
                q = (qs.get("q") or [""])[0]
                out = {
                    "items": db.list_legacy(1, dept=dept, q=q),
                    "dept": dept or "",
                    "q": q or "",
                }
            elif path == "/api/assets":
                visibility = (qs.get("visibility") or [""])[0]
                out = {
                    "items": db.list_assets(1, visibility=visibility),
                    "visibility": visibility or "",
                }
            elif path == "/api/hospitals":
                q = (qs.get("q") or [""])[0]
                country = (qs.get("country") or [""])[0]
                region = (qs.get("region") or [""])[0]
                hid = (qs.get("id") or [""])[0]
                if hid:
                    item = db.get_hospital(int(hid))
                    if not item:
                        code, body, ctype = json_bytes({"error": "医院不存在"}, 404)
                        self._send(code, body, ctype)
                        return
                    out = {"item": item}
                else:
                    out = {
                        "items": db.list_hospitals(q=q, country=country, region=region),
                        "region": region or "",
                    }
            elif path in ("/api/hospitals/intents", "/api/med-intents"):
                st = (qs.get("status") or [""])[0]
                out = {
                    "items": db.list_med_intents(1, status=st),
                    "status": st or "",
                }
            elif path == "/api/checkin/status":
                out = {
                    "user": db.get_user(1),
                    "calls": db.recent_calls(1, 10),
                }
            elif path == "/api/checkin/history":
                limit = int((qs.get("limit") or ["20"])[0] or 20)
                out = {"items": db.checkin_history(1, limit)}
            elif path == "/api/checkin/calendar":
                days = int((qs.get("days") or ["14"])[0] or 14)
                out = db.checkin_calendar(1, days=days)
            elif path == "/api/onboarding":
                out = db.onboarding_status(1)
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
                out = {
                    "pack": db.ICU_PACK,
                    "count": len(db.ICU_PACK),
                    "ready": db.icu_pack_ready(1),
                    "items": db.icu_pack_items(1),
                }
            elif path in ("/api/executor-lead", "/api/executor-leads"):
                out = {"items": db.list_executor_leads()}
            elif path == "/api/icu-checklist":
                out = db.icu_checklist_state(1)
            elif path == "/api/beneficiaries":
                out = {"items": db.list_beneficiaries(1)}
            elif path == "/api/emergency":
                out = {"items": db.list_emergency(1)}
            elif path == "/api/audit":
                t = (qs.get("type") or [""])[0]
                out = {
                    "items": db.recent_audit(1, 40, type_filter=t),
                    "types": [
                        {"id": k, "label": v} for k, v in db.AUDIT_TYPE_LABELS.items()
                    ],
                }
            elif path == "/api/snapshots":
                out = {
                    "items": db.list_snapshots(1),
                    "latest": db.latest_snapshot(1),
                }
            elif path == "/api/snapshot":
                sid = int((qs.get("id") or ["0"])[0] or 0)
                out = {"item": db.get_snapshot(1, sid)}
            elif path == "/api/execution-queue":
                out = db.execution_queue(1)
            elif path == "/api/home-next":
                out = db.home_next_step(1)
            elif path == "/api/executor-card":
                out = db.executor_card(1)
            elif path == "/api/checkin/readable":
                out = db.checkin_readable(1)
            elif path == "/api/export/summary":
                out = db.export_pack_summary(1)
            elif path in ("/api/hospitals/intent", "/api/med-intent"):
                iid = int((qs.get("id") or ["0"])[0] or 0)
                out = {"item": db.get_med_intent(1, iid)}
            elif path == "/api/learnings":
                out = db.open_source_learnings()
            elif path == "/api/mindmap":
                out = {"map": db.get_mindmap(1)}
            elif path == "/api/auth-video":
                out = db.auth_video_status(1)
            elif path == "/api/today":
                out = db.today_todos(1)
            elif path == "/api/executor-leads":
                out = {"items": db.list_executor_leads()}
            elif path == "/api/asset-tags":
                out = {"tags": list(db.ASSET_TAGS)}
            elif path == "/api/export/pack":
                out = db.export_data_pack(1)
            elif path == "/api/assets/dispose-pending":
                out = db.assets_dispose_pending(1)
            elif path == "/api/backup-contacts/summary":
                out = db.backup_contacts_summary(1)
            elif path == "/api/membership/gentle":
                out = db.membership_gentle(1)
            elif path == "/api/aftercare/cities":
                out = db.aftercare_cities(1)
            elif path == "/api/snapshots/compare":
                out = db.snapshots_compare(1)
            elif path in ("/api/counts-summary", "/api/selfcheck-summary"):
                out = db.counts_summary(1)
            elif path in ("/api/checkin/interval", "/api/me/interval"):
                out = db.checkin_readable(1)
            elif path in ("/api/aftercare/budget-hint", "/api/travel-fund/budget-hint"):
                budget = float((qs.get("budget") or ["0"])[0] or 0)
                out = db.aftercare_budget_hint(1, budget)
            elif path in ("/api/handover/print-checklist", "/api/handover/preflight"):
                out = db.handover_print_checklist(1)
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
                # 温和校验：姓名+电话；空列表表示暂未填写（UI 会提示）
                fields["backup_contacts"] = db.normalize_backup_contacts(
                    payload["backup_contacts"]
                )
            if "name" in payload:
                fields["name"] = str(payload["name"])
            if "executor_name" in payload:
                fields["executor_name"] = str(payload["executor_name"])
            if fields:
                return {"user": db.update_user(1, **fields)}
            return {"user": db.get_user(1)}

        if path in ("/api/checkin/interval", "/api/me/interval"):
            # 只写间隔；不改外呼升级机
            return db.set_checkin_interval(
                1, float(payload.get("interval_hours") or payload.get("hours") or 24)
            )

        if path == "/api/legacy":
            return {"item": db.add_legacy(1, payload)}

        if path in ("/api/aftercare/budget-hint", "/api/travel-fund/budget-hint"):
            return db.aftercare_budget_hint(
                1, float(payload.get("budget") or payload.get("travel_budget") or 0)
            )

        if path == "/api/legacy/batch-action":
            return db.batch_legacy_action(
                1,
                list(payload.get("ids") or []),
                str(payload.get("action") or ""),
            )

        if path == "/api/legacy/update":
            return db.update_legacy_action(
                1,
                int(payload.get("id") or 0),
                str(payload.get("action") or ""),
            )

        if path == "/api/legacy/delete":
            return db.delete_legacy(1, int(payload.get("id") or 0))

        if path == "/api/assets":
            return {"item": db.add_asset(1, payload)}

        if path == "/api/assets/review-at":
            return db.set_asset_review_at(
                1,
                int(payload.get("id") or 0),
                str(payload.get("review_at") or ""),
            )

        if path == "/api/assets/dispose":
            return db.set_asset_dispose(
                1,
                int(payload.get("id") or 0),
                str(payload.get("dispose_note") or ""),
            )

        if path == "/api/med-intent/status":
            return db.set_med_intent_status(
                1,
                int(payload.get("id") or 0),
                str(payload.get("status") or ""),
            )

        if path == "/api/export/import":
            return db.import_export_pack(
                1,
                dict(payload.get("pack") or payload),
                confirm=bool(payload.get("confirm")),
            )

        if path == "/api/assets/delete":
            return db.delete_asset(1, int(payload.get("id") or 0))

        if path == "/api/company/note":
            return {
                "note": db.add_company_note(
                    1,
                    str(payload.get("dept") or "board"),
                    str(payload.get("title") or ""),
                    str(payload.get("body") or ""),
                )
            }

        if path == "/api/company/note/reorder":
            return db.reorder_company_note(
                1,
                int(payload.get("id") or 0),
                str(payload.get("direction") or ""),
            )

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

        if path in ("/api/hospitals/intent/cancel", "/api/med-intent/cancel"):
            return {
                "intent": db.cancel_med_intent(1, int(payload.get("id") or 0)),
                "message": "意向已温和撤回，需要时可再提交",
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

        if path == "/api/icu-checklist":
            return db.set_icu_checklist(
                1,
                str(payload.get("pack_key") or ""),
                bool(payload.get("checked")),
            )

        if path == "/api/aftercare":
            return {"item": db.add_aftercare(1, payload)}

        if path == "/api/executor-lead":
            lead_id = int(payload.get("id") or 0)
            if lead_id:
                return {"item": db.update_executor_lead(lead_id, payload), "updated": True}
            return {"item": db.add_executor_lead(payload), "updated": False}

        if path == "/api/beneficiaries":
            return {"item": db.add_beneficiary(1, payload)}

        if path == "/api/beneficiaries/update":
            return {
                "item": db.update_beneficiary(
                    1, int(payload.get("id") or 0), payload
                )
            }

        if path == "/api/beneficiaries/delete":
            return db.delete_beneficiary(1, int(payload.get("id") or 0))

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

        if path == "/api/mindmap":
            if payload.get("reset"):
                return {"map": db.save_mindmap(1, dict(db.DEFAULT_MINDMAP))}
            if "map" in payload and isinstance(payload["map"], dict):
                return {"map": db.save_mindmap(1, payload["map"])}
            return {"map": db.get_mindmap(1)}

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
