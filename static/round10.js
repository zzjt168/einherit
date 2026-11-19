/* 电子继承 · 第十批增量（叠在 round9/8/7/6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const DEPT_CHIPS = [
    { id: "", label: "全部" },
    { id: "production", label: "生产部" },
    { id: "finance", label: "财务部" },
    { id: "ip", label: "知识产权部" },
    { id: "admin", label: "行政部" },
    { id: "board", label: "董事会" },
  ];
  const VIS_CHIPS = [
    { id: "", label: "全部" },
    { id: "private", label: "仅自己" },
    { id: "family", label: "家人可见" },
  ];
  const MED_ST_CHIPS = [
    { id: "", label: "全部" },
    { id: "pending", label: "待联系" },
    { id: "contacted", label: "已联系" },
    { id: "cancelled", label: "已取消" },
  ];

  let _lgDept = "";
  let _asVis = "";
  let _medIntentSt = "";
  let _ledgerExpanded = false;
  let _calSelected = "";

  function softBanner(msg, hostId) {
    const host = (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return;
    const eid = "round10SoftBanner_" + (hostId || "home");
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

  /* 1 · 交割按部门筛选 */
  function ensureLegacyDeptBar() {
    let bar = $("#lgDeptFilterBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "lgDeptFilterBar";
    bar.className = "chip-row";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按部门筛选交割");
    bar.innerHTML = DEPT_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _lgDept ? "active" : ""}" data-lgdept="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const list = $("#lgList");
    if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lgdept]");
      if (!btn) return;
      _lgDept = btn.dataset.lgdept || "";
      $$("#lgDeptFilterBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.lgdept || "") === _lgDept)
      );
      if (typeof refreshLegacy === "function") refreshLegacy();
    });
    return bar;
  }

  function applyLegacyDeptFilter() {
    ensureLegacyDeptBar();
    const items = $$("#lgList .item[data-id], #lgList .item[data-dept]");
    if (!items.length) {
      // round6 items have data-id; ensure data-dept
      $$("#lgList .item").forEach((el) => {
        if (el.dataset.dept) return;
        const tag = el.querySelector(".tag");
        // best-effort: leave visible if no dept
        if (!_lgDept) el.hidden = false;
      });
    }
    $$("#lgList .item").forEach((el) => {
      if (!_lgDept) {
        el.hidden = false;
        return;
      }
      const dept = el.dataset.dept || "";
      el.hidden = dept !== _lgDept;
    });
    const visible = $$("#lgList .item").filter((el) => !el.hidden);
    let tip = $("#lgDeptEmptyTip");
    if (_lgDept && !visible.length) {
      if (!tip) {
        tip = document.createElement("p");
        tip.id = "lgDeptEmptyTip";
        tip.className = "muted";
        $("#lgList") && $("#lgList").appendChild(tip);
      }
      tip.textContent = "这一部门暂时没有交割条目，换个部门看看即可。";
      tip.hidden = false;
    } else if (tip) tip.hidden = true;
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    ensureLegacyDeptBar();
    try {
      const qs = _lgDept ? "?dept=" + encodeURIComponent(_lgDept) : "";
      const { items } = await api("/api/legacy" + qs);
      const all = _lgDept ? (await api("/api/legacy")).items || [] : items || [];
      // annotate dept on DOM from full/filtered list
      const byId = Object.fromEntries((items || []).map((it) => [String(it.id), it]));
      const fullById = Object.fromEntries((all || []).map((it) => [String(it.id), it]));
      $$("#lgList .item[data-id]").forEach((el) => {
        const it = byId[el.dataset.id] || fullById[el.dataset.id];
        if (it) el.dataset.dept = it.dept || "";
      });
      if (_lgDept) {
        // re-render filtered list while keeping batch chrome
        const list = $("#lgList");
        if (list && (items || []).length) {
          // hide non-matching already rendered items
          $$("#lgList .item[data-id]").forEach((el) => {
            el.hidden = !byId[el.dataset.id];
          });
        } else if (list && !(items || []).length) {
          $$("#lgList .item").forEach((el) => {
            el.hidden = true;
          });
        }
      } else {
        $$("#lgList .item").forEach((el) => {
          el.hidden = false;
        });
      }
      applyLegacyDeptFilter();
    } catch (_) {
      applyLegacyDeptFilter();
    }
  };

  /* 2 · 备忘可见性筛选 */
  function ensureAssetVisBar() {
    let bar = $("#asVisFilterBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "asVisFilterBar";
    bar.className = "chip-row";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按可见性筛选备忘");
    bar.innerHTML = VIS_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _asVis ? "active" : ""}" data-asvis="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const tagBar = $("#asTagFilter");
    if (tagBar && tagBar.parentNode) tagBar.parentNode.insertBefore(bar, tagBar.nextSibling);
    else {
      const list = $("#asList");
      if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    }
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-asvis]");
      if (!btn) return;
      _asVis = btn.dataset.asvis || "";
      $$("#asVisFilterBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.asvis || "") === _asVis)
      );
      if (typeof refreshAssets === "function") refreshAssets();
    });
    return bar;
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    ensureAssetVisBar();
    try {
      const qs = _asVis ? "?visibility=" + encodeURIComponent(_asVis) : "";
      const { items } = await api("/api/assets" + qs);
      const byId = new Set((items || []).map((it) => String(it.id)));
      $$("#asList .item[data-id]").forEach((el) => {
        const visTag = Array.from(el.querySelectorAll(".tag")).find((t) => {
          const x = (t.textContent || "").trim().toLowerCase();
          return x === "private" || x === "family";
        });
        if (visTag) el.dataset.visibility = (visTag.textContent || "").trim().toLowerCase();
        if (!_asVis) {
          el.hidden = false;
          return;
        }
        el.hidden = !byId.has(String(el.dataset.id));
      });
      let tip = $("#asVisEmptyTip");
      const visible = $$("#asList .item[data-id]").filter((el) => !el.hidden);
      if (_asVis && !visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "asVisEmptyTip";
          tip.className = "muted";
          $("#asList") && $("#asList").appendChild(tip);
        }
        tip.textContent = "这一可见性下暂无备忘，换个筛选即可。";
        tip.hidden = false;
      } else if (tip) tip.hidden = true;
    } catch (_) {}
  };

  /* 3 · 报备日历点选只读 */
  async function renderCheckinCalendar() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinCalendarCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinCalendarCard";
      card.className = "card";
      box.appendChild(card);
    }
    try {
      const data = await api("/api/checkin/calendar?days=14");
      const items = data.items || [];
      const selected = _calSelected || (items.find((d) => d.is_today) || {}).date || "";
      const sel = items.find((d) => d.date === selected) || items[items.length - 1];
      card.innerHTML = `<h3>报备日历（只读）</h3>
        <p class="muted">${esc(data.note || "最近 14 天有打卡的日期会温和标出。")}</p>
        <div class="checkin-cal" role="list">${items
          .map(
            (d) =>
              `<button type="button" role="listitem" class="cal-day ${d.checked ? "has-check" : ""} ${
                d.is_today ? "is-today" : ""
              } ${d.date === selected ? "selected" : ""}" data-cal="${esc(d.date)}" title="${esc(
                d.date
              )}">
            <span class="cal-wd">周${esc(d.weekday)}</span>
            <span class="cal-lb">${esc(d.label)}</span>
            <span class="cal-dot" aria-hidden="true"></span>
          </button>`
          )
          .join("")}</div>
        <p class="muted cal-detail" id="calDetail">${
          sel
            ? sel.checked
              ? `${esc(sel.date)} · 这一天留下了报备`
              : `${esc(sel.date)} · 这一天暂无报备记录`
            : esc(data.text || "")
        }</p>
        <p class="muted">${esc(data.text || "")}</p>`;
      $$("#checkinCalendarCard [data-cal]").forEach((btn) => {
        btn.onclick = () => {
          _calSelected = btn.dataset.cal || "";
          renderCheckinCalendar();
        };
      });
    } catch (e) {
      card.innerHTML = `<h3>报备日历</h3><p class="muted">暂不可用：${esc(e.message)}</p>`;
    }
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    await renderCheckinCalendar();
  };

  /* 4 · 差旅流水折叠 */
  function foldTravelLedger() {
    const cards = $$("#travelBox .card");
    const ledgerCard = cards.find((c) => {
      const h = c.querySelector("h3");
      return h && (h.textContent || "").includes("流水");
    });
    if (!ledgerCard) return;
    const items = $$(".item", ledgerCard);
    if (items.length <= 3) {
      const more = $("#travelLedgerMore");
      if (more) more.remove();
      items.forEach((el) => {
        el.hidden = false;
      });
      return;
    }
    items.forEach((el, i) => {
      el.hidden = !_ledgerExpanded && i >= 3;
    });
    let btn = $("#travelLedgerMore");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "travelLedgerMore";
      btn.className = "btn ghost block";
      ledgerCard.appendChild(btn);
    }
    btn.textContent = _ledgerExpanded
      ? "收起流水"
      : `查看更多（还有 ${items.length - 3} 条）`;
    btn.onclick = () => {
      _ledgerExpanded = !_ledgerExpanded;
      foldTravelLedger();
    };
  }

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    foldTravelLedger();
  };

  /* 5 · 执行人加盟意向编辑回填 */
  function fillExecutorForm(it) {
    if ($("#exEditId")) $("#exEditId").value = String(it.id || "");
    if ($("#exName")) $("#exName").value = it.name || "";
    if ($("#exProvince")) $("#exProvince").value = it.province || "";
    if ($("#exCity")) $("#exCity").value = it.city || "";
    if ($("#exRegion")) $("#exRegion").value = it.region || "";
    if ($("#exPhone")) $("#exPhone").value = it.phone || "";
    if ($("#exNote")) $("#exNote").value = it.note || "";
    if ($("#exAdd")) $("#exAdd").textContent = "保存修改";
    if ($("#exReset")) $("#exReset").hidden = false;
  }

  function resetExecutorForm() {
    if ($("#exEditId")) $("#exEditId").value = "";
    ["exName", "exProvince", "exCity", "exRegion", "exPhone", "exNote"].forEach((id) => {
      if ($("#" + id)) $("#" + id).value = "";
    });
    if ($("#exAdd")) $("#exAdd").textContent = "提交加盟意向";
    if ($("#exReset")) $("#exReset").hidden = true;
  }

  function bindExecutorForm() {
    const reset = $("#exReset");
    if (reset && !reset.dataset.r10) {
      reset.dataset.r10 = "1";
      reset.onclick = () => {
        resetExecutorForm();
        toast("已取消编辑");
      };
    }
    const add = $("#exAdd");
    if (add && !add.dataset.r10) {
      add.dataset.r10 = "1";
      add.onclick = async () => {
        try {
          const payload = {
            name: ($("#exName") && $("#exName").value) || "",
            province: ($("#exProvince") && $("#exProvince").value) || "",
            city: ($("#exCity") && $("#exCity").value) || "",
            region: ($("#exRegion") && $("#exRegion").value) || "",
            phone: ($("#exPhone") && $("#exPhone").value) || "",
            note: ($("#exNote") && $("#exNote").value) || "",
          };
          const editId = Number(($("#exEditId") && $("#exEditId").value) || 0);
          if (editId) payload.id = editId;
          const r = await api("/api/executor-lead", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          toast(editId || r.updated ? "加盟意向已更新" : "加盟意向已登记");
          resetExecutorForm();
          if (typeof refreshExecutor === "function") refreshExecutor();
        } catch (e) {
          toast(e.message);
        }
      };
    }
  }

  const _refreshExecutor = window.refreshExecutor;
  window.refreshExecutor = async function () {
    await _refreshExecutor();
    bindExecutorForm();
    try {
      const { items } = await api("/api/executor-lead");
      const box = $("#exList");
      if (!box) return;
      box.innerHTML = (items || []).length
        ? items
            .map(
              (it) => `<div class="item" data-exid="${it.id}">
          <span class="tag">已登记</span>
          <strong>${esc(it.name)}</strong>
          <div class="muted">${esc(it.province || "")} ${esc(it.city || "")} ${esc(
                it.region || ""
              )}
            · ${esc(it.phone || "")}<br/>${esc(it.note || "")}
            · ${fmtTime(it.created_at)}</div>
          <button type="button" class="btn ghost sm ex-edit" data-exid="${it.id}">改</button>
        </div>`
            )
            .join("")
        : `<p class="muted">尚无加盟意向。提交后会在此显示「已登记」。</p>`;
      const byId = Object.fromEntries((items || []).map((it) => [String(it.id), it]));
      $$("#exList .ex-edit").forEach((btn) => {
        btn.onclick = () => {
          const it = byId[btn.dataset.exid];
          if (!it) return;
          fillExecutorForm(it);
          softBanner("已回填表单，改完点「保存修改」即可。", "executor");
          const form = $("#executor .card");
          if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
        };
      });
    } catch (_) {}
  };

  /* 6 · 手册条目数与导出一致提示 */
  function syncExportMeta(hand) {
    const n = hand.item_count != null ? hand.item_count : (hand.todos || []).length;
    const when = hand.generated_at_iso || "";
    const align =
      hand.export_align_note ||
      `当前手册 ${n} 条，与导出页条目数一致；打开打印页即可核对。`;
    const text = when
      ? `生成于 ${when} · ${n} 条 · ${align}`
      : `${n} 条 · ${align}`;
    ["exportMeta", "legacyExportMeta"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });
    return { n, align, text };
  }

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    try {
      const hand = await api("/api/handover");
      const { n, align } = syncExportMeta(hand);
      const box = $("#handoverBox");
      if (!box) return;
      let tip = $("#handItemCountTip");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "handItemCountTip";
        tip.className = "ok hand-count-tip";
        const first = box.querySelector(".card");
        if (first) {
          const stat = first.querySelector(".stat");
          if (stat) {
            const boxEl = document.createElement("div");
            boxEl.className = "box";
            boxEl.innerHTML = `<span class="muted">条目数</span><b style="font-size:16px">${n}</b>`;
            stat.appendChild(boxEl);
          }
          first.insertBefore(tip, first.children[1] || null);
        } else box.insertBefore(tip, box.firstChild);
      }
      tip.textContent = align;
      tip.hidden = false;
    } catch (_) {}
  };

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    try {
      const hand = await api("/api/handover");
      syncExportMeta(hand);
    } catch (_) {}
  };

  /* 7 · 医旅意向按状态筛选 */
  function ensureMedIntentStatusBar() {
    let bar = $("#medIntentStatusBar");
    if (bar) return bar;
    const host = $("#medIntentsBox") || $("#medIntents")?.parentElement;
    if (!host) return null;
    bar = document.createElement("div");
    bar.id = "medIntentStatusBar";
    bar.className = "chip-row";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按意向状态筛选");
    bar.innerHTML = MED_ST_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _medIntentSt ? "active" : ""}" data-medst="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const list = $("#medIntents");
    if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    else host.appendChild(bar);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-medst]");
      if (!btn) return;
      _medIntentSt = btn.dataset.medst || "";
      $$("#medIntentStatusBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.medst || "") === _medIntentSt)
      );
      if (typeof refreshMed === "function") {
        refreshMed(
          ($("#medQ") && $("#medQ").value.trim()) || "",
          ($("#medCountry") && $("#medCountry").value) || ""
        );
      }
    });
    return bar;
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q = "", country = "", region) {
    await _refreshMed(q, country, region);
    ensureMedIntentStatusBar();
    try {
      const qs = _medIntentSt ? "?status=" + encodeURIComponent(_medIntentSt) : "";
      const intents = await api("/api/hospitals/intents" + qs);
      const intentBox = $("#medIntents");
      if (!intentBox) return;
      const items = intents.items || [];
      intentBox.innerHTML = items.length
        ? items
            .map((it) => {
              const st = it.status || "pending";
              const label =
                it.status_label ||
                { pending: "待联系", open: "待联系", contacted: "已联系", cancelled: "已取消" }[
                  st
                ] ||
                st;
              return `<div class="item" data-id="${it.id}" data-status="${esc(st)}">
          <span class="tag status-${esc(st)}">${esc(label)}</span>
          <strong>${esc(it.hospital_name || "未指定医院")}</strong>
          <div class="muted">${esc(it.hospital_country || "")} ${esc(it.hospital_city || "")}
            · ${esc(it.note || "")}<br/>${fmtTime(it.created_at)}</div>
          <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap">
            <button class="btn ghost sm med-st" data-id="${it.id}" data-st="pending" type="button">待联系</button>
            <button class="btn ghost sm med-st" data-id="${it.id}" data-st="contacted" type="button">已联系</button>
            <button class="btn ghost sm med-st" data-id="${it.id}" data-st="cancelled" type="button">已取消</button>
          </div>
        </div>`;
            })
            .join("")
        : `<p class="muted">${
            _medIntentSt ? "这一状态下暂无意向，换个筛选看看。" : "还没有意向单。筛选医院后点「提交就医意向」即可。"
          }</p>`;
      $$("#medIntents .med-st").forEach((btn) => {
        btn.onclick = async () => {
          try {
            await api("/api/med-intent/status", {
              method: "POST",
              body: JSON.stringify({ id: Number(btn.dataset.id), status: btn.dataset.st }),
            });
            toast("意向状态已更新");
            refreshMed(
              ($("#medQ") && $("#medQ").value.trim()) || "",
              ($("#medCountry") && $("#medCountry").value) || ""
            );
          } catch (e) {
            toast(e.message);
          }
        };
      });
    } catch (_) {}
  };

  /* 8 · 自保七宗罪进度 */
  const _refreshGuard = window.refreshGuard;
  window.refreshGuard = async function () {
    await _refreshGuard();
    try {
      const data = await api("/api/self-guard");
      const prog = data.progress || { done: 0, total: 7, pct: 0 };
      const done = prog.done || 0;
      const total = prog.total || 7;
      const pct =
        prog.pct != null ? prog.pct : Math.round((100 * done) / Math.max(total, 1));
      const label = prog.label || `已勾选 ${done}/${total}`;
      const summary = $("#guardSummary");
      if (summary) {
        summary.innerHTML = `<h3>自保进度</h3>
          <p class="muted">按危害序慢慢勾选即可，不必一次做完。</p>
          <div class="guard-progress-meta"><span>${esc(label)}</span><span>${pct}%</span></div>
          <div class="progress-bar" aria-hidden="true"><i style="width:${Math.max(
            0,
            Math.min(100, pct)
          )}%"></i></div>`;
        summary.hidden = false;
      }
    } catch (_) {}
  };

  /* 9 · 设置·一键自检按钮 */
  async function ensureSettingsSelfcheckCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsSelfcheckCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsSelfcheckCard";
      card.className = "card";
      box.appendChild(card);
    }
    card.innerHTML = `<h3>一键自检</h3>
      <p class="muted">温和确认服务就绪与关键列表条数，不改任何流程。</p>
      <button class="btn block" type="button" id="settingsSelfcheckBtn">运行自检</button>
      <p class="muted" id="settingsSelfcheckResult" style="margin-top:10px">尚未运行。</p>`;
    const btn = $("#settingsSelfcheckBtn");
    if (btn) {
      btn.onclick = async () => {
        const out = $("#settingsSelfcheckResult");
        try {
          const [h, counts] = await Promise.all([
            api("/api/health"),
            api("/api/counts-summary"),
          ]);
          const ok = h.ok ? "服务就绪" : "服务异常";
          const msg = `${ok} · ${h.app || "电子继承"} · ${h.domain || "einherit.cn"} · v${
            h.version || "—"
          } / ${h.server_version || "—"}
${counts.text || ""}`;
          if (out) out.textContent = msg;
          softBanner("自检完成，本机数据摘要已更新。", "settings");
          toast("自检完成");
        } catch (e) {
          if (out) out.textContent = e.message;
          toast(e.message);
        }
      };
    }
  }

  /* 10 · 底部环境徽标可点 */
  async function refreshEnvBadge() {
    const footer = $("#envFooter");
    const badge = $("#envBadge");
    if (!footer || !badge) return;
    try {
      const h = await api("/api/health");
      const host = location.hostname || "local";
      const isProd = /einherit\.cn$/i.test(host);
      footer.classList.toggle("env-prod", isProd);
      footer.classList.toggle("env-dev", !isProd);
      badge.textContent = `${isProd ? "正式" : "演示"} · ${h.domain || "einherit.cn"} · v${
        h.version || "—"
      }`;
      footer.dataset.detail = JSON.stringify({
        app: h.app,
        brand_en: h.brand_en,
        domain: h.domain,
        version: h.version,
        server_version: h.server_version,
        host,
      });
      if (!footer.dataset.r10bound) {
        footer.dataset.r10bound = "1";
        footer.style.cursor = "pointer";
        footer.title = "点开查看版本与域名";
        footer.setAttribute("role", "button");
        footer.tabIndex = 0;
        const openDetail = () => {
          let panel = $("#envFooterDetail");
          if (!panel) {
            panel = document.createElement("div");
            panel.id = "envFooterDetail";
            panel.className = "env-footer-detail card";
            footer.insertAdjacentElement("afterend", panel);
          }
          if (!panel.hidden && panel.dataset.open === "1") {
            panel.hidden = true;
            panel.dataset.open = "0";
            return;
          }
          let detail = {};
          try {
            detail = JSON.parse(footer.dataset.detail || "{}");
          } catch (_) {}
          panel.hidden = false;
          panel.dataset.open = "1";
          panel.innerHTML = `<h3>运行环境</h3>
            <p class="muted">电子继承 App · E-Inherit · einherit.cn</p>
            <div class="stat" style="margin-top:10px">
              <div class="box"><span class="muted">域名</span><b style="font-size:14px">${esc(
                detail.domain || "einherit.cn"
              )}</b></div>
              <div class="box"><span class="muted">App</span><b style="font-size:14px">${esc(
                detail.version || "—"
              )}</b></div>
              <div class="box"><span class="muted">服务</span><b style="font-size:14px">${esc(
                detail.server_version || "—"
              )}</b></div>
            </div>
            <p class="muted" style="margin-top:8px">主机 ${esc(detail.host || host)} · ${esc(
            detail.app || "电子继承 App"
          )}</p>
            <button type="button" class="btn ghost sm" id="envDetailClose">收起</button>`;
          const close = $("#envDetailClose");
          if (close)
            close.onclick = () => {
              panel.hidden = true;
              panel.dataset.open = "0";
            };
        };
        footer.addEventListener("click", openDetail);
        footer.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail();
          }
        });
      }
    } catch (_) {
      badge.textContent = "环境暂不可用";
    }
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "settings") setTimeout(() => ensureSettingsSelfcheckCard(), 0);
    if (id === "legacy") setTimeout(() => ensureLegacyDeptBar(), 0);
    if (id === "assets") setTimeout(() => ensureAssetVisBar(), 0);
    if (id === "med") setTimeout(() => ensureMedIntentStatusBar(), 0);
    if (id === "executor") setTimeout(() => bindExecutorForm(), 0);
    if (id === "guard" && typeof refreshGuard === "function") {
      /* refreshGuard already wired */
    }
  };

  // boot
  refreshEnvBadge();
  bindExecutorForm();
  try {
    api("/api/handover").then(syncExportMeta).catch(() => {});
  } catch (_) {}
})();
