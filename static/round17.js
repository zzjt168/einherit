/* 电子继承 · 第十七批增量（叠在 round16…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const FAV_KEY = "einherit_med_favs";
  const EMPTY_BENE = "__empty__";
  let _lgBeneFilter = "";
  let _travelLedgerKind = "";
  let _medFavOpen = false;

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round17SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner soft-banner-cta";
      el.hidden = true;
      host.insertBefore(el, host.firstChild);
    }
    el.innerHTML = "";
    const text = document.createElement("span");
    text.textContent = msg;
    el.appendChild(text);
    (actions || []).forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = a.label;
      btn.onclick = (e) => {
        e.preventDefault();
        if (typeof a.onClick === "function") a.onClick();
      };
      el.appendChild(btn);
    });
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 8000);
    return el;
  }

  function getFavs() {
    try {
      const raw = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return Array.isArray(raw) ? raw.map(Number).filter((n) => n > 0) : [];
    } catch (_) {
      return [];
    }
  }

  function setFavs(ids) {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids || []));
  }

  function disposePrimary(note) {
    const s = String(note || "").trim();
    if (/变现|销售/.test(s)) return "变现";
    if (/转赠/.test(s)) return "转赠";
    if (/销毁/.test(s)) return "销毁";
    return "";
  }

  function disposeExtra(note) {
    const s = String(note || "").trim();
    const primary = disposePrimary(s);
    if (!primary) return s;
    return s
      .replace(new RegExp("^" + primary + "\\s*[·•-]\\s*"), "")
      .replace(new RegExp("^" + primary + "$"), "")
      .trim();
  }

  /* 1 · 首页服务正常轻提示（失败仍用 round16 不可用条） */
  async function paintHomeOkBadge() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeHealthOkBadge");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeHealthOkBadge";
      bar.className = "home-health-ok-badge";
      bar.setAttribute("role", "status");
      bar.hidden = true;
      const soft = $("#homeHealthBadge");
      if (soft && soft.parentNode === home) soft.insertAdjacentElement("afterend", bar);
      else {
        const head = home.querySelector(".panel-head") || home.firstChild;
        if (head && head.parentNode === home) head.insertAdjacentElement("afterend", bar);
        else home.insertBefore(bar, home.firstChild);
      }
    }
    try {
      const h = await api("/api/health");
      if (h && h.ok) {
        const soft = $("#homeHealthBadge");
        if (soft) {
          soft.hidden = true;
          soft.textContent = "";
        }
        bar.hidden = false;
        bar.className = "home-health-ok-badge is-ok";
        bar.textContent = "服务正常 · v" + (h.version || "—");
        return;
      }
      bar.hidden = true;
      bar.textContent = "";
    } catch (_) {
      bar.hidden = true;
      bar.textContent = "";
    }
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    await paintHomeOkBadge();
  };

  /* 2 · 交割按接收人筛选 */
  function ensureLegacyBeneFilterBar(items) {
    const list = $("#lgList");
    if (!list || !list.parentNode) return null;
    let bar = $("#lgBeneChipBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "lgBeneChipBar";
      bar.className = "chip-row lg-bene-chip-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "按接收人筛选交割");
      const miss = $("#lgMissingBeneBar");
      const stats = $("#lgActionStats");
      const dept = $("#lgDeptFilterBar");
      const anchor = miss || stats || dept;
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(bar, anchor.nextSibling);
      else list.parentNode.insertBefore(bar, list);
    }
    const names = [];
    const seen = new Set();
    let emptyCount = 0;
    (items || []).forEach((it) => {
      const b = String(it.beneficiary || "").trim();
      if (!b) {
        emptyCount += 1;
        return;
      }
      if (!seen.has(b)) {
        seen.add(b);
        names.push(b);
      }
    });
    names.sort((a, b) => a.localeCompare(b, "zh"));
    const chips = [
      { id: "", label: "全部接收人" },
      ...names.map((n) => ({ id: n, label: n })),
    ];
    if (emptyCount > 0) chips.push({ id: EMPTY_BENE, label: "未指定接收人" });
    bar.innerHTML = chips
      .map(
        (c) =>
          `<button type="button" class="chip ${
            c.id === _lgBeneFilter ? "active" : ""
          }" data-lgbene="${esc(c.id)}">${esc(c.label)}</button>`
      )
      .join("");
    $$("#lgBeneChipBar [data-lgbene]").forEach((btn) => {
      btn.onclick = () => {
        _lgBeneFilter = btn.dataset.lgbene || "";
        applyLegacyBeneFilter(items || []);
        ensureLegacyBeneFilterBar(items || []);
      };
    });
    return bar;
  }

  function applyLegacyBeneFilter(items) {
    ensureLegacyBeneFilterBar(items);
    const byId = {};
    (items || []).forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#lgList .item").forEach((el, i) => {
      const it =
        (el.dataset.id && byId[el.dataset.id]) ||
        (items || [])[i] ||
        null;
      if (it && !el.dataset.id) el.dataset.id = String(it.id || "");
      const bene = String(
        (it && it.beneficiary) || el.dataset.beneficiary || el.dataset.bene || ""
      ).trim();
      if (it) el.dataset.beneficiary = bene;
      if (!_lgBeneFilter) {
        el.hidden = false;
        return;
      }
      if (_lgBeneFilter === EMPTY_BENE) {
        el.hidden = !!bene;
        return;
      }
      el.hidden = bene !== _lgBeneFilter;
    });
    let tip = $("#lgBeneChipEmptyTip");
    const visible = $$("#lgList .item").filter((el) => !el.hidden);
    if (_lgBeneFilter && !visible.length) {
      if (!tip) {
        tip = document.createElement("p");
        tip.id = "lgBeneChipEmptyTip";
        tip.className = "muted";
        $("#lgList") && $("#lgList").appendChild(tip);
      }
      tip.textContent = "这个接收人下还没有交割条目。";
    } else if (tip) tip.remove();
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    try {
      const { items } = await api("/api/legacy");
      applyLegacyBeneFilter(items || []);
    } catch (_) {
      applyLegacyBeneFilter([]);
    }
  };

  /* 3 · 备忘一键再录 */
  function fillAssetFormFromItem(it) {
    if (!it) return;
    if ($("#asPlatform")) $("#asPlatform").value = it.platform || "";
    if ($("#asHint")) $("#asHint").value = it.account_hint || "";
    if ($("#asSummary")) $("#asSummary").value = it.summary || "";
    if ($("#asDept") && it.dept) $("#asDept").value = it.dept;
    const primary = disposePrimary(it.dispose_note);
    if ($("#asDispose") && primary) $("#asDispose").value = primary;
    const extra = disposeExtra(it.dispose_note);
    if ($("#asNote")) $("#asNote").value = extra || "";
  }

  function attachAssetCopyButtons(items) {
    const byId = {};
    (items || []).forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#asList .item").forEach((el, i) => {
      if (el.querySelector(".as-copy-btn")) return;
      const it = (el.dataset.id && byId[el.dataset.id]) || (items || [])[i];
      if (it) {
        el.dataset.id = String(it.id || "");
        el.dataset.platform = it.platform || "";
        el.dataset.summary = it.summary || "";
        el.dataset.dept = it.dept || "";
        el.dataset.dispose = it.dispose_note || "";
        el.dataset.hint = it.account_hint || "";
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-btn";
      btn.textContent = "再录一条";
      btn.title = "复制本条字段到上方表单，便于同类备忘连记";
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const src =
          byId[el.dataset.id] || {
            platform: el.dataset.platform,
            summary: el.dataset.summary,
            dept: el.dataset.dept,
            dispose_note: el.dataset.dispose,
            account_hint: el.dataset.hint,
          };
        fillAssetFormFromItem(src);
        softBanner("已填入备忘表单，改个平台名即可再记一条", "assets");
        toast("已复制到表单");
        const form = $("#asPlatform");
        if (form) {
          form.focus();
          form.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };
      const row = el.querySelector(".row") || el;
      if (row.classList && row.classList.contains("row")) row.appendChild(btn);
      else el.appendChild(btn);
    });
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    try {
      const { items } = await api("/api/assets");
      attachAssetCopyButtons(items || []);
    } catch (_) {
      attachAssetCopyButtons([]);
    }
  };

  /* 4 · 报备备用齐全绿勾（缺则保留 round16 CTA） */
  async function paintBackupReadyMark() {
    const box = $("#checkinBox");
    if (!box) return;
    let mark = $("#backupReadyMark");
    try {
      const data = await api("/api/backup-contacts/summary");
      const count = Number(data.count || 0);
      if (count < 1) {
        if (mark) mark.remove();
        return;
      }
      const miss = $("#backupMissingCta");
      if (miss) miss.remove();
      if (!mark) {
        mark = document.createElement("div");
        mark.id = "backupReadyMark";
        mark.className = "ok backup-ready-mark";
        mark.setAttribute("role", "status");
        const summary = $("#backupSummaryCard");
        if (summary && summary.parentNode) {
          summary.insertAdjacentElement("afterend", mark);
        } else {
          const first = box.querySelector(".card");
          if (first) first.insertAdjacentElement("afterend", mark);
          else box.appendChild(mark);
        }
      }
      mark.innerHTML = `<span class="backup-ready-check" aria-hidden="true">✓</span>
        <span>备用已登记</span>
        <span class="muted">已留 ${count} 位，升级时会按序温和联系。</span>`;
    } catch (_) {}
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    await paintBackupReadyMark();
  };

  /* 5 · 差旅流水按类型筛选 */
  function classifyTravelLedger(l) {
    const k = String((l && l.kind) || "");
    if (k === "travel_deposit" || k === "travel_topup" || /deposit|充值|预存/.test(k)) {
      return "deposit";
    }
    if (k === "travel_refund" || /refund|退款|退回/.test(k)) return "refund";
    if (String(k).startsWith("travel") || k === "membership" || k === "aftercare_budget") {
      return "other";
    }
    return "other";
  }

  function ensureTravelLedgerFilter() {
    const box = $("#travelBox");
    if (!box) return null;
    const cards = $$("#travelBox .card");
    const ledgerCard = Array.from(cards).find((c) => {
      const h = c.querySelector("h3");
      return h && /流水|相关/.test(h.textContent || "");
    });
    if (!ledgerCard) return null;
    let bar = $("#tfLedgerKindBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "tfLedgerKindBar";
      bar.className = "chip-row tf-ledger-kind-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "按类型筛选差旅流水");
      const list = ledgerCard.querySelector(".list");
      if (list) ledgerCard.insertBefore(bar, list);
      else ledgerCard.appendChild(bar);
    }
    const chips = [
      { id: "", label: "全部" },
      { id: "deposit", label: "充值" },
      { id: "refund", label: "退款" },
      { id: "other", label: "其他" },
    ];
    bar.innerHTML = chips
      .map(
        (c) =>
          `<button type="button" class="chip ${
            c.id === _travelLedgerKind ? "active" : ""
          }" data-tfkind="${esc(c.id)}">${esc(c.label)}</button>`
      )
      .join("");
    $$("#tfLedgerKindBar [data-tfkind]").forEach((btn) => {
      btn.onclick = () => {
        _travelLedgerKind = btn.dataset.tfkind || "";
        applyTravelLedgerFilter();
        ensureTravelLedgerFilter();
      };
    });
    return bar;
  }

  function applyTravelLedgerFilter() {
    ensureTravelLedgerFilter();
    const box = $("#travelBox");
    if (!box) return;
    const cards = $$("#travelBox .card");
    const ledgerCard = Array.from(cards).find((c) => {
      const h = c.querySelector("h3");
      return h && /流水|相关/.test(h.textContent || "");
    });
    if (!ledgerCard) return;
    const list = ledgerCard.querySelector(".list");
    if (!list) return;
    $$(".item", list).forEach((el) => {
      const kind =
        el.dataset.ledgerKind ||
        classifyTravelLedger({
          kind: (el.querySelector(".tag") && el.querySelector(".tag").textContent) || "",
        });
      if (!el.dataset.ledgerKind) el.dataset.ledgerKind = kind;
      if (!_travelLedgerKind) {
        el.hidden = false;
        return;
      }
      el.hidden = kind !== _travelLedgerKind;
    });
    let tip = $("#tfLedgerKindEmpty");
    const visible = $$(".item", list).filter((el) => !el.hidden);
    if (_travelLedgerKind && !visible.length) {
      if (!tip) {
        tip = document.createElement("p");
        tip.id = "tfLedgerKindEmpty";
        tip.className = "muted";
        list.appendChild(tip);
      }
      tip.textContent = "这一类暂无流水。";
    } else if (tip) tip.remove();
  }

  function annotateTravelLedgerKinds(ledger) {
    const box = $("#travelBox");
    if (!box) return;
    const cards = $$("#travelBox .card");
    const ledgerCard = Array.from(cards).find((c) => {
      const h = c.querySelector("h3");
      return h && /流水|相关/.test(h.textContent || "");
    });
    if (!ledgerCard) return;
    const list = ledgerCard.querySelector(".list");
    if (!list) return;
    const rows = (ledger || []).filter(
      (l) =>
        String(l.kind).startsWith("travel") ||
        l.kind === "membership" ||
        l.kind === "aftercare_budget"
    );
    $$(".item", list).forEach((el, i) => {
      const l = rows[i];
      if (l) el.dataset.ledgerKind = classifyTravelLedger(l);
      else if (!el.dataset.ledgerKind) {
        const tag = el.querySelector(".tag");
        const t = (tag && tag.textContent) || "";
        if (/退回|退款/.test(t)) el.dataset.ledgerKind = "refund";
        else if (/travel_deposit|预存|充值/.test(t)) el.dataset.ledgerKind = "deposit";
        else el.dataset.ledgerKind = "other";
      }
    });
  }

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    try {
      const { ledger } = await api("/api/travel-fund");
      annotateTravelLedgerKinds(ledger || []);
    } catch (_) {}
    applyTravelLedgerFilter();
  };

  /* 6 · 善后开单旁余额对照 */
  async function paintAftercareBalanceCompare() {
    const tip = $("#acBudgetTip");
    const input = $("#acTravel");
    const formCard = tip && tip.closest(".card");
    if (!formCard && !tip) return;
    let line = $("#acBalanceCompare");
    if (!line) {
      line = document.createElement("p");
      line.id = "acBalanceCompare";
      line.className = "muted ac-balance-compare";
      line.setAttribute("aria-live", "polite");
      if (tip) tip.insertAdjacentElement("afterend", line);
      else if (input) input.closest(".field").insertAdjacentElement("beforebegin", line);
    }
    const budget = Number((input && input.value) || 0);
    try {
      const hint = await api(
        "/api/aftercare/budget-hint?budget=" + encodeURIComponent(String(budget || 0))
      );
      const bal = Number(hint.balance || 0);
      const bud = Number(hint.budget != null ? hint.budget : budget) || 0;
      if (bud > 0) {
        line.textContent =
          "当前差旅余额 ¥" +
          bal.toFixed(0) +
          " · 本单预算 ¥" +
          bud.toFixed(0) +
          (hint.within_balance === false ? "（略高于余额，可按节奏补存）" : "（在可对照范围内）");
      } else {
        line.textContent =
          "当前差旅余额 ¥" + bal.toFixed(0) + " · 填写本单预算后可对照是否在余额内。";
      }
    } catch (_) {
      line.textContent = "差旅余额对照暂不可用。";
    }
  }

  function bindAftercareBalanceCompare() {
    const input = $("#acTravel");
    if (input && !input.dataset.r17bal) {
      input.dataset.r17bal = "1";
      input.addEventListener("input", () => paintAftercareBalanceCompare());
      input.addEventListener("change", () => paintAftercareBalanceCompare());
    }
    paintAftercareBalanceCompare();
  }

  /* 7 · 授权视频重录引导 */
  async function paintAuthRerecordGuide() {
    const panel = $("#authvideo");
    const card = $("#avUploadCard");
    if (!panel || !card) return;
    let tip = $("#avRerecordGuide");
    try {
      const st = await api("/api/auth-video");
      const ready = !!(st.ready || st.complete);
      const hasItems = !!(st.items || []).length;
      // 门槛已齐且有生效视频：不打扰
      if (ready) {
        if (tip) tip.remove();
        return;
      }
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "avRerecordGuide";
        tip.className = "ok soft-banner soft-banner-cta av-rerecord-guide";
        card.insertAdjacentElement("beforebegin", tip);
      }
      tip.innerHTML = "";
      const span = document.createElement("span");
      span.textContent = hasItems
        ? "当前视频门槛未齐，可补录一段含问候、授权与处置思路的说明。"
        : "尚未有生效的授权视频，可先补录一段温和说明。";
      tip.appendChild(span);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = "去补录";
      btn.onclick = () => {
        card.classList.add("av-upload-focus");
        setTimeout(() => card.classList.remove("av-upload-focus"), 2400);
        if (typeof card.scrollIntoView === "function") {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        const file = $("#avFile");
        if (file) file.focus();
      };
      tip.appendChild(btn);
    } catch (_) {}
  }

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    await paintAuthRerecordGuide();
  };

  /* 8 · 手册导出成功回执 */
  function bindExportReceipt() {
    ["exportHandLink", "legacyExportLink"].forEach((id) => {
      const a = document.getElementById(id);
      if (!a || a.dataset.r17export) return;
      a.dataset.r17export = "1";
      a.addEventListener("click", () => {
        const host =
          id === "legacyExportLink"
            ? "legacy"
            : document.getElementById("home") &&
              document.getElementById("home").classList.contains("active")
            ? "home"
            : "handover";
        setTimeout(() => {
          softBanner("手册已打开，可打印或另存", host === "legacy" ? "legacy" : host === "home" ? "home" : "handover", [
            {
              label: "回交割",
              onClick: () => {
                if (typeof show === "function") show("legacy");
              },
            },
          ]);
        }, 120);
      });
    });
    // also catch dynamically refreshed handover export anchors
    const box = $("#handoverBox");
    if (box && !box.dataset.r17export) {
      box.dataset.r17export = "1";
      box.addEventListener("click", (e) => {
        const a = e.target.closest('a[href*="handover.html"]');
        if (!a) return;
        setTimeout(() => {
          softBanner("手册已打开，可打印或另存", "handover", [
            {
              label: "回交割",
              onClick: () => {
                if (typeof show === "function") show("legacy");
              },
            },
          ]);
        }, 120);
      });
    }
  }

  /* 9 · 医旅收藏列表入口 */
  async function openFavHospital(hid) {
    const id = Number(hid);
    if (!id) return;
    // Prefer round16 detail button if present
    const existing = document.querySelector(
      `#medList [data-open-detail="${id}"], #medFavListCard [data-open-detail="${id}"]`
    );
    if (existing) {
      existing.click();
      return;
    }
    if (typeof show === "function") show("medDetail");
    const box = $("#medDetailBox");
    if (!box) return;
    box.innerHTML = "<p class='muted'>加载医院详情…</p>";
    try {
      const data = await api("/api/hospitals?id=" + encodeURIComponent(String(id)));
      const h = data.item || data;
      const starred = getFavs().includes(Number(h.id));
      box.innerHTML = `<div class="card med-detail-card">
        <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center">
          <span class="tag">${esc(h.country || "")}</span>
          ${starred ? '<span class="tag fav-tag">已收藏</span>' : ""}
        </div>
        <h3 style="margin-top:10px">${esc(h.name || "医院")}</h3>
        <p class="muted">${esc(h.city || "")} · ${esc(h.dept || "")}</p>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
          <button type="button" class="btn ghost sm" id="medFavEntryDetailUnstar">${
            starred ? "取消星标" : "收藏本机"
          }</button>
          <button type="button" class="btn ghost sm" data-go="med">返回列表</button>
        </div>
      </div>`;
      const u = $("#medFavEntryDetailUnstar");
      if (u) {
        u.onclick = () => {
          const cur = getFavs();
          const i = cur.indexOf(Number(h.id));
          if (i >= 0) cur.splice(i, 1);
          else cur.push(Number(h.id));
          setFavs(cur);
          toast(getFavs().includes(Number(h.id)) ? "已收藏到本机" : "已取消星标");
          openFavHospital(h.id);
          paintMedFavEntry().catch(() => {});
        };
      }
    } catch (e) {
      box.innerHTML = `<p class="muted">详情暂不可用：${esc(e.message)}</p>`;
    }
  }

  async function paintMedFavEntry() {
    const panel = $("#med");
    if (!panel) return;
    let entry = $("#medFavEntry");
    if (!entry) {
      entry = document.createElement("div");
      entry.id = "medFavEntry";
      entry.className = "card med-fav-entry";
      const head = panel.querySelector(".panel-head");
      if (head && head.nextSibling) panel.insertBefore(entry, head.nextSibling);
      else panel.insertBefore(entry, panel.firstChild);
    }
    const favs = getFavs();
    const n = favs.length;
    entry.innerHTML = `<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between">
      <div>
        <h3 style="margin:0">我的收藏</h3>
        <p class="muted" style="margin:4px 0 0">本机收藏 ${n} 家医院，可展开查看或取消星标。</p>
      </div>
      <button type="button" class="btn ghost sm" id="medFavToggle">${
        _medFavOpen ? "收起" : "展开"
      }</button>
    </div>
    <div id="medFavEntryBody" class="med-fav-entry-body" ${
      _medFavOpen ? "" : "hidden"
    }></div>`;
    const toggle = $("#medFavToggle");
    if (toggle) {
      toggle.onclick = () => {
        _medFavOpen = !_medFavOpen;
        paintMedFavEntry().catch(() => {});
      };
    }
    if (!_medFavOpen) return;
    const body = $("#medFavEntryBody");
    if (!body) return;
    if (!n) {
      body.innerHTML = `<p class="muted">还没有收藏。打开医院详情可点「收藏本机」。</p>`;
      return;
    }
    try {
      const { items } = await api("/api/hospitals");
      const map = {};
      (items || []).forEach((h) => {
        map[Number(h.id)] = h;
      });
      const rows = favs
        .map((id) => map[id])
        .filter(Boolean)
        .map(
          (h) => `<div class="item med-fav-entry-row" data-hid="${esc(String(h.id))}">
            <span class="tag fav-tag">收藏</span>
            <strong>${esc(h.name || "")}</strong>
            <div class="muted">${esc(h.city || "")} · ${esc(h.country || "")}</div>
            <div class="row" style="gap:6px;margin-top:6px">
              <button type="button" class="btn ghost sm" data-open-fav="${esc(
                String(h.id)
              )}">打开详情</button>
              <button type="button" class="btn ghost sm" data-unstar="${esc(
                String(h.id)
              )}">取消星标</button>
            </div>
          </div>`
        )
        .join("");
      body.innerHTML =
        `<div class="list">${rows || "<p class='muted'>收藏的医院暂不可用</p>"}</div>`;
      $$("#medFavEntryBody [data-open-fav]").forEach((btn) => {
        btn.onclick = () => openFavHospital(btn.dataset.openFav);
      });
      $$("#medFavEntryBody [data-unstar]").forEach((btn) => {
        btn.onclick = () => {
          const id = Number(btn.dataset.unstar);
          const next = getFavs().filter((x) => x !== id);
          setFavs(next);
          toast("已取消星标");
          paintMedFavEntry().catch(() => {});
          if (typeof refreshMed === "function") {
            refreshMed(
              ($("#medQ") && $("#medQ").value.trim()) || "",
              ($("#medCountry") && $("#medCountry").value) || ""
            );
          }
        };
      });
    } catch (_) {
      body.innerHTML = `<p class="muted">收藏列表暂不可用</p>`;
    }
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q = "", country = "", region) {
    await _refreshMed(q, country, region);
    await paintMedFavEntry();
  };

  /* 10 · 设置·生产主机只读条 */
  async function enhanceSettingsProdHost() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsProdHostCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsProdHostCard";
      card.className = "card settings-prod-host-card";
      const svc = $("#settingsServiceCard");
      const env = $("#settingsEnvCard");
      if (svc && svc.parentNode) svc.insertAdjacentElement("afterend", card);
      else if (env && env.parentNode) env.insertAdjacentElement("afterend", card);
      else box.insertBefore(card, box.firstChild);
    }
    let domain = "einherit.cn";
    try {
      const h = await api("/api/health");
      if (h && h.domain) domain = h.domain;
    } catch (_) {}
    card.innerHTML = `<h3>生产主机</h3>
      <p class="muted">只读说明，便于确认正式流量落点。</p>
      <p class="settings-prod-host-note" style="margin-top:10px">正式站 <b>${esc(
        domain
      )}</b> 由唯一 VPS 托管；旧机仅作冷备，不接对外流量。</p>
      <p class="muted" style="margin-top:6px">电子继承 App · E-Inherit</p>`;
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    bindAftercareBalanceCompare();
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    bindExportReceipt();
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeOkBadge().catch(() => {}), 0);
    if (id === "legacy") {
      setTimeout(() => {
        api("/api/legacy")
          .then((d) => applyLegacyBeneFilter(d.items || []))
          .catch(() => {});
      }, 40);
    }
    if (id === "assets") setTimeout(() => attachAssetCopyButtons([]), 40);
    if (id === "checkin") setTimeout(() => paintBackupReadyMark().catch(() => {}), 40);
    if (id === "travel") setTimeout(() => applyTravelLedgerFilter(), 40);
    if (id === "aftercare") setTimeout(() => bindAftercareBalanceCompare(), 40);
    if (id === "authvideo") setTimeout(() => paintAuthRerecordGuide().catch(() => {}), 40);
    if (id === "handover" || id === "legacy" || id === "home") {
      setTimeout(bindExportReceipt, 40);
    }
    if (id === "med") setTimeout(() => paintMedFavEntry().catch(() => {}), 40);
    if (id === "settings") setTimeout(() => enhanceSettingsProdHost().catch(() => {}), 0);
  };

  // Boot
  bindExportReceipt();
  if ($("#home") && $("#home").classList.contains("active")) {
    paintHomeOkBadge().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    bindAftercareBalanceCompare();
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    paintAuthRerecordGuide().catch(() => {});
  }
})();
