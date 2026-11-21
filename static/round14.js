/* 电子继承 · 第十四批增量（叠在 round13…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const DEPT_ORDER = [
    { id: "production", label: "生产部" },
    { id: "finance", label: "财务部" },
    { id: "ip", label: "知识产权部" },
    { id: "admin", label: "行政部" },
    { id: "board", label: "董事会" },
  ];

  let _asDisposeOnly = false;
  let _highlightAftercareId = null;

  function softBanner(msg, hostId) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return;
    const eid = "round14SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner";
      el.hidden = true;
      host.insertBefore(el, host.firstChild);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }

  function calmConfirm({ title, body, okLabel }) {
    return new Promise((resolve) => {
      const dlg = $("#confirmDialog");
      if (!dlg || typeof dlg.showModal !== "function") {
        resolve(window.confirm(body || title || "是否继续？"));
        return;
      }
      const t = $("#confirmTitle");
      const b = $("#confirmBody");
      const ok = $("#confirmOk");
      if (t) t.textContent = title || "确认操作";
      if (b) b.textContent = body || "是否继续？";
      if (ok) ok.textContent = okLabel || "确认";
      const onClose = () => {
        dlg.removeEventListener("close", onClose);
        resolve(dlg.returnValue === "ok");
      };
      dlg.addEventListener("close", onClose);
      try {
        dlg.showModal();
      } catch (_) {
        resolve(window.confirm(body || title || "是否继续？"));
      }
    });
  }

  /* 1 · 下次报备倒计时只读 */
  function renderCheckinCountdown(data, hostSel, elId) {
    const host = $(hostSel);
    if (!host) return;
    let el = $("#" + elId);
    if (!el) {
      el = document.createElement("div");
      el.id = elId;
      el.className = "checkin-countdown card";
      el.setAttribute("aria-label", "下次报备倒计时只读");
      host.insertBefore(el, host.firstChild);
    }
    const label = (data && data.countdown_label) || "完成一次报备后会显示倒计时";
    const next = (data && data.next_suggested_label) || "—";
    el.innerHTML = `<h3>下次建议报备</h3>
      <p class="countdown-main">${esc(label)}</p>
      <p class="muted">建议时间约 ${esc(next)} · 只读，不改外呼流程</p>`;
  }

  async function paintHomeCountdown() {
    try {
      const today = await api("/api/today");
      const ckItem = (today.items || []).find((x) => x.key === "checkin") || {};
      const strip = $("#todayCheckin");
      if (!strip) return;
      let line = $("#homeCheckinCountdown");
      if (!line) {
        line = document.createElement("div");
        line.id = "homeCheckinCountdown";
        line.className = "home-checkin-countdown muted";
        strip.appendChild(line);
      }
      const label =
        ckItem.countdown_label ||
        (await api("/api/checkin/readable")).countdown_label ||
        "";
      line.textContent = label ? `下次：${label}` : "";
      line.hidden = !label;
    } catch (_) {}
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || (await api("/api/checkin/readable"));
      renderCheckinCountdown(cd, "#checkinBox", "checkinCountdownCard");
    } catch (_) {}
  };

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    await paintHomeCountdown();
    await paintHomeDeptRing();
  };

  /* 2 · 交割条目一键复制进表单 */
  function fillLegacyFormFromItem(it) {
    if (!it) return;
    if ($("#lgTitle")) $("#lgTitle").value = it.title || "";
    if ($("#lgCat")) $("#lgCat").value = it.category || "其他";
    if ($("#lgDept")) $("#lgDept").value = it.dept || "admin";
    if ($("#lgAction")) $("#lgAction").value = it.action || "销毁";
    if ($("#lgBene")) $("#lgBene").value = it.beneficiary || "";
    if ($("#lgNotes")) $("#lgNotes").value = it.notes || "";
    const resets = $$("#lgReset");
    resets.forEach((el) => {
      el.checked = !!it.factory_reset;
    });
    const photos = $$("#lgPhotos");
    photos.forEach((el) => {
      el.checked = !!it.clear_photos;
    });
    const chats = $$("#lgChats");
    chats.forEach((el) => {
      el.checked = !!it.clear_chats;
    });
  }

  function attachLegacyCopyButtons(items) {
    const byId = {};
    (items || []).forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#lgList .item[data-id]").forEach((el) => {
      if (el.querySelector(".lg-copy-btn")) return;
      const it = byId[el.dataset.id];
      if (it) {
        el.dataset.title = it.title || "";
        el.dataset.cat = it.category || "";
        el.dataset.dept = it.dept || "";
        el.dataset.action = it.action || "";
        el.dataset.factory = it.factory_reset ? "1" : "0";
        el.dataset.photos = it.clear_photos ? "1" : "0";
        el.dataset.chats = it.clear_chats ? "1" : "0";
        el.dataset.bene = it.beneficiary || "";
        el.dataset.notes = it.notes || "";
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-btn";
      btn.textContent = "再录一条";
      btn.title = "复制本条字段到上方表单，便于同类资产连记";
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const src =
          byId[el.dataset.id] || {
            title: el.dataset.title,
            category: el.dataset.cat,
            dept: el.dataset.dept,
            action: el.dataset.action,
            factory_reset: el.dataset.factory === "1",
            clear_photos: el.dataset.photos === "1",
            clear_chats: el.dataset.chats === "1",
            beneficiary: el.dataset.bene,
            notes: el.dataset.notes,
          };
        fillLegacyFormFromItem(src);
        softBanner("已填入表单，改个名字即可再写一条", "legacy");
        toast("已复制到表单");
        const form = $("#lgTitle");
        if (form) {
          form.focus();
          form.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };
      el.appendChild(btn);
    });
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    try {
      const data = await api("/api/legacy");
      attachLegacyCopyButtons(data.items || []);
    } catch (_) {}
  };

  /* 3 · 手册按部门分组预览 */
  function renderHandoverByDept(data) {
    const panel = $("#handover");
    const box = $("#handoverBox");
    if (!panel || !box) return;
    let wrap = $("#handoverByDept");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "handoverByDept";
      wrap.className = "card handover-by-dept";
      const share = $("#handoverShareHint");
      if (share && share.nextSibling) panel.insertBefore(wrap, share.nextSibling);
      else panel.insertBefore(wrap, box);
    }
    const groups = data.by_dept || [];
    if (!groups.length) {
      wrap.innerHTML = `<h3>按部门预览</h3><p class="muted">暂无交割条目。</p>`;
      return;
    }
    wrap.innerHTML = `<h3>按部门预览</h3>
      <p class="muted">打印前按五部门折叠查看，只读。</p>
      <div class="dept-fold-list">${groups
        .map((g) => {
          const open = Number(g.count || 0) > 0 ? "" : "";
          return `<details class="dept-fold" ${open} data-dept="${esc(g.id || "")}">
            <summary><span class="dept-fold-name">${esc(
              g.short || g.name || g.id || ""
            )}</span>
            <span class="muted">${Number(g.count || 0)} 条</span></summary>
            <ul class="dept-fold-items">${
              (g.items || []).length
                ? (g.items || [])
                    .map(
                      (it) =>
                        `<li><strong>${esc(it.title || "")}</strong>
                        <span class="muted"> · ${esc(
                          (it.ops || []).join(" / ") || it.action || ""
                        )}</span></li>`
                    )
                    .join("")
                : `<li class="muted">本部门暂无条目</li>`
            }</ul>
          </details>`;
        })
        .join("")}</div>`;
  }

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    try {
      const data = await api("/api/handover");
      renderHandoverByDept(data);
    } catch (_) {}
  };

  /* 4 · 善后工单阶段条 */
  function renderAftercarePhaseBar(it) {
    const phases = it.phases || [
      { key: "pending_auth", label: "待授权" },
      { key: "executable", label: "可执行" },
      { key: "in_progress", label: "进行中" },
      { key: "done", label: "完成" },
    ];
    const idx =
      it.phase_index != null
        ? Number(it.phase_index)
        : Math.max(
            0,
            phases.findIndex((p) => p.key === (it.phase_key || ""))
          );
    return `<div class="ac-phase-bar" aria-label="工单阶段">
      ${phases
        .map(
          (p, i) =>
            `<span class="ac-phase-step ${i <= idx ? "done" : ""} ${
              i === idx ? "current" : ""
            }">${esc(p.label)}</span>${
              i < phases.length - 1 ? `<span class="ac-phase-sep" aria-hidden="true">→</span>` : ""
            }`
        )
        .join("")}
    </div>`;
  }

  function annotateAftercarePhases(items) {
    const list = $("#acList");
    if (!list) return;
    const byTitle = {};
    (items || []).forEach((it) => {
      byTitle[String(it.title || "")] = it;
    });
    $$("#acList .item").forEach((el) => {
      const title = ((el.querySelector("strong") || {}).textContent || "").trim();
      const it =
        byTitle[title] ||
        (items || []).find((x) => String(x.id) === String(el.dataset.id || ""));
      if (!it) return;
      el.dataset.id = String(it.id || "");
      el.dataset.phase = it.phase_key || "";
      if (_highlightAftercareId && Number(el.dataset.id) === Number(_highlightAftercareId)) {
        el.classList.add("ac-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        el.classList.remove("ac-highlight");
      }
      if (el.querySelector(".ac-phase-bar")) {
        el.querySelector(".ac-phase-bar").outerHTML = renderAftercarePhaseBar(it);
      } else {
        el.insertAdjacentHTML("beforeend", renderAftercarePhaseBar(it));
      }
    });
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    try {
      const data = await api("/api/aftercare");
      annotateAftercarePhases(data.items || []);
      if (_highlightAftercareId) {
        setTimeout(() => {
          _highlightAftercareId = null;
        }, 6000);
      }
    } catch (_) {}
  };

  /* 5 · 授权视频「当前生效」标 */
  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    try {
      const st = await api("/api/auth-video");
      const activeId = st.current_active_id;
      const byName = {};
      (st.items || []).forEach((it) => {
        byName[String(it.original_name || it.filename || "")] = it;
      });
      $$("#avList .item").forEach((el) => {
        const name = ((el.querySelector("strong") || {}).textContent || "").trim();
        const it = byName[name];
        const old = el.querySelector(".av-active-badge");
        if (old) old.remove();
        if (it && (it.current_active || (activeId && it.id === activeId))) {
          const badge = document.createElement("span");
          badge.className = "tag av-active-badge";
          badge.textContent = "当前生效";
          el.insertBefore(badge, el.firstChild);
        }
      });
    } catch (_) {}
  };

  /* 6 · 五部门首页完成环 */
  async function paintHomeDeptRing() {
    try {
      const co = await api("/api/company");
      const host = $("#homeHint") && $("#homeHint").parentNode;
      const home = $("#home");
      const mount = home || host;
      if (!mount) return;
      let ring = $("#homeDeptRing");
      if (!ring) {
        ring = document.createElement("div");
        ring.id = "homeDeptRing";
        ring.className = "home-dept-ring";
        ring.setAttribute("role", "button");
        ring.tabIndex = 0;
        ring.title = "查看个人公司化盘点";
        const hint = $("#homeHint");
        if (hint && hint.parentNode) hint.parentNode.insertBefore(ring, hint.nextSibling);
        else mount.appendChild(ring);
        const go = () => {
          if (typeof show === "function") show("company");
        };
        ring.addEventListener("click", go);
        ring.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            go();
          }
        });
      }
      const filled = Number((co.progress && co.progress.filled) || 0);
      const total = Number((co.progress && co.progress.total) || 5);
      const pct = Math.round((filled / Math.max(total, 1)) * 100);
      const depts = co.depts || [];
      const dots = DEPT_ORDER.map((d) => {
        const row = depts.find((x) => x.id === d.id);
        const ok =
          row &&
          Number(row.legacy_count || 0) +
            Number(row.asset_count || 0) +
            (row.notes || []).length >
            0;
        return `<span class="dept-dot ${ok ? "filled" : ""}" title="${esc(
          d.label
        )}">${esc(d.label.slice(0, 1))}</span>`;
      }).join("");
      ring.innerHTML = `<div class="dept-ring-visual" style="--pct:${pct}">
          <span class="dept-ring-num">${filled}<small>/5</small></span>
        </div>
        <div class="dept-ring-meta">
          <strong>五部门盘点</strong>
          <span class="muted">已填 ${filled}/${total} · 点进盘点</span>
          <div class="dept-dots">${dots}</div>
        </div>`;
    } catch (_) {}
  }

  /* 7 · 备忘缺处置指引汇总 */
  async function paintDisposePendingBar() {
    const panel = $("#assets");
    const list = $("#asList");
    if (!panel || !list) return;
    let bar = $("#asDisposePendingBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "asDisposePendingBar";
      bar.className = "as-dispose-pending-bar";
      const vis = $("#asVisFilterBar") || $("#asDeptFilterBar");
      if (vis && vis.parentNode) vis.parentNode.insertBefore(bar, vis);
      else list.parentNode.insertBefore(bar, list);
    }
    try {
      const pending = await api("/api/assets/dispose-pending");
      const n = Number(pending.count || 0);
      if (!n) {
        bar.hidden = true;
        bar.innerHTML = "";
        _asDisposeOnly = false;
        return;
      }
      bar.hidden = false;
      bar.innerHTML = `<span>还有 <b>${n}</b> 条未选处置</span>
        <button type="button" class="btn ghost sm" id="asDisposeFilterBtn">${
          _asDisposeOnly ? "显示全部" : "只看未填"
        }</button>`;
      const btn = $("#asDisposeFilterBtn");
      if (btn) {
        btn.onclick = () => {
          _asDisposeOnly = !_asDisposeOnly;
          applyDisposeOnlyFilter(pending.items || []);
          paintDisposePendingBar();
        };
      }
      if (_asDisposeOnly) applyDisposeOnlyFilter(pending.items || []);
    } catch (_) {}
  }

  function applyDisposeOnlyFilter(pendingItems) {
    const ids = new Set((pendingItems || []).map((x) => Number(x.id)));
    $$("#asList .item[data-id]").forEach((el) => {
      if (!_asDisposeOnly) {
        el.hidden = false;
        return;
      }
      el.hidden = !ids.has(Number(el.dataset.id));
    });
    let tip = $("#asDisposeOnlyTip");
    if (_asDisposeOnly) {
      const visible = $$("#asList .item[data-id]").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "asDisposeOnlyTip";
          tip.className = "muted";
          $("#asList") && $("#asList").appendChild(tip);
        }
        tip.textContent = "没有未填处置的备忘了。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    await paintDisposePendingBar();
  };

  /* 8 · 差旅流水跳转关联工单 */
  function enhanceTravelLedgerLinks(ledger) {
    const cards = $$("#travelBox .card");
    const ledgerCard = Array.from(cards).find((c) =>
      ((c.querySelector("h3") || {}).textContent || "").includes("流水")
    );
    if (!ledgerCard) return;
    const list = ledgerCard.querySelector(".list");
    if (!list) return;
    const items = (ledger || []).filter(
      (l) => String(l.kind).startsWith("travel") || l.kind === "membership" || l.kind === "aftercare_budget"
    );
    // Prefer rebuilding rows that have refs; annotate existing by note match
    const withRef = items.filter((l) => l.aftercare_id || l.order_ref || l.has_aftercare_ref);
    if (!withRef.length && !items.some((l) => l.kind === "aftercare_budget")) {
      // still show aftercare_budget rows if API returned them but filter hid them
      const extra = (ledger || []).filter((l) => l.kind === "aftercare_budget");
      if (!extra.length) return;
    }
    // Append / refresh aftercare_budget rows into list if missing
    const existingNotes = new Set(
      $$(".item", list).map((el) => ((el.querySelector("strong") || {}).textContent || "").trim())
    );
    (ledger || [])
      .filter((l) => l.kind === "aftercare_budget" || l.aftercare_id || l.has_aftercare_ref)
      .forEach((l) => {
        const note = String(l.note || "").replace(/\s*·\s*\[aftercare:#\d+\]/, "").trim();
        const aid = l.aftercare_id || l.order_ref || l.order_id;
        if (!aid) return;
        let row = Array.from($$(".item", list)).find((el) => Number(el.dataset.aftercareId) === Number(aid));
        if (!row && existingNotes.has(note)) {
          row = Array.from($$(".item", list)).find(
            (el) => ((el.querySelector("strong") || {}).textContent || "").trim() === note
          );
        }
        if (!row) {
          row = document.createElement("div");
          row.className = "item ledger-aftercare-ref";
          row.innerHTML = `<span class="tag">${esc(l.kind_label || "善后差旅预留")}</span>
            <strong>${esc(note || l.note || "")}</strong>
            <div class="muted">${
              typeof fmtMoney === "function" ? fmtMoney(l.amount) : "¥" + Number(l.amount || 0)
            } · ${typeof fmtTime === "function" ? fmtTime(l.created_at) : ""}</div>`;
          list.insertBefore(row, list.firstChild);
        }
        row.dataset.aftercareId = String(aid);
        row.classList.add("ledger-aftercare-ref");
        row.style.cursor = "pointer";
        if (!row.querySelector(".ledger-go-ac")) {
          const go = document.createElement("button");
          go.type = "button";
          go.className = "btn ghost sm ledger-go-ac";
          go.textContent = "查看关联工单";
          go.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            _highlightAftercareId = Number(aid);
            if (typeof show === "function") show("aftercare");
            else if (typeof refreshAftercare === "function") refreshAftercare();
          };
          row.appendChild(go);
        }
        row.onclick = (e) => {
          if (e.target.closest("button")) return;
          _highlightAftercareId = Number(aid);
          if (typeof show === "function") show("aftercare");
        };
      });
  }

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    try {
      const data = await api("/api/travel-fund");
      // also pull full recent ledger via me for aftercare_budget rows
      let ledger = data.ledger || [];
      try {
        const me = await api("/api/me");
        const more = me.ledger || [];
        const seen = new Set(ledger.map((x) => x.id));
        more.forEach((x) => {
          if (!seen.has(x.id)) ledger.push(x);
        });
      } catch (_) {}
      enhanceTravelLedgerLinks(ledger);
    } catch (_) {}
  };

  /* 9 · 紧急取用待处理醒目卡 */
  async function paintEmergencyPendingCard() {
    const box = $("#heirsBox");
    if (!box) return;
    try {
      const { items } = await api("/api/emergency");
      const pending = (items || []).filter((e) => e.status === "pending");
      let card = $("#emPendingTopCard");
      if (!pending.length) {
        if (card) card.remove();
        return;
      }
      if (!card) {
        card = document.createElement("div");
        card.id = "emPendingTopCard";
        card.className = "card em-pending-top";
        box.insertBefore(card, box.firstChild);
      }
      const first = pending[0];
      card.innerHTML = `<h3>待处理的紧急取用</h3>
        <p class="muted">有 ${pending.length} 条等待期申请。可冷静拒绝或查看详情；等待期算法不变。</p>
        <div class="em-pending-preview">
          <strong>${esc(first.beneficiary_name || "受益人#" + first.beneficiary_id)}</strong>
          <div class="muted">${esc(first.reason || "")}
            ${first.wait_remaining_label ? " · " + esc(first.wait_remaining_label) : ""}</div>
        </div>
        <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn ghost" id="emPendingRefuse">拒绝</button>
          <button type="button" class="btn secondary" id="emPendingView">查看</button>
        </div>`;
      const refuse = $("#emPendingRefuse");
      const view = $("#emPendingView");
      if (refuse) {
        refuse.onclick = async () => {
          const ok = await calmConfirm({
            title: "拒绝紧急取用",
            body: "将拒绝当前这条等待期申请。可稍后在列表中处理其余申请。",
            okLabel: "拒绝",
          });
          if (!ok) return;
          try {
            await api("/api/emergency/decide", {
              method: "POST",
              body: JSON.stringify({
                id: Number(first.id),
                approve: false,
                note: "主人拒绝",
              }),
            });
            toast("已拒绝");
            softBanner("已拒绝该紧急取用申请", "heirs");
            if (typeof refreshHeirs === "function") refreshHeirs();
          } catch (e) {
            toast(e.message);
          }
        };
      }
      if (view) {
        view.onclick = () => {
          const emerCard = Array.from($$("#heirsBox .card")).find((c) =>
            ((c.querySelector("h3") || {}).textContent || "").includes("紧急取用")
          );
          if (emerCard) emerCard.scrollIntoView({ behavior: "smooth", block: "start" });
          const row = $(`#heirsBox .item[data-em-id="${first.id}"]`);
          if (row) {
            row.classList.add("em-highlight");
            setTimeout(() => row.classList.remove("em-highlight"), 5000);
          }
        };
      }
    } catch (_) {}
  }

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    await paintEmergencyPendingCard();
  };

  /* 10 · 设置·一键导出备份 JSON */
  async function ensureBackupExportCard() {
    const box = $("#settingsBox");
    if (!box || $("#backupExportCard")) return;
    const card = document.createElement("div");
    card.id = "backupExportCard";
    card.className = "card";
    card.innerHTML = `<h3>本机备份</h3>
      <p class="muted">打包交割、备忘、受益人与工单摘要。演示级备份，非云同步；请自行妥善保存。</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button type="button" class="btn" id="backupDownloadBtn">下载备份 JSON</button>
        <button type="button" class="btn ghost" id="backupCopyBtn">复制备份 JSON</button>
      </div>
      <p class="muted" id="backupExportHint" style="margin-top:8px"></p>`;
    box.appendChild(card);
    const download = async () => {
      try {
        const pack = await api("/api/export/backup");
        const text = JSON.stringify(pack, null, 2);
        const blob = new Blob([text], { type: "application/json" });
        const a = document.createElement("a");
        const stamp = (pack.exported_at || "").replace(/[:T]/g, "") || String(Date.now());
        a.href = URL.createObjectURL(blob);
        a.download = `einherit-backup-${stamp}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        const hint = $("#backupExportHint");
        if (hint) hint.textContent = pack.backup_note || "已下载。非云同步。";
        softBanner("备份已下载（本机文件，非云同步）", "settings");
        toast("备份已下载");
      } catch (e) {
        toast(e.message);
      }
    };
    const copy = async () => {
      try {
        const pack = await api("/api/export/backup");
        const text = JSON.stringify(pack, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        const hint = $("#backupExportHint");
        if (hint) hint.textContent = pack.backup_note || "已复制。非云同步。";
        softBanner("备份 JSON 已复制（非云同步）", "settings");
        toast("已复制备份 JSON");
      } catch (e) {
        toast(e.message);
      }
    };
    $("#backupDownloadBtn").onclick = download;
    $("#backupCopyBtn").onclick = copy;
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "checkin" && typeof refreshCheckin === "function") {
      /* countdown via refreshCheckin */
    }
    if (id === "legacy") setTimeout(() => {}, 0);
    if (id === "handover" && typeof refreshHandover === "function") {
      /* by_dept via refreshHandover */
    }
    if (id === "aftercare" && typeof refreshAftercare === "function") {
      setTimeout(() => {
        if (typeof refreshAftercare === "function") refreshAftercare();
      }, 40);
    }
    if (id === "assets") setTimeout(() => paintDisposePendingBar(), 40);
    if (id === "travel" && typeof refreshTravel === "function") {
      /* ledger links via refreshTravel */
    }
    if (id === "heirs") setTimeout(() => paintEmergencyPendingCard(), 60);
    if (id === "settings") setTimeout(() => ensureBackupExportCard(), 80);
    if (id === "home") {
      setTimeout(() => {
        paintHomeCountdown();
        paintHomeDeptRing();
      }, 40);
    }
  };

  // settingsBox may be rebuilt by earlier rounds
  const watchSettings = () => {
    const box = $("#settingsBox");
    if (!box) return;
    const mo = new MutationObserver(() => {
      if (!$("#backupExportCard") && box.querySelector(".card")) ensureBackupExportCard();
    });
    mo.observe(box, { childList: true });
  };
  watchSettings();

  // boot
  paintHomeCountdown();
  paintHomeDeptRing();
  paintDisposePendingBar();
  ensureBackupExportCard();
  paintEmergencyPendingCard();
})();
