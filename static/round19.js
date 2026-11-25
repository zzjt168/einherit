/* 电子继承 · 第十九批增量（叠在 round18…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const SETTINGS_OPENED_KEY = "einherit_settings_last_opened";
  let _lgFactoryOnly = false;

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round19SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner soft-banner-cta";
      el.hidden = true;
    }
    if (!el.parentNode || el.parentNode !== host) {
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

  function todayIsoLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function fmtLocalStamp(ms) {
    try {
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return "—";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return y + "-" + m + "-" + day + " " + hh + ":" + mm;
    } catch (_) {
      return "—";
    }
  }

  /* 1 · 首页交割进度一句（复用 counts） */
  async function paintHomeLegacyProgress() {
    const home = $("#home");
    if (!home) return;
    let line = $("#homeLegacyProgress");
    if (!line) {
      line = document.createElement("p");
      line.id = "homeLegacyProgress";
      line.className = "muted home-legacy-progress";
      line.setAttribute("role", "status");
      const hint = $("#homeHint");
      if (hint && hint.parentNode === home) hint.insertAdjacentElement("afterend", line);
      else {
        const strip = $("#todayCheckin");
        if (strip && strip.parentNode === home) strip.insertAdjacentElement("afterend", line);
        else home.appendChild(line);
      }
    }
    try {
      const summary = await api("/api/counts-summary");
      const c = summary.counts || {};
      const total = Number(c.legacy != null ? c.legacy : 0);
      const filled = Number(
        c.legacy_filled != null ? c.legacy_filled : total
      );
      if (!total) {
        line.textContent = "交割进度：还没有条目，按自己节奏写一条即可。";
        return;
      }
      line.textContent =
        "交割进度：已填处置 " + filled + " / " + total + " 条";
    } catch (_) {
      line.textContent = "";
    }
  }

  /* 5 · 会员页差旅门槛同行 */
  async function paintMemberTravelPeer() {
    const box = $("#memberBox");
    if (!box) return;
    const card = box.querySelector(".card");
    if (!card) return;
    let peer = $("#memberTravelPeer");
    try {
      const { fund } = await api("/api/travel-fund");
      const bal = Number(fund.balance || 0);
      const thr = Number(fund.threshold || 2000);
      const met = !!(fund.meets_threshold || fund.met || bal >= thr);
      if (!peer) {
        peer = document.createElement("div");
        peer.id = "memberTravelPeer";
        peer.className = "member-travel-peer muted";
        peer.setAttribute("role", "status");
        const row = card.querySelector(".row");
        if (row) row.insertAdjacentElement("beforebegin", peer);
        else card.appendChild(peer);
      }
      peer.textContent = met
        ? "差旅预存已达建议门槛（≥¥" + thr.toFixed(0) + "）"
        : "差旅预存对照：当前 ¥" + bal.toFixed(0) + " · 建议门槛 ¥" + thr.toFixed(0);
    } catch (_) {
      if (peer) peer.textContent = "";
    }
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    await paintHomeLegacyProgress();
  };

  const _refreshMember = window.refreshMember;
  window.refreshMember = async function () {
    await _refreshMember();
    await paintMemberTravelPeer();
  };

  /* 2 · 交割缺出厂重置勾选汇总 */
  async function paintMissingFactoryBar() {
    const list = $("#lgList");
    if (!list) return;
    let bar = $("#lgMissingFactoryBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "lgMissingFactoryBar";
      bar.className = "lg-missing-factory-bar";
      const missBene = $("#lgMissingBeneBar");
      const filter = $("#lgFilterBar") || $("#lgDeptFilter");
      if (missBene && missBene.parentNode) missBene.insertAdjacentElement("afterend", bar);
      else if (filter && filter.parentNode) filter.parentNode.insertBefore(bar, filter);
      else list.parentNode.insertBefore(bar, list);
    }
    try {
      const pending = await api("/api/legacy/missing-factory-reset");
      const n = Number(pending.count || 0);
      if (!n) {
        bar.hidden = true;
        bar.innerHTML = "";
        _lgFactoryOnly = false;
        return;
      }
      bar.hidden = false;
      bar.innerHTML = `<span>${esc(
        pending.hint || "有 " + n + " 条设备安排还没勾选出厂重置"
      )}</span>
        <button type="button" class="btn ghost sm" id="lgFactoryFilterBtn">${
          _lgFactoryOnly ? "显示全部" : "筛出未勾选"
        }</button>`;
      const btn = $("#lgFactoryFilterBtn");
      if (btn) {
        btn.onclick = () => {
          _lgFactoryOnly = !_lgFactoryOnly;
          applyMissingFactoryFilter(pending.items || []);
          paintMissingFactoryBar();
        };
      }
      if (_lgFactoryOnly) applyMissingFactoryFilter(pending.items || []);
    } catch (_) {}
  }

  function applyMissingFactoryFilter(pendingItems) {
    const ids = new Set((pendingItems || []).map((x) => Number(x.id)));
    $$("#lgList .item[data-id]").forEach((el) => {
      if (!_lgFactoryOnly) {
        el.hidden = false;
        return;
      }
      el.hidden = !ids.has(Number(el.dataset.id));
    });
    let tip = $("#lgFactoryOnlyTip");
    if (_lgFactoryOnly) {
      const visible = $$("#lgList .item[data-id]").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "lgFactoryOnlyTip";
          tip.className = "muted";
          $("#lgList") && $("#lgList").appendChild(tip);
        }
        tip.textContent = "没有未勾选出厂重置的设备条目了。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    await paintMissingFactoryBar();
  };

  /* 3 · 备忘复习到期今日区（今日或已过，温和置顶） */
  function paintDueTodayZone(items) {
    const list = $("#asList");
    if (!list || !list.parentNode) return;
    const today = todayIsoLocal();
    const dueToday = (items || []).filter((it) => {
      const due = String(it.review_at || "").slice(0, 10);
      return due && due <= today;
    });
    let zone = $("#asDueTodayZone");
    if (!dueToday.length) {
      if (zone) zone.remove();
      return;
    }
    if (!zone) {
      zone = document.createElement("div");
      zone.id = "asDueTodayZone";
      zone.className = "card as-due-today";
      const soon = $("#asDueSoonZone");
      if (soon && soon.parentNode) soon.parentNode.insertBefore(zone, soon);
      else list.parentNode.insertBefore(zone, list);
    }
    zone.innerHTML = `<h3>今日可复习</h3>
      <p class="muted">检视日到了或刚过的备忘，放在这里方便一眼看到；按自己节奏即可。</p>
      <div class="list as-due-today-list">${dueToday
        .map((it) => {
          const due = String(it.review_at || "").slice(0, 10);
          return `<div class="item" data-id="${it.id}">
            <span class="tag review-today">检视 ${esc(due)}</span>
            <strong>${esc(it.platform || "")}</strong>
            <div class="muted">${esc(it.account_hint || "")} · ${esc(it.summary || "")}</div>
          </div>`;
        })
        .join("")}</div>`;
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    try {
      const qs = new URLSearchParams({ sort: "due" });
      const visBar = $("#asVisFilterBar .chip.active");
      const vis = (visBar && visBar.dataset.asvis) || "";
      if (vis) qs.set("visibility", vis);
      const data = await api("/api/assets?" + qs.toString());
      const pool = (data.due_soon || []).length
        ? data.due_soon
        : (data.items || []).filter((it) => String(it.review_at || "").trim());
      paintDueTodayZone(pool);
    } catch (_) {}
  };

  /* 4 · 报备间隔设置保存回执 */
  function bindIntervalSaveReceipt(btnId, hostId) {
    const btn = document.getElementById(btnId);
    if (!btn || btn.dataset.r19interval) return;
    btn.dataset.r19interval = "1";
    const prev = btn.onclick;
    btn.onclick = async function (e) {
      try {
        if (typeof prev === "function") await prev.call(this, e);
        softBanner("已保存报备间隔", hostId);
      } catch (_) {
        /* prev 已 toast */
      }
    };
  }

  function enhanceIntervalSaveReceipt() {
    bindIntervalSaveReceipt("settingsIntervalCard_save", "settings");
    bindIntervalSaveReceipt("checkinIntervalCard_save", "checkin");
  }

  /* 6 · 善后空列表双 CTA */
  function paintAftercareEmptyCta() {
    const list = $("#acList");
    if (!list) return;
    const hasItems = $$("#acList .item").some((el) => !el.hidden);
    let empty = $("#acEmptyDualCta");
    if (hasItems) {
      if (empty) empty.remove();
      const plain = list.querySelector(".empty");
      if (plain && /暂无善后/.test(plain.textContent || "")) {
        /* leave base empty if somehow both */
      }
      return;
    }
    if (!empty) {
      empty = document.createElement("div");
      empty.id = "acEmptyDualCta";
      empty.className = "empty-state ac-empty-dual";
    }
    empty.innerHTML = `<p class="empty-title">暂无善后工单</p>
      <p class="empty-hint">可以先完成授权视频，或去看看差旅预存是否就绪。</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <button type="button" class="btn ghost sm" data-go="authvideo">去授权视频</button>
        <button type="button" class="btn ghost sm" data-go="travel">去差旅预存</button>
      </div>`;
    const plainEmpty = list.querySelector(".empty");
    if (plainEmpty) plainEmpty.replaceWith(empty);
    else if (!empty.parentNode) {
      list.innerHTML = "";
      list.appendChild(empty);
    }
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    paintAftercareEmptyCta();
  };

  /* 7 · 授权视频当前生效摘要卡 */
  async function paintAuthActiveSummary(st) {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avActiveSummary");
    const status = st || (await api("/api/auth-video").catch(() => null));
    if (!status) return;
    const items = status.items || [];
    const active =
      items.find((it) => it.current_active) ||
      items.find((it) => Number(it.id) === Number(status.current_active_id)) ||
      null;
    const host =
      $("#avStatus") && $("#avStatus").parentNode
        ? $("#avStatus").parentNode
        : panel.querySelector(".card") || panel;
    if (!active) {
      if (card) {
        card.innerHTML = `<h3>当前生效</h3>
          <p class="muted">还没有生效的授权视频。录完三勾后会出现在这里。</p>`;
      } else {
        card = document.createElement("div");
        card.id = "avActiveSummary";
        card.className = "card av-active-summary";
        host.insertAdjacentElement(
          host === panel ? "afterbegin" : "afterend",
          card
        );
        if ($("#avStatus") && $("#avStatus").parentNode === host) {
          $("#avStatus").insertAdjacentElement("afterend", card);
        } else {
          const list = $("#avList");
          if (list && list.parentNode) list.parentNode.insertBefore(card, list);
          else host.appendChild(card);
        }
        card.innerHTML = `<h3>当前生效</h3>
          <p class="muted">还没有生效的授权视频。录完三勾后会出现在这里。</p>`;
      }
      return;
    }
    if (!card) {
      card = document.createElement("div");
      card.id = "avActiveSummary";
      card.className = "card av-active-summary";
      if ($("#avStatus")) $("#avStatus").insertAdjacentElement("afterend", card);
      else {
        const list = $("#avList");
        if (list && list.parentNode) list.parentNode.insertBefore(card, list);
        else host.appendChild(card);
      }
    }
    const g = active.has_greeting ? "✓" : "·";
    const a = active.has_authorize ? "✓" : "·";
    const p = active.has_plan ? "✓" : "·";
    card.innerHTML = `<h3>当前生效</h3>
      <p class="muted av-active-line" role="status">问候 ${g} · 授权 ${a} · 思路 ${p}
        <span class="av-active-name"> · ${esc(
          active.original_name || active.filename || "已登记视频"
        )}</span></p>`;
  }

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    try {
      const st = await api("/api/auth-video");
      await paintAuthActiveSummary(st);
    } catch (_) {}
  };

  /* 8 · 手册导出条目数与列表一致提示 */
  async function paintExportCountHint() {
    const box = $("#handoverBox");
    if (!box) return;
    try {
      const hand = await api("/api/handover");
      const n =
        hand.item_count != null ? hand.item_count : (hand.todos || []).length;
      const align =
        hand.export_align_note ||
        "当前手册 " + n + " 条，与导出页条目数一致；打开打印页即可核对。";
      let tip = $("#handExportCountHint");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "handExportCountHint";
        tip.className = "ok hand-export-count-hint";
        tip.setAttribute("role", "status");
        const first = box.querySelector(".card");
        const printCard = $("#handPrintChecklist");
        if (printCard && printCard.parentNode) {
          printCard.insertAdjacentElement("beforebegin", tip);
        } else if (first) {
          const row = first.querySelector(".row");
          if (row) row.insertAdjacentElement("beforebegin", tip);
          else first.appendChild(tip);
        } else box.insertBefore(tip, box.firstChild);
      }
      tip.textContent =
        "本次导出将含 " + n + " 条（与列表一致）。" + (align ? " " + align : "");
      tip.hidden = false;
    } catch (_) {}
  }

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    await paintExportCountHint();
  };

  /* 9 · 医旅搜索无结果抚慰 */
  function paintMedNoResultComfort() {
    const list = $("#medList");
    if (!list) return;
    const hasItems = !!list.querySelector(".item");
    let comfort = $("#medNoResultComfort");
    if (hasItems) {
      if (comfort) comfort.remove();
      return;
    }
    const q = (($("#medQ") && $("#medQ").value) || "").trim();
    const country = (($("#medCountry") && $("#medCountry").value) || "").trim();
    const filtered = !!(q || country);
    if (!comfort) {
      comfort = document.createElement("div");
      comfort.id = "medNoResultComfort";
      comfort.className = "med-no-result-comfort";
    }
    comfort.innerHTML = `<p class="muted">${
      filtered
        ? "没有找到匹配的医院。可以清空筛选再看看，或换个关键词。"
        : "暂时没有医院条目。稍后再试，或调整筛选条件。"
    }</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <button type="button" class="btn ghost sm" id="medClearFilters">清空筛选</button>
      </div>`;
    const plain = Array.from(list.querySelectorAll("p.muted")).find((p) =>
      /无匹配|暂无|没有/.test(p.textContent || "")
    );
    if (plain) plain.replaceWith(comfort);
    else if (!comfort.parentNode) {
      list.innerHTML = "";
      list.appendChild(comfort);
    }
    const btn = $("#medClearFilters");
    if (btn) {
      btn.onclick = () => {
        if ($("#medQ")) $("#medQ").value = "";
        if ($("#medCountry")) $("#medCountry").value = "";
        if (typeof refreshMed === "function") refreshMed("", "");
      };
    }
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q, country, region) {
    await _refreshMed(q, country, region);
    paintMedNoResultComfort();
  };

  /* 10 · 设置·上次同步本机时间 */
  function paintSettingsLastOpened() {
    const box = $("#settingsBox");
    if (!box) return;
    const now = Date.now();
    let prev = null;
    try {
      const raw = localStorage.getItem(SETTINGS_OPENED_KEY);
      if (raw) prev = Number(raw);
    } catch (_) {}
    let card = $("#settingsLastOpenedCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsLastOpenedCard";
      card.className = "card settings-last-opened-card";
      const copy = $("#settingsCopyServiceCard");
      const prod = $("#settingsProdHostCard");
      if (copy && copy.parentNode) copy.insertAdjacentElement("afterend", card);
      else if (prod && prod.parentNode) prod.insertAdjacentElement("afterend", card);
      else box.appendChild(card);
    }
    const prevLabel =
      prev && !Number.isNaN(prev) ? fmtLocalStamp(prev) : "尚未记录（本次将写入）";
    card.innerHTML = `<h3>上次打开设置</h3>
      <p class="muted">本机时间只读展示（演示级，存在浏览器本地）。</p>
      <div class="stat" style="margin-top:10px">
        <div class="box"><span class="muted">上次</span><b style="font-size:14px">${esc(
          prevLabel
        )}</b></div>
        <div class="box"><span class="muted">本次</span><b style="font-size:14px">${esc(
          fmtLocalStamp(now)
        )}</b></div>
      </div>`;
    try {
      localStorage.setItem(SETTINGS_OPENED_KEY, String(now));
    } catch (_) {}
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") {
      setTimeout(() => paintHomeLegacyProgress().catch(() => {}), 0);
    }
    if (id === "legacy") setTimeout(() => paintMissingFactoryBar().catch(() => {}), 40);
    if (id === "assets") {
      setTimeout(() => {
        api("/api/assets?" + new URLSearchParams({ sort: "due" }).toString())
          .then((d) => {
            const pool = (d.due_soon || []).length
              ? d.due_soon
              : (d.items || []).filter((it) => String(it.review_at || "").trim());
            paintDueTodayZone(pool);
          })
          .catch(() => {});
      }, 60);
    }
    if (id === "checkin" || id === "settings") {
      setTimeout(enhanceIntervalSaveReceipt, 80);
      setTimeout(enhanceIntervalSaveReceipt, 400);
    }
    if (id === "member") setTimeout(() => paintMemberTravelPeer().catch(() => {}), 40);
    if (id === "aftercare") setTimeout(paintAftercareEmptyCta, 40);
    if (id === "authvideo") {
      setTimeout(() => {
        api("/api/auth-video")
          .then((st) => paintAuthActiveSummary(st))
          .catch(() => {});
      }, 40);
    }
    if (id === "handover") setTimeout(() => paintExportCountHint().catch(() => {}), 60);
    if (id === "med") setTimeout(paintMedNoResultComfort, 40);
    if (id === "settings") setTimeout(paintSettingsLastOpened, 60);
  };

  // Boot
  if ($("#home") && $("#home").classList.contains("active")) {
    paintHomeLegacyProgress().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    paintAftercareEmptyCta();
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    api("/api/auth-video")
      .then((st) => paintAuthActiveSummary(st))
      .catch(() => {});
  }
})();
