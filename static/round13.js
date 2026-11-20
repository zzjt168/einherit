/* 电子继承 · 第十三批增量（叠在 round12…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const DEPT_CHIPS = [
    { id: "", label: "全部" },
    { id: "production", label: "生产部" },
    { id: "finance", label: "财务部" },
    { id: "ip", label: "知识产权部" },
    { id: "admin", label: "行政部" },
    { id: "board", label: "董事会" },
  ];
  const AC_TYPE_CHIPS = [
    { id: "", label: "全部类型" },
    { id: "delete_data", label: "删除数据" },
    { id: "sell_asset", label: "变卖资产" },
    { id: "field_visit", label: "上门执行" },
    { id: "legal_consult", label: "法律协办" },
  ];
  const BN_ROLE_CHIPS = [
    { id: "", label: "全部" },
    { id: "heir", label: "继承人" },
    { id: "family", label: "家属" },
    { id: "executor", label: "执行人" },
  ];
  const TRAVEL_QUICK = [2000, 3000, 5000];
  const PREF_KEYS = [
    "einherit_large_text",
    "einherit_privacy_mode",
    "einherit_onboard_skip",
    "einherit_med_favs",
  ];
  const KIND_FALLBACK = {
    membership: "会员年费",
    travel_deposit: "差旅预存",
    travel_refund: "差旅退回",
    checkin: "生存报备",
  };

  let _asDept = "";
  let _acType = "";
  let _bnRole = "";

  function softBanner(msg, hostId) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return;
    const eid = "round13SoftBanner_" + (hostId || "home");
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

  function kindLabel(l) {
    if (l && l.kind_label) return l.kind_label;
    const k = String((l && l.kind) || "");
    return KIND_FALLBACK[k] || k || "其他流水";
  }

  /* 1 · 交割动作统计条（只读小计） */
  function renderLegacyActionStats(counts) {
    const list = $("#lgList");
    if (!list || !list.parentNode) return;
    let bar = $("#lgActionStats");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "lgActionStats";
      bar.className = "lg-action-stats";
      bar.setAttribute("aria-label", "交割动作只读小计");
      const deptBar = $("#lgDeptFilterBar");
      if (deptBar && deptBar.parentNode) deptBar.parentNode.insertBefore(bar, deptBar);
      else list.parentNode.insertBefore(bar, list);
    }
    const c = counts || {};
    const destroy = Number(c.destroy != null ? c.destroy : 0);
    const sale = Number(c.sale != null ? c.sale : 0);
    const gift = Number(c.gift != null ? c.gift : 0);
    const total = Number(c.total != null ? c.total : destroy + sale + gift);
    bar.innerHTML = `<div class="lg-action-stats-label">${esc(
      c.label || "当前列表只读小计"
    )}</div>
      <div class="stat lg-action-stats-row">
        <div class="box"><span class="muted">销毁</span><b>${destroy}</b></div>
        <div class="box"><span class="muted">变现</span><b>${sale}</b></div>
        <div class="box"><span class="muted">转赠</span><b>${gift}</b></div>
        <div class="box"><span class="muted">合计</span><b>${total}</b></div>
      </div>`;
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    try {
      const data = await api("/api/legacy");
      renderLegacyActionStats(data.action_counts || {});
    } catch (_) {}
  };

  /* 2 · 备忘部门筛选（对标交割部门筛） */
  function ensureAssetDeptBar() {
    let bar = $("#asDeptFilterBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "asDeptFilterBar";
    bar.className = "chip-row";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按部门筛选备忘");
    bar.innerHTML = DEPT_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _asDept ? "active" : ""}" data-asdept="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const list = $("#asList");
    const visBar = $("#asVisFilterBar");
    if (visBar && visBar.parentNode) visBar.parentNode.insertBefore(bar, visBar.nextSibling);
    else if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-asdept]");
      if (!btn) return;
      _asDept = btn.dataset.asdept || "";
      $$("#asDeptFilterBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.asdept || "") === _asDept)
      );
      if (typeof refreshAssets === "function") refreshAssets();
    });
    return bar;
  }

  function applyAssetDeptFilter(items) {
    ensureAssetDeptBar();
    const byId = Object.fromEntries((items || []).map((it) => [String(it.id), it]));
    $$("#asList .item[data-id]").forEach((el) => {
      const it = byId[el.dataset.id];
      if (it && it.dept) el.dataset.dept = String(it.dept);
      if (!_asDept) {
        // may still be hidden by other filters; only clear our hide
        if (el.dataset.r13DeptHide === "1") {
          el.hidden = false;
          delete el.dataset.r13DeptHide;
        }
        return;
      }
      const dept = el.dataset.dept || (it && it.dept) || "";
      const ok = dept === _asDept;
      if (!ok) {
        el.hidden = true;
        el.dataset.r13DeptHide = "1";
      } else if (el.dataset.r13DeptHide === "1") {
        el.hidden = false;
        delete el.dataset.r13DeptHide;
      }
    });
    const visible = $$("#asList .item").filter((el) => !el.hidden);
    let tip = $("#asDeptEmptyTip");
    if (_asDept && !visible.length) {
      if (!tip) {
        tip = document.createElement("p");
        tip.id = "asDeptEmptyTip";
        tip.className = "muted";
        const list = $("#asList");
        if (list && list.parentNode) list.parentNode.insertBefore(tip, list.nextSibling);
      }
      tip.textContent = "这一部门暂时没有备忘，换个部门看看即可。";
    } else if (tip) tip.remove();
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    ensureAssetDeptBar();
    try {
      const qs = new URLSearchParams();
      if (_asDept) qs.set("dept", _asDept);
      const visBar = $("#asVisFilterBar .chip.active");
      const vis = (visBar && visBar.dataset.asvis) || "";
      if (vis) qs.set("visibility", vis);
      const data = await api("/api/assets" + (qs.toString() ? "?" + qs.toString() : ""));
      applyAssetDeptFilter(data.items || []);
    } catch (_) {
      applyAssetDeptFilter([]);
    }
  };

  /* 3 · 报备成功后下一步 chip */
  function ensureCheckinNextChips(hostId) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return;
    let row = $("#checkinNextChips");
    if (!row) {
      row = document.createElement("div");
      row.id = "checkinNextChips";
      row.className = "chip-row checkin-next-chips";
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", "报备后下一步");
      row.innerHTML = `<span class="muted checkin-next-label">接下来可以</span>
        <button type="button" class="chip" data-go="legacy">去交割</button>
        <button type="button" class="chip" data-go="company">去盘点</button>`;
      const banner =
        document.getElementById("checkinSoftBanner") ||
        document.getElementById("round13SoftBanner_" + (hostId || "home")) ||
        host.firstChild;
      if (banner && banner.parentNode === host) banner.insertAdjacentElement("afterend", row);
      else host.insertBefore(row, host.firstChild);
    }
    row.hidden = false;
    clearTimeout(row._t);
    row._t = setTimeout(() => {
      row.hidden = true;
    }, 8000);
  }

  const _doQuick = window.doQuickCheckin;
  if (typeof _doQuick === "function") {
    window.doQuickCheckin = async function () {
      await _doQuick();
      softBanner("报备已记下。可按自己的节奏继续。", "home");
      ensureCheckinNextChips("home");
    };
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    const box = $("#checkinBox") || $("#checkin");
    if (!box || box.dataset.r13Next) return;
    box.dataset.r13Next = "1";
    const btns = $$("#checkin button, #checkinBox button");
    btns.forEach((btn) => {
      const t = (btn.textContent || "").trim();
      if (!/报备|我已安全|打卡/.test(t)) return;
      if (btn.dataset.r13chip) return;
      btn.dataset.r13chip = "1";
      btn.addEventListener("click", () => {
        setTimeout(() => ensureCheckinNextChips("checkin"), 400);
      });
    });
  };

  /* 4 · 会员账单 kind 中文标签 */
  const _refreshMember = window.refreshMember;
  window.refreshMember = async function () {
    await _refreshMember();
    try {
      const { ledger } = await api("/api/me");
      const tags = $$("#memberBox .item .tag");
      (ledger || []).forEach((l, i) => {
        if (tags[i]) tags[i].textContent = kindLabel(l);
      });
    } catch (_) {}
  };

  /* 5 · 差旅充值快捷金额 */
  function ensureTravelQuickAmounts() {
    const input = $("#travelAmt");
    if (!input || !input.parentNode) return;
    let row = $("#travelQuickAmts");
    if (row) return;
    row = document.createElement("div");
    row.id = "travelQuickAmts";
    row.className = "chip-row travel-quick-amts";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "快捷充值金额");
    row.innerHTML = TRAVEL_QUICK.map(
      (n) =>
        `<button type="button" class="chip" data-amt="${n}">¥${n}</button>`
    ).join("");
    input.parentNode.insertBefore(row, input.nextSibling);
    row.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-amt]");
      if (!btn) return;
      const amt = Number(btn.dataset.amt || 0);
      if (!amt) return;
      const field = $("#travelAmt");
      if (field) field.value = String(amt);
      $$("#travelQuickAmts .chip").forEach((c) =>
        c.classList.toggle("active", c === btn)
      );
      softBanner(`已填入 ¥${amt}（演示）`, "travel");
    });
  }

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    ensureTravelQuickAmounts();
  };

  /* 6 · 工单按服务类型筛选 */
  function ensureAftercareTypeBar() {
    let bar = $("#acTypeFilterBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "acTypeFilterBar";
    bar.className = "chip-row ac-type-filters";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按服务类型筛选工单");
    bar.innerHTML = AC_TYPE_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _acType ? "active" : ""}" data-actype="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const statusBar = $("#acStatusFilterBar");
    const list = $("#acList");
    if (statusBar && statusBar.parentNode) {
      statusBar.parentNode.insertBefore(bar, statusBar.nextSibling);
    } else if (list && list.parentNode) {
      list.parentNode.insertBefore(bar, list);
    }
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-actype]");
      if (!btn) return;
      _acType = btn.dataset.actype || "";
      $$("#acTypeFilterBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.actype || "") === _acType)
      );
      if (typeof refreshAftercare === "function") refreshAftercare();
    });
    return bar;
  }

  function applyAftercareTypeFilter(items) {
    ensureAftercareTypeBar();
    const nodes = $$("#acList .item");
    (items || []).forEach((it, i) => {
      const el = nodes[i];
      if (!el) return;
      el.dataset.serviceType = String(it.service_type || "");
    });
    // Also match by scanning if lengths differ after status filter
    $$("#acList .item").forEach((el) => {
      if (!_acType) {
        if (el.dataset.r13TypeHide === "1") {
          el.hidden = false;
          delete el.dataset.r13TypeHide;
        }
        return;
      }
      const st = el.dataset.serviceType || "";
      const ok = st === _acType;
      if (!ok) {
        el.hidden = true;
        el.dataset.r13TypeHide = "1";
      } else if (el.dataset.r13TypeHide === "1") {
        el.hidden = false;
        delete el.dataset.r13TypeHide;
      }
    });
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    ensureAftercareTypeBar();
    try {
      const qs = _acType
        ? "?service_type=" + encodeURIComponent(_acType)
        : "";
      const data = await api("/api/aftercare" + qs);
      // If filtering by type via API, re-render list when status bar isn't driving
      if (_acType && $("#acList")) {
        const labels =
          typeof SERVICE_LABEL !== "undefined"
            ? SERVICE_LABEL
            : {
                delete_data: "删除电子数据",
                sell_asset: "变卖电子资产",
                field_visit: "上门执行",
                legal_consult: "法律顾问协办",
              };
        const items = data.items || [];
        if (items.length) {
          // annotate existing or rebuild lightly
          applyAftercareTypeFilter(items);
          // If status filter left mismatched nodes, rebuild from type-filtered set
          const list = $("#acList");
          const statusActive = ($("#acStatusFilterBar .chip.active") || {}).dataset;
          const stKey = (statusActive && statusActive.acst) || "";
          const filtered = stKey
            ? items.filter((it) => it.status_key === stKey)
            : items;
          list.innerHTML = filtered
            .map(
              (it) => `<div class="item" data-service-type="${esc(it.service_type || "")}">
      <strong>${esc(it.title || "")}</strong>
      <div class="muted">${esc(labels[it.service_type] || it.service_type || "")}
        · ${esc(it.city || "未填城市")}
        · 差旅预算 ${
          typeof fmtMoney === "function"
            ? fmtMoney(it.travel_budget)
            : "¥" + Number(it.travel_budget || 0)
        }
        · ${esc(it.coop_state || "")}
        · ${esc(it.status || "")}</div>
      <div class="muted">${esc(it.visit_pref || "")} ${esc(it.notes || "")}</div>
      ${
        it.contact_window
          ? `<div class="muted ac-contact-window">联系窗口：${esc(it.contact_window)}</div>`
          : ""
      }
    </div>`
            )
            .join("");
        } else {
          $("#acList").innerHTML =
            `<p class="muted">这一服务类型暂时没有工单，换个类型看看即可。</p>`;
        }
      } else {
        applyAftercareTypeFilter(data.items || []);
      }
    } catch (_) {}
  };

  /* 7 · 授权视频缺失项提示 */
  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    try {
      const st = await api("/api/auth-video");
      const card = $("#avUploadCard");
      if (!card) return;
      let tip = $("#avMissingTip");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "avMissingTip";
        tip.className = "av-missing-tip";
        const banner = $("#avCompleteBanner");
        if (banner && banner.parentNode) banner.insertAdjacentElement("afterend", tip);
        else card.insertBefore(tip, card.firstChild);
      }
      const missing = st.missing || [];
      if (st.ready || st.complete || !missing.length) {
        tip.hidden = true;
        tip.innerHTML = "";
        return;
      }
      tip.hidden = false;
      tip.innerHTML = `<p class="muted">${esc(st.missing_text || "还差几项。")}</p>
        <ul class="av-missing-list">${missing
          .map((m) => `<li>${esc(m.label || m.key || "")}</li>`)
          .join("")}</ul>`;
    } catch (_) {}
  };

  /* 8 · 受益人角色筛选 */
  function ensureBeneRoleBar() {
    let bar = $("#bnRoleFilterBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "bnRoleFilterBar";
    bar.className = "chip-row bn-role-filters";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按角色筛选受益人");
    bar.innerHTML = BN_ROLE_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _bnRole ? "active" : ""}" data-bnrole="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const box = $("#heirsBox");
    if (box) box.parentNode.insertBefore(bar, box);
    else {
      const form = $("#bnAdd") && $("#bnAdd").closest(".card");
      if (form && form.parentNode) form.parentNode.insertBefore(bar, form.nextSibling);
    }
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-bnrole]");
      if (!btn) return;
      _bnRole = btn.dataset.bnrole || "";
      $$("#bnRoleFilterBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.bnrole || "") === _bnRole)
      );
      applyBeneRoleFilter();
    });
    return bar;
  }

  function applyBeneRoleFilter() {
    ensureBeneRoleBar();
    const card = $$("#heirsBox .card").find((c) =>
      ((c.querySelector("h3") || {}).textContent || "").includes("受益人")
    );
    const list = card ? card.querySelector(".list") : $("#heirsBox .list");
    if (!list) return;
    let visible = 0;
    $$(".item", list).forEach((el) => {
      const role =
        el.dataset.role ||
        ((el.querySelector(".tag") || {}).textContent || "").trim().toLowerCase();
      // role tags may be Chinese labels — also check data-role from API annotate
      let ok = !_bnRole;
      if (_bnRole) {
        const raw = (el.dataset.role || "").toLowerCase();
        if (raw) ok = raw === _bnRole;
        else {
          const map = { heir: "继承人", family: "家属", executor: "执行人", trustee: "受托人" };
          const label = map[_bnRole] || _bnRole;
          const tag = ((el.querySelector(".tag") || {}).textContent || "").trim();
          ok = tag === label || tag === _bnRole || tag.toLowerCase() === _bnRole;
        }
      }
      el.hidden = !ok;
      if (ok) visible += 1;
    });
    let tip = $("#bnRoleEmptyTip");
    if (_bnRole && !visible) {
      if (!tip) {
        tip = document.createElement("p");
        tip.id = "bnRoleEmptyTip";
        tip.className = "muted";
        list.parentNode.appendChild(tip);
      }
      tip.textContent = "这一角色暂时没有登记，换个角色看看即可。";
    } else if (tip) tip.remove();
  }

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    ensureBeneRoleBar();
    try {
      const qs = _bnRole ? "?role=" + encodeURIComponent(_bnRole) : "";
      const data = await api("/api/beneficiaries" + qs);
      const card = $$("#heirsBox .card").find((c) =>
        ((c.querySelector("h3") || {}).textContent || "").includes("受益人")
      );
      const list = card ? card.querySelector(".list") : null;
      if (list && _bnRole) {
        const ROLE_LABEL =
          typeof window.ROLE_LABEL === "object"
            ? window.ROLE_LABEL
            : { heir: "继承人", family: "家属", executor: "执行人", trustee: "受托人" };
        list.innerHTML = (data.items || []).length
          ? (data.items || [])
              .map(
                (b) =>
                  `<div class="item" data-role="${esc(b.role || "")}"><span class="tag role-badge role-${esc(
                    b.role || "other"
                  )}">${esc(ROLE_LABEL[b.role] || b.role || "")}</span><strong>${esc(
                    b.name || ""
                  )}</strong>
                  <div class="muted">${esc(b.contact || "")} ${esc(b.note || "")}</div></div>`
              )
              .join("")
          : "<p class='muted'>这一角色暂时没有登记</p>";
      } else {
        // annotate roles on existing items
        const all = await api("/api/beneficiaries");
        const byName = {};
        (all.items || []).forEach((b) => {
          byName[String(b.name || "")] = b;
        });
        if (list) {
          $$(".item", list).forEach((el) => {
            const name = ((el.querySelector("strong") || {}).textContent || "").trim();
            const b = byName[name];
            if (b) el.dataset.role = String(b.role || "");
          });
        }
        applyBeneRoleFilter();
      }
    } catch (_) {
      applyBeneRoleFilter();
    }
  };

  /* 9 · 手册分享提示常驻 */
  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    try {
      const data = await api("/api/handover");
      const panel = $("#handover");
      const box = $("#handoverBox");
      if (!panel || !box) return;
      let tip = $("#handoverShareHint");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "handoverShareHint";
        tip.className = "ok soft-banner share-hint-bar";
        const head = panel.querySelector(".panel-head");
        if (head && head.nextSibling) panel.insertBefore(tip, head.nextSibling);
        else panel.insertBefore(tip, box);
      }
      tip.hidden = false;
      tip.textContent =
        data.share_hint || "仅执行人持有，勿转发至群聊或公开渠道。";
    } catch (_) {}
  };

  /* 10 · 设置·重置本机偏好 */
  function ensureResetPrefsCard() {
    const box = $("#settingsBox");
    if (!box || $("#resetPrefsCard")) return;
    const card = document.createElement("div");
    card.id = "resetPrefsCard";
    card.className = "card";
    card.innerHTML = `<h3>本机偏好</h3>
      <p class="muted">清除大字号、隐私遮罩、引导跳过等本机记住项。不影响服务器数据。</p>
      <button type="button" class="btn ghost" id="resetPrefsBtn">重置本机偏好</button>`;
    box.appendChild(card);
    $("#resetPrefsBtn").onclick = async () => {
      const ok = await calmConfirm({
        title: "重置本机偏好",
        body: "将清除大字号、隐私遮罩、引导跳过等 localStorage 项。服务器上的交割与报备数据不受影响。",
        okLabel: "清除偏好",
      });
      if (!ok) return;
      PREF_KEYS.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch (_) {}
      });
      document.body.classList.remove("large-text");
      softBanner("本机偏好已清除", "settings");
      toast("本机偏好已重置");
      if (typeof show === "function") show("settings");
    };
  }

  // Hook settings refresh: round6 rebuilds settingsBox — re-attach after
  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "legacy") setTimeout(() => {
      if (typeof refreshLegacy === "function") {
        /* stats via refreshLegacy */
      }
    }, 0);
    if (id === "assets") setTimeout(() => ensureAssetDeptBar(), 0);
    if (id === "travel") setTimeout(() => ensureTravelQuickAmounts(), 0);
    if (id === "aftercare") setTimeout(() => ensureAftercareTypeBar(), 0);
    if (id === "heirs") setTimeout(() => ensureBeneRoleBar(), 0);
    if (id === "handover" && typeof refreshHandover === "function") {
      /* share hint via refreshHandover */
    }
    if (id === "settings") setTimeout(() => ensureResetPrefsCard(), 80);
    if (id === "authvideo" && typeof refreshAuthVideo === "function") {
      /* missing tip via refreshAuthVideo */
    }
  };

  // When round6 refreshSettings replaces DOM, re-add card
  const origSettingsObserver = () => {
    const box = $("#settingsBox");
    if (!box) return;
    const mo = new MutationObserver(() => {
      if (!$("#resetPrefsCard") && box.querySelector(".card")) ensureResetPrefsCard();
    });
    mo.observe(box, { childList: true });
  };
  origSettingsObserver();

  // boot
  ensureAssetDeptBar();
  ensureTravelQuickAmounts();
  ensureAftercareTypeBar();
  ensureBeneRoleBar();
  ensureResetPrefsCard();
})();
