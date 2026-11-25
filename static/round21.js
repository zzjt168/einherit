/* 电子继承 · 第二十一批增量（叠在 round20…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const FACTORY_CHIPS = [
    { id: "", label: "全部" },
    { id: "1", label: "已勾重置" },
    { id: "0", label: "未勾" },
  ];
  const DEMO_PREF_KEYS = [
    "einherit_large_text",
    "einherit_privacy_mode",
    "einherit_onboard_skip",
    "einherit_med_favs",
    "einherit_today_todos_done",
    "einherit_settings_last_opened",
  ];

  let _lgFactoryFilter = "";
  let _acCityChip = "";

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round21SoftBanner_" + (hostId || "home");
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

  function fmtGraceRemain(sec) {
    const s = Math.max(0, Number(sec) || 0);
    if (s <= 0) return "已结束";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h >= 24) {
      const d = Math.floor(h / 24);
      const rh = h % 24;
      return rh ? `约 ${d} 天 ${rh} 小时` : `约 ${d} 天`;
    }
    if (h > 0) return m ? `约 ${h} 小时 ${m} 分` : `约 ${h} 小时`;
    if (m > 0) return `约 ${m} 分钟`;
    return "不到一分钟";
  }

  /* 1 · 首页急症清册是否已写入一句 */
  async function paintHomeIcuReady() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeIcuReadyBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeIcuReadyBar";
      bar.className = "home-icu-ready-bar";
      bar.setAttribute("role", "status");
      const r20 = $("#homeRound20Ready");
      const hint = $("#homeHint");
      const progress = $("#homeLegacyProgress");
      if (r20 && r20.parentNode === home) r20.insertAdjacentElement("afterend", bar);
      else if (progress && progress.parentNode === home)
        progress.insertAdjacentElement("afterend", bar);
      else if (hint && hint.parentNode === home) hint.insertAdjacentElement("afterend", bar);
      else home.appendChild(bar);
    }
    try {
      const data = await api("/api/icu-pack");
      const ready = !!data.ready;
      const n = (data.items || []).length;
      bar.hidden = false;
      if (ready && n > 0) {
        bar.innerHTML = `<span class="home-icu-ready-mark">清册已备</span>
          <span class="muted home-icu-ready-sub">急症前安排已写入交割（${n} 条）</span>
          <button type="button" class="btn ghost sm" id="homeIcuGoReady">去查看</button>`;
      } else {
        bar.innerHTML = `<span class="home-icu-ready-mark">可去准备</span>
          <span class="muted home-icu-ready-sub">急症前清册尚未写入，可按自己节奏准备</span>
          <button type="button" class="btn ghost sm" id="homeIcuGoReady">去准备</button>`;
      }
      const btn = $("#homeIcuGoReady");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("icu");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割按出厂重置筛选 chip */
  function ensureFactoryFilterBar() {
    let bar = $("#lgFactoryChipBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "lgFactoryChipBar";
    bar.className = "chip-row lg-factory-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按出厂重置筛选");
    bar.innerHTML = FACTORY_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _lgFactoryFilter ? "active" : ""}" data-lgfactory="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const list = $("#lgList");
    const missFr = $("#lgMissingFactoryBar");
    const missClear = $("#lgMissingClearBar");
    const filter = $("#lgFilterBar") || $("#lgDeptFilter");
    if (missClear && missClear.parentNode) missClear.insertAdjacentElement("afterend", bar);
    else if (missFr && missFr.parentNode) missFr.insertAdjacentElement("afterend", bar);
    else if (filter && filter.parentNode) filter.parentNode.insertBefore(bar, filter);
    else if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lgfactory]");
      if (!btn) return;
      _lgFactoryFilter = btn.dataset.lgfactory || "";
      $$("#lgFactoryChipBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.lgfactory || "") === _lgFactoryFilter)
      );
      applyFactoryChipFilter();
    });
    return bar;
  }

  function applyFactoryChipFilter() {
    ensureFactoryFilterBar();
    const list = $("#lgList");
    if (!list) return;
    $$("#lgList .item[data-id]").forEach((el) => {
      if (!_lgFactoryFilter) {
        // don't unhide if other filters hid it — only manage our own
        if (el.dataset.r21FactoryHidden === "1") {
          el.hidden = false;
          delete el.dataset.r21FactoryHidden;
        }
        return;
      }
      const fr = el.dataset.factory;
      // if factory unknown, fetch-tag later; treat missing as "0"
      const val = fr === "1" ? "1" : "0";
      const show = val === _lgFactoryFilter;
      if (!show) {
        el.hidden = true;
        el.dataset.r21FactoryHidden = "1";
      } else if (el.dataset.r21FactoryHidden === "1") {
        el.hidden = false;
        delete el.dataset.r21FactoryHidden;
      }
    });
    let tip = $("#lgFactoryChipTip");
    if (_lgFactoryFilter) {
      const visible = $$("#lgList .item[data-id]").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "lgFactoryChipTip";
          tip.className = "muted";
          list.appendChild(tip);
        }
        tip.textContent =
          _lgFactoryFilter === "1"
            ? "这一筛选下暂时没有已勾出厂重置的条目。"
            : "这一筛选下暂时没有未勾出厂重置的条目。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  async function paintFactoryChipFilter() {
    const list = $("#lgList");
    if (!list) return;
    ensureFactoryFilterBar();
    try {
      const data = await api("/api/legacy");
      const byId = {};
      (data.items || []).forEach((it) => {
        byId[String(it.id)] = it;
      });
      $$("#lgList .item[data-id]").forEach((el) => {
        const it = byId[el.dataset.id];
        if (it) el.dataset.factory = it.factory_reset ? "1" : "0";
      });
    } catch (_) {}
    applyFactoryChipFilter();
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    await paintFactoryChipFilter();
  };

  /* 3 · 备忘可见性一键切换 private↔family */
  function enhanceAssetVisibilityToggle() {
    const list = $("#asList");
    if (!list) return;
    $$("#asList .item").forEach((el) => {
      if (el.querySelector(".as-vis-toggle")) return;
      const id = el.dataset.id;
      if (!id) return;
      let cur = (el.dataset.visibility || "").toLowerCase();
      if (!cur) {
        const tags = $$(".tag", el);
        const hit = tags.find((t) =>
          /^(private|family)$/i.test((t.textContent || "").trim())
        );
        cur = hit ? (hit.textContent || "").trim().toLowerCase() : "private";
        el.dataset.visibility = cur;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-vis-toggle";
      btn.textContent = cur === "family" ? "改为仅本人" : "改为家人可见";
      btn.title = "温和切换可见性（演示）";
      btn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = (el.dataset.visibility || "private") === "family" ? "private" : "family";
        try {
          const r = await api("/api/assets/update", {
            method: "POST",
            body: JSON.stringify({ id: Number(id), visibility: next }),
          });
          const item = r.item || {};
          el.dataset.visibility = (item.visibility || next).toLowerCase();
          const tags = $$(".tag", el);
          tags.forEach((t) => {
            if (/^(private|family)$/i.test((t.textContent || "").trim())) {
              t.textContent = el.dataset.visibility;
            }
          });
          btn.textContent =
            el.dataset.visibility === "family" ? "改为仅本人" : "改为家人可见";
          softBanner(r.hint || "可见性已更新", "assets");
          toast(r.hint || "已更新");
        } catch (err) {
          toast(err.message || "未完成切换");
        }
      };
      let row = el.querySelector(".row");
      if (!row) {
        row = document.createElement("div");
        row.className = "row";
        row.style.cssText = "gap:6px;flex-wrap:wrap;margin-top:8px";
        el.appendChild(row);
      }
      row.appendChild(btn);
    });
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    try {
      const { items } = await api("/api/assets");
      const nodes = $$("#asList .item");
      (items || []).forEach((it, i) => {
        const el = nodes[i];
        if (!el) return;
        if (it.id != null) el.dataset.id = String(it.id);
        if (it.visibility) el.dataset.visibility = String(it.visibility).toLowerCase();
      });
    } catch (_) {}
    enhanceAssetVisibilityToggle();
  };

  /* 4 · 报备冷静期剩余只读条 */
  async function paintCheckinGraceRemain() {
    const box = $("#checkinBox");
    if (!box) return;
    let bar = $("#checkinGraceRemain");
    try {
      const { user } = await api("/api/me");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "checkinGraceRemain";
        bar.className = "checkin-grace-remain";
        bar.setAttribute("role", "status");
        const peer = $("#checkinMemberPeer");
        if (peer && peer.parentNode) peer.insertAdjacentElement("afterend", bar);
        else {
          const first = box.querySelector(".card, .status-card");
          if (first) first.insertAdjacentElement("beforebegin", bar);
          else box.insertBefore(bar, box.firstChild);
        }
      }
      const inGrace = !!user.checkin_in_grace;
      const remain = Number(user.grace_remaining_seconds || 0);
      const hours = user.grace_hours != null ? user.grace_hours : 72;
      if (inGrace) {
        bar.textContent =
          "冷静期内还可改 · 剩余 " +
          fmtGraceRemain(remain) +
          "（设定 " +
          hours +
          " 小时，只读）";
      } else if (remain > 0) {
        bar.textContent =
          "冷静期窗口约 " +
          fmtGraceRemain(remain) +
          "（设定 " +
          hours +
          " 小时）。冷静期内还可改，不改外呼节奏。";
      } else {
        bar.textContent =
          "冷静期设定 " + hours + " 小时。报备点过后仍可在冷静期内调整，不改外呼节奏。";
      }
      bar.hidden = false;
    } catch (_) {
      if (bar) bar.hidden = true;
    }
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    await paintCheckinGraceRemain();
  };

  /* 5 · 差旅流水导出 CSV 演示 */
  function csvEscape(v) {
    const s = String(v == null ? "" : v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  async function downloadTravelLedgerCsv() {
    try {
      const data = await api("/api/travel-fund");
      const rows = data.ledger || [];
      const header = ["id", "kind", "kind_label", "amount", "note", "created_at"];
      const lines = [header.join(",")];
      rows.forEach((l) => {
        lines.push(
          [
            csvEscape(l.id),
            csvEscape(l.kind),
            csvEscape(l.kind_label || ""),
            csvEscape(l.amount),
            csvEscape(l.note || ""),
            csvEscape(l.created_at || ""),
          ].join(",")
        );
      });
      const blob = new Blob(["\ufeff" + lines.join("\n")], {
        type: "text/csv;charset=utf-8",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download =
        "einherit-travel-ledger-" +
        new Date().toISOString().slice(0, 10) +
        ".csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 500);
      softBanner("已下载最近差旅流水（演示）", "travel");
      toast("CSV 已开始下载");
    } catch (err) {
      toast(err.message || "导出未完成");
    }
  }

  function ensureTravelCsvExport() {
    const box = $("#travelBox");
    if (!box || $("#travelCsvExportBtn")) return;
    const cards = $$(".card", box);
    const ledgerCard = cards.find((c) => {
      const h = c.querySelector("h3");
      return h && (h.textContent || "").includes("流水");
    });
    const host = ledgerCard || cards[0] || box;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "travelCsvExportBtn";
    btn.className = "btn ghost sm travel-csv-export";
    btn.textContent = "导出流水 CSV";
    btn.title = "下载最近差旅相关流水（演示）";
    btn.onclick = () => downloadTravelLedgerCsv();
    const h3 = host.querySelector("h3");
    if (h3) h3.insertAdjacentElement("afterend", btn);
    else host.insertBefore(btn, host.firstChild);
  }

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    ensureTravelCsvExport();
  };

  /* 6 · 善后工单城市快捷 chip */
  async function paintAftercareCityChips() {
    const list = $("#acList");
    if (!list || !list.parentNode) return;
    let bar = $("#acCityChipBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "acCityChipBar";
      bar.className = "chip-row ac-city-chips";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "按出现过的城市筛选");
      const cityFilter = $("#acCityFilterBar");
      const statusBar = $("#acStatusFilterBar");
      if (cityFilter && cityFilter.parentNode)
        cityFilter.insertAdjacentElement("beforebegin", bar);
      else if (statusBar && statusBar.parentNode)
        statusBar.insertAdjacentElement("afterend", bar);
      else list.parentNode.insertBefore(bar, list);
    }
    try {
      const cities = await api("/api/aftercare/cities");
      const listCities = cities.cities || [];
      if (!listCities.length) {
        bar.innerHTML =
          '<span class="muted ac-city-chips-empty">开单并填写城市后，这里会出现快捷筛选</span>';
        return;
      }
      const chips = [{ id: "", label: "全部城市" }].concat(
        listCities.map((c) => ({ id: c, label: c }))
      );
      bar.innerHTML = chips
        .map(
          (c) =>
            `<button type="button" class="chip ${
              c.id === _acCityChip ? "active" : ""
            }" data-accity="${esc(c.id)}">${esc(c.label)}</button>`
        )
        .join("");
      bar.onclick = (e) => {
        const btn = e.target.closest("[data-accity]");
        if (!btn) return;
        _acCityChip = btn.dataset.accity || "";
        $$("#acCityChipBar .chip").forEach((c) =>
          c.classList.toggle("active", (c.dataset.accity || "") === _acCityChip)
        );
        applyAftercareCityChip();
      };
      applyAftercareCityChip();
    } catch (_) {}
  }

  function applyAftercareCityChip() {
    const list = $("#acList");
    if (!list) return;
    // sync with round9 input if present
    const inp = $("#acCityFilterInput");
    if (inp && _acCityChip !== undefined) {
      if (_acCityChip) inp.value = _acCityChip;
    }
    $$("#acList .item").forEach((el) => {
      if (!_acCityChip) {
        if (el.dataset.r21CityHidden === "1") {
          el.hidden = false;
          delete el.dataset.r21CityHidden;
        }
        return;
      }
      const city = (el.dataset.city || "").trim();
      // also try muted text
      let hit = city === _acCityChip;
      if (!hit && !city) {
        const muted = ((el.querySelector(".muted") || {}).textContent || "");
        hit = muted.indexOf(_acCityChip) >= 0;
      }
      if (!hit) {
        el.hidden = true;
        el.dataset.r21CityHidden = "1";
      } else if (el.dataset.r21CityHidden === "1") {
        el.hidden = false;
        delete el.dataset.r21CityHidden;
      }
    });
    // Prefer round9 filter path when available
    if (typeof window.refreshAftercare === "function" && inp && _acCityChip) {
      /* city chips already hid items; leave round9 alone if input synced */
    }
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    // tag city on items for chip filter
    try {
      const { items } = await api("/api/aftercare");
      const nodes = $$("#acList .item");
      (items || []).forEach((it, i) => {
        const el = nodes[i];
        if (el && it.city) el.dataset.city = String(it.city);
      });
    } catch (_) {}
    await paintAftercareCityChips();
  };

  /* 7 · 授权视频三勾未齐时禁用上传说明 */
  function syncAuthUploadGate() {
    const btn = $("#avUpload");
    const card = $("#avUploadCard");
    if (!btn || !card) return;
    const g = $("#avGreet");
    const a = $("#avAuth");
    const p = $("#avPlan");
    const ok = !!(g && g.checked && a && a.checked && p && p.checked);
    let tip = $("#avUploadDisabledHint");
    if (!tip) {
      tip = document.createElement("p");
      tip.id = "avUploadDisabledHint";
      tip.className = "muted av-upload-disabled-hint";
      btn.insertAdjacentElement("afterend", tip);
    }
    const missing = [];
    if (g && !g.checked) missing.push("问候");
    if (a && !a.checked) missing.push("授权");
    if (p && !p.checked) missing.push("处置思路");
    if (ok) {
      btn.disabled = false;
      btn.removeAttribute("aria-disabled");
      tip.hidden = true;
      tip.textContent = "";
    } else {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      tip.hidden = false;
      tip.textContent =
        "请先勾选确认：" +
        (missing.length ? missing.join("、") : "三项") +
        " 均已录进视频后再上传。";
    }
  }

  function bindAuthUploadGate() {
    const checks = $("#avChecks");
    if (checks && !checks.dataset.r21gate) {
      checks.dataset.r21gate = "1";
      checks.addEventListener("change", syncAuthUploadGate);
    }
    ["avGreet", "avAuth", "avPlan"].forEach((id) => {
      const el = $("#" + id);
      if (el && !el.dataset.r21gate) {
        el.dataset.r21gate = "1";
        el.addEventListener("change", syncAuthUploadGate);
      }
    });
    syncAuthUploadGate();
  }

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    bindAuthUploadGate();
  };

  /* 8 · 受益人空列表 CTA */
  function paintBeneEmptyCta() {
    const box = $("#heirsBox");
    if (!box) return;
    const cards = $$(".card", box);
    const beneCard = cards.find((c) => {
      const h = c.querySelector("h3");
      return h && /受益人/.test(h.textContent || "");
    });
    if (!beneCard) return;
    const list = beneCard.querySelector(".list") || beneCard;
    const hasItem = !!list.querySelector(".item");
    let cta = $("#bnEmptyCta");
    if (hasItem) {
      if (cta) cta.remove();
      return;
    }
    // replace muted empty or inject CTA
    const muted = list.querySelector("p.muted");
    if (!cta) {
      cta = document.createElement("div");
      cta.id = "bnEmptyCta";
      cta.className = "bn-empty-cta";
      cta.innerHTML = `<p class="muted">还没有受益人。写上一位家人或执行人即可。</p>
        <button type="button" class="btn ghost sm" id="bnEmptyGoAdd">去添加</button>`;
      if (muted && /暂无受益人/.test(muted.textContent || "")) {
        muted.replaceWith(cta);
      } else if (!list.querySelector(".bn-empty-cta")) {
        list.appendChild(cta);
      }
    }
    const btn = $("#bnEmptyGoAdd");
    if (btn) {
      btn.onclick = () => {
        const name = $("#bnName");
        if (name) {
          name.scrollIntoView({ behavior: "smooth", block: "center" });
          name.focus();
        }
        softBanner("在上方表单写上姓名即可添加", "heirs");
      };
    }
  }

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    paintBeneEmptyCta();
  };

  /* 9 · 手册快照条数差回显强化 */
  async function paintSnapDeltaBar() {
    const box = $("#handoverBox");
    if (!box) return;
    let bar = $("#snapDeltaBar");
    const tip = $("#snapCompareTip");
    const snapCard = Array.from(box.querySelectorAll(".card")).find((c) =>
      ((c.querySelector("h3") || {}).textContent || "").includes("历史快照")
    );
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "snapDeltaBar";
      bar.className = "snap-delta-bar";
      bar.setAttribute("role", "status");
      if (tip && tip.parentNode) tip.insertAdjacentElement("afterend", bar);
      else if (snapCard) snapCard.insertBefore(bar, snapCard.children[1] || null);
      else box.appendChild(bar);
    }
    try {
      const cmp = await api("/api/snapshots/compare");
      bar.hidden = false;
      if (cmp.ready) {
        const d = Number(cmp.delta || 0);
        const sign = d > 0 ? "+" : "";
        bar.innerHTML = `<span class="snap-delta-mark">条数差 ${sign}${d}</span>
          <span class="muted">${esc(cmp.text || "")}</span>`;
      } else {
        bar.innerHTML = `<span class="snap-delta-mark">暂无对比</span>
          <span class="muted">${esc(
            cmp.text || "快照不足两条。存两版后即可温和对照条数差。"
          )}</span>
          <button type="button" class="btn ghost sm" id="snapDeltaSaveHint">去存一版</button>`;
        const go = $("#snapDeltaSaveHint");
        if (go) {
          go.onclick = () => {
            const saveBtn =
              $("#handSnapSave") ||
              Array.from(box.querySelectorAll("button")).find((b) =>
                /快照|存/.test(b.textContent || "")
              );
            if (saveBtn) {
              saveBtn.scrollIntoView({ behavior: "smooth", block: "center" });
              softBanner("存两版后即可看到条数差", "handover");
            } else {
              softBanner("在本页存两版快照后即可对照", "handover");
            }
          };
        }
      }
      // keep legacy tip in sync / empty-state friendly
      if (tip) {
        tip.textContent = cmp.text || "";
        tip.hidden = false;
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    await paintSnapDeltaBar();
  };

  /* 10 · 设置·清空演示数据确认（仅本机偏好 localStorage） */
  function ensureClearDemoCard() {
    const box = $("#settingsBox");
    if (!box || $("#clearDemoCard")) return;
    const card = document.createElement("div");
    card.id = "clearDemoCard";
    card.className = "card clear-demo-card";
    card.innerHTML = `<h3>清空演示数据</h3>
      <p class="muted">仅清除本机偏好类记忆（大字号、隐私遮罩、医旅收藏、引导跳过等）。服务器交割与报备库不受影响。</p>
      <button type="button" class="btn ghost" id="clearDemoBtn">清空本机演示偏好</button>`;
    const reset = $("#resetPrefsCard");
    if (reset && reset.parentNode) reset.insertAdjacentElement("afterend", card);
    else box.appendChild(card);
    $("#clearDemoBtn").onclick = async () => {
      const ok1 = await calmConfirm({
        title: "清空本机演示偏好？",
        body: "将清除大字号、隐私遮罩、医旅收藏、引导跳过等 localStorage 项。服务器数据不受影响。",
        okLabel: "继续",
      });
      if (!ok1) return;
      const ok2 = await calmConfirm({
        title: "再确认一次",
        body: "确定清空本机演示偏好吗？此操作不可撤销（仅本机）。",
        okLabel: "确认清空",
      });
      if (!ok2) return;
      const keys = new Set(DEMO_PREF_KEYS);
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && /^einherit_/i.test(k)) keys.add(k);
        }
      } catch (_) {}
      keys.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch (_) {}
      });
      document.body.classList.remove("large-text");
      softBanner("本机演示偏好已清空", "settings");
      toast("已清空本机演示偏好");
    };
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeIcuReady().catch(() => {}), 0);
    if (id === "legacy") setTimeout(() => paintFactoryChipFilter().catch(() => {}), 60);
    if (id === "assets") setTimeout(enhanceAssetVisibilityToggle, 80);
    if (id === "checkin") setTimeout(() => paintCheckinGraceRemain().catch(() => {}), 60);
    if (id === "travel") setTimeout(ensureTravelCsvExport, 60);
    if (id === "aftercare") setTimeout(() => paintAftercareCityChips().catch(() => {}), 60);
    if (id === "authvideo") setTimeout(bindAuthUploadGate, 40);
    if (id === "heirs") setTimeout(paintBeneEmptyCta, 80);
    if (id === "handover") setTimeout(() => paintSnapDeltaBar().catch(() => {}), 80);
    if (id === "settings") {
      setTimeout(ensureClearDemoCard, 120);
      setTimeout(ensureClearDemoCard, 400);
    }
  };

  // Boot
  paintHomeIcuReady().catch(() => {});
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) bindAuthUploadGate();
  if ($("#settings") && $("#settings").classList.contains("active")) ensureClearDemoCard();
})();
