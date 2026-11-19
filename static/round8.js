/* 电子继承 · 第八批增量（叠在 round7/round6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const PRIVACY_KEY = "einherit_privacy_mode";
  const QUICK_ACTIONS = ["销毁", "变现", "转赠", "清除"];
  const ASSET_TAG_FILTERS = [
    { id: "", label: "全部" },
    { id: "账号", label: "账号" },
    { id: "设备", label: "设备" },
    { id: "虚拟资产", label: "虚拟资产" },
    { id: "其他", label: "其他" },
  ];
  const AC_STATUS_FILTERS = [
    { id: "", label: "全部" },
    { id: "pending_auth", label: "待授权" },
    { id: "executable", label: "可执行" },
    { id: "done", label: "已完成" },
  ];

  let _asTagFilter = "";
  let _acStatusFilter = "";
  let _asCache = [];
  let _acCache = [];

  function privacyOn() {
    return localStorage.getItem(PRIVACY_KEY) === "1";
  }

  function maskContact(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    if (!privacyOn()) return s;
    const digits = s.replace(/\D/g, "");
    if (digits.length >= 7) {
      return digits.slice(0, 3) + "****" + digits.slice(-4);
    }
    if (s.includes("@")) {
      const [name, domain] = s.split("@");
      return (name ? name[0] + "***" : "***") + "@" + (domain || "");
    }
    if (s.length <= 2) return "*".repeat(s.length);
    return s[0] + "*".repeat(Math.max(1, s.length - 2)) + s.slice(-1);
  }

  function applyPrivacyMasks(root) {
    if (!privacyOn()) return;
    const scope = root || document;
    scope.querySelectorAll("[data-privacy-raw]").forEach((el) => {
      el.textContent = maskContact(el.getAttribute("data-privacy-raw") || el.textContent);
    });
    scope.querySelectorAll(".muted, .item").forEach((node) => {
      if (node.dataset.privacyRaw) return;
      if (node.querySelector("input,textarea,select,button")) return;
      const t = node.childNodes.length === 1 && node.childNodes[0].nodeType === 3 ? node.textContent || "" : "";
      if (!t) return;
      const m = t.match(/(\+?\d[\d\s-]{6,}\d)/);
      if (!m) return;
      node.dataset.privacyRaw = m[1];
      node.textContent = t.replace(m[1], maskContact(m[1]));
    });
  }

  function copyText(text) {
    const t = String(text || "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(t);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = t;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  function matchQuickAction(action) {
    const a = String(action || "");
    for (const q of QUICK_ACTIONS) {
      if (a === q || a.includes(q)) return q;
    }
    return "销毁";
  }

  /* 1 · 执行人卡片可读（首页 + 手册） */
  async function renderExecutorCard(hostId, insertBeforeSel) {
    const host = document.getElementById(hostId);
    if (!host) return;
    let card = document.getElementById("executorCard_" + hostId);
    if (!card) {
      card = document.createElement("div");
      card.id = "executorCard_" + hostId;
      card.className = "card executor-card";
      const before = insertBeforeSel ? host.querySelector(insertBeforeSel) : null;
      if (before) host.insertBefore(card, before);
      else host.appendChild(card);
    }
    try {
      const data = await api("/api/executor-card");
      const contact = data.contact_hint
        ? `<div class="muted" data-privacy-raw="${esc(data.contact_hint)}">${esc(
            maskContact(data.contact_hint)
          )}</div>`
        : `<div class="muted">${esc(data.contact_text || "")}</div>`;
      card.innerHTML = `<h3>执行人</h3>
        <p class="muted">${esc(data.note || "只读展示")}</p>
        <strong>${esc(data.has_executor ? data.name : "尚未指定")}</strong>
        ${contact}
        <div class="row" style="margin-top:10px">
          <button class="btn ghost sm" type="button" data-go="${esc(data.go || "checkin")}">${esc(
        data.cta || "去设置"
      )}</button>
        </div>`;
    } catch (e) {
      card.innerHTML = `<h3>执行人</h3><p class="muted">暂不可用：${esc(e.message)}</p>`;
    }
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    await renderExecutorCard("home", "#todayTodos");
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    await renderExecutorCard("handover", "#handPreviewCard");
    await ensureExportSummaryCard("handover");
  };

  /* 2 · 交割条目快速编辑入口 */
  function enhanceLegacyQuickEdit() {
    $$("#lgList .item[data-id]").forEach((el) => {
      if (el.querySelector(".lg-quick-action")) return;
      const id = Number(el.dataset.id);
      let current = "销毁";
      const actionTag = Array.from(el.querySelectorAll(".tag")).find((t) =>
        QUICK_ACTIONS.some((q) => (t.textContent || "").includes(q))
      );
      if (actionTag) current = matchQuickAction(actionTag.textContent);
      const wrap = document.createElement("label");
      wrap.className = "field lg-quick-action";
      wrap.innerHTML = `改处置
        <select data-lg-quick="${id}">
          ${QUICK_ACTIONS.map(
            (a) => `<option value="${a}" ${a === current ? "selected" : ""}>${a}</option>`
          ).join("")}
        </select>`;
      el.appendChild(wrap);
      wrap.querySelector("select").onchange = async (ev) => {
        const action = ev.target.value;
        try {
          await api("/api/legacy/update", {
            method: "POST",
            body: JSON.stringify({ id, action }),
          });
          toast("已更新处置：" + action);
          if (typeof refreshLegacy === "function") refreshLegacy();
        } catch (e) {
          toast(e.message);
        }
      };
    });
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    enhanceLegacyQuickEdit();
  };

  /* 3 · 备忘按标签筛选 */
  function ensureAssetTagBar() {
    let bar = $("#asTagFilterBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "asTagFilterBar";
    bar.className = "chip-row as-tag-filters";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按标签筛选");
    bar.innerHTML = ASSET_TAG_FILTERS.map(
      (f) =>
        `<button type="button" class="chip ${f.id === _asTagFilter ? "active" : ""}" data-atag="${esc(
          f.id
        )}">${esc(f.label)}</button>`
    ).join("");
    const list = $("#asList");
    const search = $("#asSearchBox");
    if (search && search.parentNode) search.parentNode.insertBefore(bar, search.nextSibling);
    else if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-atag]");
      if (!btn) return;
      _asTagFilter = btn.dataset.atag || "";
      $$("#asTagFilterBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.atag || "") === _asTagFilter)
      );
      applyAssetTagFilter();
    });
    return bar;
  }

  function applyAssetTagFilter() {
    const list = $("#asList");
    if (!list) return;
    let visible = 0;
    $$("#asList .item").forEach((el) => {
      const tag = el.dataset.tag || "其他";
      const ok = !_asTagFilter || tag === _asTagFilter;
      el.hidden = !ok;
      if (ok) visible += 1;
    });
    let tip = $("#asTagEmpty");
    if (_asTagFilter && !visible) {
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "asTagEmpty";
        tip.className = "empty-state";
        list.parentNode.insertBefore(tip, list.nextSibling);
      }
      tip.innerHTML = `<p class="empty-title">这一类暂时还没有备忘</p>
        <p class="empty-hint">换个标签看看，或记一笔平台与处置指引。</p>`;
    } else if (tip) tip.remove();
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    try {
      const { items } = await api("/api/assets");
      _asCache = items || [];
      const byId = Object.fromEntries(_asCache.map((it) => [String(it.id), it]));
      $$("#asList .item[data-id]").forEach((el) => {
        const it = byId[el.dataset.id];
        const tag = (it && it.tag) || "其他";
        el.dataset.tag = tag;
        if (!el.querySelector(".as-tag-badge")) {
          const badge = document.createElement("span");
          badge.className = "tag as-tag-badge";
          badge.textContent = tag;
          el.insertBefore(badge, el.firstChild);
        }
      });
      ensureAssetTagBar();
      applyAssetTagFilter();
      applyPrivacyMasks($("#asList"));
    } catch (_) {}
  };

  /* 4 · 报备频率可读说明 */
  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    try {
      const data = await api("/api/checkin/readable");
      const box = $("#checkinBox");
      if (!box) return;
      let card = $("#checkinReadableCard");
      if (!card) {
        card = document.createElement("div");
        card.id = "checkinReadableCard";
        card.className = "card";
        const first = box.querySelector(".card");
        if (first && first.nextSibling) box.insertBefore(card, first.nextSibling);
        else box.appendChild(card);
      }
      card.innerHTML = `<h3>报备节奏说明</h3>
        <p class="muted">只读提示，不改外呼升级流程。</p>
        <div class="stat" style="margin-top:10px">
          <div class="box"><span class="muted">间隔</span><b style="font-size:15px">${esc(
            String(data.interval_hours)
          )} 小时</b></div>
          <div class="box"><span class="muted">下次建议</span><b style="font-size:14px">${esc(
            data.next_suggested_label || "—"
          )}</b></div>
        </div>
        <p class="muted" style="margin-top:8px">${esc(data.readable || "")}</p>`;
      applyPrivacyMasks(box);
    } catch (_) {}
  };

  /* 5 · 差旅余额进度条 */
  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    try {
      const { fund } = await api("/api/travel-fund");
      const box = $("#travelBox .card");
      if (!box) return;
      let bar = $("#travelProgress");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "travelProgress";
        bar.className = "travel-progress";
        const stat = box.querySelector(".stat");
        if (stat) stat.insertAdjacentElement("afterend", bar);
        else box.appendChild(bar);
      }
      const pct = Number(fund.progress_pct != null ? fund.progress_pct : 0);
      const label = fund.progress_label || (fund.meets_threshold || fund.met ? "已达建议门槛" : "按自己节奏预存即可");
      bar.innerHTML = `<div class="travel-progress-meta">
          <span>相对 ¥${Number(fund.threshold || 2000)} 建议门槛</span>
          <span>${esc(label)}</span>
        </div>
        <div class="travel-progress-track" aria-hidden="true">
          <div class="travel-progress-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div>
        </div>`;
    } catch (_) {}
  };

  /* 6 · 善后工单状态筛选 */
  function ensureAftercareFilterBar() {
    let bar = $("#acStatusFilterBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "acStatusFilterBar";
    bar.className = "chip-row ac-status-filters";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按工单状态筛选");
    bar.innerHTML = AC_STATUS_FILTERS.map(
      (f) =>
        `<button type="button" class="chip ${f.id === _acStatusFilter ? "active" : ""}" data-acst="${esc(
          f.id
        )}">${esc(f.label)}</button>`
    ).join("");
    const list = $("#acList");
    if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-acst]");
      if (!btn) return;
      _acStatusFilter = btn.dataset.acst || "";
      $$("#acStatusFilterBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.acst || "") === _acStatusFilter)
      );
      renderAftercareFiltered();
    });
    return bar;
  }

  function renderAftercareFiltered() {
    const list = $("#acList");
    if (!list) return;
    ensureAftercareFilterBar();
    const items = (_acCache || []).filter(
      (it) => !_acStatusFilter || it.status_key === _acStatusFilter
    );
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">
        <p class="empty-title">这一状态暂时没有工单</p>
        <p class="empty-hint">换个筛选看看，或授权齐备后再开一张温和工单。</p>
      </div>`;
      return;
    }
    const labels =
      typeof SERVICE_LABEL !== "undefined"
        ? SERVICE_LABEL
        : {
            delete_data: "删除电子数据",
            sell_asset: "变卖电子资产",
            field_visit: "上门执行",
            legal_consult: "合规协办",
          };
    list.innerHTML = items
      .map(
        (it) => `<div class="item" data-status-key="${esc(it.status_key || "")}">
      <span class="tag status-${esc(it.status_key || "")}">${esc(it.status_label || it.status || "")}</span>
      <strong>${esc(it.title)}</strong>
      <div class="muted">${esc(labels[it.service_type] || it.service_type || "")}
        · ${esc(it.city || "未填城市")}
        · 差旅预算 ${fmtMoney(it.travel_budget)}
        · ${esc(it.coop_state || "")}</div>
      <div class="muted">${esc(it.visit_pref || "")} ${esc(it.notes || "")}</div>
    </div>`
      )
      .join("");
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    try {
      const { items } = await api("/api/aftercare");
      _acCache = items || [];
      if (!_acCache.length) return;
      renderAftercareFiltered();
    } catch (_) {}
  };

  /* 7 · 授权视频门槛清单勾选回显 */
  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    try {
      const st = await api("/api/auth-video");
      const card = $("#avUploadCard");
      if (!card) return;
      let echo = $("#avChecklistEcho");
      if (!echo) {
        echo = document.createElement("div");
        echo.id = "avChecklistEcho";
        echo.className = "av-checklist-echo";
        const checks = $("#avChecks");
        if (checks) checks.insertAdjacentElement("afterend", echo);
        else card.appendChild(echo);
      }
      const list = st.checklist || [];
      echo.innerHTML = `<p class="muted">门槛回显（只读）：问候 / 授权 / 思路</p>
        <div class="auth-gate">
          ${list
            .map(
              (c) =>
                `<div class="gate-cell ${c.done || c.demo_checked ? "ok" : "miss"}"><b>${
                  c.done || c.demo_checked ? "✓" : "·"
                }</b>${esc(c.label)}</div>`
            )
            .join("")}
        </div>`;
      // sync demo checkboxes to latest submitted state (clearer echo; user may still toggle to upload)
      if (list.length) {
        const map = {
          greeting: $("#avGreet"),
          authorize: $("#avAuth"),
          plan: $("#avPlan"),
        };
        list.forEach((c) => {
          const el = map[c.key];
          if (el && (c.done || c.demo_checked)) el.checked = true;
        });
      }
    } catch (_) {}
  };

  /* 8 · 紧急取用等待期倒计时只读 */
  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    try {
      const { items } = await api("/api/emergency");
      const cards = $$("#heirsBox .card");
      const emerCard = Array.from(cards).find((c) => (c.querySelector("h3") || {}).textContent === "紧急取用申请");
      if (!emerCard) return;
      const list = emerCard.querySelector(".list");
      if (!list) return;
      const pending = (items || []).filter((e) => e.status === "pending");
      $$("#heirsBox .item").forEach((el) => {
        /* leave beneficiaries alone */
      });
      // Rebuild emergency list with countdown (decide flow untouched)
      const statusLabel = {
        pending: "等待中",
        approved: "已批准",
        denied: "已拒绝",
        auto_granted: "到期自动放行",
      };
      if (!(items || []).length) return;
      list.innerHTML = items
        .map((e) => {
          const wait =
            e.status === "pending" && e.wait_remaining_label
              ? `<div class="muted wait-remain">${esc(e.wait_remaining_label)}（只读）</div>`
              : "";
          return `<div class="item" data-em-id="${e.id}">
          <span class="tag">${esc(statusLabel[e.status] || e.status)}</span>
          <strong>${esc(e.beneficiary_name || "受益人#" + e.beneficiary_id)}</strong>
          <div class="muted">${esc(e.reason || "")} · 等待 ${esc(String(e.wait_days))} 天 · 截止 ${fmtTime(
            e.decide_by
          )}</div>
          ${wait}
          ${
            e.status === "pending"
              ? `<div class="row" style="margin-top:8px;gap:8px">
                  <button class="btn secondary emDec" data-id="${e.id}" data-ok="1">批准</button>
                  <button class="btn ghost emDec" data-id="${e.id}" data-ok="0">拒绝</button>
                </div>`
              : ""
          }
        </div>`;
        })
        .join("");
      $$("#heirsBox .emDec").forEach((btn) => {
        btn.onclick = async () => {
          await api("/api/emergency/decide", {
            method: "POST",
            body: JSON.stringify({ id: Number(btn.dataset.id), approve: btn.dataset.ok === "1" }),
          });
          toast(btn.dataset.ok === "1" ? "已批准" : "已拒绝");
          refreshHeirs();
        };
      });
      applyPrivacyMasks($("#heirsBox"));
      void pending;
    } catch (_) {}
  };

  /* 9 · 导出包一键复制摘要 */
  async function ensureExportSummaryCard(hostId) {
    const host =
      hostId === "settings"
        ? $("#settingsBox")
        : hostId === "handover"
          ? $("#handover")
          : null;
    if (!host) return;
    const eid = "exportSummaryCard_" + hostId;
    let card = document.getElementById(eid);
    if (!card) {
      card = document.createElement("div");
      card.id = eid;
      card.className = "card";
      if (hostId === "settings") host.appendChild(card);
      else host.appendChild(card);
    }
    try {
      const data = await api("/api/export/summary");
      const s = data.summary || {};
      card.innerHTML = `<h3>导出摘要</h3>
        <p class="muted">一键复制条数摘要，便于粘贴到备忘或与执行人核对。</p>
        <p id="${eid}_text">${esc(s.text || "")}</p>
        <button class="btn ghost" type="button" id="${eid}_btn">复制摘要</button>`;
      const btn = document.getElementById(eid + "_btn");
      if (btn) {
        btn.onclick = async () => {
          try {
            await copyText(s.text || "");
            toast("摘要已复制");
          } catch (e) {
            toast(e.message || "复制失败");
          }
        };
      }
    } catch (e) {
      card.innerHTML = `<h3>导出摘要</h3><p class="muted">暂不可用：${esc(e.message)}</p>`;
    }
  }

  /* 10 · 隐私模式开关 */
  function ensurePrivacyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#privacyModeCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "privacyModeCard";
      card.className = "card";
      box.appendChild(card);
    }
    const on = privacyOn();
    document.body.classList.toggle("privacy-mode", on);
    card.innerHTML = `<h3>隐私模式</h3>
      <p class="muted">本机隐藏电话尾号与联系方式中间位，列表脱敏显示；不上传。</p>
      <label class="row large-toggle"><input type="checkbox" id="privacyModeToggle" ${
        on ? "checked" : ""
      }/> <span>开启隐私模式（本机记住）</span></label>`;
    const tog = $("#privacyModeToggle");
    if (tog) {
      tog.onchange = (e) => {
        const v = e.target.checked;
        localStorage.setItem(PRIVACY_KEY, v ? "1" : "0");
        document.body.classList.toggle("privacy-mode", v);
        toast(v ? "已开启隐私模式" : "已关闭隐私模式");
        // refresh visible lists to re-mask / unmask
        if (typeof refreshHeirs === "function" && $("#heirs")?.classList.contains("active")) refreshHeirs();
        if (typeof refreshAssets === "function" && $("#assets")?.classList.contains("active")) refreshAssets();
        if (typeof refreshHome === "function" && $("#home")?.classList.contains("active")) refreshHome();
        if (typeof refreshCheckin === "function" && $("#checkin")?.classList.contains("active"))
          refreshCheckin();
      };
    }
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "settings") {
      setTimeout(() => {
        ensurePrivacyCard();
        ensureExportSummaryCard("settings");
      }, 0);
    }
    if (id === "handover") {
      setTimeout(() => {
        renderExecutorCard("handover", "#handPreviewCard");
        ensureExportSummaryCard("handover");
      }, 0);
    }
  };

  document.body.classList.toggle("privacy-mode", privacyOn());
})();
